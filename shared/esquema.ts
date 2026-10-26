// Las 10 tablas que se sincronizan y la validación de las operaciones que llegan a /api/ops.
// Lo importa también el cliente: nada que sea solo del Worker.

import { z } from 'zod';
import { SECCIONES } from './secciones';

// Workers Free permite 50 consultas D1 por invocación: el lote lleva 1 + N + 1, además de la sesión y las ya vistas.
// Además, el INSERT multifila de op_vista usa 2 parámetros por op y D1 admite 100 por sentencia: MAX_OPS debe seguir siendo <= 50.
export const MAX_OPS = 40;

const idTexto = z.string().min(1).max(100);
// Texto corriente (nombres, cantidades): 2000 caracteres de sobra. Los largos, 10000.
const texto = z.string().max(2000);
const textoOpcional = z.string().max(2000).nullable().default(null);
const textoLargo = z.string().max(10_000);
const textoLargoOpcional = z.string().max(10_000).nullable().default(null);
const entero = z.number().int().min(0);
const enteroOpcional = entero.nullable().default(null);
// Una fecha del calendario: 2026-02-30 tiene la forma, pero al pasar por UTC sale otro día (o ninguno) y no vale.
const esFechaReal = (f: string) => {
  const d = new Date(`${f}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
};
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(esFechaReal, 'No es una fecha del calendario.');
// Listas cerradas (spec, apartado 5, y shared/secciones.ts): un valor fuera de ellas se rechaza al llegar.
export const TIPOS_INGREDIENTE = ['hidratos', 'proteína', 'grasas', 'fibra', 'ninguno'] as const;
const tipo = z.enum(TIPOS_INGREDIENTE).nullable().default(null);
const seccion = z.enum(SECCIONES).nullable().default(null);
const booleano = (porDefecto: 0 | 1) => z.union([z.literal(0), z.literal(1)]).default(porDefecto);

// Columnas propias de cada tabla: sin hogar_id, version ni borrado, que pone el servidor.
// Cada esquema es estricto: una columna desconocida invalida la operación.
export const TABLAS_SYNC = {
  receta: z.strictObject({
    id: idTexto, nombre: texto, corto: textoOpcional, raciones: enteroOpcional, minutos: enteroOpcional,
    // tipos viaja como texto JSON ya serializado, en los dos sentidos.
    tipos: textoOpcional, foto_key: textoOpcional, notas: textoLargoOpcional,
  }),
  ingrediente: z.strictObject({
    id: idTexto, receta_id: idTexto, orden: entero.default(0), nombre: texto, cantidad: textoOpcional,
    compra: textoOpcional, a_la_lista: booleano(1), tipo, seccion,
  }),
  paso: z.strictObject({
    id: idTexto, receta_id: idTexto, orden: entero.default(0), texto: textoLargo, minutos: enteroOpcional,
  }),
  // lista: el JSON con los ids de las recetas del menú cuando se hizo la lista.
  semana: z.strictObject({ id: idTexto, lunes: fecha, propuesta_aceptada: booleano(0), lista: textoOpcional }),
  semana_dia: z.strictObject({
    id: idTexto, semana_id: idTexto, dia: z.number().int().min(0).max(6), activo: booleano(1), fuera: booleano(0),
  }),
  semana_plato: z.strictObject({
    id: idTexto, semana_id: idTexto, hueco: texto, receta_id: idTexto.nullable().default(null),
    sustituye_a: textoOpcional,
  }),
  comida: z.strictObject({
    id: idTexto, fecha, receta_id: idTexto.nullable().default(null), texto: textoOpcional, fuera: booleano(0),
    planificada_receta_id: idTexto.nullable().default(null),
  }),
  // miembro_id se acepta pero el servidor lo sustituye por el de la sesión.
  nota: z.strictObject({
    id: idTexto, comida_id: idTexto, miembro_id: idTexto.optional(), valor: z.number().int().min(1).max(10),
  }),
  // origen: null si se añadió a mano; si no, los nombres cortos de sus recetas unidos por " · " ("lentejas · merluza").
  // El 'a mano' de las pruebas del Worker es solo un dato de prueba.
  producto: z.strictObject({
    id: idTexto, nombre: texto, cantidad: textoOpcional, seccion, origen: textoOpcional,
    estado: z.enum(['pendiente', 'carro', 'casa']).default('pendiente'), cogido_por: textoOpcional,
  }),
  frecuente: z.strictObject({
    id: idTexto, nombre: texto, seccion, cantidad_habitual: textoOpcional, veces: entero.default(0),
  }),
};

export type TablaSync = keyof typeof TABLAS_SYNC;
export const NOMBRES_TABLAS = Object.keys(TABLAS_SYNC) as TablaSync[];

// Una fila de la tabla `T` tal como la valida su esquema (con los valores por defecto ya resueltos).
export type FilaDe<T extends TablaSync> = z.output<(typeof TABLAS_SYNC)[T]>;

export type Fila = Record<string, unknown>;
export type Op = { id: string; tabla: TablaSync; fila: { id: string } & Record<string, unknown>; borrar?: boolean };

// Los nombres de columna salen de aquí y nunca de la petición.
export const columnasDe = (tabla: TablaSync): string[] => Object.keys(TABLAS_SYNC[tabla].shape);

const esquemaOp = z.strictObject({
  id: idTexto,
  tabla: z.enum(NOMBRES_TABLAS as [TablaSync, ...TablaSync[]]),
  fila: z.unknown(),
  borrar: z.boolean().optional(),
});

// Una fila completa, con los valores que faltan resueltos a NULL o a su valor por defecto.
// Para borrar solo hace falta el id (el resto, si viene, también se comprueba).
function esquemaFila(tabla: TablaSync, borrar: boolean | undefined) {
  const esquema: z.ZodObject = TABLAS_SYNC[tabla];
  return borrar ? esquema.partial().required({ id: true }) : esquema;
}

export function normalizarOp(op: unknown): Op {
  const { id, tabla, fila, borrar } = esquemaOp.parse(op);
  const resultado = esquemaFila(tabla, borrar).parse(fila) as Op['fila'];
  return borrar ? { id, tabla, fila: resultado, borrar: true } : { id, tabla, fila: resultado };
}

// `op` es el índice de la operación inválida en la petición; sin él, el problema es de la petición entera.
export type ResultadoOps = { ok: true; ops: Op[] } | { ok: false; error: string; op?: number };

// Valida la petición entera: si una operación falla, ninguna vale.
export function validarOps(cuerpo: unknown): ResultadoOps {
  const envoltorio = z.strictObject({ ops: z.array(z.unknown()) }).safeParse(cuerpo);
  if (!envoltorio.success) return { ok: false, error: 'La petición no es válida.' };
  if (envoltorio.data.ops.length > MAX_OPS)
    return { ok: false, error: `Demasiadas operaciones: como mucho ${MAX_OPS} por petición.` };
  const ops: Op[] = [];
  for (const [i, bruta] of envoltorio.data.ops.entries()) {
    try {
      ops.push(normalizarOp(bruta));
    } catch (e) {
      if (e instanceof z.ZodError) return { ok: false, error: 'Una operación no es válida.', op: i };
      throw e;
    }
  }
  return { ok: true, ops };
}

// Las 10 tablas que se sincronizan y la validación de las operaciones que llegan a /api/ops.
// Lo importa también el cliente: nada que sea solo del Worker.

import { z } from 'zod';

// Workers Free permite 50 consultas D1 por invocación: el lote lleva 1 + N + 1, además de la sesión y las ya vistas.
export const MAX_OPS = 40;

const idTexto = z.string().min(1).max(100);
const texto = z.string();
const textoOpcional = z.string().nullable().default(null);
const entero = z.number().int().min(0);
const enteroOpcional = entero.nullable().default(null);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const booleano = (porDefecto: 0 | 1) => z.union([z.literal(0), z.literal(1)]).default(porDefecto);

// Columnas propias de cada tabla: sin hogar_id, version ni borrado, que pone el servidor.
// Cada esquema es estricto: una columna desconocida invalida la operación.
export const TABLAS_SYNC = {
  receta: z.strictObject({
    id: idTexto, nombre: texto, corto: textoOpcional, raciones: enteroOpcional, minutos: enteroOpcional,
    tipos: textoOpcional, foto_key: textoOpcional, notas: textoOpcional,
  }),
  ingrediente: z.strictObject({
    id: idTexto, receta_id: idTexto, orden: entero.default(0), nombre: texto, cantidad: textoOpcional,
    compra: textoOpcional, a_la_lista: booleano(1), tipo: textoOpcional, seccion: textoOpcional,
  }),
  paso: z.strictObject({
    id: idTexto, receta_id: idTexto, orden: entero.default(0), texto, minutos: enteroOpcional,
  }),
  semana: z.strictObject({ id: idTexto, lunes: fecha, propuesta_aceptada: booleano(0) }),
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
  producto: z.strictObject({
    id: idTexto, nombre: texto, cantidad: textoOpcional, seccion: textoOpcional, origen: textoOpcional,
    estado: z.enum(['pendiente', 'carro', 'casa']).default('pendiente'), cogido_por: textoOpcional,
  }),
  frecuente: z.strictObject({
    id: idTexto, nombre: texto, seccion: textoOpcional, cantidad_habitual: textoOpcional, veces: entero.default(0),
  }),
};

export type TablaSync = keyof typeof TABLAS_SYNC;
export const NOMBRES_TABLAS = Object.keys(TABLAS_SYNC) as TablaSync[];

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

export type ResultadoOps = { ok: true; ops: Op[] } | { ok: false; error: string };

// Valida la petición entera: si una operación falla, ninguna vale.
export function validarOps(cuerpo: unknown): ResultadoOps {
  const envoltorio = z.strictObject({ ops: z.array(z.unknown()) }).safeParse(cuerpo);
  if (!envoltorio.success) return { ok: false, error: 'La petición no es válida.' };
  if (envoltorio.data.ops.length > MAX_OPS)
    return { ok: false, error: `Demasiadas operaciones: como mucho ${MAX_OPS} por petición.` };
  try {
    return { ok: true, ops: envoltorio.data.ops.map(normalizarOp) };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: 'Alguna operación no es válida.' };
    throw e;
  }
}

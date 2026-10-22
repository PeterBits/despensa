// Reglas de las recetas: tipos de nutriente, tiempos, básicos, búsqueda y medias de notas.

import { media } from './notas';
import { normalizar } from './secciones';
import { TIPOS_INGREDIENTE } from './esquema';

export type Tipo = Exclude<(typeof TIPOS_INGREDIENTE)[number], 'ninguno'>;
export const TIPOS: readonly Tipo[] = TIPOS_INGREDIENTE.filter((t): t is Tipo => t !== 'ninguno');

// Un plato es energético si lleva hidratos (spec, apartado 8).
export const esEnergetica = (tipos: readonly Tipo[]): boolean => tipos.includes('hidratos');

export function tiposDe(ingredientes: { tipo: string | null }[]): Tipo[] {
  const presentes = new Set<string | null>(ingredientes.map((i) => i.tipo));
  return TIPOS.filter((t) => presentes.has(t));
}

export function fraseTipos(tipos: readonly Tipo[]): string {
  const ultimo = tipos.at(-1);
  if (ultimo === undefined) return '';
  const frase = tipos.length === 1 ? ultimo : `${tipos.slice(0, -1).join(', ')} y ${ultimo}`;
  return frase.charAt(0).toLocaleUpperCase('es') + frase.slice(1);
}

// receta.tipos viaja como texto JSON; lo que no sea un tipo válido se descarta.
export function leerTipos(json: string | null): Tipo[] {
  if (json === null) return [];
  let valores: unknown;
  try {
    valores = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(valores)) return [];
  return TIPOS.filter((t) => valores.includes(t));
}

// Sin tiempo (0 o null) no se muestra nada.
export function formatearMinutos(minutos: number | null): string {
  if (!minutos) return '';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

export const cortoDe = (nombre: string): string =>
  (nombre.trim().split(/\s+/)[0] ?? '').toLocaleLowerCase('es');

const BASICOS = new Set(
  ['sal', 'aceite', 'aceite de oliva', 'agua', 'laurel', 'harina', 'pimienta', 'pimienta negra'].map(normalizar),
);

export const esBasico = (nombre: string): boolean => BASICOS.has(normalizar(nombre));

export function coincide(receta: { nombre: string; ingredientes: readonly string[] }, consulta: string): boolean {
  const q = normalizar(consulta);
  if (q === '') return true;
  return normalizar(receta.nombre).includes(q) || receta.ingredientes.some((i) => normalizar(i).includes(q));
}

// Solo cuentan las notas de comidas que tienen receta; las de comidas desconocidas se ignoran.
export function mediasPorReceta(
  comidas: { id: string; receta_id: string | null }[],
  notas: { comida_id: string; valor: number }[],
): Map<string, number> {
  const recetaDe = new Map<string, string>();
  for (const c of comidas) if (c.receta_id !== null) recetaDe.set(c.id, c.receta_id);
  const valoresPorReceta = new Map<string, number[]>();
  for (const n of notas) {
    const receta = recetaDe.get(n.comida_id);
    if (receta === undefined) continue;
    valoresPorReceta.set(receta, [...(valoresPorReceta.get(receta) ?? []), n.valor]);
  }
  const medias = new Map<string, number>();
  for (const [receta, valores] of valoresPorReceta) {
    const m = media(valores);
    if (m !== null) medias.set(receta, m);
  }
  return medias;
}

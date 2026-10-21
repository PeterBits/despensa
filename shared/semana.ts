// Cómo se reparten los dos platos de la semana, la propuesta de la siguiente y las recomendaciones.

import { sumarDias } from './fechas';

export type Dia = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
export type RecetaResumen = { id: string; energetica: boolean; media: number | null; ultimaVez: string | null };

const DIAS_DE_COMER: Dia[] = ['L', 'M', 'X', 'J', 'V', 'S'];
const MEDIA_MINIMA = 7;
const DIAS_SIN_REPETIR = 21;

export function repartir(
  platos: { id: string; energetico: boolean }[],
  activos: Dia[],
): Record<Dia, string | null> {
  const energetico = platos.find((p) => p.energetico) ?? platos[0];
  const otro = platos.find((p) => p !== energetico);
  const reparto: Record<Dia, string | null> = { L: null, M: null, X: null, J: null, V: null, S: null, D: null };
  for (const dia of DIAS_DE_COMER) {
    const plato = activos.includes(dia) ? energetico : otro;
    reparto[dia] = plato?.id ?? null;
  }
  return reparto;
}

const mediaEfectiva = (r: RecetaResumen) => r.media ?? MEDIA_MINIMA;

// Filtra, y si no queda nadie relaja primero los 21 días y después la media. Ordena: más antigua primero.
function candidatas(recetas: RecetaResumen[], hoy: string): RecetaResumen[] {
  const limite = sumarDias(hoy, -DIAS_SIN_REPETIR);
  const buenas = (r: RecetaResumen) => mediaEfectiva(r) >= MEDIA_MINIMA;
  const sinRepetir = (r: RecetaResumen) => r.ultimaVez === null || r.ultimaVez <= limite;
  const intentos = [
    (r: RecetaResumen) => buenas(r) && sinRepetir(r),
    buenas,
    () => true,
  ];
  for (const pasa of intentos) {
    const lista = recetas.filter(pasa);
    if (lista.length > 0) return lista.sort(masAntiguaPrimero);
  }
  return [];
}

function masAntiguaPrimero(a: RecetaResumen, b: RecetaResumen): number {
  if (a.ultimaVez !== b.ultimaVez) {
    if (a.ultimaVez === null) return -1;
    if (b.ultimaVez === null) return 1;
    return a.ultimaVez < b.ultimaVez ? -1 : 1;
  }
  return mediaEfectiva(b) - mediaEfectiva(a);
}

export function proponer(recetas: RecetaResumen[], hoy: string): { energetica: string; otra: string } | null {
  const energetica = candidatas(recetas.filter((r) => r.energetica), hoy)[0];
  const otra = candidatas(recetas.filter((r) => !r.energetica), hoy)[0];
  return energetica && otra ? { energetica: energetica.id, otra: otra.id } : null;
}

export function recomendar(recetas: RecetaResumen[], enPlan: string[], hoy: string): RecetaResumen[] {
  return candidatas(recetas.filter((r) => !enPlan.includes(r.id)), hoy);
}

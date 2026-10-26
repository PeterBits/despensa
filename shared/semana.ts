// Cómo se reparten los dos platos de la semana, la propuesta de la siguiente y las recomendaciones.

import { diasEntre, lunesDe, sumarDias } from './fechas';

export type Dia = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
export type RecetaResumen = { id: string; energetica: boolean; media: number | null; ultimaVez: string | null };

// El índice de cada día es el de semana_dia.dia.
export const DIAS: readonly Dia[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const NOMBRE_DIA: Record<Dia, string> = {
  L: 'lunes',
  M: 'martes',
  X: 'miércoles',
  J: 'jueves',
  V: 'viernes',
  S: 'sábado',
  D: 'domingo',
};
const MEDIA_MINIMA = 7;
const DIAS_SIN_REPETIR = 21;

export function repartir(
  platos: { id: string; energetico: boolean }[],
  activos: Dia[],
  fuera: readonly Dia[] = ['D'],
): Record<Dia, string | null> {
  const energetico = platos.find((p) => p.energetico) ?? platos[0];
  const otro = platos.find((p) => p !== energetico);
  const reparto: Record<Dia, string | null> = { L: null, M: null, X: null, J: null, V: null, S: null, D: null };
  for (const dia of DIAS) {
    if (fuera.includes(dia)) continue;
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

// De lunes a jueves se planifica la semana en curso; de viernes a domingo, la que viene.
export function semanaQueSeAbre(hoy: string): 'esta' | 'viene' {
  return diasEntre(lunesDe(hoy), hoy) <= 3 ? 'esta' : 'viene';
}

export type DiaDeSemana = { activo: boolean; fuera: boolean };

// Cada día sale de la fila de esa semana; si no la hay, de la misma fila en la semana guardada más reciente anterior.
export function diasDeLaSemana(
  lunes: string,
  guardados: { lunes: string; dia: number; activo: boolean; fuera: boolean }[],
): DiaDeSemana[] {
  return DIAS.map((_, i) => {
    const filas = guardados.filter((g) => g.dia === i && g.lunes <= lunes);
    const fila = filas.find((g) => g.lunes === lunes) ?? filas.sort((a, b) => (a.lunes < b.lunes ? 1 : -1))[0];
    return fila ? { activo: fila.activo, fuera: fila.fuera } : { activo: i === 0 || i === 2 || i === 4, fuera: i === 6 };
  });
}

// Lo apuntado manda; lo planificado solo cuenta en los días sin comida apuntada. Solo fechas anteriores a `antesDe`.
export function ultimaVezPorReceta(
  comidas: { fecha: string; receta_id: string | null }[],
  planificadas: { fecha: string; receta_id: string }[],
  antesDe: string,
): Map<string, string> {
  const diasApuntados = new Set(comidas.map((c) => c.fecha));
  const vistas: { fecha: string; receta_id: string | null }[] = [
    ...comidas,
    ...planificadas.filter((p) => !diasApuntados.has(p.fecha)),
  ];
  const ultima = new Map<string, string>();
  for (const { fecha, receta_id } of vistas) {
    if (receta_id === null || fecha >= antesDe) continue;
    const actual = ultima.get(receta_id);
    if (actual === undefined || fecha > actual) ultima.set(receta_id, fecha);
  }
  return ultima;
}

export type Hueco = '1' | '2';
export const HUECOS: readonly Hueco[] = ['1', '2'];

// El hueco 1 es para la energética y el 2 para la otra; si falta un tipo, el hueco toma lo mejor del otro sin repetir.
export function proponerHuecos(recetas: RecetaResumen[], lunes: string): Record<Hueco, string | null> {
  const energeticas = recetas.filter((r) => r.energetica);
  const otras = recetas.filter((r) => !r.energetica);
  const uno = candidatas(energeticas, lunes)[0]?.id ?? null;
  const dos = candidatas(otras, lunes)[0]?.id ?? null;
  const puestas = [uno, dos].filter((id): id is string => id !== null);
  return {
    '1': uno ?? recomendar(otras, puestas, lunes)[0]?.id ?? null,
    '2': dos ?? recomendar(energeticas, puestas, lunes)[0]?.id ?? null,
  };
}

// Hasta dos recetas fuera del menú: la mejor energética y la mejor de las otras; si falta un tipo, dos del otro.
export function sugerir(recetas: RecetaResumen[], enMenu: string[], lunes: string): RecetaResumen[] {
  const energeticas = recomendar(recetas.filter((r) => r.energetica), enMenu, lunes);
  const otras = recomendar(recetas.filter((r) => !r.energetica), enMenu, lunes);
  const [energetica] = energeticas;
  const [otra] = otras;
  if (energetica && otra) return [energetica, otra];
  return [...energeticas, ...otras].slice(0, 2);
}

export function haceCuanto(ultimaVez: string | null, lunes: string): string {
  if (ultimaVez === null) return 'Por probar';
  const semanas = Math.ceil(diasEntre(ultimaVez, lunes) / 7);
  return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
}

// Una sugerencia va al hueco de su tipo; si no hay, al primero vacío; si tampoco, al 2.
export function huecoDelMismoTipo(energetica: boolean, menu: { hueco: Hueco; energetica: boolean | null }[]): Hueco {
  return (
    menu.find((m) => m.energetica === energetica)?.hueco ?? menu.find((m) => m.energetica === null)?.hueco ?? '2'
  );
}

// `lista` es el JSON de ids de cuando se hizo; se compara como conjunto con el menú de ahora.
export function estadoLista(lista: string | null, enMenu: string[]): 'pendiente' | 'hecha' | 'cambiada' {
  if (lista === null) return 'pendiente';
  let ids: unknown;
  try {
    ids = JSON.parse(lista);
  } catch {
    return 'cambiada';
  }
  if (!Array.isArray(ids)) return 'cambiada';
  const hechas = new Set(ids);
  const actuales = new Set(enMenu);
  const igual = hechas.size === actuales.size && [...actuales].every((id) => hechas.has(id));
  return igual ? 'hecha' : 'cambiada';
}

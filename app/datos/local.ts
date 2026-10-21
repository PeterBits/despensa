// La copia local de cada móvil, una base por hogar: las 10 tablas del servidor, la cola de operaciones
// por enviar y las operaciones que el servidor rechazó. Las lecturas reactivas usan useLiveQuery sobre `copia()`.

import Dexie, { type Table } from 'dexie';
import type { Fila, Op, TablaSync } from '../../shared/esquema';

export type OpEnCola = Op & { n?: number };
export type OpApartada = { n?: number; op: Op; error: string; fecha: string };

type TablasLocales = { [T in TablaSync]: Table<Fila, string> };

class BaseDespensa extends Dexie {
  cola!: Table<OpEnCola, number>;
  meta!: Table<{ clave: string; valor: number }, string>;
  apartadas!: Table<OpApartada, number>;

  constructor(nombre: string) {
    super(nombre);
    this.version(1).stores({
      receta: 'id',
      ingrediente: 'id, receta_id',
      paso: 'id, receta_id',
      semana: 'id, lunes',
      semana_dia: 'id, semana_id',
      semana_plato: 'id, semana_id',
      comida: 'id, fecha',
      nota: 'id, comida_id',
      producto: 'id',
      frecuente: 'id',
      cola: '++n',
      meta: 'clave',
      apartadas: '++n',
    });
  }
}

export type CopiaLocal = BaseDespensa & TablasLocales;

let actual: CopiaLocal | null = null;

// La cola y el cursor `meta.version` son de un hogar: si viajaran a otro, sus operaciones irían al hogar
// equivocado (y el servidor las anularía sin avisar) y el cursor se saltaría filas. Por eso cada hogar tiene su base.
// Abrir la de otro hogar cierra la anterior, pero no la borra: lo pendiente sigue ahí si se vuelve a ese hogar.
// El plan 2 conecta las pantallas: llamará a abrirCopia con el hogarId de /api/yo.
export function abrirCopia(hogarId: string): CopiaLocal {
  if (!hogarId) throw new Error('Falta el hogar para abrir la copia local.');
  const nombre = 'despensa-' + hogarId;
  if (actual?.name === nombre) return actual;
  actual?.close();
  actual = new BaseDespensa(nombre) as CopiaLocal;
  return actual;
}

export function copia(): CopiaLocal {
  if (!actual) throw new Error('No hay ninguna copia local abierta: antes hay que llamar a abrirCopia con el hogar.');
  return actual;
}

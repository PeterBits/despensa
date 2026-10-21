// La copia local de cada móvil: las 10 tablas del servidor, la cola de operaciones por enviar
// y las operaciones que el servidor rechazó. Las lecturas reactivas usan useLiveQuery sobre `db`.

import Dexie, { type Table } from 'dexie';
import type { Fila, Op, TablaSync } from '../../shared/esquema';

export type OpEnCola = Op & { n?: number };
export type OpApartada = { n?: number; op: Op; error: string; fecha: string };

type TablasLocales = { [T in TablaSync]: Table<Fila, string> };

class BaseDespensa extends Dexie {
  cola!: Table<OpEnCola, number>;
  meta!: Table<{ clave: string; valor: number }, string>;
  apartadas!: Table<OpApartada, number>;

  constructor() {
    super('despensa');
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

export const db = new BaseDespensa() as BaseDespensa & TablasLocales;

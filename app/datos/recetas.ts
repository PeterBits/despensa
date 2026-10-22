// Las recetas en la copia local: borradores para el editor, guardar, borrar con deshacer y lecturas reactivas.

import { useLiveQuery } from 'dexie-react-hooks';
import type { Fila, FilaDe, TablaSync } from '../../shared/esquema';
import { marcarPaso, quitarMarcas } from '../../shared/pasos';
import { cortoDe, leerTipos, mediasPorReceta, tiposDe, type Tipo } from '../../shared/recetas';
import { seccionDe, type Seccion } from '../../shared/secciones';
import { copia } from './local';
import { escribir } from './sync';

export type RecetaCompleta = {
  receta: FilaDe<'receta'>;
  ingredientes: FilaDe<'ingrediente'>[];
  pasos: FilaDe<'paso'>[];
};

export type ResumenReceta = {
  id: string;
  nombre: string;
  tipos: Tipo[];
  minutos: number | null;
  media: number | null;
  ingredientes: string[];
};

export type BorradorIngrediente = {
  id: string;
  nombre: string;
  cantidad: string;
  tipo: Tipo | null;
  seccion: Seccion;
  aLaLista: boolean;
  compra: string;
};

// `texto` va sin marcas: las pone guardarReceta.
export type BorradorPaso = { id: string; texto: string; minutos: number | null };

export type BorradorReceta = {
  id: string;
  nombre: string;
  raciones: number | null;
  minutos: number | null;
  fotoKey: string | null;
  ingredientes: BorradorIngrediente[];
  pasos: BorradorPaso[];
};

export const ingredienteVacio = (): BorradorIngrediente => ({
  id: crypto.randomUUID(),
  nombre: '',
  cantidad: '',
  tipo: null,
  seccion: 'Otros',
  aLaLista: true,
  compra: '',
});

export const pasoVacio = (): BorradorPaso => ({ id: crypto.randomUUID(), texto: '', minutos: null });

export const borradorVacio = (): BorradorReceta => ({
  id: crypto.randomUUID(),
  nombre: '',
  raciones: null,
  minutos: null,
  fotoKey: null,
  ingredientes: [ingredienteVacio()],
  pasos: [pasoVacio()],
});

export const borradorDe = ({ receta, ingredientes, pasos }: RecetaCompleta): BorradorReceta => ({
  id: receta.id,
  nombre: receta.nombre,
  raciones: receta.raciones,
  minutos: receta.minutos,
  fotoKey: receta.foto_key,
  ingredientes: ingredientes.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    cantidad: i.cantidad ?? '',
    tipo: i.tipo === null || i.tipo === 'ninguno' ? null : i.tipo,
    seccion: i.seccion ?? seccionDe(i.nombre),
    aLaLista: i.a_la_lista === 1,
    compra: i.compra ?? '',
  })),
  pasos: pasos.map((p) => ({ id: p.id, texto: quitarMarcas(p.texto), minutos: p.minutos })),
});

const vacioANulo = (texto: string): string | null => (texto.trim() === '' ? null : texto.trim());

export async function guardarReceta(borrador: BorradorReceta): Promise<void> {
  const nombre = borrador.nombre.trim();
  // Antes de escribir nada: una receta sin nombre no deja rastro en la cola.
  if (nombre === '') throw new Error('Ponle nombre a la receta.');
  const ingredientes = borrador.ingredientes.filter((i) => i.nombre.trim() !== '');
  const pasos = borrador.pasos.filter((p) => p.texto.trim() !== '');

  const db = copia();
  // Todo o nada: una fila inválida no deja media receta ni operaciones sueltas en la cola.
  await db.transaction('rw', [db.receta, db.ingrediente, db.paso, db.cola], async () => {
    // `notas` no se toca: escribir mezcla con la fila local y la conserva.
    await escribir('receta', {
      id: borrador.id,
      nombre,
      corto: cortoDe(nombre),
      raciones: borrador.raciones,
      minutos: borrador.minutos,
      tipos: JSON.stringify(tiposDe(ingredientes)),
      foto_key: borrador.fotoKey,
    });

    for (const [orden, i] of ingredientes.entries()) {
      await escribir('ingrediente', {
        id: i.id,
        receta_id: borrador.id,
        orden,
        nombre: i.nombre.trim(),
        cantidad: vacioANulo(i.cantidad),
        compra: vacioANulo(i.compra),
        a_la_lista: i.aLaLista ? 1 : 0,
        tipo: i.tipo,
        seccion: i.seccion,
      });
    }

    const nombrados = ingredientes.map((i) => ({ id: i.id, nombre: i.nombre }));
    for (const [orden, p] of pasos.entries()) {
      await escribir('paso', {
        id: p.id,
        receta_id: borrador.id,
        orden,
        texto: marcarPaso(p.texto, nombrados),
        minutos: p.minutos,
      });
    }

    // Lo que estaba en la copia y ya no está en el borrador.
    const idsIngredientes = new Set(ingredientes.map((i) => i.id));
    const idsPasos = new Set(pasos.map((p) => p.id));
    const enCopiaIngredientes = await db.ingrediente.where('receta_id').equals(borrador.id).primaryKeys();
    const enCopiaPasos = await db.paso.where('receta_id').equals(borrador.id).primaryKeys();
    for (const id of enCopiaIngredientes) {
      if (!idsIngredientes.has(id)) await escribir('ingrediente', { id }, { borrar: true });
    }
    for (const id of enCopiaPasos) {
      if (!idsPasos.has(id)) await escribir('paso', { id }, { borrar: true });
    }
  });
}

type FilaCualquiera = { id: string } & Record<string, unknown>;

export async function borrarReceta(id: string): Promise<() => Promise<void>> {
  const db = copia();
  const receta = (await db.receta.get(id)) as FilaCualquiera | undefined;
  const ingredientes = (await db.ingrediente.where('receta_id').equals(id).toArray()) as FilaCualquiera[];
  const pasos = (await db.paso.where('receta_id').equals(id).toArray()) as FilaCualquiera[];

  const tablas = [db.receta, db.ingrediente, db.paso, db.cola];
  await db.transaction('rw', tablas, async () => {
    for (const p of pasos) await escribir('paso', { id: p.id }, { borrar: true });
    for (const i of ingredientes) await escribir('ingrediente', { id: i.id }, { borrar: true });
    if (receta) await escribir('receta', { id }, { borrar: true });
  });

  // Filas completas: escribir mezcla sobre la fila local, que ya no existe.
  return () =>
    db.transaction('rw', tablas, async () => {
      if (receta) await escribir('receta', receta);
      for (const i of ingredientes) await escribir('ingrediente', i);
      for (const p of pasos) await escribir('paso', p);
    });
}

// La copia guarda las filas ya validadas por el esquema de su tabla.
const como = <T extends TablaSync>(filas: Fila[]) => filas as unknown as FilaDe<T>[];

const porOrden = <T extends { orden: number }>(filas: T[]): T[] => [...filas].sort((a, b) => a.orden - b.orden);

export function useRecetas(): ResumenReceta[] | undefined {
  return useLiveQuery(async () => {
    const db = copia();
    const recetas = como<'receta'>(await db.receta.toArray());
    const ingredientes = como<'ingrediente'>(await db.ingrediente.toArray());
    const comidas = como<'comida'>(await db.comida.toArray());
    const notas = como<'nota'>(await db.nota.toArray());
    const medias = mediasPorReceta(comidas, notas);
    return recetas
      .map(
        (r): ResumenReceta => ({
          id: r.id,
          nombre: r.nombre,
          tipos: leerTipos(r.tipos),
          minutos: r.minutos,
          media: medias.get(r.id) ?? null,
          ingredientes: ingredientes.filter((i) => i.receta_id === r.id).map((i) => i.nombre),
        }),
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });
}

// undefined mientras carga; null si la receta no existe (borrada o nunca existió).
export function useReceta(id: string): RecetaCompleta | null | undefined {
  return useLiveQuery(
    async (): Promise<RecetaCompleta | null> => {
      const db = copia();
      const receta = (await db.receta.get(id)) as FilaDe<'receta'> | undefined;
      if (!receta) return null;
      const ingredientes = como<'ingrediente'>(await db.ingrediente.where('receta_id').equals(id).toArray());
      const pasos = como<'paso'>(await db.paso.where('receta_id').equals(id).toArray());
      return { receta, ingredientes: porOrden(ingredientes), pasos: porOrden(pasos) };
    },
    [id],
  );
}

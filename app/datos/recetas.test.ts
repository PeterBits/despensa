import 'fake-indexeddb/auto';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { abrirCopia, copia } from './local';
import {
  borradorDe,
  borradorVacio,
  borrarReceta,
  guardarReceta,
  ingredienteVacio,
  useReceta,
  useRecetas,
  type BorradorReceta,
  type RecetaCompleta,
} from './recetas';
import { escribir } from './sync';

// Cada prueba abre la copia de un hogar nuevo, que empieza vacía y sin cola.
beforeEach(() => {
  abrirCopia(crypto.randomUUID());
});

function lentejas(): BorradorReceta {
  const b = { ...borradorVacio(), nombre: 'Lentejas estofadas', raciones: 6, minutos: 60 };
  b.ingredientes = [
    { ...ingredienteVacio(), id: 'i1', nombre: 'Lentejas pardinas', cantidad: '500 g', tipo: 'hidratos', seccion: 'Despensa' },
    { ...ingredienteVacio(), id: 'i2', nombre: 'Sal', cantidad: 'al gusto', aLaLista: false, seccion: 'Despensa' },
    { ...ingredienteVacio(), id: 'i3', nombre: '  ' },
  ];
  b.pasos = [
    { id: 'p1', texto: 'Lava 500 g de lentejas.', minutos: null },
    { id: 'p2', texto: '', minutos: 5 },
  ];
  return b;
}

describe('recetas en la copia local', () => {
  it('guarda la receta con sus tipos, su nombre corto y los pasos marcados', async () => {
    const b = lentejas();
    await guardarReceta(b);
    expect(await copia().receta.get(b.id)).toMatchObject({
      nombre: 'Lentejas estofadas', corto: 'lentejas', raciones: 6, minutos: 60, tipos: '["hidratos"]',
    });
    expect(await copia().ingrediente.get('i2')).toMatchObject({ a_la_lista: 0, cantidad: 'al gusto', compra: null, orden: 1 });
    expect(await copia().ingrediente.get('i3')).toBeUndefined();
    expect(await copia().paso.where('receta_id').equals(b.id).toArray()).toEqual([
      expect.objectContaining({ id: 'p1', orden: 0, texto: 'Lava {500 g de lentejas|i1}.' }),
    ]);
  });

  it('al volver a guardar borra lo que se quitó y conserva los ids', async () => {
    const b = lentejas();
    await guardarReceta(b);
    const antes = await copia().cola.count();
    await guardarReceta({ ...b, ingredientes: b.ingredientes.filter((i) => i.id !== 'i2') });
    expect(await copia().ingrediente.get('i2')).toBeUndefined();
    expect(await copia().ingrediente.get('i1')).toMatchObject({ id: 'i1', orden: 0 });
    const ops = (await copia().cola.toArray()).slice(antes);
    expect(ops.filter((o) => o.borrar)).toEqual([expect.objectContaining({ tabla: 'ingrediente', fila: { id: 'i2' } })]);
  });

  it('guardar sin red deja la receta en la copia y sus operaciones en la cola', async () => {
    // Sin fetcher: nada sale; 1 receta + 2 ingredientes + 1 paso.
    await guardarReceta(lentejas());
    expect(await copia().cola.count()).toBe(4);
  });

  it('conserva las notas de la receta al volver a guardarla', async () => {
    const b = lentejas();
    await guardarReceta(b);
    await escribir('receta', { id: b.id, notas: 'Con un chorrito de vinagre.' });
    await guardarReceta({ ...b, nombre: 'Lentejas de la casa' });
    expect(await copia().receta.get(b.id)).toMatchObject({ nombre: 'Lentejas de la casa', notas: 'Con un chorrito de vinagre.' });
  });

  it('rechaza una receta sin nombre', async () => {
    await expect(guardarReceta({ ...borradorVacio(), nombre: '  ' })).rejects.toThrow('Ponle nombre a la receta.');
    expect(await copia().cola.count()).toBe(0);
  });

  it('borrar una receta se puede deshacer', async () => {
    const b = lentejas();
    await guardarReceta(b);
    const receta = await copia().receta.get(b.id);
    const ingredientes = await copia().ingrediente.where('receta_id').equals(b.id).toArray();
    const pasos = await copia().paso.where('receta_id').equals(b.id).toArray();

    const deshacer = await borrarReceta(b.id);
    expect(await copia().receta.get(b.id)).toBeUndefined();
    expect(await copia().ingrediente.where('receta_id').equals(b.id).count()).toBe(0);
    expect(await copia().paso.where('receta_id').equals(b.id).count()).toBe(0);

    await deshacer();
    expect(await copia().receta.get(b.id)).toEqual(receta);
    expect(await copia().ingrediente.where('receta_id').equals(b.id).toArray()).toEqual(ingredientes);
    expect(await copia().paso.where('receta_id').equals(b.id).toArray()).toEqual(pasos);
  });

  it('borradorDe devuelve los pasos sin marcas', async () => {
    const b = lentejas();
    await guardarReceta(b);
    const completa: RecetaCompleta = {
      receta: (await copia().receta.get(b.id)) as RecetaCompleta['receta'],
      ingredientes: (await copia().ingrediente.where('receta_id').equals(b.id).toArray()) as RecetaCompleta['ingredientes'],
      pasos: (await copia().paso.where('receta_id').equals(b.id).toArray()) as RecetaCompleta['pasos'],
    };
    expect(completa.pasos[0]!.texto).toBe('Lava {500 g de lentejas|i1}.');
    const borrador = borradorDe(completa);
    expect(borrador.pasos[0]!.texto).toBe('Lava 500 g de lentejas.');
    expect(borrador.ingredientes[1]).toMatchObject({ id: 'i2', compra: '', aLaLista: false, tipo: null });
  });

  it('useRecetas trae la media y los ingredientes para buscar', async () => {
    const b = lentejas();
    await guardarReceta(b);
    await escribir('comida', { id: 'c1', fecha: '2026-10-19', receta_id: b.id });
    await escribir('nota', { id: 'n1', comida_id: 'c1', valor: 8 });
    const { result } = renderHook(() => useRecetas());
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current).toEqual([
      { id: b.id, nombre: 'Lentejas estofadas', tipos: ['hidratos'], minutos: 60, media: 8, ingredientes: ['Lentejas pardinas', 'Sal'] },
    ]);
  });

  it('useReceta devuelve null si la receta no existe', async () => {
    const b = lentejas();
    await guardarReceta(b);
    const { result } = renderHook(() => useReceta(b.id));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).not.toBeUndefined());
    expect(result.current?.ingredientes.map((i) => i.id)).toEqual(['i1', 'i2']);
    const { result: ausente } = renderHook(() => useReceta('no-existe'));
    await waitFor(() => expect(ausente.current).toBeNull());
  });
});

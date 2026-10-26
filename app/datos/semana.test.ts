import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { abrirCopia, copia } from './local';
import { borrarReceta, guardarReceta } from './recetas';
import { RECETAS_DE_EJEMPLO } from './semilla';
import { cambiarDia, cambiarFuera, hacerLista, leerSemana, ponerPlato } from './semana';
import { escribir } from './sync';

const LUNES = '2026-11-02';

// Cada prueba abre una copia nueva con cuatro recetas de ejemplo y tres comidas apuntadas.
beforeEach(async () => {
  abrirCopia(crypto.randomUUID());
  for (const clave of ['lentejas', 'merluza', 'arroz', 'pisto']) {
    await guardarReceta(RECETAS_DE_EJEMPLO.find((r) => r.id === `ejemplo-${clave}`)!);
  }
  await escribir('comida', { id: 'c-arroz', fecha: '2026-10-20', receta_id: 'ejemplo-arroz' });
  await escribir('comida', { id: 'c-lentejas', fecha: '2026-09-28', receta_id: 'ejemplo-lentejas' });
  await escribir('comida', { id: 'c-pisto', fecha: '2026-10-05', receta_id: 'ejemplo-pisto' });
});

describe('la semana en la copia local', () => {
  it('sin nada guardado propone la semana y no escribe nada', async () => {
    const s = await leerSemana(LUNES);
    expect(s.dias.map((d) => d.activo)).toEqual([true, false, true, false, true, false, false]);
    expect(s.menu.map((p) => [p.receta?.id, p.dias, p.vaAActivos])).toEqual([
      ['ejemplo-lentejas', ['L', 'X', 'V'], true],
      ['ejemplo-merluza', ['M', 'J', 'S'], false],
    ]);
    expect(s.sugerencias.map((x) => [x.id, x.haceCuanto, x.hueco])).toEqual([
      ['ejemplo-arroz', 'Hace 2 semanas', '1'],
      ['ejemplo-pisto', 'Hace 4 semanas', '2'],
    ]);
    expect(s.lista).toBe('pendiente');
    expect((await copia().cola.toArray()).filter((o) => o.tabla.startsWith('semana'))).toHaveLength(0);
  });

  it('cambiar un día escribe solo ese día, con id fijo', async () => {
    const antes = await copia().cola.count();
    await cambiarDia(LUNES, 'M');
    const ops = (await copia().cola.toArray()).slice(antes).map((o) => [o.tabla, o.fila.id]);
    expect(ops).toEqual([['semana_dia', 'semana-2026-11-02-d1']]);
    expect(await copia().semana.count()).toBe(0);
    expect((await leerSemana(LUNES)).menu[0]!.dias).toEqual(['L', 'M', 'X', 'V']);
  });

  it('el domingo en casa entra en el reparto y fuera sale', async () => {
    await cambiarFuera(LUNES, 'D', false);
    expect((await leerSemana(LUNES)).menu[1]!.dias).toEqual(['M', 'J', 'S', 'D']);
    await cambiarFuera(LUNES, 'D', true);
    expect((await leerSemana(LUNES)).menu[1]!.dias).toEqual(['M', 'J', 'S']);
  });

  it('poner un plato guarda "En lugar de" y volver al de antes lo quita', async () => {
    await ponerPlato(LUNES, '1', 'ejemplo-arroz');
    await ponerPlato(LUNES, '1', 'ejemplo-pisto');
    expect((await leerSemana(LUNES)).menu[0]!.enLugarDe).toEqual({
      id: 'ejemplo-lentejas',
      nombre: 'Lentejas estofadas',
    });
    await ponerPlato(LUNES, '1', 'ejemplo-lentejas');
    expect((await leerSemana(LUNES)).menu[0]!.enLugarDe).toBeNull();
  });

  it('una receta del menú borrada deja su hueco sin plato y fuera de la lista', async () => {
    await ponerPlato(LUNES, '2', 'ejemplo-pisto');
    await borrarReceta('ejemplo-pisto');
    const s = await leerSemana(LUNES);
    expect(s.menu[1]).toMatchObject({ receta: null, dias: ['M', 'J', 'S'] });
    expect(s.menu[0]!.dias).toEqual(['L', 'X', 'V']);
    await hacerLista(LUNES);
    expect((await copia().producto.toArray()).every((p) => p.origen === 'lentejas')).toBe(true);
  });

  it('un hueco vacío sin energética guarda los días activos', async () => {
    abrirCopia(crypto.randomUUID());
    for (const clave of ['merluza', 'pisto']) {
      await guardarReceta(RECETAS_DE_EJEMPLO.find((r) => r.id === `ejemplo-${clave}`)!);
    }
    await ponerPlato(LUNES, '1', 'ejemplo-pisto');
    await ponerPlato(LUNES, '2', 'ejemplo-merluza');
    await borrarReceta('ejemplo-pisto');
    const s = await leerSemana(LUNES);
    expect(s.menu.map((p) => [p.receta?.id ?? null, p.dias, p.vaAActivos])).toEqual([
      [null, ['L', 'X', 'V'], true],
      ['ejemplo-merluza', ['M', 'J', 'S'], false],
    ]);
  });

  it('hacer la lista escribe los productos y fija el menú', async () => {
    const n = await hacerLista(LUNES);
    const productos = await copia().producto.toArray();
    expect(productos).toHaveLength(n);
    expect(productos.find((p) => p.nombre === 'Ajo')).toMatchObject({
      cantidad: '1 cabeza',
      origen: 'lentejas · merluza',
      estado: 'pendiente',
    });
    expect(productos.some((p) => p.nombre === 'Sal')).toBe(false);
    expect(await copia().semana_plato.count()).toBe(2);
    expect(await copia().semana_dia.count()).toBe(7);
    expect(await leerSemana(LUNES)).toMatchObject({ lista: 'hecha', productos: n });
  });

  it('actualizar conserva estados y lo añadido a mano; no duplica', async () => {
    await hacerLista(LUNES);
    const chorizo = (await copia().producto.toArray()).find((p) => p.nombre === 'Chorizo')!;
    await escribir('producto', { ...chorizo, id: chorizo.id as string, estado: 'casa' });
    await escribir('producto', { id: 'a-mano', nombre: 'Cebolla', origen: null });
    await ponerPlato(LUNES, '2', 'ejemplo-pisto');
    expect((await leerSemana(LUNES)).lista).toBe('cambiada');
    await hacerLista(LUNES);
    const despues = await copia().producto.toArray();
    expect(despues.find((p) => p.id === chorizo.id)).toMatchObject({ estado: 'casa' });
    expect(despues.some((p) => p.nombre === 'Merluza en rodajas')).toBe(false);
    expect(despues.filter((p) => p.nombre === 'Cebolla').map((p) => p.origen)).toEqual(
      expect.arrayContaining([null, expect.any(String)]),
    );
    expect(despues.filter((p) => p.nombre === 'Cebolla')).toHaveLength(2);
  });

  it('la lista de una semana nueva rehace desde cero lo que sale de recetas', async () => {
    await hacerLista(LUNES);
    const viejos = (await copia().producto.toArray()).map((p) => p.id as string);
    await hacerLista('2026-11-09');
    const nuevos = await copia().producto.toArray();
    expect(nuevos.some((p) => viejos.includes(p.id as string))).toBe(false);
    expect(nuevos.every((p) => p.estado === 'pendiente')).toBe(true);
  });

  it('apuntar lo que se come esta semana no cambia su menú', async () => {
    const antes = (await leerSemana(LUNES)).menu.map((p) => p.receta?.id);
    await escribir('comida', { id: 'c-hoy', fecha: '2026-11-03', receta_id: 'ejemplo-lentejas' });
    expect((await leerSemana(LUNES)).menu.map((p) => p.receta?.id)).toEqual(antes);
  });

  it('las medias y la última vez solo miran antes del lunes: el menú no cambia durante la semana', async () => {
    const antes = await leerSemana(LUNES);
    await escribir('comida', { id: 'c-nueva', fecha: '2026-11-03', receta_id: 'ejemplo-lentejas' });
    await escribir('nota', { id: 'n-nueva', comida_id: 'c-nueva', valor: 2 });
    const despues = await leerSemana(LUNES);
    expect(despues.menu.map((p) => p.receta?.id)).toEqual(antes.menu.map((p) => p.receta?.id));
    expect(despues.sugerencias).toEqual(antes.sugerencias);
  });

  it('un hueco sin guardar no repite la receta guardada en el otro', async () => {
    await ponerPlato(LUNES, '2', 'ejemplo-lentejas');
    const s = await leerSemana(LUNES);
    expect(s.menu[0]!.receta?.id).not.toBe('ejemplo-lentejas');
    expect(s.menu[1]!.receta?.id).toBe('ejemplo-lentejas');
  });

  it('con la misma receta en los dos huecos, la lista cuenta cada ingrediente una vez', async () => {
    await ponerPlato(LUNES, '1', 'ejemplo-lentejas');
    await ponerPlato(LUNES, '2', 'ejemplo-lentejas');
    const n = await hacerLista(LUNES);
    const productos = await copia().producto.toArray();
    expect(productos).toHaveLength(n);
    expect(productos.filter((p) => p.nombre === 'Ajo')).toHaveLength(1);
    expect(productos.find((p) => p.nombre === 'Lentejas pardinas')).toMatchObject({ cantidad: '500 g' });
  });

  it('los gestos de un día no necesitan la fila de la semana', async () => {
    await cambiarDia(LUNES, 'M');
    expect(await copia().semana.count()).toBe(0);
    expect((await leerSemana(LUNES)).dias.map((d) => d.activo)).toEqual([true, true, true, false, true, false, false]);
  });

  it('una semana pasada con solo sus platos guardados cuenta en la última vez', async () => {
    await ponerPlato('2026-10-26', '2', 'ejemplo-merluza');
    expect(await copia().semana.count()).toBe(0);
    expect((await leerSemana(LUNES)).menu.map((p) => p.receta?.id)).toEqual(['ejemplo-lentejas', 'ejemplo-pisto']);
  });
});

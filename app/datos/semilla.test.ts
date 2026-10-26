import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ingredientesDe } from '../../shared/pasos';
import { leerTipos } from '../../shared/recetas';
import { abrirCopia, copia } from './local';
import { leerSemana } from './semana';
import { cargarSemilla } from './semilla';

beforeEach(() => {
  abrirCopia(crypto.randomUUID());
});

describe('semilla de desarrollo', () => {
  it('carga las diez recetas del prototipo y repetirla no duplica', async () => {
    expect(await cargarSemilla()).toBe(10);
    await cargarSemilla();
    expect(await copia().receta.count()).toBe(10);
  });

  it('los tipos salen como en el prototipo', async () => {
    await cargarSemilla();
    expect(leerTipos((await copia().receta.get('ejemplo-lentejas'))!.tipos as string)).toEqual(['hidratos', 'proteína', 'fibra']);
    expect(leerTipos((await copia().receta.get('ejemplo-merluza'))!.tipos as string)).toEqual(['proteína', 'grasas']);
  });

  it('deja esta semana planificada y un historial que propone la que viene', async () => {
    await cargarSemilla('2026-10-28');
    expect(await copia().comida.count()).toBe(36);
    expect(await copia().nota.count()).toBe(36);
    expect((await leerSemana('2026-10-26')).menu.map((p) => p.receta?.id)).toEqual(['ejemplo-curry', 'ejemplo-crema']);
    const viene = await leerSemana('2026-11-02');
    expect(viene.menu.map((p) => p.receta?.id)).toEqual(['ejemplo-arroz', 'ejemplo-pisto']);
    expect(viene.sugerencias.map((x) => [x.id, x.haceCuanto])).toEqual([
      ['ejemplo-lentejas', 'Hace 4 semanas'],
      ['ejemplo-merluza', 'Hace 3 semanas'],
    ]);
  });

  it('cada paso marca ingredientes de su propia receta', async () => {
    await cargarSemilla();
    const ingredientes = await copia().ingrediente.toArray();
    const pasos = await copia().paso.toArray();
    for (const p of pasos) {
      const propios = new Set(ingredientes.filter((i) => i.receta_id === p.receta_id).map((i) => i.id));
      for (const id of ingredientesDe(p.texto as string)) expect(propios.has(id)).toBe(true);
    }
    const marcados = new Set(
      pasos.filter((p) => p.receta_id === 'ejemplo-lentejas').flatMap((p) => ingredientesDe(p.texto as string)),
    );
    expect(marcados.size).toBeGreaterThanOrEqual(6);
  });
});

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ingredientesDe } from '../../shared/pasos';
import { leerTipos } from '../../shared/recetas';
import { abrirCopia, copia } from './local';
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

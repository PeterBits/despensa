// La semana en la copia local: el menú se compone con lo guardado más la propuesta, cada gesto escribe solo
// las filas que toca y la lista de la compra sale del menú tal como se ve.

import { useLiveQuery } from 'dexie-react-hooks';
import type { Fila, FilaDe, TablaSync } from '../../shared/esquema';
import { sumarDias } from '../../shared/fechas';
import { listaDesdeRecetas, type LineaLista, type RecetaParaLista } from '../../shared/lista';
import { cortoDe, esEnergetica, leerTipos, mediasPorReceta, type Tipo } from '../../shared/recetas';
import { normalizar } from '../../shared/secciones';
import {
  DIAS,
  diasDeLaSemana,
  estadoLista,
  haceCuanto,
  HUECOS,
  huecoDelMismoTipo,
  proponerHuecos,
  repartir,
  sugerir,
  ultimaVezPorReceta,
  type Dia,
  type Hueco,
  type RecetaResumen,
} from '../../shared/semana';
import { copia } from './local';
import { escribir } from './sync';

export const idSemana = (lunes: string): string => `semana-${lunes}`;
export const idDia = (lunes: string, dia: number): string => `semana-${lunes}-d${dia}`;
export const idHueco = (lunes: string, hueco: Hueco): string => `semana-${lunes}-h${hueco}`;

export type RecetaDelMenu = { id: string; nombre: string; corto: string; tipos: Tipo[]; energetica: boolean };
export type PlatoEnSemana = {
  hueco: Hueco;
  receta: RecetaDelMenu | null; // null: "Sin plato"
  enLugarDe: { id: string; nombre: string } | null;
  dias: Dia[]; // los que lleva este plato
  vaAActivos: boolean; // es el que va a los días activos y tiene alguno
};
export type DiaEnSemana = { dia: Dia; fecha: string; activo: boolean; fuera: boolean };
export type Sugerencia = {
  id: string;
  nombre: string;
  media: number | null;
  haceCuanto: string;
  hueco: Hueco; // huecoDelMismoTipo
  sustituye: string | null; // corto del plato de ese hueco
};
export type VistaSemana = {
  lunes: string;
  dias: DiaEnSemana[];
  menu: PlatoEnSemana[];
  sugerencias: Sugerencia[];
  lista: 'pendiente' | 'hecha' | 'cambiada';
  productos: number;
  hayRecetas: boolean;
};

// Las filas de la copia, ya validadas por el esquema de su tabla.
export type FilasDeLaSemana = {
  recetas: FilaDe<'receta'>[];
  ingredientes: FilaDe<'ingrediente'>[];
  semanas: FilaDe<'semana'>[];
  dias: FilaDe<'semana_dia'>[];
  platos: FilaDe<'semana_plato'>[];
  comidas: FilaDe<'comida'>[];
  notas: FilaDe<'nota'>[];
};

const como = <T extends TablaSync>(filas: Fila[]) => filas as unknown as FilaDe<T>[];

async function leerFilas(): Promise<FilasDeLaSemana> {
  const db = copia();
  return {
    recetas: como<'receta'>(await db.receta.toArray()),
    ingredientes: como<'ingrediente'>(await db.ingrediente.toArray()),
    semanas: como<'semana'>(await db.semana.toArray()),
    dias: como<'semana_dia'>(await db.semana_dia.toArray()),
    platos: como<'semana_plato'>(await db.semana_plato.toArray()),
    comidas: como<'comida'>(await db.comida.toArray()),
    notas: como<'nota'>(await db.nota.toArray()),
  };
}

const delMenu = (r: FilaDe<'receta'>): RecetaDelMenu => {
  const tipos = leerTipos(r.tipos);
  return { id: r.id, nombre: r.nombre, corto: r.corto ?? cortoDe(r.nombre), tipos, energetica: esEnergetica(tipos) };
};

// Los ids de la semana son `semana-<lunes>`: el lunes sale del id, sin pasar por la fila `semana`.
const lunesDeId = (semanaId: string): string => semanaId.slice('semana-'.length);

type DiaGuardado = { lunes: string; dia: number; activo: boolean; fuera: boolean };

// Lo planificado en las semanas guardadas anteriores: sus platos repartidos con los días que mostraban.
function planificadasAntes(
  lunes: string,
  f: FilasDeLaSemana,
  energetica: (id: string) => boolean | undefined,
  guardados: DiaGuardado[],
) {
  const planificadas: { fecha: string; receta_id: string }[] = [];
  const anteriores = new Set(f.platos.map((p) => lunesDeId(p.semana_id)).filter((l) => l < lunes));
  for (const anterior of anteriores) {
    const platos = f.platos.filter((p) => p.semana_id === idSemana(anterior) && p.receta_id !== null);
    const conReceta = platos.filter((p) => energetica(p.receta_id as string) !== undefined);
    if (conReceta.length === 0) continue;
    const dias = diasDeLaSemana(anterior, guardados);
    const reparto = repartir(
      conReceta.map((p) => ({ id: p.hueco, energetico: energetica(p.receta_id as string) === true })),
      DIAS.filter((_, i) => dias[i]!.activo),
      DIAS.filter((_, i) => dias[i]!.fuera),
    );
    DIAS.forEach((dia, i) => {
      const hueco = reparto[dia];
      const receta_id = conReceta.find((p) => p.hueco === hueco)?.receta_id;
      if (receta_id) planificadas.push({ fecha: sumarDias(anterior, i), receta_id });
    });
  }
  return planificadas;
}

// Función pura: de las filas leídas a lo que ve la pantalla. Una receta borrada deja su hueco en "Sin plato".
export function componerSemana(lunes: string, f: FilasDeLaSemana): VistaSemana {
  const recetas = new Map(f.recetas.map((r) => [r.id, r]));
  const energetica = (id: string) => {
    const r = recetas.get(id);
    return r ? esEnergetica(leerTipos(r.tipos)) : undefined;
  };
  const guardados: DiaGuardado[] = f.dias.map((d) => ({
    lunes: lunesDeId(d.semana_id), dia: d.dia, activo: d.activo === 1, fuera: d.fuera === 1,
  }));
  // Propuesta y sugerencias solo miran lo anterior al lunes: el menú de una semana no cambia durante ella.
  const anteriores = f.comidas.filter((c) => c.fecha < lunes);
  const medias = mediasPorReceta(anteriores, f.notas);
  const ultimas = ultimaVezPorReceta(f.comidas, planificadasAntes(lunes, f, energetica, guardados), lunes);
  const resumenes: RecetaResumen[] = f.recetas.map((r) => ({
    id: r.id,
    energetica: energetica(r.id) === true,
    media: medias.get(r.id) ?? null,
    ultimaVez: ultimas.get(r.id) ?? null,
  }));

  const semana = f.semanas.find((s) => s.id === idSemana(lunes));
  const guardado = (hueco: Hueco) => f.platos.find((p) => p.id === idHueco(lunes, hueco));
  // Un hueco sin guardar no repite la receta que ya tiene guardada el otro: cada receta cuenta una vez.
  const propuestaSin = (otro: Hueco) => {
    const ya = guardado(otro)?.receta_id;
    return proponerHuecos(ya ? resumenes.filter((r) => r.id !== ya) : resumenes, lunes);
  };
  const propuesta: Record<Hueco, string | null> = {
    '1': guardado('1') ? null : propuestaSin('2')['1'],
    '2': guardado('2') ? null : propuestaSin('1')['2'],
  };
  const dias = diasDeLaSemana(lunes, guardados);

  const elegidos = HUECOS.map((hueco) => {
    const fila = guardado(hueco);
    const recetaId = fila ? fila.receta_id : propuesta[hueco];
    const receta = recetaId ? recetas.get(recetaId) : undefined;
    const viejo = fila?.sustituye_a ? recetas.get(fila.sustituye_a) : undefined;
    return { hueco, receta: receta ? delMenu(receta) : null, viejo };
  });
  const presentes = elegidos.filter((e) => e.receta !== null);
  const reparto = repartir(
    presentes.map((e) => ({ id: e.hueco, energetico: e.receta!.energetica })),
    DIAS.filter((_, i) => dias[i]!.activo),
    DIAS.filter((_, i) => dias[i]!.fuera),
  );
  const huecoActivos = (presentes.find((e) => e.receta!.energetica) ?? presentes[0])?.hueco;

  const menu = elegidos.map(({ hueco, receta, viejo }): PlatoEnSemana => {
    const lleva = DIAS.filter((d) => reparto[d] === hueco);
    return {
      hueco,
      receta,
      enLugarDe: viejo ? { id: viejo.id, nombre: viejo.nombre } : null,
      dias: lleva,
      vaAActivos: hueco === huecoActivos && lleva.length > 0,
    };
  });
  const enMenu = menu.flatMap((p) => (p.receta ? [p.receta.id] : []));

  const sugerencias = sugerir(resumenes, enMenu, lunes).map((s): Sugerencia => {
    const hueco = huecoDelMismoTipo(
      s.energetica,
      menu.map((p) => ({ hueco: p.hueco, energetica: p.receta?.energetica ?? null })),
    );
    return {
      id: s.id,
      nombre: recetas.get(s.id)!.nombre,
      media: s.media,
      haceCuanto: haceCuanto(s.ultimaVez, lunes),
      hueco,
      sustituye: menu.find((p) => p.hueco === hueco)?.receta?.corto ?? null,
    };
  });

  return {
    lunes,
    dias: DIAS.map((dia, i) => ({ dia, fecha: sumarDias(lunes, i), ...dias[i]! })),
    menu,
    sugerencias,
    lista: estadoLista(semana?.lista ?? null, enMenu),
    productos: lineasDelMenu(menu, f).length,
    hayRecetas: f.recetas.length > 0,
  };
}

function lineasDelMenu(menu: PlatoEnSemana[], f: FilasDeLaSemana): LineaLista[] {
  // Cada receta cuenta una vez, aunque esté en los dos huecos.
  const unicos = menu.filter((p, i) => p.receta && menu.findIndex((q) => q.receta?.id === p.receta!.id) === i);
  const recetas: RecetaParaLista[] = unicos.flatMap((p) =>
    p.receta
      ? [
          {
            corto: p.receta.corto,
            ingredientes: f.ingredientes
              .filter((i) => i.receta_id === p.receta!.id)
              .sort((a, b) => a.orden - b.orden)
              .map((i) => ({
                nombre: i.nombre,
                cantidad: i.cantidad ?? '',
                compra: i.compra,
                aLaLista: i.a_la_lista === 1,
                seccion: i.seccion,
              })),
          },
        ]
      : [],
  );
  return listaDesdeRecetas(recetas);
}

export async function leerSemana(lunes: string): Promise<VistaSemana> {
  return componerSemana(lunes, await leerFilas());
}

export function useSemana(lunes: string): VistaSemana | undefined {
  return useLiveQuery(() => leerSemana(lunes), [lunes]);
}

// Todas las tablas que leen la composición y los gestos, más la cola.
function tablasDeLaSemana() {
  const db = copia();
  return [
    db.receta, db.ingrediente, db.semana, db.semana_dia, db.semana_plato, db.comida, db.nota, db.producto, db.cola,
  ];
}

// Los gestos escriben solo su fila: la `semana` es de hacerLista, para que un móvil sin sincronizar
// no reenvíe una `lista` vieja con cada cambio.
const escribirSemana = (lunes: string, resto: Record<string, unknown>) =>
  escribir('semana', { id: idSemana(lunes), lunes, ...resto });

export async function cambiarDia(lunes: string, dia: Dia): Promise<void> {
  const db = copia();
  await db.transaction('rw', tablasDeLaSemana(), async () => {
    const vista = componerSemana(lunes, await leerFilas());
    const actual = vista.dias.find((d) => d.dia === dia)!;
    if (actual.fuera) return;
    const i = DIAS.indexOf(dia);
    await escribir('semana_dia', {
      id: idDia(lunes, i), semana_id: idSemana(lunes), dia: i, activo: actual.activo ? 0 : 1, fuera: 0,
    });
  });
}

// Al salir o volver, el día queda no activo: la persona lo vuelve a marcar si quiere cocinar ese día.
export async function cambiarFuera(lunes: string, dia: Dia, fuera: boolean): Promise<void> {
  const db = copia();
  await db.transaction('rw', tablasDeLaSemana(), async () => {
    const i = DIAS.indexOf(dia);
    await escribir('semana_dia', {
      id: idDia(lunes, i), semana_id: idSemana(lunes), dia: i, activo: 0, fuera: fuera ? 1 : 0,
    });
  });
}

export async function ponerPlato(lunes: string, hueco: Hueco, recetaId: string): Promise<void> {
  const db = copia();
  await db.transaction('rw', tablasDeLaSemana(), async () => {
    const filas = await leerFilas();
    const viejo = componerSemana(lunes, filas).menu.find((p) => p.hueco === hueco)?.receta?.id ?? null;
    const antes = filas.platos.find((p) => p.id === idHueco(lunes, hueco))?.sustituye_a ?? null;
    // Volver al plato de antes quita el "En lugar de"; si no, se recuerda el primero que se sustituyó.
    const sustituye = antes === recetaId ? null : (antes ?? viejo);
    await escribir('semana_plato', {
      id: idHueco(lunes, hueco),
      semana_id: idSemana(lunes),
      hueco,
      receta_id: recetaId,
      sustituye_a: sustituye === recetaId ? null : sustituye,
    });
  });
}

// Fija el menú y los días tal como se ven y escribe los productos que salen de las recetas.
export async function hacerLista(lunes: string): Promise<number> {
  const db = copia();
  return db.transaction('rw', tablasDeLaSemana(), async () => {
    const filas = await leerFilas();
    const vista = componerSemana(lunes, filas);
    const lineas = lineasDelMenu(vista.menu, filas);
    const teniaLista = filas.semanas.find((s) => s.id === idSemana(lunes))?.lista != null;
    const ids = vista.menu.flatMap((p) => (p.receta ? [p.receta.id] : []));

    await escribirSemana(lunes, { lista: JSON.stringify(ids), propuesta_aceptada: 1 });
    for (const p of vista.menu) {
      await escribir('semana_plato', {
        id: idHueco(lunes, p.hueco),
        semana_id: idSemana(lunes),
        hueco: p.hueco,
        receta_id: p.receta?.id ?? null,
        sustituye_a: null,
      });
    }
    for (const [i, d] of vista.dias.entries()) {
      await escribir('semana_dia', {
        id: idDia(lunes, i), semana_id: idSemana(lunes), dia: i, activo: d.activo ? 1 : 0, fuera: d.fuera ? 1 : 0,
      });
    }

    // Los de origen nulo los añadió una persona: no se tocan.
    const deRecetas = (await db.producto.toArray()).filter((p) => p.origen != null);
    const conservables = new Map<string, string>();
    if (teniaLista) {
      for (const p of deRecetas) {
        const clave = normalizar(String(p.nombre));
        if (!conservables.has(clave)) conservables.set(clave, p.id as string);
      }
    }
    const conservados = new Set<string>();
    for (const l of lineas) {
      const campos = { nombre: l.nombre, cantidad: l.cantidad, seccion: l.seccion, origen: l.origen.join(' · ') };
      const id = conservables.get(normalizar(l.nombre));
      if (id) {
        // Sin `estado` ni `cogido_por`: escribir mezcla con la fila local y los conserva.
        conservados.add(id);
        await escribir('producto', { id, ...campos });
      } else {
        await escribir('producto', { id: crypto.randomUUID(), ...campos, estado: 'pendiente', cogido_por: null });
      }
    }
    for (const p of deRecetas) {
      if (!conservados.has(p.id as string)) await escribir('producto', { id: p.id as string }, { borrar: true });
    }
    return lineas.length;
  });
}

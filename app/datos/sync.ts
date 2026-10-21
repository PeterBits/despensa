// Escribir aplica en local y encola; sincronizar envía la cola a /api/ops y trae /api/cambios.

import { MAX_OPS, NOMBRES_TABLAS, normalizarOp, type Fila, type Op, type TablaSync } from '../../shared/esquema';
import { db, type OpEnCola } from './local';

// El servidor respondió 401: hay que mandar a la persona a /bienvenida.
export class SinSesion extends Error {
  constructor() {
    super('No hay sesión.');
    this.name = 'SinSesion';
  }
}

// Columnas que pone el servidor: nunca viajan en una operación.
const DEL_SERVIDOR = ['version', 'borrado', 'hogar_id'];

export async function escribir(
  tabla: TablaSync,
  fila: { id: string } & Record<string, unknown>,
  opciones: { borrar?: boolean } = {},
): Promise<void> {
  await db.transaction('rw', db[tabla], db.cola, async () => {
    if (opciones.borrar) {
      const op = normalizarOp({ id: crypto.randomUUID(), tabla, fila: { id: fila.id }, borrar: true });
      await db[tabla].delete(fila.id);
      await db.cola.add(op);
      return;
    }
    const mezclada: Fila = { ...(await db[tabla].get(fila.id)), ...fila };
    for (const columna of DEL_SERVIDOR) delete mezclada[columna];
    // Si la fila no es válida lanza aquí, antes de escribir nada.
    const op = normalizarOp({ id: crypto.randomUUID(), tabla, fila: mezclada });
    await db[tabla].put(op.fila);
    await db.cola.add(op);
  });
}

async function cuerpoJson(respuesta: Response): Promise<{ error?: string; op?: number; [k: string]: unknown }> {
  try {
    return await respuesta.json();
  } catch {
    return {};
  }
}

async function enviarCola(fetcher: typeof fetch): Promise<number> {
  let enviadas = 0;
  for (;;) {
    const lote = await db.cola.orderBy('n').limit(MAX_OPS).toArray();
    if (lote.length === 0) return enviadas;
    const ops: Op[] = lote.map(({ n: _n, ...op }) => op);
    const respuesta = await fetcher('/api/ops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops }),
    });
    if (respuesta.ok) {
      // Se quita de la cola solo tras el 200 y solo lo enviado: lo escrito mientras tanto se queda.
      await db.cola.bulkDelete(lote.map((o) => o.n as number));
      enviadas += lote.length;
      continue;
    }
    if (respuesta.status === 401) throw new SinSesion();
    const cuerpo = await cuerpoJson(respuesta);
    const error = typeof cuerpo.error === 'string' ? cuerpo.error : `Error ${respuesta.status} al enviar.`;
    const rechazada = respuesta.status === 400 && typeof cuerpo.op === 'number' ? lote[cuerpo.op] : undefined;
    if (!rechazada) throw new Error(error);
    // Una operación inválida no se pierde: se aparta con su error y el lote se reintenta sin ella.
    const { n, ...op } = rechazada as OpEnCola;
    await db.transaction('rw', db.cola, db.apartadas, async () => {
      await db.apartadas.add({ op, error, fecha: new Date().toISOString() });
      await db.cola.delete(n as number);
    });
  }
}

type Cambios = { version: number; filas?: Partial<Record<TablaSync, Fila[]>> };

async function traerCambios(fetcher: typeof fetch): Promise<number> {
  const desde = (await db.meta.get('version'))?.valor ?? 0;
  const respuesta = await fetcher('/api/cambios?desde=' + desde);
  if (respuesta.status === 401) throw new SinSesion();
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status} al traer los cambios.`);
  const cambios = (await respuesta.json()) as Cambios;
  const tablas = NOMBRES_TABLAS.map((t) => db[t]);
  await db.transaction('rw', [...tablas, db.cola, db.meta], async () => {
    // Una fila con una operación pendiente se deja: la edición local gana y ya viajará.
    const pendientes = new Set((await db.cola.toArray()).map((o) => `${o.tabla}:${o.fila.id}`));
    for (const tabla of NOMBRES_TABLAS) {
      for (const { borrado, ...fila } of cambios.filas?.[tabla] ?? []) {
        const id = String(fila.id);
        if (pendientes.has(`${tabla}:${id}`)) continue;
        if (borrado === 1) await db[tabla].delete(id);
        else await db[tabla].put(fila);
      }
    }
    await db.meta.put({ clave: 'version', valor: cambios.version });
  });
  return cambios.version;
}

let enCurso: Promise<{ enviadas: number; version: number }> | null = null;

// Una sola sincronización a la vez: quien llama mientras otra corre recibe la misma promesa.
export function sincronizar(fetcher: typeof fetch = fetch): Promise<{ enviadas: number; version: number }> {
  enCurso ??= (async () => {
    try {
      const enviadas = await enviarCola(fetcher);
      return { enviadas, version: await traerCambios(fetcher) };
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './local';
import { SinSesion, escribir, sincronizar } from './sync';

type Llamada = { url: string; cuerpo?: { ops: { id: string; fila: { id: string } }[] } };

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

// Fetcher falso: apunta las llamadas y responde con lo que decida `responder`.
function falso(responder: (llamada: Llamada, n: number) => Response) {
  const llamadas: Llamada[] = [];
  const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
    const llamada: Llamada = { url: String(url), cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined };
    llamadas.push(llamada);
    return responder(llamada, llamadas.length);
  };
  return { fetcher: fetcher as typeof fetch, llamadas };
}

const esOps = (url: string) => url === '/api/ops';
const sinCambios = () => json(200, { version: 0, filas: {} });
const productoAjeno = (id: string, nombre: string, version: number) => ({
  id, nombre, cantidad: null, seccion: null, origen: null, estado: 'pendiente', cogido_por: null, version, borrado: 0,
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('copia local y sincronización', () => {
  it('escribe al momento y conserva la cola si no hay red', async () => {
    await escribir('producto', { id: 'p1', nombre: 'Leche', estado: 'pendiente' });
    expect(await db.producto.get('p1')).toMatchObject({ nombre: 'Leche' });
    await expect(
      sincronizar(async () => {
        throw new TypeError('offline');
      }),
    ).rejects.toThrow();
    expect(await db.cola.count()).toBe(1);
  });

  it('vacía la cola al enviarla y aplica cambios ajenos y borrados', async () => {
    await escribir('producto', { id: 'p1', nombre: 'Leche' });
    const { fetcher } = falso(({ url }) =>
      esOps(url)
        ? json(200, { version: 5 })
        : json(200, {
            version: 6,
            filas: { producto: [productoAjeno('p2', 'Pan', 6), { id: 'p1', version: 6, borrado: 1 }] },
          }),
    );
    expect(await sincronizar(fetcher)).toEqual({ enviadas: 1, version: 6 });
    expect(await db.cola.count()).toBe(0);
    expect((await db.meta.get('version'))?.valor).toBe(6);
    expect(await db.producto.get('p2')).toMatchObject({ nombre: 'Pan', version: 6 });
    expect(await db.producto.get('p2')).not.toHaveProperty('borrado');
    expect(await db.producto.get('p1')).toBeUndefined();
  });

  it('una escritura parcial se mezcla con la fila existente', async () => {
    await escribir('producto', { id: 'p1', nombre: 'Leche', cantidad: '2 l' });
    await escribir('producto', { id: 'p1', estado: 'carro' });
    expect(await db.producto.get('p1')).toMatchObject({ nombre: 'Leche', cantidad: '2 l', estado: 'carro' });
    expect((await db.cola.toArray())[1]?.fila).toMatchObject({ nombre: 'Leche', estado: 'carro' });
  });

  it('una escritura inválida lanza y no cambia ni la tabla ni la cola', async () => {
    await expect(escribir('producto', { id: 'p1', nombre: 'Leche', estado: 'roto' })).rejects.toThrow();
    expect(await db.producto.count()).toBe(0);
    expect(await db.cola.count()).toBe(0);
  });

  it('borrar elimina la fila local y encola el borrado', async () => {
    await escribir('producto', { id: 'p1', nombre: 'Leche' });
    await escribir('producto', { id: 'p1' }, { borrar: true });
    expect(await db.producto.get('p1')).toBeUndefined();
    expect((await db.cola.toArray())[1]).toMatchObject({ borrar: true, fila: { id: 'p1' } });
  });

  it('más de 40 operaciones salen en dos peticiones y en orden', async () => {
    for (let i = 0; i < 45; i++) await escribir('producto', { id: `p${i}`, nombre: `Producto ${i}` });
    const { fetcher, llamadas } = falso(({ url }) => (esOps(url) ? json(200, { version: 1 }) : sinCambios()));
    const resultado = await sincronizar(fetcher);
    const envios = llamadas.filter((l) => esOps(l.url));
    expect(envios.map((l) => l.cuerpo?.ops.length)).toEqual([40, 5]);
    expect(envios[1]?.cuerpo?.ops[0]?.fila.id).toBe('p40');
    expect(resultado.enviadas).toBe(45);
  });

  it('un 400 con op aparta esa operación y envía el resto', async () => {
    await escribir('producto', { id: 'a', nombre: 'A' });
    await escribir('producto', { id: 'b', nombre: 'B' });
    await escribir('producto', { id: 'c', nombre: 'C' });
    const { fetcher, llamadas } = falso(({ url }, n) => {
      if (!esOps(url)) return sinCambios();
      return n === 1 ? json(400, { error: 'Una operación no es válida.', op: 1 }) : json(200, { version: 1 });
    });
    const resultado = await sincronizar(fetcher);
    const apartadas = await db.apartadas.toArray();
    expect(apartadas).toHaveLength(1);
    expect(apartadas[0]).toMatchObject({ op: { fila: { id: 'b' } }, error: 'Una operación no es válida.' });
    expect(llamadas.filter((l) => esOps(l.url))[1]?.cuerpo?.ops.map((o) => o.fila.id)).toEqual(['a', 'c']);
    expect(await db.cola.count()).toBe(0);
    expect(resultado.enviadas).toBe(2);
  });

  it('un 400 sin op lanza y conserva la cola', async () => {
    await escribir('producto', { id: 'a', nombre: 'A' });
    const { fetcher } = falso(() => json(400, { error: 'La petición no es válida.' }));
    await expect(sincronizar(fetcher)).rejects.toThrow('La petición no es válida.');
    expect(await db.cola.count()).toBe(1);
  });

  it('un 5xx lanza y conserva la cola', async () => {
    await escribir('producto', { id: 'a', nombre: 'A' });
    const { fetcher } = falso(() => json(503, { error: 'caído' }));
    await expect(sincronizar(fetcher)).rejects.toThrow();
    expect(await db.cola.count()).toBe(1);
  });

  it('un 401 lanza SinSesion y conserva la cola', async () => {
    await escribir('producto', { id: 'a', nombre: 'A' });
    const { fetcher } = falso(() => json(401, { error: 'Sin sesión.' }));
    await expect(sincronizar(fetcher)).rejects.toBeInstanceOf(SinSesion);
    expect(await db.cola.count()).toBe(1);
  });

  it('una fila traída con una operación pendiente no se pisa', async () => {
    await escribir('producto', { id: 'p1', nombre: 'Leche' });
    const { fetcher } = falso(({ url }) =>
      esOps(url)
        ? json(200, { version: 1 })
        : json(200, { version: 2, filas: { producto: [productoAjeno('p1', 'Ajena', 2)] } }),
    );
    // Una edición local llega mientras se piden los cambios.
    const conEscritura: typeof fetch = async (url, init) => {
      const respuesta = await fetcher(url, init);
      if (String(url).startsWith('/api/cambios')) await escribir('producto', { id: 'p1', nombre: 'Local nueva' });
      return respuesta;
    };
    await sincronizar(conEscritura);
    expect(await db.producto.get('p1')).toMatchObject({ nombre: 'Local nueva' });
    expect(await db.cola.count()).toBe(1);
  });

  it('dos sincronizar() a la vez hacen una sola petición a /api/ops', async () => {
    await escribir('producto', { id: 'a', nombre: 'A' });
    const { fetcher, llamadas } = falso(({ url }) => (esOps(url) ? json(200, { version: 1 }) : sinCambios()));
    const [x, y] = await Promise.all([sincronizar(fetcher), sincronizar(fetcher)]);
    expect(llamadas.filter((l) => esOps(l.url))).toHaveLength(1);
    expect(x).toEqual(y);
  });
});

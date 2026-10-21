import { env } from 'cloudflare:test';
import { crearApp } from '../index';
import { crearSesion } from '../auth/sesiones';
import { aplicarOps, cambiosDesde } from './ops';
import { MAX_OPS } from '../../shared/esquema';

// Todo con ids inventados: cada prueba usa los suyos para no pisar a las demás (D1 se comparte dentro del fichero).
const id = () => crypto.randomUUID();
const app = crearApp(() => { throw new Error('Estas pruebas no usan passkeys'); });

async function hogarCon(...miembros: string[]) {
  const hogarId = id();
  await env.DB.prepare('INSERT INTO hogar (id) VALUES (?)').bind(hogarId).run();
  for (const m of miembros) await env.DB.prepare('INSERT INTO miembro (id, hogar_id) VALUES (?, ?)').bind(m, hogarId).run();
  return hogarId;
}
const versionDe = async (hogarId: string) =>
  (await env.DB.prepare('SELECT version FROM hogar WHERE id = ?').bind(hogarId).first<{ version: number }>())?.version ?? -1;
const fila = <T = Record<string, unknown>>(sql: string, ...args: unknown[]) => env.DB.prepare(sql).bind(...args).first<T>();
const cuenta = async (sql: string, ...args: unknown[]) => (await fila<{ n: number }>(sql, ...args))?.n ?? -1;

const producto = (p: string, extra: Record<string, unknown> = {}) => ({
  id: p, nombre: 'Leche', cantidad: '6 l', seccion: 'Lácteos y huevos', origen: 'a mano', estado: 'pendiente', cogido_por: null, ...extra,
});
const opProducto = (opId: string, p: string, extra: Record<string, unknown> = {}) =>
  ({ id: opId, tabla: 'producto' as const, fila: producto(p, extra) });

describe('aplicarOps', () => {
  it('aplica una vez aunque se reenvíe la misma operación', async () => {
    const M = id();
    const H = await hogarCon(M);
    const op = opProducto(id(), id());
    const a = await aplicarOps(env.DB, H, M, [op]);
    const b = await aplicarOps(env.DB, H, M, [op]);
    expect(a.aplicadas).toBe(1);
    expect(b).toEqual({ version: a.version, aplicadas: 0 });
    expect(await versionDe(H)).toBe(a.version);
    expect(await cuenta('SELECT COUNT(*) AS n FROM producto WHERE id = ?', op.fila.id)).toBe(1);
  });

  it('cuenta una sola vez un id de operación repetido en la misma petición y aplica en orden', async () => {
    const M = id();
    const H = await hogarCon(M);
    const p = id();
    const op = opProducto(id(), p);
    const r = await aplicarOps(env.DB, H, M, [op, op, opProducto(id(), p, { nombre: 'Leche entera' })]);
    expect(r.aplicadas).toBe(2);
    expect(await fila('SELECT nombre, borrado, version FROM producto WHERE id = ?', p)).toEqual({ nombre: 'Leche entera', borrado: 0, version: r.version });
  });

  it('rellena con NULL o con el valor por defecto lo que falta en la fila', async () => {
    const M = id();
    const H = await hogarCon(M);
    const p = id();
    await aplicarOps(env.DB, H, M, [{ id: id(), tabla: 'producto', fila: { id: p, nombre: 'Pan' } }]);
    expect(await fila('SELECT cantidad, estado FROM producto WHERE id = ?', p)).toEqual({ cantidad: null, estado: 'pendiente' });
  });

  it('devuelve solo lo cambiado desde una versión, borrados incluidos', async () => {
    const M = id();
    const H = await hogarCon(M);
    const [p1, p2] = [id(), id()];
    const { version: v0 } = await aplicarOps(env.DB, H, M, [opProducto(id(), p1), opProducto(id(), p2)]);
    const antes = await cambiosDesde(env.DB, H, 0);
    expect(antes.version).toBe(v0);
    expect(antes.filas.producto?.map((f) => f.id).sort()).toEqual([p1, p2].sort());
    const { version: v1 } = await aplicarOps(env.DB, H, M, [{ id: id(), tabla: 'producto', fila: { id: p1 }, borrar: true }]);
    const { version, filas } = await cambiosDesde(env.DB, H, v0);
    expect(version).toBe(v1);
    expect(Object.keys(filas)).toEqual(['producto']);
    expect(filas.producto).toEqual([{ ...producto(p1), version: v1, borrado: 1 }]);
    expect(filas.producto?.[0]).not.toHaveProperty('hogar_id');
    expect((await cambiosDesde(env.DB, H, v1)).filas).toEqual({});
  });

  it('no deja escribir en filas de otro hogar ni la nota de la pareja', async () => {
    const [yo, pareja] = [id(), id()];
    const H = await hogarCon(yo, pareja);
    const OTRO = await hogarCon(id());

    // Una fila de otro hogar con el mismo id no cambia, ni al escribir ni al borrar.
    const ajeno = id();
    await aplicarOps(env.DB, OTRO, 'ajeno', [opProducto(id(), ajeno, { nombre: 'Ajeno' })]);
    const antesAjeno = await fila('SELECT * FROM producto WHERE id = ?', ajeno);
    await aplicarOps(env.DB, H, yo, [opProducto(id(), ajeno, { nombre: 'Mío' })]);
    await aplicarOps(env.DB, H, yo, [{ id: id(), tabla: 'producto', fila: { id: ajeno }, borrar: true }]);
    expect(await fila('SELECT * FROM producto WHERE id = ?', ajeno)).toEqual(antesAjeno);

    // La nota se guarda con el miembro que escribe, aunque la operación diga otro.
    const comida = id();
    const mia = id();
    await aplicarOps(env.DB, H, yo, [{ id: id(), tabla: 'nota', fila: { id: mia, comida_id: comida, miembro_id: pareja, valor: 8 } }]);
    expect(await fila('SELECT miembro_id, valor FROM nota WHERE id = ?', mia)).toEqual({ miembro_id: yo, valor: 8 });

    // Ni sobrescribir ni borrar la nota de la pareja.
    const suya = id();
    await aplicarOps(env.DB, H, pareja, [{ id: id(), tabla: 'nota', fila: { id: suya, comida_id: comida, miembro_id: pareja, valor: 6 } }]);
    const antesSuya = await fila('SELECT * FROM nota WHERE id = ?', suya);
    await aplicarOps(env.DB, H, yo, [{ id: id(), tabla: 'nota', fila: { id: suya, comida_id: comida, miembro_id: yo, valor: 1 } }]);
    expect(await fila('SELECT * FROM nota WHERE id = ?', suya)).toEqual(antesSuya);
    await aplicarOps(env.DB, H, yo, [{ id: id(), tabla: 'nota', fila: { id: suya }, borrar: true }]);
    expect(await fila('SELECT * FROM nota WHERE id = ?', suya)).toEqual(antesSuya);

    // Y quien la escribió sí puede borrarla.
    await aplicarOps(env.DB, H, pareja, [{ id: id(), tabla: 'nota', fila: { id: suya }, borrar: true }]);
    expect(await fila('SELECT borrado FROM nota WHERE id = ?', suya)).toEqual({ borrado: 1 });
  });
});

describe('POST /api/ops y GET /api/cambios', () => {
  async function conSesion() {
    const m = id();
    const H = await hogarCon(m);
    const cookie = (await crearSesion(env.DB, m)).split(';')[0] ?? '';
    return { H, m, cookie };
  }
  const enviar = (cookie: string, cuerpo: unknown) => app.request('/api/ops', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(cuerpo),
  }, env);
  const pedirCambios = (cookie: string, consulta = '') => app.request(`/api/cambios${consulta}`, { headers: { Cookie: cookie } }, env);

  it('aplica las operaciones y sirve los cambios', async () => {
    const { H, cookie } = await conSesion();
    const p = id();
    const r = await enviar(cookie, { ops: [opProducto(id(), p)] });
    expect(r.status).toBe(200);
    const { version } = await r.json<{ version: number }>();
    expect(version).toBe(await versionDe(H));
    const c = await pedirCambios(cookie, '?desde=0');
    expect(await c.json()).toEqual({ version, filas: { producto: [{ ...producto(p), version, borrado: 0 }] } });
    expect(await (await pedirCambios(cookie)).json()).toMatchObject({ version });
  });

  it('rechaza columnas desconocidas con 400 y no escribe nada', async () => {
    const { H, cookie } = await conSesion();
    const bueno = id();
    const r = await enviar(cookie, { ops: [opProducto(id(), bueno), opProducto(id(), id(), { columna_rara: 1 })] });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: expect.any(String) });
    expect(await cuenta('SELECT COUNT(*) AS n FROM producto WHERE id = ?', bueno)).toBe(0);
    expect(await versionDe(H)).toBe(0);
  });

  it('rechaza valores fuera de rango con 400', async () => {
    const { cookie } = await conSesion();
    const nota = (valor: number) => ({ id: id(), tabla: 'nota', fila: { id: id(), comida_id: id(), valor } });
    expect((await enviar(cookie, { ops: [nota(11)] })).status).toBe(400);
    expect((await enviar(cookie, { ops: [nota(0)] })).status).toBe(400);
    expect((await enviar(cookie, { ops: [opProducto(id(), id(), { estado: 'perdido' })] })).status).toBe(400);
    expect((await enviar(cookie, { ops: [nota(7)] })).status).toBe(200);
  });

  it('rechaza más de 40 operaciones con 400 y no escribe nada', async () => {
    const { H, cookie } = await conSesion();
    const ops = Array.from({ length: MAX_OPS + 1 }, () => opProducto(id(), id()));
    const r = await enviar(cookie, { ops });
    expect(r.status).toBe(400);
    expect(await versionDe(H)).toBe(0);
    expect((await enviar(cookie, { ops: ops.slice(0, MAX_OPS) })).status).toBe(200);
  });

  it('exige sesión', async () => {
    expect((await app.request('/api/ops', { method: 'POST', body: '{}' }, env)).status).toBe(401);
    expect((await app.request('/api/cambios', {}, env)).status).toBe(401);
  });

  it('rechaza un desde que no es un entero no negativo', async () => {
    const { cookie } = await conSesion();
    for (const malo of ['-1', 'abc', '1.5', '']) expect((await pedirCambios(cookie, `?desde=${malo}`)).status).toBe(400);
  });
});

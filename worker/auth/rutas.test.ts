import { env } from 'cloudflare:test';
import { crearApp } from '../index';
import { sha256 } from './cripto';
import { verificadorReal, type VerificadorPasskeys } from './passkeys';

// Acepta cualquier respuesta: cada registro es una credencial nueva con datos inventados.
const falso: VerificadorPasskeys = {
  opcionesRegistro: async () => ({ challenge: 'reto-de-prueba' }),
  verificarRegistro: async () => ({
    id: `credencial-${crypto.randomUUID()}`,
    clavePublica: new Uint8Array([1, 2, 3]),
    contador: 0,
    transportes: ['internal'],
  }),
  opcionesEntrada: async () => ({ challenge: 'reto-de-prueba' }),
  verificarEntrada: async (_respuesta, _reto, credencial) => ({ id: credencial.id, contador: credencial.contador + 1 }),
};
const app = crearApp(() => falso);

function peticion(metodo: string, cuerpo?: unknown, cookie?: string): RequestInit {
  const headers: Record<string, string> = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  return { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) };
}
const pedir = async (metodo: string, ruta: string, cuerpo?: unknown, cookie?: string) =>
  app.request(ruta, peticion(metodo, cuerpo, cookie), env);
const cookieDe = (r: Response) => (r.headers.get('Set-Cookie') ?? '').split(';')[0] ?? '';

async function reto(ruta = '/api/hogar/opciones', cuerpo?: unknown) {
  return (await (await pedir('POST', ruta, cuerpo)).json<{ retoId: string }>()).retoId;
}
async function crearHogar() {
  const r = await pedir('POST', '/api/hogar', { retoId: await reto(), respuesta: {} });
  return { r, cookie: cookieDe(r) };
}
async function invitar(cookie: string) {
  const { enlace } = await (await pedir('POST', '/api/invitaciones', {}, cookie)).json<{ enlace: string }>();
  return enlace.split('#')[1] ?? '';
}
async function aceptar(token: string) {
  const retoId = await reto('/api/invitaciones/aceptar/opciones', { token });
  return pedir('POST', '/api/invitaciones/aceptar', { token, retoId, respuesta: {} });
}

describe('acceso con passkeys', () => {
  it('crea hogar con cookie Lax y entra en /api/yo', async () => {
    const r = await pedir('POST', '/api/hogar', { retoId: await reto(), respuesta: {} });
    expect(r.status).toBe(201);
    expect(r.headers.get('Set-Cookie')).toMatch(/^sesion=[\w-]+; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=15552000$/);
    const yo = await pedir('GET', '/api/yo', undefined, cookieDe(r));
    expect(await yo.json()).toMatchObject({ miembros: 1 });
  });

  it('invita a una segunda persona y rechaza una tercera', async () => {
    const { cookie } = await crearHogar();
    const token = await invitar(cookie);
    expect((await aceptar(token)).status).toBe(201);
    expect((await pedir('POST', '/api/invitaciones/aceptar/opciones', { token })).status).toBe(410);
    const otro = await invitar(cookie);
    const tercera = await pedir('POST', '/api/invitaciones/aceptar/opciones', { token: otro });
    expect(tercera.status).toBe(409);
    expect(await tercera.json()).toEqual({ error: 'Este hogar ya tiene dos personas.' });
  });

  it('rechaza una invitación caducada y no guarda tokens en claro', async () => {
    const { cookie } = await crearHogar();
    const token = await invitar(cookie);
    const hash = await sha256(token);
    const guardados = (await env.DB.prepare('SELECT token_hash FROM invitacion').all<{ token_hash: string }>())
      .results.map((f) => f.token_hash);
    expect(guardados).toContain(hash);
    expect(guardados).not.toContain(token);

    await env.DB.prepare('UPDATE invitacion SET caduca = ? WHERE token_hash = ?')
      .bind(new Date(Date.now() - 60_000).toISOString(), hash)
      .run();
    const r = await pedir('POST', '/api/invitaciones/aceptar/opciones', { token });
    expect(r.status).toBe(410);
    expect(await r.json()).toEqual({ error: 'Esta invitación ya no vale. Pide otra.' });
  });

  it('responde 401 sin sesión', async () => {
    const r = await pedir('GET', '/api/yo');
    expect(r.status).toBe(401);
    expect(await r.json()).toHaveProperty('error');
  });

  it('no deja usar un reto dos veces, aunque la passkey falle', async () => {
    const { cookie } = await crearHogar();
    const { miembroId } = await (await pedir('GET', '/api/yo', undefined, cookie)).json<{ miembroId: string }>();
    const credencial = await env.DB.prepare('SELECT id FROM credencial WHERE miembro_id = ?')
      .bind(miembroId)
      .first<{ id: string }>();
    const respuesta = { id: credencial?.id };

    // La verificación falla: el reto se gasta igualmente.
    const fallido = await reto('/api/entrar/opciones');
    const rechazo = await crearApp(() => ({ ...falso, verificarEntrada: async () => null }))
      .request('/api/entrar', peticion('POST', { retoId: fallido, respuesta }), env);
    expect(rechazo.status).toBe(401);
    expect(rechazo.headers.get('Set-Cookie')).toBeNull();
    expect((await pedir('POST', '/api/entrar', { retoId: fallido, respuesta })).status).toBe(400);

    // Entra a la primera y actualiza el contador; el mismo reto ya no vale.
    const retoId = await reto('/api/entrar/opciones');
    const dentro = await pedir('POST', '/api/entrar', { retoId, respuesta });
    expect(dentro.status).toBe(200);
    expect(dentro.headers.get('Set-Cookie')).toMatch(/^sesion=[\w-]+;/);
    const { contador } = (await env.DB.prepare('SELECT contador FROM credencial WHERE id = ?')
      .bind(credencial?.id)
      .first<{ contador: number }>()) ?? {};
    expect(contador).toBe(1);
    expect((await pedir('POST', '/api/entrar', { retoId, respuesta })).status).toBe(400);
  });

  it('genera opciones reales de registro en workerd', async () => {
    const opciones = await verificadorReal(env).opcionesRegistro('miembro-de-prueba');
    expect(opciones).toMatchObject({ rp: { id: env.RP_ID }, challenge: expect.any(String) });
    expect(opciones.challenge).not.toBe('');
  });
});

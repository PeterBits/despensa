import { env } from 'cloudflare:test';
import { crearApp } from '../index';
import { sha256 } from './cripto';
import { etiquetaPasskey, verificadorReal, type Credencial, type VerificadorPasskeys } from './passkeys';
import { cookieBorrada } from './sesiones';

const credencialNueva = (id = `credencial-${crypto.randomUUID()}`): Credencial =>
  ({ id, clavePublica: new Uint8Array([1, 2, 3]), contador: 0, transportes: ['internal'] });

// Acepta cualquier respuesta: cada registro es una credencial nueva con datos inventados.
const falso: VerificadorPasskeys = {
  opcionesRegistro: async () => ({
    challenge: 'reto-de-prueba',
    rp: { name: 'Despensa' },
    user: { id: 'bWllbWJyby1kZS1wcnVlYmE', name: 'Despensa', displayName: 'Despensa' },
    pubKeyCredParams: [],
  }),
  verificarRegistro: async () => credencialNueva(),
  opcionesEntrada: async () => ({ challenge: 'reto-de-prueba' }),
  verificarEntrada: async (_respuesta, _reto, credencial) => ({ id: credencial.id, contador: credencial.contador + 1 }),
};
const app = crearApp(() => falso);

const AJENO = 'https://atacante.example';

function peticion(metodo: string, cuerpo?: unknown, cookie?: string, cabeceras: Record<string, string> = {}): RequestInit {
  const headers: Record<string, string> = { ...cabeceras };
  if (cuerpo !== undefined) headers['Content-Type'] ??= 'application/json';
  if (cookie) headers.Cookie = cookie;
  return { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) };
}
const pedir = async (metodo: string, ruta: string, cuerpo?: unknown, cookie?: string, cabeceras?: Record<string, string>) =>
  app.request(ruta, peticion(metodo, cuerpo, cookie, cabeceras), env);
const cookieDe = (r: Response) => (r.headers.get('Set-Cookie') ?? '').split(';')[0] ?? '';

async function reto(ruta = '/api/hogar/opciones', cuerpo?: unknown) {
  return (await (await pedir('POST', ruta, cuerpo)).json<{ retoId: string }>()).retoId;
}
async function crearHogar() {
  const r = await pedir('POST', '/api/hogar', { retoId: await reto(), respuesta: {} });
  return { r, cookie: cookieDe(r) };
}
async function yo(cookie: string) {
  return (await pedir('GET', '/api/yo', undefined, cookie)).json<{ miembroId: string; hogarId: string; miembros: number }>();
}
async function credencialDe(cookie: string) {
  const { miembroId } = await yo(cookie);
  const fila = await env.DB.prepare('SELECT id FROM credencial WHERE miembro_id = ?').bind(miembroId).first<{ id: string }>();
  return fila?.id ?? '';
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

  it('acepta una sola vez la misma invitación aunque lleguen dos a la vez', async () => {
    const { cookie } = await crearHogar();
    const token = await invitar(cookie);
    const estados = (await Promise.all([aceptar(token), aceptar(token)])).map((r) => r.status);
    expect(estados.filter((e) => e === 201)).toHaveLength(1);
    expect((await yo(cookie)).miembros).toBe(2);
  });

  it('responde 401 sin sesión', async () => {
    const r = await pedir('GET', '/api/yo');
    expect(r.status).toBe(401);
    expect(await r.json()).toHaveProperty('error');
    expect((await pedir('POST', '/api/invitaciones', {})).status).toBe(401);
    expect((await pedir('POST', '/api/hogar/opciones-x')).status).toBe(401);
  });

  it('sale de forma idempotente y borra la sesión', async () => {
    const { cookie } = await crearHogar();
    const r = await pedir('POST', '/api/salir', undefined, cookie);
    expect(r.status).toBe(200);
    expect(r.headers.get('Set-Cookie')).toBe(cookieBorrada());
    const hash = await sha256(cookie.slice('sesion='.length));
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM sesion WHERE id = ?').bind(hash).first('n')).toBe(0);
    expect((await pedir('GET', '/api/yo', undefined, cookie)).status).toBe(401);

    for (const otra of [await pedir('POST', '/api/salir', undefined, cookie), await pedir('POST', '/api/salir')]) {
      expect(otra.status).toBe(200);
      expect(otra.headers.get('Set-Cookie')).toBe(cookieBorrada());
    }
  });

  it('rechaza un reto caducado', async () => {
    const retoId = await reto();
    await env.DB.prepare('UPDATE reto SET caduca = ? WHERE id = ?')
      .bind(new Date(Date.now() - 60_000).toISOString(), retoId)
      .run();
    const r = await pedir('POST', '/api/hogar', { retoId, respuesta: {} });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'El intento ha caducado. Vuelve a empezar.' });
    expect(r.headers.get('Set-Cookie')).toBeNull();
  });

  it('no deja usar un reto dos veces, aunque la passkey falle', async () => {
    const { cookie } = await crearHogar();
    const credencialId = await credencialDe(cookie);
    const respuesta = { id: credencialId };

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
    const contador = await env.DB.prepare('SELECT contador FROM credencial WHERE id = ?').bind(credencialId).first('contador');
    expect(contador).toBe(1);
    expect((await pedir('POST', '/api/entrar', { retoId, respuesta })).status).toBe(400);
  });

  it('responde 500 en JSON y sin rastro si falla D1', async () => {
    const callar = vi.spyOn(console, 'error').mockImplementation(() => {});
    onTestFinished(() => callar.mockRestore());
    const repetida = credencialNueva();
    const conRepetida = crearApp(() => ({ ...falso, verificarRegistro: async () => repetida }));
    const crear = async () => {
      const retoId = await reto();
      return { retoId, r: await conRepetida.request('/api/hogar', peticion('POST', { retoId, respuesta: {} }), env) };
    };
    expect((await crear()).r.status).toBe(201);

    const { retoId, r } = await crear();
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'Algo ha fallado. Inténtalo otra vez.' });
    expect(r.headers.get('Set-Cookie')).toBeNull();
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM miembro WHERE id = ?').bind(retoId).first('n')).toBe(0);
  });

  it('genera opciones reales en workerd', async () => {
    const real = verificadorReal(env);
    const registro = await real.opcionesRegistro('miembro-de-prueba');
    expect(registro).toMatchObject({
      rp: { id: env.RP_ID, name: 'Despensa' },
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    // Una etiqueta sin datos personales: "Despensa" y la fecha del alta.
    expect(registro.user.name).toMatch(/^Despensa · \d{2}\/\d{2}\/\d{4}$/);
    expect(registro.user.displayName).toBe(registro.user.name);
    // La fecha es la de Madrid: las 22:30 UTC del 20 de octubre ya son día 21 allí.
    expect(etiquetaPasskey(new Date('2026-10-20T22:30:00Z'))).toBe('Despensa · 21/10/2026');
    expect(registro.challenge).not.toBe('');

    const entrada = await real.opcionesEntrada();
    expect(entrada.userVerification).toBe('required');
    expect(entrada.allowCredentials ?? []).toEqual([]);
    expect(entrada.challenge).not.toBe('');
  });
});

describe('protección CSRF', () => {
  it('corta una entrada enviada desde otra web como text/plain', async () => {
    const { cookie } = await crearHogar();
    const cuerpo = { retoId: await reto('/api/entrar/opciones'), respuesta: { id: await credencialDe(cookie) } };
    const desde = (cabeceras: Record<string, string>) =>
      pedir('POST', '/api/entrar', cuerpo, undefined, { 'Content-Type': 'text/plain', ...cabeceras });

    for (const ajena of [await desde({ Origin: AJENO }), await desde({ 'Sec-Fetch-Site': 'cross-site' })]) {
      expect(ajena.status).toBe(403);
      expect(await ajena.json()).toEqual({ error: 'Esta petición no viene de Despensa.' });
      expect(ajena.headers.get('Set-Cookie')).toBeNull();
    }
    // La misma petición desde la propia app sí entra: lo único que la frenaba era el origen.
    expect((await desde({ Origin: env.ORIGEN, 'Sec-Fetch-Site': 'same-origin' })).status).toBe(200);
  });

  it('no deja cerrar la sesión desde otra web', async () => {
    const { cookie } = await crearHogar();
    const r = await pedir('POST', '/api/salir', undefined, cookie, { Origin: AJENO });
    expect(r.status).toBe(403);
    expect(r.headers.get('Set-Cookie')).toBeNull();
    expect((await pedir('GET', '/api/yo', undefined, cookie)).status).toBe(200);
  });

  it('deja pasar las peticiones de la propia app', async () => {
    const mismo = { Origin: env.ORIGEN, 'Sec-Fetch-Site': 'same-origin' };
    const opciones = await pedir('POST', '/api/hogar/opciones', undefined, undefined, mismo);
    const { retoId } = await opciones.json<{ retoId: string }>();
    expect((await pedir('POST', '/api/hogar', { retoId, respuesta: {} }, undefined, mismo)).status).toBe(201);
  });
});

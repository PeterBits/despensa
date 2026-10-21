import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import { sha256 } from './cripto';
import { cookieBorrada, crearSesion, leerSesion, requiereSesion, type Entorno } from './sesiones';

const DIA = 86_400_000;

// D1 se comparte entre los tests de un fichero: cada test se inventa su propio hogar.
async function miembroDePrueba() {
  const hogarId = `hogar-${crypto.randomUUID()}`;
  const miembroId = `miembro-${crypto.randomUUID()}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO hogar (id) VALUES (?)').bind(hogarId),
    env.DB.prepare('INSERT INTO miembro (id, hogar_id) VALUES (?, ?)').bind(miembroId, hogarId),
  ]);
  return { hogarId, miembroId };
}

// Una sesión guardada como la guardaría crearSesion, pero con la caducidad que pida el test.
async function sesionQueCaduca(miembroId: string, dentroDe: number) {
  const token = `token-de-prueba-${crypto.randomUUID()}`;
  await env.DB.prepare('INSERT INTO sesion (id, miembro_id, caduca) VALUES (?, ?, ?)')
    .bind(await sha256(token), miembroId, new Date(Date.now() + dentroDe).toISOString())
    .run();
  return token;
}

const caducaDe = async (token: string) =>
  (await env.DB.prepare('SELECT caduca FROM sesion WHERE id = ?').bind(await sha256(token)).first<{ caduca: string }>())
    ?.caduca;

describe('cookie de sesión', () => {
  it('crea la cookie con el formato exacto y guarda solo el hash del token', async () => {
    const { hogarId, miembroId } = await miembroDePrueba();
    const cookie = await crearSesion(env.DB, miembroId);
    expect(cookie).toMatch(/^sesion=[\w-]{43}; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=15552000$/);

    const token = cookie.slice('sesion='.length, cookie.indexOf(';'));
    const fila = await env.DB.prepare('SELECT id, caduca FROM sesion WHERE miembro_id = ?')
      .bind(miembroId)
      .first<{ id: string; caduca: string }>();
    expect(fila?.id).toBe(await sha256(token));
    expect(Date.parse(fila?.caduca ?? '')).toBeGreaterThan(Date.now() + 179 * DIA);
    expect(await leerSesion(env.DB, `otra=1; sesion=${token}`)).toEqual({ miembroId, hogarId });
  });

  it('borra la cookie con los mismos atributos', () => {
    expect(cookieBorrada()).toBe('sesion=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  });
});

describe('leerSesion', () => {
  it('devuelve null sin cookie, con basura o con la sesión caducada', async () => {
    const { miembroId } = await miembroDePrueba();
    const caducada = await sesionQueCaduca(miembroId, -DIA);
    expect(await leerSesion(env.DB, null)).toBeNull();
    expect(await leerSesion(env.DB, '')).toBeNull();
    expect(await leerSesion(env.DB, 'otra=valor')).toBeNull();
    expect(await leerSesion(env.DB, 'sesion=basura')).toBeNull();
    expect(await leerSesion(env.DB, `sesion=${caducada}`)).toBeNull();
  });
});

describe('requiereSesion', () => {
  const app = new Hono<Entorno>().use(requiereSesion).get('/', (c) => c.json(c.get('sesion')));
  const pedir = (token: string) => app.request('/', { headers: { Cookie: `sesion=${token}` } }, env);

  it('renueva la sesión solo cuando le quedan menos de 90 días', async () => {
    const { hogarId, miembroId } = await miembroDePrueba();

    const vieja = await sesionQueCaduca(miembroId, 89 * DIA);
    const r = await pedir(vieja);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ miembroId, hogarId });
    expect(r.headers.get('Set-Cookie')).toBe(`sesion=${vieja}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=15552000`);
    expect(Date.parse((await caducaDe(vieja)) ?? '')).toBeGreaterThan(Date.now() + 179 * DIA);

    const reciente = await sesionQueCaduca(miembroId, 91 * DIA);
    const antes = await caducaDe(reciente);
    const s = await pedir(reciente);
    expect(s.status).toBe(200);
    expect(s.headers.get('Set-Cookie')).toBeNull();
    expect(await caducaDe(reciente)).toBe(antes);
  });
});

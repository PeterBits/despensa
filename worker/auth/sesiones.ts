// Sesiones: la cookie lleva un token aleatorio; D1 guarda su SHA-256 y cuándo caduca.

import { createMiddleware } from 'hono/factory';
import { sha256, tokenAleatorio } from './cripto';

export type Sesion = { miembroId: string; hogarId: string };
export type Entorno = { Bindings: Env; Variables: { sesion: Sesion } };

const DIA = 86_400_000;
const DURACION = 180 * DIA;
const RENOVAR_SI_QUEDAN = 90 * DIA;
const ATRIBUTOS = 'HttpOnly; Secure; SameSite=Lax; Path=/';

const cookieCon = (token: string) => `sesion=${token}; ${ATRIBUTOS}; Max-Age=${DURACION / 1000}`;
const caducidadNueva = () => new Date(Date.now() + DURACION).toISOString();

export function cookieBorrada(): string {
  return `sesion=; ${ATRIBUTOS}; Max-Age=0`;
}

// Devuelve el valor de Set-Cookie para la sesión recién creada.
export async function crearSesion(db: D1Database, miembroId: string): Promise<string> {
  const token = tokenAleatorio();
  await db.prepare('INSERT INTO sesion (id, miembro_id, caduca) VALUES (?, ?, ?)')
    .bind(await sha256(token), miembroId, caducidadNueva())
    .run();
  return cookieCon(token);
}

// El token de la cabecera Cookie, si viene.
function tokenDe(cookie: string | null): string | null {
  const parte = cookie?.split(';').map((p) => p.trim()).find((p) => p.startsWith('sesion='));
  return parte?.slice('sesion='.length) || null;
}

// La sesión vigente de esa cookie; una caducada cuenta como ninguna.
async function buscar(db: D1Database, cookie: string | null) {
  const token = tokenDe(cookie);
  if (!token) return null;
  const fila = await db.prepare(
    `SELECT s.id, s.caduca, s.miembro_id AS miembroId, m.hogar_id AS hogarId
     FROM sesion s JOIN miembro m ON m.id = s.miembro_id
     WHERE s.id = ? AND s.caduca > ?`,
  ).bind(await sha256(token), new Date().toISOString())
    .first<{ id: string; caduca: string } & Sesion>();
  return fila && { token, ...fila };
}

export async function leerSesion(db: D1Database, cookie: string | null): Promise<Sesion | null> {
  const s = await buscar(db, cookie);
  return s && { miembroId: s.miembroId, hogarId: s.hogarId };
}

export async function cerrarSesion(db: D1Database, cookie: string | null): Promise<void> {
  const token = tokenDe(cookie);
  if (token) await db.prepare('DELETE FROM sesion WHERE id = ?').bind(await sha256(token)).run();
}

// Contra CSRF: una escritura que llega desde otra web (Origin ajeno o Sec-Fetch-Site cross-site) no pasa,
// porque un formulario text/plain podría colar JSON y dejar la cookie. Sin ninguna de las dos (curl, tests), sí.
export const soloMismoOrigen = createMiddleware<Entorno>(async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const origen = c.req.header('Origin');
    if ((origen !== undefined && origen !== c.env.ORIGEN) || c.req.header('Sec-Fetch-Site') === 'cross-site')
      return c.json({ error: 'Esta petición no viene de Despensa.' }, 403);
  }
  await next();
});

// Sin sesión, 401. Si le quedan menos de 90 días, la alarga a 180 y reenvía la misma cookie.
export const requiereSesion = createMiddleware<Entorno>(async (c, next) => {
  const s = await buscar(c.env.DB, c.req.header('Cookie') ?? null);
  if (!s) return c.json({ error: 'Entra con tu passkey para seguir.' }, 401);
  if (Date.parse(s.caduca) - Date.now() < RENOVAR_SI_QUEDAN) {
    await c.env.DB.prepare('UPDATE sesion SET caduca = ? WHERE id = ?').bind(caducidadNueva(), s.id).run();
    c.header('Set-Cookie', cookieCon(s.token));
  }
  c.set('sesion', { miembroId: s.miembroId, hogarId: s.hogarId });
  await next();
});

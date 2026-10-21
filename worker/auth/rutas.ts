// Rutas de acceso: crear el hogar, invitar a la pareja, entrar y salir con passkeys.

import type { Context, Hono } from 'hono';
import { sha256, tokenAleatorio } from './cripto';
import { gastarReto, guardarReto, type Credencial, type VerificadorPasskeys } from './passkeys';
import { cerrarSesion, cookieBorrada, crearSesion, type Entorno } from './sesiones';

type Verificador = (env: Env) => VerificadorPasskeys;

const INVITACION_DURA = 24 * 3_600_000;
const MAX_MIEMBROS = 2;

const ERROR = {
  peticion: 'La petición no es válida.',
  reto: 'El intento ha caducado. Vuelve a empezar.',
  passkey: 'No hemos podido comprobar tu passkey.',
  invitacion: 'Esta invitación ya no vale. Pide otra.',
  hogarLleno: 'Este hogar ya tiene dos personas.',
};

const ahora = () => new Date().toISOString();
const esTexto = (v: unknown): v is string => typeof v === 'string' && v !== '';
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// El cuerpo JSON; vacío si no es un objeto o no se puede leer.
async function cuerpoDe(c: Context<Entorno>): Promise<Record<string, unknown>> {
  try {
    const cuerpo: unknown = await c.req.json();
    return esObjeto(cuerpo) ? cuerpo : {};
  } catch {
    return {};
  }
}

async function entrarComo(c: Context<Entorno>, miembroId: string, estado: 200 | 201) {
  c.header('Set-Cookie', await crearSesion(c.env.DB, miembroId));
  return c.json({ ok: true }, estado);
}

// El reto de un registro lleva el id del miembro que se creará, que es también el userID de su passkey.
async function retoDeRegistro(env: Env, verificador: Verificador) {
  const miembroId = crypto.randomUUID();
  const opciones = await verificador(env).opcionesRegistro(miembroId);
  await guardarReto(env.DB, miembroId, opciones.challenge);
  return { retoId: miembroId, opciones };
}

// Solo entra si el miembro existe: si su alta no se hizo, tampoco se guarda la credencial.
const guardarCredencial = (db: D1Database, miembroId: string, cr: Credencial) =>
  db.prepare(
    `INSERT INTO credencial (id, miembro_id, clave_publica, contador, transportes)
     SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM miembro WHERE id = ?)`,
  ).bind(cr.id, miembroId, cr.clavePublica, cr.contador, JSON.stringify(cr.transportes), miembroId);

// D1 devuelve los BLOB como array de bytes.
async function leerCredencial(db: D1Database, id: string) {
  const fila = await db.prepare('SELECT miembro_id, clave_publica, contador, transportes FROM credencial WHERE id = ?')
    .bind(id)
    .first<{ miembro_id: string; clave_publica: number[]; contador: number; transportes: string | null }>();
  if (!fila) return null;
  const credencial: Credencial = {
    id,
    clavePublica: new Uint8Array(fila.clave_publica),
    contador: fila.contador,
    transportes: fila.transportes ? (JSON.parse(fila.transportes) as string[]) : [],
  };
  return { miembroId: fila.miembro_id, credencial };
}

// Primero 410 (no existe, ya se usó o caducó) y luego 409 (el hogar ya está completo).
async function revisarInvitacion(db: D1Database, tokenHash: string) {
  const fila = await db.prepare(
    `SELECT i.hogar_id AS hogarId, (SELECT COUNT(*) FROM miembro m WHERE m.hogar_id = i.hogar_id) AS miembros
     FROM invitacion i WHERE i.token_hash = ? AND i.usada = 0 AND i.caduca > ?`,
  ).bind(tokenHash, ahora())
    .first<{ hogarId: string; miembros: number }>();
  if (!fila) return { estado: 410, error: ERROR.invitacion } as const;
  if (fila.miembros >= MAX_MIEMBROS) return { estado: 409, error: ERROR.hogarLleno } as const;
  return { hogarId: fila.hogarId };
}

// Sin sesión: crear el hogar, aceptar una invitación, entrar y salir.
export function rutasPublicas(app: Hono<Entorno>, verificador: Verificador): void {
  app.post('/api/hogar/opciones', async (c) => c.json(await retoDeRegistro(c.env, verificador)));

  app.post('/api/hogar', async (c) => {
    const { retoId, respuesta } = await cuerpoDe(c);
    if (!esTexto(retoId) || !esObjeto(respuesta)) return c.json({ error: ERROR.peticion }, 400);
    const db = c.env.DB;
    const reto = await gastarReto(db, retoId);
    if (!reto) return c.json({ error: ERROR.reto }, 400);
    const credencial = await verificador(c.env).verificarRegistro(respuesta, reto);
    if (!credencial) return c.json({ error: ERROR.passkey }, 401);
    const hogarId = crypto.randomUUID();
    await db.batch([
      db.prepare('INSERT INTO hogar (id) VALUES (?)').bind(hogarId),
      db.prepare('INSERT INTO miembro (id, hogar_id) VALUES (?, ?)').bind(retoId, hogarId),
      guardarCredencial(db, retoId, credencial),
    ]);
    return entrarComo(c, retoId, 201);
  });

  app.post('/api/invitaciones/aceptar/opciones', async (c) => {
    const { token } = await cuerpoDe(c);
    if (!esTexto(token)) return c.json({ error: ERROR.peticion }, 400);
    const invitacion = await revisarInvitacion(c.env.DB, await sha256(token));
    if ('estado' in invitacion) return c.json({ error: invitacion.error }, invitacion.estado);
    return c.json(await retoDeRegistro(c.env, verificador));
  });

  app.post('/api/invitaciones/aceptar', async (c) => {
    const { token, retoId, respuesta } = await cuerpoDe(c);
    if (!esTexto(token) || !esTexto(retoId) || !esObjeto(respuesta)) return c.json({ error: ERROR.peticion }, 400);
    const db = c.env.DB;
    const tokenHash = await sha256(token);
    const invitacion = await revisarInvitacion(db, tokenHash);
    if ('estado' in invitacion) return c.json({ error: invitacion.error }, invitacion.estado);
    const reto = await gastarReto(db, retoId);
    if (!reto) return c.json({ error: ERROR.reto }, 400);
    const credencial = await verificador(c.env).verificarRegistro(respuesta, reto);
    if (!credencial) return c.json({ error: ERROR.passkey }, 401);

    // Si dos personas aceptan a la vez, solo una marca la invitación y solo entra quien quepa en el hogar.
    const marcada = await db.prepare('UPDATE invitacion SET usada = 1 WHERE token_hash = ? AND usada = 0 AND caduca > ?')
      .bind(tokenHash, ahora())
      .run();
    if (marcada.meta.changes !== 1) return c.json({ error: ERROR.invitacion }, 410);
    const [alta] = await db.batch([
      db.prepare('INSERT INTO miembro (id, hogar_id) SELECT ?, ? WHERE (SELECT COUNT(*) FROM miembro WHERE hogar_id = ?) < ?')
        .bind(retoId, invitacion.hogarId, invitacion.hogarId, MAX_MIEMBROS),
      guardarCredencial(db, retoId, credencial),
    ]);
    if (alta?.meta.changes !== 1) return c.json({ error: ERROR.hogarLleno }, 409);
    return entrarComo(c, retoId, 201);
  });

  app.post('/api/entrar/opciones', async (c) => {
    const opciones = await verificador(c.env).opcionesEntrada();
    const retoId = crypto.randomUUID();
    await guardarReto(c.env.DB, retoId, opciones.challenge);
    return c.json({ retoId, opciones });
  });

  app.post('/api/entrar', async (c) => {
    const { retoId, respuesta } = await cuerpoDe(c);
    if (!esTexto(retoId) || !esObjeto(respuesta) || !esTexto(respuesta.id)) return c.json({ error: ERROR.peticion }, 400);
    const db = c.env.DB;
    const reto = await gastarReto(db, retoId);
    if (!reto) return c.json({ error: ERROR.reto }, 400);
    const guardada = await leerCredencial(db, respuesta.id);
    if (!guardada) return c.json({ error: ERROR.passkey }, 401);
    const verificada = await verificador(c.env).verificarEntrada(respuesta, reto, guardada.credencial);
    if (!verificada) return c.json({ error: ERROR.passkey }, 401);
    await db.prepare('UPDATE credencial SET contador = ? WHERE id = ?')
      .bind(verificada.contador, guardada.credencial.id)
      .run();
    return entrarComo(c, guardada.miembroId, 200);
  });

  app.post('/api/salir', async (c) => {
    await cerrarSesion(c.env.DB, c.req.header('Cookie') ?? null);
    c.header('Set-Cookie', cookieBorrada());
    return c.json({ ok: true });
  });
}

// Detrás de requiereSesion.
export function rutasConSesion(app: Hono<Entorno>): void {
  app.get('/api/yo', async (c) => {
    const { miembroId, hogarId } = c.get('sesion');
    const miembros = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM miembro WHERE hogar_id = ?')
      .bind(hogarId)
      .first<number>('n');
    return c.json({ miembroId, hogarId, miembros: miembros ?? 0 });
  });

  // El token sale solo en este enlace, una vez; D1 guarda su SHA-256.
  app.post('/api/invitaciones', async (c) => {
    const token = tokenAleatorio();
    const caduca = new Date(Date.now() + INVITACION_DURA).toISOString();
    await c.env.DB.prepare('INSERT INTO invitacion (token_hash, hogar_id, caduca) VALUES (?, ?, ?)')
      .bind(await sha256(token), c.get('sesion').hogarId, caduca)
      .run();
    return c.json({ enlace: `${c.env.ORIGEN}/invitacion#${token}`, caduca }, 201);
  });
}

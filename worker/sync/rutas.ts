// Rutas de sincronización: el cliente envía sus operaciones y pide lo que ha cambiado.

import type { Hono } from 'hono';
import { validarOps } from '../../shared/esquema';
import type { Entorno } from '../auth/sesiones';
import { aplicarOps, cambiosDesde } from './ops';

export function rutasSync(app: Hono<Entorno>) {
  app.post('/api/ops', async (c) => {
    const cuerpo: unknown = await c.req.json().catch(() => null);
    const validado = validarOps(cuerpo);
    if (!validado.ok) return c.json(validado.op === undefined ? { error: validado.error } : { error: validado.error, op: validado.op }, 400);
    const { hogarId, miembroId } = c.get('sesion');
    const { version } = await aplicarOps(c.env.DB, hogarId, miembroId, validado.ops);
    return c.json({ version });
  });

  app.get('/api/cambios', async (c) => {
    const texto = c.req.query('desde') ?? '0';
    const desde = Number(texto);
    if (!/^\d+$/.test(texto) || !Number.isSafeInteger(desde)) return c.json({ error: 'El parámetro desde no es válido.' }, 400);
    return c.json(await cambiosDesde(c.env.DB, c.get('sesion').hogarId, desde));
  });
}

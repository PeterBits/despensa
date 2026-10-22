// Fotos de las recetas: se guardan bajo el hogar de la sesión y solo se sirven a ese hogar.

import type { Hono } from 'hono';
import type { Entorno } from '../auth/sesiones';
import { almacenR2, type TipoFoto } from './almacen';

const MAX_BYTES = 5 * 1024 * 1024;
const DEMASIADO_PESADA = 'La foto pesa demasiado. Prueba con otra.';
const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const empieza = (bytes: Uint8Array, desde: number, firma: number[]) => firma.every((b, i) => bytes[desde + i] === b);

// Lo que dicen los primeros bytes, no lo que diga la cabecera.
function tipoPorBytes(bytes: Uint8Array): TipoFoto | null {
  if (empieza(bytes, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // "RIFF" al principio y "WEBP" en la posición 8.
  if (empieza(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && empieza(bytes, 8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  return null;
}

export function rutasFotos(app: Hono<Entorno>) {
  app.post('/api/fotos', async (c) => {
    const declarado = (c.req.header('Content-Type') ?? '').split(';')[0]?.trim().toLowerCase();
    // Con Content-Length se corta antes de leer el cuerpo; sin él, se comprueba al leerlo.
    const anunciado = Number(c.req.header('Content-Length'));
    if (anunciado > MAX_BYTES) return c.json({ error: DEMASIADO_PESADA }, 413);
    const datos = await c.req.arrayBuffer();
    if (datos.byteLength > MAX_BYTES) return c.json({ error: DEMASIADO_PESADA }, 413);
    if (datos.byteLength === 0) return c.json({ error: 'La foto está vacía.' }, 400);
    const real = tipoPorBytes(new Uint8Array(datos));
    if (real === null || real !== declarado) return c.json({ error: 'La foto tiene que ser JPEG o WebP.' }, 415);
    const id = crypto.randomUUID();
    await almacenR2(c.env.FOTOS).guardar(`${c.get('sesion').hogarId}/${id}`, datos, real);
    return c.json({ id }, 201);
  });

  app.get('/api/fotos/:id', async (c) => {
    const id = c.req.param('id');
    const foto = FORMA_UUID.test(id) ? await almacenR2(c.env.FOTOS).leer(`${c.get('sesion').hogarId}/${id}`) : null;
    if (!foto) return c.json({ error: 'Esa foto no existe.' }, 404);
    // Por c.body y no con un Response suelto: así conserva el Set-Cookie con el que requiereSesion renueva la sesión.
    return c.body(foto.cuerpo, 200, {
      'Content-Type': foto.tipo,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
  });
}

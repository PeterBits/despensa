import { env } from 'cloudflare:test';
import { app, crearHogar, pedir } from '../pruebas';

// Bytes inventados: solo importan los primeros.
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 8, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2]);

// Sin Origin, como las demás pruebas del Worker: soloMismoOrigen solo corta los orígenes ajenos.
const subir = (bytes: Uint8Array, tipo: string, cookie?: string) =>
  app.request('/api/fotos', {
    method: 'POST',
    headers: { 'Content-Type': tipo, ...(cookie ? { Cookie: cookie } : {}) },
    body: bytes,
  }, env);

describe('fotos', () => {
  it('guarda una foto y solo la sirve a su hogar', async () => {
    const { cookie } = await crearHogar();
    const r = await subir(JPEG, 'image/jpeg', cookie);
    expect(r.status).toBe(201);
    const { id } = await r.json<{ id: string }>();
    const foto = await pedir('GET', `/api/fotos/${id}`, undefined, cookie);
    expect(foto.status).toBe(200);
    expect(foto.headers.get('Content-Type')).toBe('image/jpeg');
    expect(foto.headers.get('Cache-Control')).toBe('private, max-age=31536000, immutable');
    expect(foto.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(new Uint8Array(await foto.arrayBuffer())).toEqual(JPEG);
    const otro = await crearHogar();
    const ajena = await pedir('GET', `/api/fotos/${id}`, undefined, otro.cookie);
    expect(ajena.status).toBe(404);
    expect(await ajena.json()).toEqual({ error: 'Esa foto no existe.' });
  });

  it('acepta WebP, aunque la cabecera lleve parámetros, y lo sirve como WebP', async () => {
    const { cookie } = await crearHogar();
    const r = await subir(WEBP, 'image/webp; charset=binary', cookie);
    expect(r.status).toBe(201);
    const { id } = await r.json<{ id: string }>();
    const foto = await pedir('GET', `/api/fotos/${id}`, undefined, cookie);
    expect(foto.headers.get('Content-Type')).toBe('image/webp');
  });

  it('rechaza lo que no es JPEG ni WebP aunque lo diga la cabecera', async () => {
    const { cookie } = await crearHogar();
    const html = new TextEncoder().encode('<html>');
    for (const [bytes, tipo] of [[html, 'text/html'], [html, 'image/jpeg'], [JPEG, 'image/webp'], [WEBP, 'image/jpeg'], [JPEG, 'image/png']] as const) {
      const r = await subir(bytes, tipo, cookie);
      expect(r.status, tipo).toBe(415);
      expect(await r.json()).toEqual({ error: 'La foto tiene que ser JPEG o WebP.' });
    }
  });

  it('rechaza una foto vacía con 400', async () => {
    const { cookie } = await crearHogar();
    const r = await subir(new Uint8Array(0), 'image/jpeg', cookie);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'La foto está vacía.' });
  });

  it('rechaza una foto de más de 5 MB', async () => {
    const { cookie } = await crearHogar();
    const grande = new Uint8Array(5 * 1024 * 1024 + 1);
    grande.set(JPEG);
    const r = await subir(grande, 'image/jpeg', cookie);
    expect(r.status).toBe(413);
    expect(await r.json()).toEqual({ error: 'La foto pesa demasiado. Prueba con otra.' });
    expect((await subir(grande.subarray(0, 5 * 1024 * 1024), 'image/jpeg', cookie)).status).toBe(201);
  });

  it('responde 404 si el id no tiene forma de UUID', async () => {
    const { cookie } = await crearHogar();
    expect((await pedir('GET', '/api/fotos/no-es-un-uuid', undefined, cookie)).status).toBe(404);
  });

  it('pide sesión', async () => {
    expect((await subir(JPEG, 'image/jpeg')).status).toBe(401);
    expect((await pedir('GET', `/api/fotos/${crypto.randomUUID()}`)).status).toBe(401);
  });
});

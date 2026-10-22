// Ayudas compartidas por las pruebas del Worker: verificador de passkeys falso, peticiones y alta de hogares.
// Todo con datos inventados.

import { env } from 'cloudflare:test';
import { crearApp } from './index';
import type { Credencial, VerificadorPasskeys } from './auth/passkeys';

export const credencialNueva = (id = `credencial-${crypto.randomUUID()}`): Credencial =>
  ({ id, clavePublica: new Uint8Array([1, 2, 3]), contador: 0, transportes: ['internal'] });

// Acepta cualquier respuesta: cada registro es una credencial nueva con datos inventados.
export const falso: VerificadorPasskeys = {
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
export const app = crearApp(() => falso);

export function peticion(metodo: string, cuerpo?: unknown, cookie?: string, cabeceras: Record<string, string> = {}): RequestInit {
  const headers: Record<string, string> = { ...cabeceras };
  if (cuerpo !== undefined) headers['Content-Type'] ??= 'application/json';
  if (cookie) headers.Cookie = cookie;
  return { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) };
}
export const pedir = async (metodo: string, ruta: string, cuerpo?: unknown, cookie?: string, cabeceras?: Record<string, string>) =>
  app.request(ruta, peticion(metodo, cuerpo, cookie, cabeceras), env);
export const cookieDe = (r: Response) => (r.headers.get('Set-Cookie') ?? '').split(';')[0] ?? '';

export async function reto(ruta = '/api/hogar/opciones', cuerpo?: unknown) {
  return (await (await pedir('POST', ruta, cuerpo)).json<{ retoId: string }>()).retoId;
}
export async function crearHogar() {
  const r = await pedir('POST', '/api/hogar', { retoId: await reto(), respuesta: {} });
  return { r, cookie: cookieDe(r) };
}

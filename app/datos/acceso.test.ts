import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { leerSesion, olvidarSesion } from './acceso';

const respuesta = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
const conSesion = () => vi.stubGlobal('fetch', async () => respuesta(200, { miembroId: 'm1', hogarId: 'h1', miembros: 1 }));
const sinRed = () =>
  vi.stubGlobal('fetch', async () => {
    throw new TypeError('offline');
  });

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('leerSesion recuerda el hogar para abrir sin red y lo olvida con un 401', async () => {
  conSesion();
  expect(await leerSesion()).toEqual({ hogarId: 'h1', miembroId: 'm1' });
  sinRed();
  expect(await leerSesion()).toEqual({ hogarId: 'h1', miembroId: 'm1' });
  vi.stubGlobal('fetch', async () => respuesta(401, { error: 'Sin sesión.' }));
  expect(await leerSesion()).toBeNull();
  sinRed();
  expect(await leerSesion()).toBeNull();
});

it('olvidarSesion borra lo guardado', async () => {
  conSesion();
  await leerSesion();
  olvidarSesion();
  sinRed();
  expect(await leerSesion()).toBeNull();
});

it('un localStorage que lanza cuenta como vacío', async () => {
  const bloqueado = () => {
    throw new Error('bloqueado');
  };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(bloqueado);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(bloqueado);
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(bloqueado);
  sinRed();
  expect(await leerSesion()).toBeNull();
  conSesion();
  expect(await leerSesion()).toEqual({ hogarId: 'h1', miembroId: 'm1' });
  olvidarSesion();
});

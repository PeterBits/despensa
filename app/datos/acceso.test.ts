import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { compartirInvitacion, contarMiembros, invitar, leerSesion, olvidarSesion } from './acceso';

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

it('contarMiembros devuelve cuántos hay y null sin red', async () => {
  conSesion();
  expect(await contarMiembros()).toBe(1);
  sinRed();
  expect(await contarMiembros()).toBeNull();
});

it('invitar devuelve el enlace y, si falla, lanza la frase de enviar', async () => {
  vi.stubGlobal('fetch', async () => respuesta(201, { enlace: 'http://localhost:5173/invitacion#abc', caduca: 'x' }));
  expect(await invitar()).toBe('http://localhost:5173/invitacion#abc');
  sinRed();
  await expect(invitar()).rejects.toThrow('No hay conexión. Inténtalo otra vez.');
});

it('compartirInvitacion cae al portapapeles y, sin él, a mano', async () => {
  const poner = (nombre: string, valor: unknown) =>
    Object.defineProperty(navigator, nombre, { configurable: true, value: valor });
  try {
    expect(await compartirInvitacion('http://localhost:5173/invitacion#abc')).toBe('a mano');
    poner('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('denegado')) });
    expect(await compartirInvitacion('http://localhost:5173/invitacion#abc')).toBe('a mano');
    poner('clipboard', { writeText: vi.fn().mockResolvedValue(undefined) });
    expect(await compartirInvitacion('http://localhost:5173/invitacion#abc')).toBe('copiada');
    poner('share', vi.fn().mockResolvedValue(undefined));
    expect(await compartirInvitacion('http://localhost:5173/invitacion#abc')).toBe('compartida');
  } finally {
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'clipboard');
  }
});

import { expect, it, vi } from 'vitest';
import { subirFoto, urlFoto } from './fotos';

const original = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' });
const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

it('sube la foto reducida y devuelve su id', async () => {
  const reducir = vi.fn(async () => jpeg);
  const fetcher = vi.fn(async () => json(201, { id: 'f1' }));
  const id = await subirFoto(original, { reducir, fetcher: fetcher as unknown as typeof fetch });
  expect(id).toBe('f1');
  expect(reducir).toHaveBeenCalledWith(original);
  expect(fetcher).toHaveBeenCalledWith('/api/fotos', {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: jpeg,
  });
});

it('avisa en español si no hay red o la foto no se puede leer', async () => {
  const sinRed = vi.fn(async () => {
    throw new TypeError('offline');
  });
  await expect(subirFoto(original, { reducir: async () => jpeg, fetcher: sinRed as unknown as typeof fetch }))
    .rejects.toThrow('No hay conexión. Prueba otra vez con cobertura.');

  const fetcher = vi.fn();
  await expect(subirFoto(original, {
    reducir: async () => {
      throw new Error('no es una imagen');
    },
    fetcher: fetcher as unknown as typeof fetch,
  })).rejects.toThrow('No se pudo leer la foto. Prueba con otra.');
  expect(fetcher).not.toHaveBeenCalled();
});

it('enseña el error del servidor cuando rechaza la foto', async () => {
  const fetcher = async () => json(413, { error: 'La foto pesa demasiado. Prueba con otra.' });
  await expect(subirFoto(original, { reducir: async () => jpeg, fetcher: fetcher as unknown as typeof fetch }))
    .rejects.toThrow('La foto pesa demasiado. Prueba con otra.');
});

it('da la ruta de una foto por su id', () => {
  expect(urlFoto('f1')).toBe('/api/fotos/f1');
});

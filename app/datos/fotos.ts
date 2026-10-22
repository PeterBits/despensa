// Fotos de las recetas: se reducen en el móvil antes de subirlas y se piden por su id.
// Si algo falla, lanza un Error con la frase en español que se enseña tal cual.

const LADO_MAYOR = 1600;
const CALIDAD = 0.8;
const SIN_CONEXION = 'No hay conexión. Prueba otra vez con cobertura.';
const FOTO_ILEGIBLE = 'No se pudo leer la foto. Prueba con otra.';
const FALLO = 'Algo ha fallado. Inténtalo otra vez.';

type Lienzo = OffscreenCanvas | HTMLCanvasElement;

function codificar(lienzo: Lienzo, tipo: string): Promise<Blob | null> {
  if ('convertToBlob' in lienzo) return lienzo.convertToBlob({ type: tipo, quality: CALIDAD }).catch(() => null);
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, CALIDAD));
}

// Solo en el navegador (jsdom no tiene canvas): lado mayor de 1600 px como mucho, sin ampliar nunca.
// WebP al 0,8; si el navegador no sabe codificarlo y devuelve otra cosa, JPEG al 0,8.
export async function reducirFoto(archivo: Blob): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  try {
    const escala = Math.min(1, LADO_MAYOR / Math.max(imagen.width, imagen.height));
    const ancho = Math.max(1, Math.round(imagen.width * escala));
    const alto = Math.max(1, Math.round(imagen.height * escala));
    const lienzo: Lienzo = typeof OffscreenCanvas === 'undefined'
      ? Object.assign(document.createElement('canvas'), { width: ancho, height: alto })
      : new OffscreenCanvas(ancho, alto);
    const contexto = lienzo.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!contexto) throw new Error('El lienzo no tiene contexto 2d.');
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(imagen, 0, 0, ancho, alto);
    const webp = await codificar(lienzo, 'image/webp');
    if (webp?.type === 'image/webp') return webp;
    const jpeg = await codificar(lienzo, 'image/jpeg');
    if (!jpeg) throw new Error('No se pudo codificar la foto.');
    return jpeg;
  } finally {
    imagen.close();
  }
}

export async function subirFoto(
  archivo: Blob,
  opciones: { reducir?: (b: Blob) => Promise<Blob>; fetcher?: typeof fetch } = {},
): Promise<string> {
  const { reducir = reducirFoto, fetcher = fetch } = opciones;
  let reducida: Blob;
  try {
    reducida = await reducir(archivo);
  } catch {
    throw new Error(FOTO_ILEGIBLE);
  }
  let respuesta: Response;
  try {
    respuesta = await fetcher('/api/fotos', {
      method: 'POST',
      headers: { 'Content-Type': reducida.type },
      body: reducida,
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }
  const datos: unknown = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = (datos as { error?: unknown }).error;
    throw new Error(typeof error === 'string' ? error : FALLO);
  }
  const id = (datos as { id?: unknown }).id;
  if (typeof id !== 'string') throw new Error(FALLO);
  return id;
}

export const urlFoto = (id: string): string => `/api/fotos/${id}`;

// Dónde viven las fotos de las recetas. Las rutas hablan con esta interfaz; R2 es solo una implementación.

export type TipoFoto = 'image/jpeg' | 'image/webp';

export interface AlmacenFotos {
  guardar(clave: string, datos: ArrayBuffer, tipo: TipoFoto): Promise<void>;
  leer(clave: string): Promise<{ cuerpo: ReadableStream; tipo: string } | null>;
  borrar(clave: string): Promise<void>;
}

export function almacenR2(bucket: R2Bucket): AlmacenFotos {
  return {
    async guardar(clave, datos, tipo) {
      await bucket.put(clave, datos, { httpMetadata: { contentType: tipo } });
    },
    async leer(clave) {
      const objeto = await bucket.get(clave);
      if (!objeto) return null;
      return { cuerpo: objeto.body, tipo: objeto.httpMetadata?.contentType ?? 'application/octet-stream' };
    },
    async borrar(clave) {
      await bucket.delete(clave);
    },
  };
}

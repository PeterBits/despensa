import { useRef, useState, type RefObject } from 'react';
import { subirFoto, urlFoto } from '../../datos/fotos';

const Camara = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

// La foto de la receta: el hueco con la foto o una cámara y, a su lado, elegirla, cambiarla o quitarla.
// Elegir un archivo la sube en el momento; `subida` deja ver la subida en curso para que Guardar la espere.
export function HuecoFoto({
  fotoKey,
  cambiar,
  subida,
}: {
  fotoKey: string | null;
  cambiar: (fotoKey: string | null) => void;
  subida: RefObject<Promise<string | null> | null>;
}) {
  const archivoRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const elegir = async (archivo: File) => {
    setSubiendo(true);
    setError('');
    let terminar: (id: string | null) => void = () => {};
    subida.current = new Promise((resolver) => {
      terminar = resolver;
    });
    try {
      const id = await subirFoto(archivo);
      cambiar(id);
      terminar(id);
    } catch (e) {
      // subirFoto lanza la frase en español que se enseña tal cual.
      setError(e instanceof Error ? e.message : 'Algo ha fallado. Inténtalo otra vez.');
      terminar(null);
    } finally {
      subida.current = null;
      setSubiendo(false);
    }
  };

  return (
    <>
      <div className="campo">
        <span className="rot" id="rot-foto">
          Foto
        </span>
      </div>
      <div className="foto" role="group" aria-labelledby="rot-foto">
        <div className="hueco" aria-hidden="true">
          {fotoKey ? <img src={urlFoto(fotoKey)} alt="" /> : <Camara />}
        </div>
        <div className="foto-acc">
          {subiendo ? (
            <p aria-live="polite">Subiendo la foto…</p>
          ) : fotoKey ? (
            <>
              <button className="link" type="button" onClick={() => archivoRef.current?.click()}>
                Cambiar foto
              </button>
              <button className="quiet" type="button" onClick={() => cambiar(null)}>
                Quitar foto
              </button>
            </>
          ) : (
            <button className="link" type="button" onClick={() => archivoRef.current?.click()}>
              Añadir foto
            </button>
          )}
          {error !== '' && <p role="alert">{error}</p>}
        </div>
        <input
          ref={archivoRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            // Se vacía para que volver a elegir el mismo archivo también avise.
            e.target.value = '';
            if (archivo) void elegir(archivo);
          }}
        />
      </div>
    </>
  );
}

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { ponerAviso, useAviso } from '../datos/avisos';

// La línea de estado de la app: "texto · Deshacer", sobre `ground` y encima de la barra de pestañas.
// Hay una sola, montada en Rutas: ve todos los cambios de ruta. Solo se ve en la ruta del aviso y, cuando
// la ruta pasa a otra, el aviso se retira (uno puesto justo antes de navegar a su propia ruta se conserva).
export function LineaEstado() {
  const aviso = useAviso();
  const { pathname } = useLocation();

  const anterior = useRef(pathname);
  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    if (aviso && aviso.en !== pathname) ponerAviso(null);
  }, [pathname, aviso]);

  const visible = aviso !== null && aviso.en === pathname;

  const deshacer = () => {
    if (!aviso) return;
    // Se retira antes de ejecutar: una segunda pulsación no deshace dos veces.
    ponerAviso(null);
    Promise.resolve()
      .then(() => aviso.deshacer())
      .catch((error: unknown) => console.debug('No se pudo deshacer', error));
  };

  // El contenedor de estado está siempre montado para que los lectores de pantalla anuncien el aviso al aparecer.
  return (
    <div role="status">
      {visible && (
        <div className="dock">
          <p className="status">
            {aviso.texto} ·{' '}
            <button className="link" type="button" onClick={deshacer}>
              Deshacer
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { ponerAviso, useAviso } from '../datos/avisos';

// La línea de estado de las pantallas sin botón fijo: "texto · Deshacer", sobre `ground` y encima de la barra de pestañas.
// Solo se ve en la ruta del aviso; al pasar a otra ruta, el aviso se retira.
export function LineaEstado() {
  const aviso = useAviso();
  const { pathname } = useLocation();

  const anterior = useRef(pathname);
  useEffect(() => {
    if (anterior.current === pathname) return;
    anterior.current = pathname;
    if (aviso && aviso.en !== pathname) ponerAviso(null);
  }, [pathname, aviso]);

  if (!aviso || aviso.en !== pathname) return null;

  const deshacer = () => {
    // Se retira antes de ejecutar: una segunda pulsación no deshace dos veces.
    ponerAviso(null);
    void aviso.deshacer();
  };

  return (
    <div className="dock">
      <p className="status" role="status">
        {aviso.texto} ·{' '}
        <button className="link" type="button" onClick={deshacer}>
          Deshacer
        </button>
      </p>
    </div>
  );
}

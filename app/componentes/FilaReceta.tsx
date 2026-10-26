import { useRef } from 'react';
import { Link } from 'react-router';
import { formatearNota } from '../../shared/notas';
import { formatearMinutos, fraseTipos } from '../../shared/recetas';
import type { ResumenReceta } from '../datos/recetas';
import { useGuiaLarga } from './useGuiaLarga';

type Props = {
  receta: ResumenReceta;
  // "enlace": abre la receta (el índice); "boton": la elige (el modo elegir de Semana).
  como: 'enlace' | 'boton';
  alAbrir?: () => void;
  alElegir?: () => void;
};

// La fila de carta de una receta: nombre a la izquierda, su nota a la derecha y, debajo, tipos y tiempo.
export function FilaReceta({ receta, como, alAbrir, alElegir }: Props) {
  const linea = useRef<HTMLSpanElement>(null);
  const tieneNota = receta.media !== null;

  useGuiaLarga(linea, tieneNota, receta.nombre);

  const detalle = [fraseTipos(receta.tipos), formatearMinutos(receta.minutos)].filter((p) => p !== '').join(' · ');
  const cuerpo = (
    <>
      <span className="line" ref={linea}>
        <span className="name">{receta.nombre}</span>
        {receta.media !== null && (
          <>
            <span className="leader" aria-hidden="true" />
            <span className="fig">
              <span className="lab">nota</span>
              <span className="sr"> </span>
              {formatearNota(receta.media)}
            </span>
          </>
        )}
      </span>
      {detalle !== '' && <span className="from">{detalle}</span>}
    </>
  );

  return (
    <li>
      {como === 'enlace' ? (
        <Link className="row" to={`/recetas/${receta.id}`} state={{ desde: 'indice' }} onClick={alAbrir}>
          {cuerpo}
        </Link>
      ) : (
        <button className="row" type="button" onClick={alElegir}>
          {cuerpo}
        </button>
      )}
    </li>
  );
}

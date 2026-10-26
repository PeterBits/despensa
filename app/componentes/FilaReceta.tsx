import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { formatearNota } from '../../shared/notas';
import { formatearMinutos, fraseTipos } from '../../shared/recetas';
import type { ResumenReceta } from '../datos/recetas';

// Si el nombre ocupa dos líneas, los puntos guía se alargan hacia la izquierda hasta 8px después de la última
// palabra, sin mover el nombre: `--ext` es lo que sobra entre el inicio de la guía y ese punto.
// jsdom no maqueta: sin `getClientRects` (o sin anchura) no se mide y la guía queda como está.
function medirGuia(linea: HTMLElement) {
  const guia = linea.querySelector<HTMLElement>('.leader');
  const nombre = linea.querySelector<HTMLElement>('.name');
  if (!guia || !nombre) return;
  const rango = document.createRange();
  rango.selectNodeContents(nombre);
  if (typeof rango.getClientRects !== 'function') return;
  guia.style.setProperty('--ext', '0px');
  const lineas = rango.getClientRects();
  const ultima = lineas[lineas.length - 1];
  if (!ultima || lineas.length < 2) return;
  const izquierda = guia.getBoundingClientRect().left;
  const desde = ultima.right + 8;
  guia.style.setProperty('--ext', `${Math.max(0, izquierda - desde)}px`);
}

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

  useLayoutEffect(() => {
    const el = linea.current;
    if (!el || !tieneNota) return;
    const medir = () => medirGuia(el);
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [tieneNota, receta.nombre]);

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

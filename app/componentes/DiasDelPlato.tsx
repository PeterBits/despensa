import { Fragment } from 'react';
import type { Dia } from '../../shared/semana';

// Los días de un plato: cada letra es su propio elemento para poder moverla de una fila a otra (FLIP) y,
// en Esta semana, tacharla si ya pasó. El color (`.fig.on`) lo pone quien pinta la fila. Las letras van unidas por " · "; el separador no se lee.
export function DiasDelPlato({ dias, pasados }: { dias: Dia[]; pasados?: Set<Dia> }) {
  if (dias.length === 0) return <>sin días</>;
  return (
    <>
      {dias.map((d, i) => (
        <Fragment key={d}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <span className={`dl${pasados?.has(d) ? ' past' : ''}`} data-d={d}>
            {d}
          </span>
        </Fragment>
      ))}
    </>
  );
}

import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigationType } from 'react-router';
import { formatearNota } from '../../shared/notas';
import { coincide, formatearMinutos, fraseTipos } from '../../shared/recetas';
import { BarraPestanas } from '../componentes/BarraPestanas';
import { LineaEstado } from '../componentes/LineaEstado';
import { useRecetas, type ResumenReceta } from '../datos/recetas';
import '../estilos/recetas.css';

// Posición de scroll del índice, para recuperarla al volver de una receta con el botón atrás.
let scrollIndice = 0;

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const Mas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function Fila({ receta }: { receta: ResumenReceta }) {
  const detalle = [fraseTipos(receta.tipos), formatearMinutos(receta.minutos)].filter((p) => p !== '').join(' · ');
  return (
    <li>
      <Link className="row" to={`/recetas/${receta.id}`}>
        <span className="line">
          <span className="name">{receta.nombre}</span>
          {receta.media !== null && (
            <>
              <span className="leader" aria-hidden="true" />
              <span className="fig">
                <span className="lab">nota</span>
                {formatearNota(receta.media)}
              </span>
            </>
          )}
        </span>
        {detalle !== '' && <span className="from">{detalle}</span>}
      </Link>
    </li>
  );
}

export function Recetas() {
  const recetas = useRecetas();
  const tipoNavegacion = useNavigationType();
  const [consulta, setConsulta] = useState('');

  // El scroll se guarda mientras el índice está abierto: al desmontarse ya habría vuelto arriba.
  useEffect(() => {
    const guardar = () => {
      scrollIndice = window.scrollY;
    };
    window.addEventListener('scroll', guardar, { passive: true });
    return () => window.removeEventListener('scroll', guardar);
  }, []);

  const listo = recetas !== undefined;
  const volviendo = tipoNavegacion === 'POP';
  useLayoutEffect(() => {
    if (listo && volviendo && scrollIndice > 0) window.scrollTo(0, scrollIndice);
  }, [listo, volviendo]);

  const vacio = listo && recetas.length === 0;
  const buscando = consulta.trim() !== '';
  const mostradas = !listo ? [] : buscando ? recetas.filter((r) => coincide(r, consulta)) : recetas;
  const entra = listo && volviendo && !sinMovimiento();

  return (
    <>
      <main className={`screen recetas${entra ? ' vuelve' : ''}`}>
        {listo && !vacio && (
          <div className="top top-indice">
            <Link className="accion" to="/recetas/nueva">
              <Mas />
              Nueva receta
            </Link>
          </div>
        )}
        <header>
          <h1>Recetas</h1>
        </header>

        {vacio && (
          <>
            <p className="vacio-todo">
              Todavía no hay recetas. Empezad por una que cocinéis a menudo: con dos o tres ya se puede planificar la semana.
            </p>
            <Link className="cta" to="/recetas/nueva">
              <Mas />
              Nueva receta
            </Link>
          </>
        )}

        {listo && !vacio && (
          <>
            <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6" />
                <path d="M15 15l5 5" />
              </svg>
              <label className="sr" htmlFor="buscar-receta">
                Buscar receta
              </label>
              <input
                id="buscar-receta"
                type="search"
                placeholder="Buscar por plato o ingrediente"
                autoComplete="off"
                enterKeyHint="search"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
              />
            </form>
            <h2 className="sec">
              {buscando ? 'Resultados' : 'Todas'} <small>{mostradas.length}</small>
            </h2>
            {mostradas.length > 0 ? (
              <ul>
                {mostradas.map((r) => (
                  <Fila key={r.id} receta={r} />
                ))}
              </ul>
            ) : (
              <p className="vacio">Ninguna receta coincide con «{consulta.trim()}».</p>
            )}
          </>
        )}
      </main>
      <LineaEstado />
      <BarraPestanas />
    </>
  );
}

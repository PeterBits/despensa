import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useNavigationType } from 'react-router';
import { hoyEnMadrid, lunesDe, sumarDias } from '../../shared/fechas';
import { formatearNota } from '../../shared/notas';
import { coincide, formatearMinutos, fraseTipos } from '../../shared/recetas';
import type { Dia } from '../../shared/semana';
import { BarraPestanas } from '../componentes/BarraPestanas';
import { DiasDelPlato } from '../componentes/DiasDelPlato';
import { useRecetas, type ResumenReceta } from '../datos/recetas';
import { useSemana, type PlatoEnSemana, type VistaSemana } from '../datos/semana';
import '../estilos/recetas.css';

// Lo que el índice recuerda al abrir una receta: la posición y la búsqueda. Solo se recupera al volver
// de la receta con el botón atrás; entrar por la pestaña, o recargar, empieza arriba y sin búsqueda.
let alAbrirReceta: { scroll: number; consulta: string } | null = null;

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const Mas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function Fila({ receta, alAbrir }: { receta: ResumenReceta; alAbrir: () => void }) {
  const detalle = [fraseTipos(receta.tipos), formatearMinutos(receta.minutos)].filter((p) => p !== '').join(' · ');
  return (
    <li>
      <Link className="row" to={`/recetas/${receta.id}`} state={{ desde: 'indice' }} onClick={alAbrir}>
        <span className="line">
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
      </Link>
    </li>
  );
}

// Un plato de la semana en el índice: sus días a la derecha y, si es el de hoy, "Hoy" antes del detalle.
function FilaSemana({
  plato,
  minutos,
  hoy,
  pasados,
  alAbrir,
}: {
  plato: PlatoEnSemana;
  minutos: number | null;
  hoy: boolean;
  pasados?: Set<Dia>;
  alAbrir: () => void;
}) {
  const { receta, dias, vaAActivos } = plato;
  if (!receta) return null;
  const detalle = [hoy ? 'Hoy' : '', fraseTipos(receta.tipos), formatearMinutos(minutos)].filter((p) => p !== '').join(' · ');
  return (
    <li>
      <Link className="row" to={`/recetas/${receta.id}`} state={{ desde: 'indice' }} onClick={alAbrir}>
        <span className="line">
          <span className="name">{receta.nombre}</span>
          <span className="leader" aria-hidden="true" />
          <span className={`fig${dias.length === 0 ? ' none' : vaAActivos ? ' on' : ''}`}>
            <DiasDelPlato dias={dias} pasados={pasados} />
          </span>
        </span>
        {detalle !== '' && <span className="from">{detalle}</span>}
      </Link>
    </li>
  );
}

// Una semana del menú encima de "Todas": sin platos (o sin que la copia haya respondido) no hay sección.
function SeccionSemana({
  titulo,
  vista,
  recetas,
  hoy,
  alAbrir,
}: {
  titulo: string;
  vista: VistaSemana | undefined;
  recetas: ResumenReceta[];
  hoy?: string;
  alAbrir: () => void;
}) {
  const platos = vista?.menu.filter((p) => p.receta !== null) ?? [];
  if (!vista || platos.length === 0) return null;
  const diaDeHoy = hoy === undefined ? undefined : vista.dias.find((d) => d.fecha === hoy && !d.fuera)?.dia;
  const pasados = hoy === undefined ? undefined : new Set(vista.dias.filter((d) => d.fecha < hoy).map((d) => d.dia));
  return (
    <>
      <h2 className="sec">{titulo}</h2>
      <ul className="menu">
        {platos.map((p) => (
          <FilaSemana
            key={p.hueco}
            plato={p}
            minutos={recetas.find((r) => r.id === p.receta!.id)?.minutos ?? null}
            hoy={diaDeHoy !== undefined && p.dias.includes(diaDeHoy)}
            pasados={pasados}
            alAbrir={alAbrir}
          />
        ))}
      </ul>
    </>
  );
}

export function Recetas() {
  const recetas = useRecetas();
  const hoy = hoyEnMadrid(new Date());
  const lunesEsta = lunesDe(hoy);
  const esta = useSemana(lunesEsta);
  const viene = useSemana(sumarDias(lunesEsta, 7));
  const tipoNavegacion = useNavigationType();
  // Se lee una vez, al montar (y es idempotente para StrictMode): ¿venimos de una receta con el botón atrás?
  const [recuerdo] = useState(() => (tipoNavegacion === 'POP' ? alAbrirReceta : null));
  const [consulta, setConsulta] = useState(recuerdo?.consulta ?? '');
  useEffect(() => {
    alAbrirReceta = null;
  }, []);

  const listo = recetas !== undefined;
  useLayoutEffect(() => {
    if (listo && recuerdo && recuerdo.scroll > 0) window.scrollTo(0, recuerdo.scroll);
  }, [listo, recuerdo]);

  const vacio = listo && recetas.length === 0;
  const buscando = consulta.trim() !== '';
  const mostradas = !listo ? [] : buscando ? recetas.filter((r) => coincide(r, consulta)) : recetas;
  const recordar = () => {
    alAbrirReceta = { scroll: window.scrollY, consulta };
  };
  const entra = listo && recuerdo !== null && !sinMovimiento();

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
            {!buscando && (
              <>
                <SeccionSemana titulo="Esta semana" vista={esta} recetas={recetas} hoy={hoy} alAbrir={recordar} />
                <SeccionSemana titulo="La que viene" vista={viene} recetas={recetas} alAbrir={recordar} />
              </>
            )}
            <h2 className="sec">
              {buscando ? 'Resultados' : 'Todas'} <small>{mostradas.length}</small>
            </h2>
            {mostradas.length > 0 ? (
              <ul>
                {mostradas.map((r) => (
                  <Fila
                    key={r.id}
                    receta={r}
                    alAbrir={recordar}
                  />
                ))}
              </ul>
            ) : (
              <p className="vacio">Ninguna receta coincide con «{consulta.trim()}».</p>
            )}
          </>
        )}
      </main>
      <BarraPestanas />
    </>
  );
}

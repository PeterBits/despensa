import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { hoyEnMadrid, lunesDe, sumarDias } from '../../shared/fechas';
import { coincide } from '../../shared/recetas';
import type { Hueco } from '../../shared/semana';
import { FilaReceta } from '../componentes/FilaReceta';
import { useRecetas } from '../datos/recetas';
import { ponerPlato, useSemana } from '../datos/semana';
import '../estilos/recetas.css';

// Un lunes de verdad: YYYY-MM-DD que sobrevive a una vuelta por el calendario (el 31 de febrero no).
const esFecha = (texto: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(Date.parse(`${texto}T12:00:00Z`)) && sumarDias(texto, 0) === texto;

export function ElegirReceta() {
  const { lunes = '', hueco = '' } = useParams();
  if (!esFecha(lunes) || (hueco !== '1' && hueco !== '2')) return <Navigate to="/semana" replace />;
  return <Selector lunes={lunes} hueco={hueco} />;
}

// El modo elegir de Recetas: una tarea que se cierra con Cancelar o eligiendo, sin barra de pestañas.
function Selector({ lunes, hueco }: { lunes: string; hueco: Hueco }) {
  const navigate = useNavigate();
  const location = useLocation();
  const recetas = useRecetas();
  const vista = useSemana(lunes);
  const [consulta, setConsulta] = useState('');
  const ocupado = useRef(false);

  // Se vuelve a donde se estaba: atrás si se vino de Semana y, si no, a la semana de este lunes.
  const volver = () => {
    if ((location.state as { desde?: string } | null)?.desde === 'semana') {
      navigate(-1);
      return;
    }
    const ver = lunes === sumarDias(lunesDe(hoyEnMadrid(new Date())), 7) ? 'viene' : 'esta';
    navigate(`/semana?ver=${ver}`, { replace: true });
  };

  const elegir = async (recetaId: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    try {
      await ponerPlato(lunes, hueco, recetaId);
      volver();
    } catch (error) {
      console.debug('No se pudo cambiar el plato', error);
      ocupado.current = false;
    }
  };

  const listo = recetas !== undefined && vista !== undefined;
  const enMenu = new Set(listo ? vista.menu.flatMap((p) => (p.receta ? [p.receta.id] : [])) : []);
  const ofrecidas = listo ? recetas.filter((r) => !enMenu.has(r.id)) : [];
  const buscando = consulta.trim() !== '';
  const mostradas = buscando ? ofrecidas.filter((r) => coincide(r, consulta)) : ofrecidas;
  const actual = listo ? vista.menu.find((p) => p.hueco === hueco)?.receta : null;

  return (
    <main className="screen recetas elegir">
      <div className="top top-elegir">
        <button className="cancel" type="button" onClick={volver}>
          Cancelar
        </button>
      </div>
      {/* Nada bajo Cancelar se pinta hasta tener las recetas y el menú: el título y "En lugar de" no se mueven al llegar. */}
      {listo && (
        <>
          <header>
            <h1>Elegir receta</h1>
            {actual && (
              <p className="en-lugar">
                En lugar de <strong>{actual.nombre}</strong>
              </p>
            )}
          </header>
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
                <FilaReceta key={r.id} receta={r} como="boton" alElegir={() => elegir(r.id)} />
              ))}
            </ul>
          ) : (
            <p className="vacio">
              {buscando ? `Ninguna receta coincide con «${consulta.trim()}».` : 'No hay más recetas que ofrecer.'}
            </p>
          )}
        </>
      )}
    </main>
  );
}

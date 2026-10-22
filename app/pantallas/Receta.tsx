import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useNavigationType, useParams } from 'react-router';
import { ingredientesGastados, trozos } from '../../shared/pasos';
import { formatearMinutos, fraseTipos, leerTipos } from '../../shared/recetas';
import { BarraPestanas } from '../componentes/BarraPestanas';
import { ponerAviso } from '../datos/avisos';
import { urlFoto } from '../datos/fotos';
import { guardarProgreso, leerProgreso } from '../datos/progreso';
import { useReceta, type RecetaCompleta } from '../datos/recetas';
import '../estilos/recetas.css';

const Atras = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

// Marca de animación de lo que cambia al tocar un paso: 'on' se tacha, 'off' se destacha.
type Frescos = Map<string, 'on' | 'off'>;

const clase = (...partes: (string | false | undefined)[]): string | undefined => partes.filter(Boolean).join(' ') || undefined;

// Mientras la receta está abierta, la pantalla no se apaga (si el navegador lo permite): se pide al abrir,
// se vuelve a pedir al volver a primer plano (el sistema lo suelta al ocultar la página) y se suelta al salir.
function usePantallaDespierta(): boolean {
  const [despierta, setDespierta] = useState(false);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let activo = true;
    let bloqueo: WakeLockSentinel | null = null;
    let pidiendo = false;

    const pedir = async () => {
      if (bloqueo || pidiendo) return;
      pidiendo = true;
      try {
        const nuevo = await navigator.wakeLock.request('screen');
        if (!activo) {
          void nuevo.release?.();
          return;
        }
        bloqueo = nuevo;
        setDespierta(true);
        nuevo.addEventListener?.('release', () => {
          if (bloqueo === nuevo) bloqueo = null;
          if (activo) setDespierta(false);
        });
      } catch {
        if (activo) setDespierta(false);
      } finally {
        pidiendo = false;
      }
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'visible') void pedir();
    };

    void pedir();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      activo = false;
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      void bloqueo?.release?.();
    };
  }, []);
  return despierta;
}

function Cocina({ completa }: { completa: RecetaCompleta }) {
  const { receta, ingredientes, pasos } = completa;
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const tipoNavegacion = useNavigationType();

  // Los ids de los pasos hechos; el progreso guardado puede nombrar pasos que ya no existen.
  const [hechos, setHechos] = useState(() => leerProgreso(receta.id));
  const [frescos, setFrescos] = useState<Frescos>(new Map());
  const [fotoAbierta, setFotoAbierta] = useState(false);
  const despierta = usePantallaDespierta();

  // Se abre arriba salvo al recargar o volver con atrás, donde el navegador recuerda la posición.
  useLayoutEffect(() => {
    if (tipoNavegacion !== 'POP') window.scrollTo(0, 0);
  }, [tipoNavegacion]);

  const textos = pasos.map((p) => p.texto);
  // ingredientesGastados trabaja con posiciones: de ids a índices, aquí en el borde.
  const gastadosCon = (ids: Set<string>) =>
    ingredientesGastados(textos, new Set(pasos.flatMap((p, i) => (ids.has(p.id) ? [i] : []))));

  const vivos = new Set(pasos.filter((p) => hechos.has(p.id)).map((p) => p.id));
  const gastados = gastadosCon(vivos);
  const actual = pasos.findIndex((p) => !vivos.has(p.id));
  const terminada = pasos.length > 0 && vivos.size === pasos.length;

  const cambiar = (nuevos: Set<string>) => {
    setHechos(nuevos);
    guardarProgreso(receta.id, nuevos);
  };

  const alternar = (id: string) => {
    // El aviso de "Empezar de nuevo" se queda hasta la siguiente acción: esta.
    ponerAviso(null);
    const nuevos = new Set(vivos);
    if (nuevos.has(id)) nuevos.delete(id);
    else nuevos.add(id);
    const despues = gastadosCon(nuevos);
    const marcas: Frescos = new Map([[`p${id}`, nuevos.has(id) ? 'on' : 'off']]);
    for (const i of ingredientes) {
      if (gastados.has(i.id) !== despues.has(i.id)) marcas.set(`i${i.id}`, despues.has(i.id) ? 'on' : 'off');
    }
    setFrescos(marcas);
    cambiar(nuevos);
  };

  const empezarDeNuevo = () => {
    const antes = new Set(vivos);
    const y = window.scrollY;
    setFrescos(new Map());
    cambiar(new Set());
    window.scrollTo(0, 0);
    ponerAviso({
      texto: 'Progreso borrado',
      en: pathname,
      deshacer: () => {
        setFrescos(new Map());
        cambiar(antes);
        window.scrollTo(0, y);
      },
    });
  };

  // Atrás en el historial solo si se llegó desde el índice (el índice recupera así su posición);
  // en cualquier otro caso (enlace directo, recarga, tras el editor) se va al índice.
  const volver = () => {
    if ((state as { desde?: string } | null)?.desde === 'indice') navigate(-1);
    else navigate('/recetas');
  };

  const meta = [
    fraseTipos(leerTipos(receta.tipos)),
    receta.raciones ? `${receta.raciones} ${receta.raciones === 1 ? 'ración' : 'raciones'}` : '',
    formatearMinutos(receta.minutos),
  ]
    .filter((p) => p !== '')
    .join(' · ');
  const foto = receta.foto_key ? urlFoto(receta.foto_key) : null;

  return (
    <>
      <main className="screen receta entra">
        <div className="top">
          <button className="back" type="button" onClick={volver}>
            <Atras />
            Recetas
          </button>
          <Link className="accion" to={`/recetas/${receta.id}/editar`}>
            Editar
          </Link>
        </div>
        <header className="cabeza">
          <h1>{receta.nombre}</h1>
          {foto && (
            <button
              className="mini"
              type="button"
              aria-expanded={fotoAbierta}
              aria-controls="foto-grande"
              aria-label="Ver la foto"
              onClick={() => setFotoAbierta((abierta) => !abierta)}
            >
              <img src={foto} alt="" />
            </button>
          )}
          {meta !== '' && <p className="meta">{meta}</p>}
          {despierta && <p className="awake">La pantalla no se apagará mientras cocináis</p>}
        </header>
        {foto && fotoAbierta && (
          <div className="grande entra" id="foto-grande">
            <img src={foto} alt={`Foto de ${receta.nombre}`} />
          </div>
        )}

        <h2 className="sec">Ingredientes</h2>
        <ul className="ing">
          {ingredientes.map((i) => (
            <li
              key={i.id}
              className={clase(
                gastados.has(i.id) && 'used',
                frescos.get(`i${i.id}`) === 'on' && 'fresh',
                frescos.get(`i${i.id}`) === 'off' && 'fresh-off',
              )}
            >
              <span className="name">
                <span className="txt">{i.nombre}</span>
              </span>
              {i.cantidad && (
                <>
                  <span className="leader" aria-hidden="true" />
                  <span className="qty">
                    <span className="txt">{i.cantidad}</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>

        <h2 className="sec">
          Pasos <small>{vivos.size > 0 ? `${vivos.size} de ${pasos.length}` : ''}</small>
        </h2>
        <ol className="steps">
          {pasos.map((p, n) => {
            const hecho = vivos.has(p.id);
            const tiempo = formatearMinutos(p.minutos);
            return (
              <li key={p.id}>
                <button
                  className={clase(
                    'step',
                    hecho && 'done',
                    frescos.get(`p${p.id}`) === 'on' && 'fresh',
                    frescos.get(`p${p.id}`) === 'off' && 'fresh-off',
                    n === actual && 'now',
                  )}
                  type="button"
                  aria-pressed={hecho}
                  aria-current={n === actual ? 'step' : undefined}
                  onClick={() => alternar(p.id)}
                >
                  <span className="n" aria-hidden="true">
                    {n + 1}
                  </span>
                  <span className="t">
                    <span className="sr">Paso {n + 1}: </span>
                    <span className="txt">
                      {trozos(p.texto).map((t, k) => (t.ingrediente ? <b key={k}>{t.texto}</b> : t.texto))}
                    </span>
                    {tiempo !== '' && <span className="time">{tiempo}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {terminada && (
          <p className="end">
            Receta terminada ·{' '}
            <button className="link" type="button" onClick={empezarDeNuevo}>
              Empezar de nuevo
            </button>
          </p>
        )}
      </main>
      <BarraPestanas />
    </>
  );
}

export function Receta() {
  const { id = '' } = useParams();
  const completa = useReceta(id);
  if (completa === undefined) return null;
  if (completa === null) {
    return (
      <>
        <main className="screen receta">
          <div className="top">
            <Link className="back" to="/recetas">
              <Atras />
              Recetas
            </Link>
          </div>
          <p className="vacio-todo">Esta receta ya no existe.</p>
        </main>
        <BarraPestanas />
      </>
    );
  }
  // Con key, abrir otra receta desde esta empieza con su propio progreso y su propio estado.
  return <Cocina key={id} completa={completa} />;
}

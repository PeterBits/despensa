import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { hoyEnMadrid, lunesDe, rangoDeFechas, sumarDias } from '../../shared/fechas';
import { formatearNota } from '../../shared/notas';
import { fraseTipos } from '../../shared/recetas';
import { NOMBRE_DIA, semanaQueSeAbre, type Dia, type Hueco } from '../../shared/semana';
import { BarraPestanas } from '../componentes/BarraPestanas';
import { DiasDelPlato } from '../componentes/DiasDelPlato';
import {
  cambiarDia,
  cambiarFuera,
  hacerLista,
  ponerPlato,
  useSemana,
  type PlatoEnSemana,
  type Sugerencia,
  type VistaSemana,
} from '../datos/semana';
import '../estilos/semana.css';

type Segmento = 'esta' | 'viene';

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// El trazo que tacha el plato dura 0,3 s; se espera un poco más para que se vea acabado.
const MS_TRAZO = 340;
const MS_LETRAS = 420;

const Mas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const Hecho = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

// Los días de un plato a la derecha de su fila: en naranja si va a los días activos, apagados si no tiene ninguno.
function DiasDeLaFila({ plato, pasados }: { plato: PlatoEnSemana; pasados?: Set<Dia> }) {
  const { dias, vaAActivos } = plato;
  return (
    <span className={`fig${dias.length === 0 ? ' none' : vaAActivos ? ' on' : ''}`}>
      <DiasDelPlato dias={dias} pasados={pasados} />
    </span>
  );
}

function FilaPlato({
  lunes,
  plato,
  tachando,
  entrando,
  alDeshacer,
}: {
  lunes: string;
  plato: PlatoEnSemana;
  tachando: boolean;
  entrando: boolean;
  alDeshacer: (recetaId: string) => void;
}) {
  const { receta, enLugarDe, vaAActivos, hueco } = plato;
  const elegir = `/semana/elegir/${lunes}/${hueco}`;
  const fig = <DiasDeLaFila plato={plato} />;
  if (!receta) {
    return (
      <li className="item hueco">
        <div className="line">
          <span className="name">Sin plato</span>
          <span className="leader" aria-hidden="true" />
          {fig}
        </div>
        <p className="act">
          <Link className="link" to={elegir} state={{ desde: 'semana' }}>
            Elegir receta
          </Link>
        </p>
      </li>
    );
  }
  const tipos = fraseTipos(receta.tipos);
  const detalle = [tipos, vaAActivos ? 'va a los días activos' : ''].filter((p) => p !== '').join(' · ');
  return (
    <li className="item">
      <div className="line">
        <span className={`name${tachando ? ' striking' : ''}${entrando ? ' entering' : ''}`}>
          <span className="txt">{receta.nombre}</span>
        </span>
        <span className="leader" aria-hidden="true" />
        {fig}
      </div>
      <p className="meta">{detalle}</p>
      {enLugarDe && (
        <p className="was">
          En lugar de <s>{enLugarDe.nombre}</s> ·{' '}
          <button className="link" type="button" onClick={() => alDeshacer(enLugarDe.id)}>
            Deshacer
          </button>
        </p>
      )}
      <p className="act">
        <Link
          className="link"
          to={elegir}
          state={{ desde: 'semana' }}
          aria-label={`Elegir otra receta en lugar de ${receta.nombre}`}
        >
          Elegir otra receta
        </Link>
      </p>
    </li>
  );
}

// Sin recetas no hay semana que proponer: una frase y el botón principal, en cualquiera de los dos segmentos.
function SinRecetas() {
  return (
    <div>
      <p className="vacio-todo">
        Todavía no hay recetas. Con una que lleve hidratos y otra que no, la semana se propone sola.
      </p>
      <Link className="cta solo" to="/recetas/nueva">
        <Mas />
        Nueva receta
      </Link>
    </div>
  );
}

// Esta semana, solo para mirar: los días que ya pasaron van tachados y no hay acciones sobre los platos.
function EstaSemana({ vista, hoy, titulo }: { vista: VistaSemana; hoy: string; titulo: string }) {
  if (!vista.hayRecetas) {
    return (
      <>
        <header>
          <h1>{titulo}</h1>
        </header>
        <SinRecetas />
      </>
    );
  }
  const pasados = new Set(vista.dias.filter((d) => d.fecha < hoy).map((d) => d.dia));
  const hoyEnLaSemana = vista.dias.find((d) => d.fecha === hoy);
  const domingo = vista.dias.find((d) => d.dia === 'D')!;
  const deHoy = hoyEnLaSemana && !hoyEnLaSemana.fuera ? vista.menu.find((p) => p.dias.includes(hoyEnLaSemana.dia)) : undefined;
  const nombreDeHoy = deHoy?.receta?.nombre;

  return (
    <>
      <header>
        <h1>{titulo}</h1>
        {hoyEnLaSemana?.fuera && <p className="today">Hoy coméis fuera</p>}
        {nombreDeHoy && (
          <p className="today">
            Hoy toca <strong>{nombreDeHoy.charAt(0).toLowerCase() + nombreDeHoy.slice(1)}</strong>
          </p>
        )}
      </header>
      <div className="days" role="group" aria-label="Días de esta semana">
        {vista.dias.map(({ dia, fecha, activo, fuera }) => (
          <div
            key={dia}
            role="img"
            className={`day${fuera ? ' fuera' : ''}${activo ? ' on' : ''}${fecha < hoy ? ' past' : ''}${fecha === hoy ? ' is-today' : ''}`}
            aria-label={`${NOMBRE_DIA[dia]} ${Number(fecha.slice(8))}${fuera ? ', fuera' : activo ? ', activo' : ''}`}
          >
            <b aria-hidden="true">{dia}</b>
            <span aria-hidden="true">{Number(fecha.slice(8))}</span>
          </div>
        ))}
      </div>
      <p className="legend">
        <i />
        Días activos
      </p>

      <h2>Menú</h2>
      <ul className="menu">
        {vista.menu.map((plato) => {
          const { receta, vaAActivos } = plato;
          const fig = <DiasDeLaFila plato={plato} pasados={pasados} />;
          if (!receta) {
            return (
              <li key={plato.hueco} className="item hueco">
                <div className="line">
                  <span className="name">Sin plato</span>
                  <span className="leader" aria-hidden="true" />
                  {fig}
                </div>
              </li>
            );
          }
          const detalle = [fraseTipos(receta.tipos), vaAActivos ? 'va a los días activos' : ''].filter((p) => p !== '').join(' · ');
          return (
            <li key={plato.hueco} className="item">
              <div className="line">
                <span className="name">{receta.nombre}</span>
                <span className="leader" aria-hidden="true" />
                {fig}
              </div>
              <p className="meta">{detalle}</p>
            </li>
          );
        })}
        {domingo.fuera && (
          <li className="item out">
            <div className="line">
              <span className="name">Domingo</span>
              <span className="leader" aria-hidden="true" />
              <span className="fig">fuera</span>
            </div>
          </li>
        )}
      </ul>
    </>
  );
}

function FilaSugerencia({ sugerencia, alCambiar }: { sugerencia: Sugerencia; alCambiar: () => void }) {
  const { nombre, media, haceCuanto, sustituye } = sugerencia;
  return (
    <li className="item">
      <div className="line">
        <span className="name">{nombre}</span>
        {/* Sin notas no hay cifra a la derecha, y la fila no lleva puntos guía */}
        {media !== null && (
          <>
            <span className="leader" aria-hidden="true" />
            <span className="fig">
              <span className="lab">nota</span>
              <span className="sr">: </span>
              {formatearNota(media)}
            </span>
          </>
        )}
      </div>
      <p className="meta">
        {haceCuanto} ·{' '}
        <button className="link" type="button" onClick={alCambiar}>
          {sustituye ? `Cambiar por ${sustituye}` : 'Poner en el menú'}
        </button>
      </p>
    </li>
  );
}

function LaQueViene({ vista }: { vista: VistaSemana }) {
  const { lunes } = vista;
  // El cambio de plato en marcha: el viejo sigue tachado hasta que la vista trae el nuevo. Luego entra el nuevo
  // (con la receta, para animar solo ese nombre).
  const [cambio, setCambio] = useState<{ hueco: Hueco; id: string; tacha: boolean } | null>(null);
  const [entra, setEntra] = useState<{ hueco: Hueco; id: string } | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const ocupado = useRef(false);
  const menu = useRef<HTMLUListElement>(null);
  // Dónde estaba cada letra antes de cambiar un día: el efecto de abajo las hace viajar a su fila nueva.
  const previas = useRef<Map<string, DOMRect> | null>(null);

  const domingo = vista.dias.find((d) => d.dia === 'D')!;

  useLayoutEffect(() => {
    const antes = previas.current;
    if (!antes) return;
    previas.current = null;
    menu.current?.querySelectorAll<HTMLElement>('.dl').forEach((e) => {
      const a = antes.get(e.dataset.d!);
      if (!a) return;
      const b = e.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (dx || dy) e.animate?.([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], {
        duration: MS_LETRAS,
        easing: 'cubic-bezier(.16,1,.3,1)',
      });
    });
  }, [vista]);

  // Las letras de los días son elementos sueltos: se anota dónde están antes de escribir el cambio.
  const anotarLetras = () => {
    if (sinMovimiento() || !menu.current) return;
    const posiciones = new Map<string, DOMRect>();
    menu.current.querySelectorAll<HTMLElement>('.dl').forEach((e) => posiciones.set(e.dataset.d!, e.getBoundingClientRect()));
    previas.current = posiciones;
    // Si el cambio no mueve nada, las posiciones no se quedan esperando a otra actualización.
    setTimeout(() => {
      previas.current = null;
    }, 1000);
  };
  const moverLetras = (escribirDia: () => Promise<void>) => {
    anotarLetras();
    return escribirDia().catch((error: unknown) => console.debug('No se pudo cambiar el día', error));
  };

  // Cuando la vista trae el plato nuevo, el trazo acaba y el nombre entra.
  useEffect(() => {
    if (!cambio) return;
    if (vista.menu.find((p) => p.hueco === cambio.hueco)?.receta?.id !== cambio.id) return;
    setCambio(null);
    setEntra(sinMovimiento() ? null : { hueco: cambio.hueco, id: cambio.id });
    ocupado.current = false;
  }, [vista, cambio]);

  // Tacha el plato del hueco (0,3 s) y escribe el nuevo; un hueco sin plato no tiene nada que tachar.
  const poner = async (hueco: Hueco, recetaId: string) => {
    if (ocupado.current) return;
    ocupado.current = true;
    const tacha = vista.menu.find((p) => p.hueco === hueco)?.receta != null && !sinMovimiento();
    setCambio({ hueco, id: recetaId, tacha });
    try {
      if (tacha) await new Promise((resolver) => setTimeout(resolver, MS_TRAZO));
      anotarLetras();
      await ponerPlato(lunes, hueco, recetaId);
      // Por si la vista no cambiara, el cambio no se queda esperando.
      setTimeout(() => {
        ocupado.current = false;
        setCambio((c) => (c?.id === recetaId ? null : c));
      }, 2000);
    } catch (error) {
      console.debug('No se pudo cambiar el plato', error);
      ocupado.current = false;
      setCambio(null);
    }
  };

  const hacer = async () => {
    if (escribiendo) return;
    setEscribiendo(true);
    try {
      await hacerLista(lunes);
    } catch (error) {
      console.debug('No se pudo hacer la lista', error);
    } finally {
      setEscribiendo(false);
    }
  };

  if (!vista.hayRecetas) return <SinRecetas />;

  return (
    <>
      <fieldset className="days">
        <legend className="sr">Días activos</legend>
        {vista.dias.map(({ dia, fecha, activo, fuera }) => (
          <button
            key={dia}
            type="button"
            className={`day${fuera ? ' fuera' : ''}${activo ? ' on' : ''}`}
            disabled={fuera}
            aria-pressed={activo}
            aria-label={`${NOMBRE_DIA[dia]} ${Number(fecha.slice(8))}${fuera ? ', fuera' : activo ? ', activo' : ''}`}
            onClick={() => moverLetras(() => cambiarDia(lunes, dia))}
          >
            <b aria-hidden="true">{dia}</b>
            <span aria-hidden="true">{Number(fecha.slice(8))}</span>
          </button>
        ))}
      </fieldset>
      <p className="legend">
        <i />
        Días activos · toca un día para cambiarlo
      </p>

      <h2>Menú</h2>
      <ul className="menu" ref={menu}>
        {vista.menu.map((plato) => (
          <FilaPlato
            key={plato.hueco}
            lunes={lunes}
            plato={plato}
            tachando={cambio?.tacha === true && cambio.hueco === plato.hueco && plato.receta?.id !== cambio.id}
            entrando={entra?.hueco === plato.hueco && entra.id === plato.receta?.id}
            alDeshacer={(recetaId) => poner(plato.hueco, recetaId)}
          />
        ))}
        <li className={`item out${domingo.fuera ? '' : ' casa'}`}>
          <div className="line">
            <span className="name">Domingo</span>
            <span className="leader" aria-hidden="true" />
            <span className="fig">{domingo.fuera ? 'fuera' : 'en casa'}</span>
          </div>
          <p className="act">
            <button
              className="link"
              type="button"
              aria-label={domingo.fuera ? 'Comer en casa el domingo' : 'Comer fuera el domingo'}
              onClick={() => moverLetras(() => cambiarFuera(lunes, 'D', !domingo.fuera))}
            >
              {domingo.fuera ? 'Comer en casa' : 'Comer fuera'}
            </button>
          </p>
        </li>
      </ul>

      <h2>Hace tiempo que no coméis</h2>
      <ul className="sug">
        {vista.sugerencias.map((s) => (
          <FilaSugerencia key={s.id} sugerencia={s} alCambiar={() => poner(s.hueco, s.id)} />
        ))}
      </ul>

      <div className="dock">
        <div className="dock-in">
          <p className="status" aria-live="polite">
            {vista.lista === 'hecha' && `Lista hecha con ${vista.productos} ${vista.productos === 1 ? 'producto' : 'productos'}`}
            {vista.lista === 'cambiada' && 'Has cambiado el menú desde que hiciste la lista'}
          </p>
          {vista.lista === 'hecha' ? (
            <Link className="cta quiet" to="/lista">
              <Hecho />
              Ver la lista
            </Link>
          ) : (
            <button
              className="cta"
              type="button"
              aria-disabled={escribiendo}
              aria-busy={escribiendo || undefined}
              onClick={hacer}
            >
              {vista.lista === 'cambiada' ? 'Actualizar la lista de la compra' : 'Hacer la lista de la compra'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function Semana() {
  const [params, setParams] = useSearchParams();
  const hoy = hoyEnMadrid(new Date());
  const pedido = params.get('ver');
  const ver: Segmento = pedido === 'esta' || pedido === 'viene' ? pedido : semanaQueSeAbre(hoy);
  const lunesEsta = lunesDe(hoy);
  const lunesViene = sumarDias(lunesEsta, 7);
  const vista = useSemana(lunesViene);
  const vistaEsta = useSemana(lunesEsta);

  const elegir = (segmento: Segmento) => setParams({ ver: segmento }, { replace: true });

  return (
    <>
      <main className="screen semana">
        <div className="bar">
          <div className="seg" role="tablist" aria-label="Semana">
            <button
              type="button"
              role="tab"
              id="t-esta"
              aria-controls="p-esta"
              aria-selected={ver === 'esta'}
              onClick={() => elegir('esta')}
            >
              Esta semana
            </button>
            <button
              type="button"
              role="tab"
              id="t-viene"
              aria-controls="p-viene"
              aria-selected={ver === 'viene'}
              onClick={() => elegir('viene')}
            >
              La que viene
            </button>
          </div>
        </div>

        {/* Mientras la copia no responde solo se pinta el segmentado. */}
        {vista && vistaEsta && (
          <>
            <section id="p-esta" role="tabpanel" aria-labelledby="t-esta" hidden={ver !== 'esta'}>
              <EstaSemana vista={vistaEsta} hoy={hoy} titulo={rangoDeFechas(lunesEsta)} />
            </section>
            <section id="p-viene" role="tabpanel" aria-labelledby="t-viene" hidden={ver !== 'viene'}>
              <header>
                <h1>{rangoDeFechas(lunesViene)}</h1>
              </header>
              <LaQueViene vista={vista} />
            </section>
          </>
        )}
      </main>
      <BarraPestanas />
    </>
  );
}

import { useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router';
import { esBasico, esEnergetica, fraseTipos, tiposDe } from '../../shared/recetas';
import { seccionDe } from '../../shared/secciones';
import { ponerAviso } from '../datos/avisos';
import {
  borradorDe,
  borradorVacio,
  borrarReceta,
  guardarReceta,
  ingredienteVacio,
  pasoVacio,
  useReceta,
  type BorradorIngrediente,
  type BorradorPaso,
  type BorradorReceta,
} from '../datos/recetas';
import { BloqueIngrediente, type IngredienteEditor } from './editor/BloqueIngrediente';
import { BloquePaso, type PasoEditor } from './editor/BloquePaso';
import { HuecoFoto } from './editor/HuecoFoto';
import '../estilos/editor.css';

// Lo que se edita: los números como texto, tal cual se teclean, y por ingrediente si ya se eligió a mano su sección.
type Formulario = {
  id: string;
  nombre: string;
  raciones: string;
  minutos: string;
  fotoKey: string | null;
  ingredientes: IngredienteEditor[];
  pasos: PasoEditor[];
};

const PARTES = [
  { clave: 'receta', texto: 'Receta' },
  { clave: 'ingredientes', texto: 'Ingredientes' },
  { clave: 'pasos', texto: 'Pasos' },
] as const;

type Parte = (typeof PARTES)[number]['clave'];

const SIN_NOMBRE = 'Ponle nombre a la receta.';

// Raciones, tiempo y minutos se leen como enteros: lo que no sea un entero mayor que 0 es null.
function entero(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d+$/.test(limpio)) return null;
  const n = Number(limpio);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const textoDe = (n: number | null): string => (n === null ? '' : String(n));

const ingredienteEditor = (i: BorradorIngrediente): IngredienteEditor => ({
  ...i,
  // Lo que ya no coincide con lo que propondría su nombre lo eligió alguien: el nombre no lo vuelve a cambiar.
  tocado: i.seccion !== seccionDe(i.nombre) || i.aLaLista === esBasico(i.nombre),
});

const pasoEditor = (p: BorradorPaso): PasoEditor => ({ id: p.id, texto: p.texto, minutos: textoDe(p.minutos) });

const formularioDe = (b: BorradorReceta): Formulario => ({
  id: b.id,
  nombre: b.nombre,
  raciones: textoDe(b.raciones),
  minutos: textoDe(b.minutos),
  fotoKey: b.fotoKey,
  ingredientes: b.ingredientes.map(ingredienteEditor),
  pasos: b.pasos.map(pasoEditor),
});

const borradorDesde = (f: Formulario): BorradorReceta => ({
  id: f.id,
  nombre: f.nombre,
  raciones: entero(f.raciones),
  minutos: entero(f.minutos),
  fotoKey: f.fotoKey,
  ingredientes: f.ingredientes.map(({ tocado: _tocado, ...i }) => i),
  pasos: f.pasos.map((p) => ({ id: p.id, texto: p.texto, minutos: entero(p.minutos) })),
});

const Mas = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// Atrás en el historial si se llegó desde la app; si se entró directo al editor, a `alternativa`, reemplazando la entrada.
function useVolver(alternativa: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return () => {
    if (key === 'default') navigate(alternativa, { replace: true });
    else navigate(-1);
  };
}

// El editor no lleva barra de pestañas: es una tarea que se cierra con Cancelar o Guardar.
function EditorReceta({ inicial }: { inicial?: BorradorReceta }) {
  const nueva = inicial === undefined;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [form, setForm] = useState(() => formularioDe(inicial ?? borradorVacio()));
  const [cambios, setCambios] = useState(false);
  const [parte, setParte] = useState<Parte>('receta');
  // La parte a la que se acaba de pasar: entra desde abajo (la primera, al abrir, no se anima).
  const [llegada, setLlegada] = useState<Parte | null>(null);
  const [errorNombre, setErrorNombre] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [descarte, setDescarte] = useState(false);

  const volver = useVolver(nueva ? '/recetas' : `/recetas/${form.id}`);
  const nombreRef = useRef<HTMLInputElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const descartarRef = useRef<HTMLButtonElement>(null);
  const anadirIngredienteRef = useRef<HTMLButtonElement>(null);
  const anadirPasoRef = useRef<HTMLButtonElement>(null);
  const pestanas = useRef<Partial<Record<Parte, HTMLButtonElement | null>>>({});
  // La subida en curso: Guardar la espera para no dejar la receta sin la foto recién elegida.
  const subida = useRef<Promise<string | null> | null>(null);
  const ocupado = useRef(false);

  const actualizar = (cambio: (f: Formulario) => Formulario) => {
    setForm(cambio);
    setCambios(true);
  };

  // El bloque con el foco desaparece: el foco pasa al "Quitar" del siguiente (o a "Añadir…" si era el último)
  // y no cae al body. Sin mover la página: en el móvil no se ve y no debe saltar.
  const enfocarTrasQuitar = (siguiente: string | undefined, anadir: HTMLButtonElement | null) => {
    const destino = siguiente === undefined ? anadir : document.getElementById(`quitar-${siguiente}`);
    destino?.focus({ preventScroll: true });
  };

  // Un aviso con "Deshacer" se queda hasta la siguiente acción: escribir o tocar cualquier otra cosa lo retira.
  const retirarAviso = () => ponerAviso(null);

  const ir = (destino: Parte) => {
    if (destino === parte) return;
    setParte(destino);
    setLlegada(destino);
  };

  const alPulsarTecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const k = PARTES.findIndex((p) => p.clave === parte);
    const siguiente = PARTES[(k + (e.key === 'ArrowRight' ? 1 : PARTES.length - 1)) % PARTES.length]!.clave;
    retirarAviso();
    ir(siguiente);
    pestanas.current[siguiente]?.focus();
  };

  // Ingredientes

  const cambiarIngrediente = (id: string) => (cambio: (i: IngredienteEditor) => IngredienteEditor) =>
    actualizar((f) => ({ ...f, ingredientes: f.ingredientes.map((i) => (i.id === id ? cambio(i) : i)) }));

  const anadirIngrediente = () => {
    const nuevo = ingredienteEditor(ingredienteVacio());
    flushSync(() => actualizar((f) => ({ ...f, ingredientes: [...f.ingredientes, nuevo] })));
    document.getElementById(`ingrediente-${nuevo.id}`)?.focus();
  };

  const quitarIngrediente = (id: string) => {
    const k = form.ingredientes.findIndex((i) => i.id === id);
    const quitado = form.ingredientes[k];
    if (!quitado) return;
    actualizar((f) => ({ ...f, ingredientes: f.ingredientes.filter((i) => i.id !== id) }));
    enfocarTrasQuitar(form.ingredientes[k + 1]?.id, anadirIngredienteRef.current);
    ponerAviso({
      texto: 'Ingrediente quitado',
      en: pathname,
      deshacer: () =>
        actualizar((f) => ({ ...f, ingredientes: [...f.ingredientes.slice(0, k), quitado, ...f.ingredientes.slice(k)] })),
    });
  };

  // Pasos

  const cambiarPaso = (id: string) => (cambio: (p: PasoEditor) => PasoEditor) =>
    actualizar((f) => ({ ...f, pasos: f.pasos.map((p) => (p.id === id ? cambio(p) : p)) }));

  const anadirPaso = () => {
    const nuevo = pasoEditor(pasoVacio());
    flushSync(() => actualizar((f) => ({ ...f, pasos: [...f.pasos, nuevo] })));
    document.getElementById(`paso-${nuevo.id}`)?.focus();
  };

  const quitarPaso = (id: string) => {
    const k = form.pasos.findIndex((p) => p.id === id);
    const quitado = form.pasos[k];
    if (!quitado) return;
    actualizar((f) => ({ ...f, pasos: f.pasos.filter((p) => p.id !== id) }));
    enfocarTrasQuitar(form.pasos[k + 1]?.id, anadirPasoRef.current);
    ponerAviso({
      texto: 'Paso quitado',
      en: pathname,
      deshacer: () => actualizar((f) => ({ ...f, pasos: [...f.pasos.slice(0, k), quitado, ...f.pasos.slice(k)] })),
    });
  };

  // Guardar, cancelar y borrar

  const guardar = async () => {
    if (ocupado.current) return;
    if (form.nombre.trim() === '') {
      // Se vuelve a Receta y el foco va al nombre en el mismo toque (en el iPhone así se abre el teclado).
      flushSync(() => {
        ir('receta');
        setErrorNombre(true);
      });
      nombreRef.current?.focus();
      return;
    }
    ocupado.current = true;
    setErrorGuardar('');
    let fotoKey = form.fotoKey;
    const pendiente = subida.current;
    if (pendiente) {
      const id = await pendiente;
      if (id === null) {
        // La foto no subió: su error queda escrito en Receta y no se guarda sin ella.
        ocupado.current = false;
        setParte('receta');
        return;
      }
      fotoKey = id;
    }
    try {
      await guardarReceta(borradorDesde({ ...form, fotoKey }));
    } catch (error) {
      console.debug('No se pudo guardar la receta', error);
      ocupado.current = false;
      setErrorGuardar('No se pudo guardar. Inténtalo otra vez.');
      return;
    }
    // Una receta nueva abre su vista en el sitio del editor; al editar, se vuelve a la vista de la que se vino.
    if (nueva) navigate(`/recetas/${form.id}`, { replace: true });
    else volver();
  };

  const cancelar = () => {
    if (!cambios) {
      volver();
      return;
    }
    flushSync(() => setDescarte(true));
    descartarRef.current?.focus();
  };

  const seguirEditando = () => {
    flushSync(() => setDescarte(false));
    cancelarRef.current?.focus();
  };

  // Sin confirmación (The Undo, Don't Ask Rule): el índice ofrece deshacerlo.
  const borrar = async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    let deshacer: () => Promise<void>;
    try {
      deshacer = await borrarReceta(form.id);
    } catch (error) {
      console.debug('No se pudo borrar la receta', error);
      ocupado.current = false;
      setErrorGuardar('No se pudo borrar. Inténtalo otra vez.');
      return;
    }
    ponerAviso({ texto: 'Receta borrada', deshacer, en: '/recetas' });
    navigate('/recetas', { replace: true });
  };

  const nombrados = form.ingredientes
    .filter((i) => i.nombre.trim() !== '')
    .map((i) => ({ id: i.id, nombre: i.nombre }));
  const tipos = tiposDe(form.ingredientes.filter((i) => i.nombre.trim() !== ''));
  const lineaTipos =
    tipos.length === 0
      ? 'El tipo de cada ingrediente dice si el plato es energético.'
      : esEnergetica(tipos)
        ? `${fraseTipos(tipos)}: plato energético, irá a los días activos.`
        : `${fraseTipos(tipos)}: irá a los días sin actividad.`;

  const panel = (clave: Parte) => ({
    className: llegada === clave ? 'parte llega' : 'parte',
    id: `p-${clave}`,
    role: 'tabpanel',
    'aria-labelledby': `t-${clave}`,
    hidden: parte !== clave,
  });

  return (
    <main className="screen editor" onClickCapture={retirarAviso} onChangeCapture={retirarAviso}>
      <div className="top">
        <button ref={cancelarRef} className="cancel" type="button" onClick={cancelar}>
          Cancelar
        </button>
        <button className="save" type="button" onClick={() => void guardar()}>
          Guardar
        </button>
      </div>
      <div className="descarte" role="alert" hidden={!descarte}>
        <p>Hay cambios sin guardar.</p>
        <div className="descarte-acc">
          <button ref={descartarRef} className="link" type="button" onClick={() => volver()}>
            Descartar cambios
          </button>
          <button className="quiet" type="button" onClick={seguirEditando}>
            Seguir editando
          </button>
        </div>
      </div>
      {errorGuardar !== '' && (
        <p className="error" role="alert">
          {errorGuardar}
        </p>
      )}
      <header>
        <h1>{nueva ? 'Nueva receta' : 'Editar receta'}</h1>
      </header>

      {/* Pestañas con foco itinerante: solo la elegida entra en el orden del tabulador; las flechas pasan a la siguiente. */}
      <div className="seg" role="tablist" aria-label="Partes de la receta" onKeyDown={alPulsarTecla}>
        {PARTES.map(({ clave, texto }) => (
          <button
            key={clave}
            ref={(boton) => {
              pestanas.current[clave] = boton;
            }}
            type="button"
            role="tab"
            id={`t-${clave}`}
            aria-controls={`p-${clave}`}
            aria-selected={parte === clave}
            tabIndex={parte === clave ? 0 : -1}
            onClick={() => ir(clave)}
          >
            {texto}
          </button>
        ))}
      </div>

      <section {...panel('receta')}>
        <label className="campo">
          <span className="rot">Nombre</span>
          <span className="caja">
            <input
              ref={nombreRef}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="Cómo se llama el plato"
              value={form.nombre}
              aria-invalid={errorNombre || undefined}
              aria-describedby={errorNombre ? 'error-nombre' : undefined}
              onChange={(e) => {
                const nombre = e.target.value;
                setErrorNombre(false);
                actualizar((f) => ({ ...f, nombre }));
              }}
            />
          </span>
        </label>
        <p className="error" id="error-nombre" role="alert" hidden={!errorNombre}>
          {SIN_NOMBRE}
        </p>
        <div className="fila">
          <label className="campo">
            <span className="rot">Raciones</span>
            <span className="caja">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={form.raciones}
                onChange={(e) => {
                  const raciones = e.target.value;
                  actualizar((f) => ({ ...f, raciones }));
                }}
              />
            </span>
          </label>
          <label className="campo">
            <span className="rot" aria-hidden="true">
              Tiempo
            </span>
            <span className="caja">
              <input
                inputMode="numeric"
                autoComplete="off"
                aria-label="Tiempo en minutos"
                value={form.minutos}
                onChange={(e) => {
                  const minutos = e.target.value;
                  actualizar((f) => ({ ...f, minutos }));
                }}
              />
              <span className="uni" aria-hidden="true">
                min
              </span>
            </span>
          </label>
        </div>
        <p className="tipos" aria-live="polite">
          {lineaTipos}
        </p>
        <HuecoFoto
          fotoKey={form.fotoKey}
          cambiar={(fotoKey) => actualizar((f) => ({ ...f, fotoKey }))}
          subida={subida}
        />
        {!nueva && (
          <p className="borrar">
            <button className="link" type="button" onClick={() => void borrar()}>
              Borrar receta
            </button>
          </p>
        )}
      </section>

      <section {...panel('ingredientes')}>
        <ul className="ings">
          {form.ingredientes.map((i, k) => (
            <BloqueIngrediente
              key={i.id}
              ingrediente={i}
              n={k + 1}
              cambiar={cambiarIngrediente(i.id)}
              quitar={() => quitarIngrediente(i.id)}
            />
          ))}
        </ul>
        <button ref={anadirIngredienteRef} className="anadir" type="button" onClick={anadirIngrediente}>
          <Mas />
          Añadir ingrediente
        </button>
      </section>

      <section {...panel('pasos')}>
        <ol className="pasos">
          {form.pasos.map((p, k) => (
            <BloquePaso
              key={p.id}
              paso={p}
              n={k + 1}
              ingredientes={nombrados}
              visible={parte === 'pasos'}
              cambiar={cambiarPaso(p.id)}
              quitar={() => quitarPaso(p.id)}
            />
          ))}
        </ol>
        <button ref={anadirPasoRef} className="anadir" type="button" onClick={anadirPaso}>
          <Mas />
          Añadir paso
        </button>
      </section>
    </main>
  );
}

function NoExiste() {
  const volver = useVolver('/recetas');
  return (
    <main className="screen editor">
      <div className="top">
        <button className="cancel" type="button" onClick={() => volver()}>
          Cancelar
        </button>
      </div>
      <h1 className="vacio-todo">Esta receta ya no existe.</h1>
    </main>
  );
}

function Editar({ id }: { id: string }) {
  const completa = useReceta(id);
  // El borrador se toma una sola vez, al cargar: lo que llegue después por la sincronización no pisa lo que se escribe.
  const [inicial, setInicial] = useState<BorradorReceta | null>(null);
  if (inicial === null && completa) setInicial(borradorDe(completa));
  if (inicial) return <EditorReceta inicial={inicial} />;
  if (completa === null) return <NoExiste />;
  return <main className="screen editor" />;
}

// /recetas/nueva empieza con un borrador vacío; /recetas/:id/editar, con la receta guardada.
export function Editor() {
  const { id } = useParams();
  if (id === undefined) return <EditorReceta key="nueva" />;
  return <Editar key={id} id={id} />;
}

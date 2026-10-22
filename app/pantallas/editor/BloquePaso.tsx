import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { ingredientesDe, marcarPaso } from '../../../shared/pasos';

// Los minutos se escriben como texto y se leen como entero al guardar.
export type PasoEditor = { id: string; texto: string; minutos: string };

type Nombrado = { id: string; nombre: string };

// Los ids de los ingredientes que nombra el texto, en el orden en que aparecen: los mismos que marcará guardarReceta.
const usados = (texto: string, ingredientes: Nombrado[]): string[] => ingredientesDe(marcarPaso(texto, ingredientes));

// El campo crece con el texto; donde el navegador no tiene field-sizing, lo mide el script.
const conFieldSizing =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content');

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Un paso del editor: el número en su columna, el texto sin marcas, la línea "Usa" y los minutos.
export function BloquePaso({
  paso,
  n,
  ingredientes,
  visible,
  cambiar,
  quitar,
}: {
  paso: PasoEditor;
  n: number;
  ingredientes: Nombrado[];
  visible: boolean;
  cambiar: (cambio: (p: PasoEditor) => PasoEditor) => void;
  quitar: () => void;
}) {
  const campo = useRef<HTMLTextAreaElement>(null);
  // Los ingredientes que este paso acaba de nombrar al escribirlo: entran subiendo en la línea "Usa".
  const [nuevos, setNuevos] = useState<ReadonlySet<string>>(() => new Set());
  const ids = usados(paso.texto, ingredientes);
  const nombres = new Map(ingredientes.map((i) => [i.id, i.nombre.trim()]));

  // Oculto (otra parte del editor) no tiene alto que medir: se mide al enseñarse.
  useLayoutEffect(() => {
    const t = campo.current;
    if (conFieldSizing || !visible || !t) return;
    t.style.height = 'auto';
    if (t.scrollHeight > 0) t.style.height = `${t.scrollHeight}px`;
  }, [paso.texto, visible]);

  const escribir = (texto: string) => {
    const ahora = usados(texto, ingredientes);
    // Solo cambia la marca cuando cambia la lista: seguir tecleando no corta la entrada a medias.
    if (ahora.join() !== ids.join()) {
      setNuevos(sinMovimiento() ? new Set() : new Set(ahora.filter((id) => !ids.includes(id))));
    }
    cambiar((p) => ({ ...p, texto }));
  };

  const usa = `usa-${paso.id}`;
  return (
    <li>
      <span className="n" aria-hidden="true">
        {n}
      </span>
      <div>
        <textarea
          ref={campo}
          id={`paso-${paso.id}`}
          aria-label={`Paso ${n}`}
          aria-describedby={usa}
          rows={1}
          placeholder="Cómo se hace este paso"
          value={paso.texto}
          onChange={(e) => escribir(e.target.value)}
        />
        <p className="usa" id={usa} aria-live="polite">
          {ids.length > 0 && (
            <>
              Usa:{' '}
              {ids.map((id, k) => (
                <Fragment key={id}>
                  {k > 0 && ', '}
                  <b className={nuevos.has(id) ? 'nuevo' : undefined}>{nombres.get(id)}</b>
                </Fragment>
              ))}
            </>
          )}
        </p>
        <div className="paso-pie">
          <label className="min">
            <input
              inputMode="numeric"
              autoComplete="off"
              aria-label={`Minutos del paso ${n}`}
              value={paso.minutos}
              onChange={(e) => {
                const minutos = e.target.value;
                cambiar((p) => ({ ...p, minutos }));
              }}
            />
            <span aria-hidden="true">min</span>
          </label>
          <button id={`quitar-${paso.id}`} className="quiet" type="button" onClick={quitar}>
            Quitar<span className="sr"> paso {n}</span>
          </button>
        </div>
      </div>
    </li>
  );
}

import { useState } from 'react';
import { esBasico, TIPOS } from '../../../shared/recetas';
import { esSeccion, SECCIONES, seccionDe } from '../../../shared/secciones';
import type { BorradorIngrediente } from '../../datos/recetas';

// `tocado`: alguien eligió la sección o si va a la lista; desde entonces el nombre ya no los propone.
export type IngredienteEditor = BorradorIngrediente & { tocado: boolean };

export const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const mayuscula = (texto: string) => texto.charAt(0).toLocaleUpperCase('es') + texto.slice(1);

// Un ingrediente del editor: nombre y cantidad, el tipo debajo y, plegado, la sección y si va a la lista.
export function BloqueIngrediente({
  ingrediente: i,
  n,
  cambiar,
  quitar,
}: {
  ingrediente: IngredienteEditor;
  n: number;
  cambiar: (cambio: (i: IngredienteEditor) => IngredienteEditor) => void;
  quitar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const panel = `mas-${i.id}`;
  const quien = i.nombre.trim() || `el ingrediente ${n}`;
  const lista = !i.aLaLista ? 'no va a la lista' : i.compra.trim() ? `se compra ${i.compra.trim()}` : 'va a la lista';

  const escribirNombre = (nombre: string) =>
    cambiar((x) => (x.tocado ? { ...x, nombre } : { ...x, nombre, seccion: seccionDe(nombre), aLaLista: !esBasico(nombre) }));

  return (
    <li>
      <div className="ing-linea">
        <span className="caja">
          <input
            id={`ingrediente-${i.id}`}
            aria-label={`Ingrediente ${n}`}
            placeholder="Ingrediente"
            autoComplete="off"
            value={i.nombre}
            onChange={(e) => escribirNombre(e.target.value)}
          />
        </span>
        <span className="caja">
          <input
            aria-label={`Cantidad del ingrediente ${n}`}
            placeholder="Cantidad"
            autoComplete="off"
            value={i.cantidad}
            onChange={(e) => {
              const cantidad = e.target.value;
              cambiar((x) => ({ ...x, cantidad }));
            }}
          />
        </span>
      </div>
      <div className="tipo" role="group" aria-label={`Tipo del ingrediente ${n}`}>
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={i.tipo === t}
            onClick={() => cambiar((x) => ({ ...x, tipo: x.tipo === t ? null : t }))}
          >
            {mayuscula(t)}
          </button>
        ))}
      </div>
      <div className="ing-pie">
        <button
          className="resumen"
          type="button"
          aria-expanded={abierto}
          aria-controls={panel}
          onClick={() => setAbierto((a) => !a)}
        >
          <span>
            {i.seccion} · {lista}
          </span>
          <Chevron />
          <span className="sr">, más opciones de {quien}</span>
        </button>
        <button id={`quitar-${i.id}`} className="quiet" type="button" onClick={quitar}>
          Quitar <span className="sr">ingrediente {n}</span>
        </button>
      </div>
      {/* Plegado con hidden, no fuera del DOM: el control sigue ahí aunque no se vea. */}
      <div className="mas" id={panel} hidden={!abierto}>
        <label className="campo">
          <span className="sr">Sección del ingrediente {n}</span>
          <span className="select">
            <select
              value={i.seccion}
              onChange={(e) => {
                const seccion = e.target.value;
                if (esSeccion(seccion)) cambiar((x) => ({ ...x, seccion, tocado: true }));
              }}
            >
              {SECCIONES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Chevron />
          </span>
        </label>
        <label className="interruptor">
          <span>No va a la lista</span>
          <input
            type="checkbox"
            role="switch"
            checked={!i.aLaLista}
            onChange={(e) => {
              const fuera = e.target.checked;
              cambiar((x) => ({ ...x, aLaLista: !fuera, tocado: true }));
            }}
          />
        </label>
        <label className="campo" hidden={!i.aLaLista}>
          <span className="rot">Se compra</span>
          <span className="caja">
            <input
              placeholder="1 cabeza, 1 bote…"
              autoComplete="off"
              value={i.compra}
              onChange={(e) => {
                const compra = e.target.value;
                cambiar((x) => ({ ...x, compra }));
              }}
            />
          </span>
        </label>
      </div>
    </li>
  );
}

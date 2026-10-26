import { useLayoutEffect, type RefObject } from 'react';

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

// Mide la guía de una fila tras maquetar y otra vez al cambiar el tamaño de la ventana.
export function useGuiaLarga(linea: RefObject<HTMLElement | null>, activa: boolean, nombre: string) {
  useLayoutEffect(() => {
    const el = linea.current;
    if (!el || !activa) return;
    const medir = () => medirGuia(el);
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [linea, activa, nombre]);
}

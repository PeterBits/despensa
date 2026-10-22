// El aviso de la línea de estado: un texto con "Deshacer", compartido por todas las pantallas.
// `en` es la ruta (pathname) a la que pertenece: el editor pone el aviso de /recetas justo antes de navegar allí.

import { useSyncExternalStore } from 'react';

export type Aviso = { texto: string; deshacer: () => void | Promise<void>; en: string };

let actual: Aviso | null = null;
const oyentes = new Set<() => void>();

export function ponerAviso(aviso: Aviso | null): void {
  actual = aviso;
  for (const oyente of [...oyentes]) oyente();
}

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

const leer = () => actual;

export function useAviso(): Aviso | null {
  return useSyncExternalStore(suscribir, leer, leer);
}

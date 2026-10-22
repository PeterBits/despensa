// Mantiene la copia local al día sin que ninguna pantalla lo pida: sincroniza al empezar, al escribir,
// al volver a primer plano y al recuperar la red. Un fallo no se reintenta en bucle: espera al siguiente disparo.

import { liveQuery } from 'dexie';
import { copia } from './local';
import { SinSesion, sincronizar } from './sync';

type Opciones = {
  alPerderSesion: () => void;
  fetcher?: typeof fetch;
  // Pausa antes de enviar lo escrito, para juntar escrituras seguidas en un solo envío.
  espera?: number;
};

export function iniciarSincronizacion({ alPerderSesion, fetcher = fetch, espera = 300 }: Opciones): () => void {
  let parado = false;
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const programar = () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(vuelta, espera);
  };

  // sincronizar() ya garantiza una vuelta a la vez; quien llega mientras otra corre comparte su resultado.
  async function vuelta() {
    if (parado) return;
    try {
      await sincronizar(fetcher);
      // Lo escrito mientras se enviaba se quedó en la cola: sale en la vuelta siguiente.
      if (!parado && (await copia().cola.count()) > 0) programar();
    } catch (e) {
      if (e instanceof SinSesion) {
        if (parado) return;
        parar();
        alPerderSesion();
      } else {
        console.debug('La sincronización ha fallado:', e instanceof Error ? e.message : typeof e);
      }
    }
  }

  const alVolver = () => {
    if (document.visibilityState === 'visible') void vuelta();
  };
  const alRecuperarRed = () => void vuelta();

  function parar() {
    parado = true;
    clearTimeout(temporizador);
    suscripcion.unsubscribe();
    document.removeEventListener('visibilitychange', alVolver);
    window.removeEventListener('online', alRecuperarRed);
  }

  const suscripcion = liveQuery(() => copia().cola.count()).subscribe({
    next: (pendientes) => {
      if (pendientes > 0 && !parado) programar();
    },
    error: (e) => console.debug('No se pudo vigilar la cola:', e instanceof Error ? e.message : typeof e),
  });
  document.addEventListener('visibilitychange', alVolver);
  window.addEventListener('online', alRecuperarRed);
  void vuelta();

  return parar;
}

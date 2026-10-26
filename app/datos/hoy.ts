// Hoy en Madrid, al día: una app que vuelve del segundo plano o que sigue abierta a medianoche cambia de día sola.

import { useEffect, useState } from 'react';
import { hoyEnMadrid } from '../../shared/fechas';

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

const RELOJ_MADRID = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

// Cuánto falta para la medianoche de Madrid, contado con su reloj. El día que cambia la hora dura 23 o 25 horas
// y la cuenta puede errar en una: por eso se espera como mucho una hora y se vuelve a contar.
function hastaMedianoche(ahora: Date): number {
  const [h = 0, m = 0, s = 0] = RELOJ_MADRID.format(ahora).split(':').map(Number);
  const pasado = ((h * 60 + m) * 60 + s) * 1000 + ahora.getMilliseconds();
  return Math.min(DIA - pasado, HORA) + 50;
}

export function useHoy(): string {
  const [hoy, setHoy] = useState(() => hoyEnMadrid(new Date()));

  useEffect(() => {
    let reloj: ReturnType<typeof setTimeout> | undefined;
    const ponerAlDia = () => setHoy(hoyEnMadrid(new Date()));
    const armar = () => {
      clearTimeout(reloj);
      reloj = setTimeout(() => {
        ponerAlDia();
        armar();
      }, hastaMedianoche(new Date()));
    };
    // En segundo plano el iPhone congela los temporizadores: al volver se mira la fecha y se rearma el reloj.
    const alVolver = () => {
      if (document.visibilityState !== 'visible') return;
      ponerAlDia();
      armar();
    };
    armar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearTimeout(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, []);

  return hoy;
}

// Fechas del dominio: calendario de Europe/Madrid en YYYY-MM-DD, sin depender de la zona de la máquina.

const aFecha = (fecha: string) => new Date(`${fecha}T12:00:00Z`);
const aTexto = (d: Date) => d.toISOString().slice(0, 10);

export function hoyEnMadrid(ahora: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(ahora);
}

export function sumarDias(fecha: string, n: number): string {
  const d = aFecha(fecha);
  d.setUTCDate(d.getUTCDate() + n);
  return aTexto(d);
}

// La semana va de lunes a domingo: el domingo pertenece a la semana que empezó el lunes anterior.
export function lunesDe(fecha: string): string {
  const diaSemana = aFecha(fecha).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, diaSemana === 0 ? -6 : 1 - diaSemana);
}

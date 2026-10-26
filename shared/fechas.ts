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

// Días de hasta − desde; ambas fechas a mediodía UTC, así el cambio de hora no cuenta.
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86_400_000);
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// "Del 26 oct al 1 nov"; si la semana cae en un solo mes, el mes se dice una vez: "Del 2 al 8 nov".
export function rangoDeFechas(lunes: string): string {
  const domingo = sumarDias(lunes, 6);
  const dia = (f: string) => Number(f.slice(8));
  const mes = (f: string) => MESES[Number(f.slice(5, 7)) - 1];
  if (mes(lunes) === mes(domingo)) return `Del ${dia(lunes)} al ${dia(domingo)} ${mes(domingo)}`;
  return `Del ${dia(lunes)} ${mes(lunes)} al ${dia(domingo)} ${mes(domingo)}`;
}

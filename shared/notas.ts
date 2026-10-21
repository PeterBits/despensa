// Notas de las recetas: media y formato con coma decimal.

export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((suma, v) => suma + v, 0) / valores.length;
}

export function formatearNota(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}

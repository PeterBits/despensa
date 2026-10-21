// En D1 la cantidad es texto libre ("1,5 kg", "2 dientes", "al gusto"). Este módulo lo lee,
// suma las cantidades compatibles de la lista de la compra y las vuelve a escribir.

export type Cantidad = { valor: number | null; unidad: string };

// Factor para pasar cada unidad de las familias a su base (g o ml).
const MASA: Record<string, number> = { g: 1, kg: 1000 };
const VOLUMEN: Record<string, number> = { ml: 1, l: 1000 };

const NUMERO_INICIAL = /^(\d+(?:[.,]\d+)?)(.*)$/;

// Máximo 3 decimales y sin ruido de coma flotante (0,1 + 0,2).
const redondear = (n: number) => Math.round(n * 1000) / 1000;

export function leerCantidad(texto: string): Cantidad {
  const limpio = texto.trim();
  const [, numero, resto] = NUMERO_INICIAL.exec(limpio) ?? [];
  // Las fracciones ("1/2 taza") quedan fuera: se leen como texto.
  if (numero === undefined || resto === undefined || resto.startsWith('/')) return { valor: null, unidad: limpio };
  return { valor: Number(numero.replace(',', '.')), unidad: resto.trim() };
}

// Clave de agrupación: familia de masa, de volumen, o el texto de la unidad.
function clave(unidad: string): string {
  const u = unidad.toLowerCase();
  if (u in MASA) return 'masa';
  if (u in VOLUMEN) return 'volumen';
  return `u:${u}`;
}

export function sumarCantidades(lista: Cantidad[]): Cantidad[] {
  const utiles = lista.filter((c) => c.valor !== null || c.unidad !== '');

  // Sin ningún valor, cada texto distinto se queda una vez.
  if (utiles.every((c) => c.valor === null)) {
    const vistos = new Set<string>();
    return utiles.filter((c) => {
      const k = c.unidad.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  }

  // Con algún valor, las cantidades sin valor desaparecen.
  const grupos = new Map<string, { base: number; unidad: string }>();
  for (const { valor, unidad } of utiles) {
    if (valor === null) continue;
    const k = clave(unidad);
    const u = unidad.toLowerCase();
    const factor = MASA[u] ?? VOLUMEN[u] ?? 1;
    const previo = grupos.get(k);
    if (previo) previo.base += valor * factor;
    else grupos.set(k, { base: valor * factor, unidad });
  }

  // Map conserva el orden de primera aparición.
  return [...grupos].map(([k, { base, unidad }]) => {
    const total = redondear(base);
    if (k === 'masa') return total >= 1000 ? { valor: redondear(total / 1000), unidad: 'kg' } : { valor: total, unidad: 'g' };
    if (k === 'volumen') return total >= 1000 ? { valor: redondear(total / 1000), unidad: 'l' } : { valor: total, unidad: 'ml' };
    return { valor: total, unidad };
  });
}

export function formatearCantidades(lista: Cantidad[]): string {
  return lista
    .filter((c) => c.valor !== null || c.unidad !== '')
    .map(({ valor, unidad }) => {
      if (valor === null) return unidad;
      const numero = String(redondear(valor)).replace('.', ',');
      return unidad ? `${numero} ${unidad}` : numero;
    })
    .join(' + ');
}

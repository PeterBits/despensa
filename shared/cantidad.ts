// En D1 la cantidad es texto libre ("1,5 kg", "2 dientes", "al gusto"). Este módulo lo lee,
// suma las cantidades compatibles de la lista de la compra y las vuelve a escribir.

export type Cantidad = { valor: number | null; unidad: string };

// Factor para pasar cada unidad de las familias a su base (g o ml).
const MASA: Record<string, number> = { g: 1, kg: 1000 };
const VOLUMEN: Record<string, number> = { ml: 1, l: 1000 };

// Un punto con exactamente tres cifras detrás y nada numérico más es separador de miles
// ("1.000 g"); en cualquier otro caso es decimal ("1.5 kg").
const NUM = String.raw`(?:\d{1,3}(?:\.\d{3})+(?![\d.,])|\d+(?:[.,]\d+)?)`;
const ENTERO_Y_FRACCION = /^(\d+)\s+(\d+)\/(\d+)(.*)$/;
const FRACCION = /^(\d+)\/(\d+)(.*)$/;
const FRACCION_UNICODE = /^([½¼¾])(.*)$/;
const VALOR_UNICODE: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
// Un número o un rango ("2-3", "2 - 3", "2 a 3"); un rango vale por lo alto.
const NUMERO_INICIAL = new RegExp(String.raw`^(${NUM})(?:(?:\s*-\s*|\s+a\s+)(${NUM}))?(.*)$`);

const aNumero = (s: string): number =>
  Number(/^\d{1,3}(?:\.\d{3})+$/.test(s) ? s.replaceAll('.', '') : s.replace(',', '.'));

// Máximo 3 decimales y sin ruido de coma flotante (0,1 + 0,2).
const redondear = (n: number) => Math.round(n * 1000) / 1000;

export function leerCantidad(texto: string): Cantidad {
  const limpio = texto.trim();
  const texto_ = { valor: null, unidad: limpio };

  const unicode = FRACCION_UNICODE.exec(limpio);
  if (unicode) return { valor: VALOR_UNICODE[unicode[1]!]!, unidad: unicode[2]!.trim() };

  const mixta = ENTERO_Y_FRACCION.exec(limpio);
  if (mixta) {
    const [, entero, num, den, resto] = mixta;
    if (Number(den) === 0) return texto_;
    return { valor: Number(entero) + Number(num) / Number(den), unidad: resto!.trim() };
  }

  const fraccion = FRACCION.exec(limpio);
  if (fraccion) {
    const [, num, den, resto] = fraccion;
    if (Number(den) === 0) return texto_;
    return { valor: Number(num) / Number(den), unidad: resto!.trim() };
  }

  const m = NUMERO_INICIAL.exec(limpio);
  if (!m) return texto_;
  return { valor: aNumero(m[2] ?? m[1]!), unidad: m[3]!.trim() };
}

// Clave de agrupación: familia de masa, de volumen, o el texto de la unidad.
function clave(unidad: string): string {
  const u = unidad.toLowerCase();
  if (Object.hasOwn(MASA, u)) return 'masa';
  if (Object.hasOwn(VOLUMEN, u)) return 'volumen';
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
    const factor = (Object.hasOwn(MASA, u) ? MASA[u] : undefined) ?? (Object.hasOwn(VOLUMEN, u) ? VOLUMEN[u] : undefined) ?? 1;
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

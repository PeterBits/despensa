// Marcas de cantidad en los pasos de una receta: `{500 g de lentejas|lentejas}` es el texto
// que se muestra en negrita y el id del ingrediente que usa. Cuando todos los pasos que marcan
// un ingrediente están hechos, la lista lo tacha ("tachado enlazado").

export type Trozo = { texto: string; ingrediente?: string };

// Fábrica, no constante: un RegExp con /g guarda lastIndex y no debe compartirse entre llamadas.
const marcas = () => /\{([^|}]+)\|([^}]+)\}/g;

export function trozos(texto: string): Trozo[] {
  const resultado: Trozo[] = [];
  let desde = 0;
  for (const m of texto.matchAll(marcas())) {
    if (m.index > desde) resultado.push({ texto: texto.slice(desde, m.index) });
    resultado.push({ texto: m[1]!, ingrediente: m[2]! });
    desde = m.index + m[0].length;
  }
  if (desde < texto.length) resultado.push({ texto: texto.slice(desde) });
  return resultado;
}

export function ingredientesDe(texto: string): string[] {
  return [...new Set([...texto.matchAll(marcas())].map((m) => m[2]!))];
}

export function ingredientesGastados(pasos: string[], hechos: Set<number>): Set<string> {
  const pendientes = new Set<string>();
  const marcados = new Set<string>();
  pasos.forEach((paso, i) => {
    for (const id of ingredientesDe(paso)) {
      marcados.add(id);
      if (!hechos.has(i)) pendientes.add(id);
    }
  });
  return new Set([...marcados].filter((id) => !pendientes.has(id)));
}

// Un carácter en minúscula y sin tilde. Siempre de longitud 1, para que los índices del texto
// plegado sean los del original.
const plegar = (c: string): string => c.normalize('NFD').charAt(0).toLowerCase().charAt(0) || c;
const plegarTexto = (texto: string): string => Array.from({ length: texto.length }, (_, i) => plegar(texto[i]!)).join('');

const esLetra = (c: string | undefined): boolean => c !== undefined && /[\p{L}\p{N}]/u.test(c);

type Rango = { desde: number; hasta: number };
const solapa = (a: Rango, b: Rango) => a.desde < b.hasta && a.hasta > b.desde;

export function sugerirMarcas(
  texto: string,
  ingredientes: { id: string; nombre: string }[],
): { id: string; desde: number; hasta: number }[] {
  const plano = plegarTexto(texto);
  const ocupados: Rango[] = [...texto.matchAll(marcas())].map((m) => ({
    desde: m.index,
    hasta: m.index + m[0].length,
  }));
  const sugerencias: { id: string; desde: number; hasta: number }[] = [];

  const buscar = (aguja: string): Rango | undefined => {
    for (let desde = plano.indexOf(aguja); desde !== -1; desde = plano.indexOf(aguja, desde + 1)) {
      if (esLetra(texto[desde - 1])) continue;
      let hasta = desde + aguja.length;
      while (esLetra(texto[hasta])) hasta++;
      const rango = { desde, hasta };
      if (!ocupados.some((o) => solapa(o, rango))) return rango;
    }
    return undefined;
  };

  for (const { id, nombre } of ingredientes) {
    const completo = plegarTexto(nombre).trim().replace(/\s+/g, ' ');
    if (!completo) continue;
    const primera = completo.split(' ')[0]!;
    const candidatos = completo.includes(' ') && primera.length >= 3 ? [completo, primera] : [completo];
    for (const aguja of candidatos) {
      const rango = buscar(aguja);
      if (!rango) continue;
      ocupados.push(rango);
      sugerencias.push({ id, ...rango });
      break;
    }
  }
  return sugerencias.sort((a, b) => a.desde - b.desde);
}

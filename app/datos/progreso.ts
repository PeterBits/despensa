// El progreso de una receta en la cocina: los pasos hechos se recuerdan 12 horas en este dispositivo.
// No es contenido del hogar: no pasa por escribir() ni se sincroniza.

const CLAVE = 'despensa.progreso.';
const DURACION = 12 * 3600_000;

type Guardado = { hechos: string[]; hasta: number };

// Si localStorage lanza al guardar (modo privado, cuota llena), el progreso vive aquí hasta que se recargue la página.
const enMemoria = new Map<string, Guardado>();

function leerGuardado(recetaId: string): Guardado | null {
  // Lo que no cupo en localStorage (cuota llena) manda: guardarProgreso lo quita al lograr escribir.
  const recordado = enMemoria.get(recetaId);
  if (recordado) return recordado;
  let crudo: string | null;
  try {
    crudo = localStorage.getItem(CLAVE + recetaId);
  } catch {
    return null;
  }
  if (crudo === null) return null;
  try {
    const valor: unknown = JSON.parse(crudo);
    const { hechos, hasta } = (valor ?? {}) as Partial<Guardado>;
    if (Array.isArray(hechos) && hechos.every((h) => typeof h === 'string') && typeof hasta === 'number') {
      return { hechos, hasta };
    }
  } catch {
    // Un valor ilegible se trata como si no hubiera progreso.
  }
  return null;
}

function olvidar(recetaId: string): void {
  enMemoria.delete(recetaId);
  try {
    localStorage.removeItem(CLAVE + recetaId);
  } catch {
    // Sin localStorage no hay nada más que borrar.
  }
}

export function leerProgreso(recetaId: string, ahora: number = Date.now()): Set<string> {
  const guardado = leerGuardado(recetaId);
  if (!guardado) return new Set();
  if (ahora > guardado.hasta) {
    olvidar(recetaId);
    return new Set();
  }
  return new Set(guardado.hechos);
}

export function guardarProgreso(recetaId: string, hechos: Set<string>, ahora: number = Date.now()): void {
  if (hechos.size === 0) {
    olvidar(recetaId);
    return;
  }
  const guardado: Guardado = { hechos: [...hechos], hasta: ahora + DURACION };
  try {
    localStorage.setItem(CLAVE + recetaId, JSON.stringify(guardado));
    enMemoria.delete(recetaId);
  } catch {
    enMemoria.set(recetaId, guardado);
  }
}

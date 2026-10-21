import { useRef, useState } from 'react';

// Una ceremonia de passkey a la vez: mientras dura, otro toque se ignora; si falla, su error queda a la vista.
export function useCeremonia(alEntrar?: () => void) {
  const enCurso = useRef(false);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  async function lanzar(nombre: string, ceremonia: () => Promise<void>) {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupada(nombre);
    setError(null);
    try {
      await ceremonia();
      alEntrar?.();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      enCurso.current = false;
      setOcupada(null);
    }
  }

  return { ocupada, error, lanzar };
}

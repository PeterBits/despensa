import { beforeEach, describe, expect, it, vi } from 'vitest';
import { guardarProgreso, leerProgreso } from './progreso';

const HORAS_12 = 12 * 3600_000;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('progreso', () => {
  it('recuerda los pasos hechos y los olvida a las 12 horas', () => {
    guardarProgreso('r1', new Set(['p1']), 0);
    expect(leerProgreso('r1', HORAS_12 - 1)).toEqual(new Set(['p1']));
    expect(leerProgreso('r1', HORAS_12 + 1)).toEqual(new Set());
  });

  it('lo guarda en despensa.progreso.<id> con la hora límite', () => {
    guardarProgreso('r2', new Set(['a', 'b']), 1000);
    expect(JSON.parse(localStorage.getItem('despensa.progreso.r2')!)).toEqual({ hechos: ['a', 'b'], hasta: 1000 + HORAS_12 });
  });

  it('con el conjunto vacío borra la clave', () => {
    guardarProgreso('r3', new Set(['p1']), 0);
    guardarProgreso('r3', new Set(), 0);
    expect(localStorage.getItem('despensa.progreso.r3')).toBeNull();
    expect(leerProgreso('r3', 0)).toEqual(new Set());
  });

  it('un valor ilegible se lee como vacío', () => {
    localStorage.setItem('despensa.progreso.r4', '{no es json');
    expect(leerProgreso('r4')).toEqual(new Set());
    localStorage.setItem('despensa.progreso.r4', JSON.stringify({ hechos: [1], hasta: 5 }));
    expect(leerProgreso('r4', 0)).toEqual(new Set());
  });

  it('si localStorage lanza, el progreso se queda en memoria', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cuota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    guardarProgreso('r5', new Set(['p1']), 0);
    expect(leerProgreso('r5', 1)).toEqual(new Set(['p1']));
  });
});

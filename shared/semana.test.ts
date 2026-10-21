import { describe, expect, it } from 'vitest';
import { hoyEnMadrid, lunesDe, sumarDias } from './fechas';
import { proponer, recomendar, repartir } from './semana';

describe('fechas', () => {
  it('calcula hoy y el lunes en Madrid también con el cambio de hora', () => {
    expect(hoyEnMadrid(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26');
    expect(lunesDe('2026-10-25')).toBe('2026-10-19');
    expect(lunesDe('2026-10-26')).toBe('2026-10-26');
  });
  it('suma días cruzando el final de mes y hacia atrás', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-01-02', -3)).toBe('2025-12-30');
  });
});

describe('repartir', () => {
  it('lleva el plato energético a los días activos y deja el domingo fuera', () => {
    const r = repartir([{ id: 'lentejas', energetico: true }, { id: 'merluza', energetico: false }], ['L', 'X', 'V']);
    expect(r).toEqual({ L: 'lentejas', M: 'merluza', X: 'lentejas', J: 'merluza', V: 'lentejas', S: 'merluza', D: null });
  });
  it('con un solo plato rellena los días activos y deja null el resto', () => {
    const r = repartir([{ id: 'lentejas', energetico: true }], ['L', 'X']);
    expect(r).toEqual({ L: 'lentejas', M: null, X: 'lentejas', J: null, V: null, S: null, D: null });
  });
});

describe('proponer y recomendar', () => {
  const rs = [
    { id: 'arroz', energetica: true, media: 9, ultimaVez: '2026-09-07' },
    { id: 'curry', energetica: true, media: 8, ultimaVez: '2026-10-19' },
    { id: 'pisto', energetica: false, media: 8.5, ultimaVez: '2026-08-17' },
    { id: 'nueva', energetica: false, media: null, ultimaVez: null },
    { id: 'macarrones', energetica: true, media: 6.5, ultimaVez: '2026-08-01' },
  ];
  it('propone media ≥ 7 sin repetir en tres semanas, lo más antiguo primero, y lo nuevo cuenta como 7', () => {
    expect(proponer(rs, '2026-10-20')).toEqual({ energetica: 'arroz', otra: 'nueva' });
  });
  it('acepta lo comido hace 21 días justos y rechaza lo de hace 20', () => {
    const rs21 = [
      { id: 'hace20', energetica: true, media: 8, ultimaVez: '2026-09-30' },
      { id: 'hace21', energetica: true, media: 8, ultimaVez: '2026-09-29' },
    ];
    expect(recomendar(rs21, [], '2026-10-20').map((r) => r.id)).toEqual(['hace21']);
  });
  it('relaja los filtros si solo hay recetas comidas hace poco', () => {
    const recientes = [
      { id: 'a', energetica: true, media: 8, ultimaVez: '2026-10-18' },
      { id: 'b', energetica: false, media: 8, ultimaVez: '2026-10-19' },
    ];
    expect(proponer(recientes, '2026-10-20')).toEqual({ energetica: 'a', otra: 'b' });
  });
  it('devuelve null si no hay ninguna receta no energética', () => {
    expect(proponer(rs.filter((r) => r.energetica), '2026-10-20')).toBeNull();
  });
  it('recomendar excluye lo que ya está en el plan', () => {
    const ids = recomendar(rs, ['arroz'], '2026-10-20').map((r) => r.id);
    expect(ids).not.toContain('arroz');
    expect(ids[0]).toBe('nueva');
  });
});

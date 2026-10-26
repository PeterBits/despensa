import { describe, expect, it } from 'vitest';
import { hoyEnMadrid, lunesDe, rangoDeFechas, sumarDias } from './fechas';
import {
  diasDeLaSemana,
  estadoLista,
  haceCuanto,
  huecoDelMismoTipo,
  proponer,
  proponerHuecos,
  recomendar,
  repartir,
  semanaQueSeAbre,
  sugerir,
  ultimaVezPorReceta,
} from './semana';

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

const rs = [
  { id: 'arroz', energetica: true, media: 9, ultimaVez: '2026-09-07' },
  { id: 'curry', energetica: true, media: 8, ultimaVez: '2026-10-19' },
  { id: 'pisto', energetica: false, media: 8.5, ultimaVez: '2026-08-17' },
  { id: 'nueva', energetica: false, media: null, ultimaVez: null },
  { id: 'macarrones', energetica: true, media: 6.5, ultimaVez: '2026-08-01' },
];

describe('proponer y recomendar', () => {
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

// shared/semana.test.ts (se añade; rs es el de 'proponer y recomendar')
describe('la semana en el calendario', () => {
  it('escribe el rango de la semana, también entre meses y entre años', () => {
    expect(rangoDeFechas('2026-10-26')).toBe('Del 26 oct al 1 nov');
    expect(rangoDeFechas('2026-11-02')).toBe('Del 2 al 8 nov');
    expect(rangoDeFechas('2026-12-28')).toBe('Del 28 dic al 3 ene');
  });
  it('de lunes a jueves abre esta semana y de viernes a domingo la que viene, en hora de Madrid', () => {
    expect(semanaQueSeAbre('2026-10-29')).toBe('esta');
    expect(semanaQueSeAbre('2026-10-30')).toBe('viene');
    expect(semanaQueSeAbre(hoyEnMadrid(new Date('2026-11-01T22:30:00Z')))).toBe('viene'); // domingo, 23:30
    expect(semanaQueSeAbre(hoyEnMadrid(new Date('2026-11-01T23:30:00Z')))).toBe('esta'); // lunes, 00:30
  });
});

describe('repartir con días fuera', () => {
  const platos = [{ id: '1', energetico: true }, { id: '2', energetico: false }];
  it('el domingo en casa entra en el reparto como los demás', () => {
    expect(repartir(platos, ['L', 'X', 'V'], []).D).toBe('2');
    expect(repartir(platos, ['L', 'X', 'V', 'D'], []).D).toBe('1');
  });
  it('un día fuera no lleva plato aunque esté activo', () => {
    expect(repartir(platos, ['L', 'S'], ['S', 'D'])).toMatchObject({ L: '1', S: null, D: null });
  });
});

describe('diasDeLaSemana', () => {
  it('sin nada guardado: L, X y V activos y el domingo fuera', () => {
    const d = diasDeLaSemana('2026-11-02', []);
    expect(d.map((x) => x.activo)).toEqual([true, false, true, false, true, false, false]);
    expect(d.map((x) => x.fuera)).toEqual([false, false, false, false, false, false, true]);
  });
  it('copia cada día de la última semana guardada antes que ella', () => {
    const guardados = [
      { lunes: '2026-10-26', dia: 1, activo: true, fuera: false },
      { lunes: '2026-10-26', dia: 6, activo: false, fuera: false },
      { lunes: '2026-10-19', dia: 1, activo: false, fuera: false },
      { lunes: '2026-11-09', dia: 0, activo: false, fuera: false },
    ];
    const d = diasDeLaSemana('2026-11-02', guardados);
    expect(d[1]).toEqual({ activo: true, fuera: false });
    expect(d[6]).toEqual({ activo: false, fuera: false });
    expect(d[0]).toEqual({ activo: true, fuera: false });
  });
});

describe('ultimaVezPorReceta', () => {
  it('manda lo apuntado; lo planificado cuenta en los días sin apuntar, y solo antes del lunes', () => {
    const comidas = [{ fecha: '2026-10-20', receta_id: 'pisto' }, { fecha: '2026-10-27', receta_id: 'curry' }];
    const planificadas = [{ fecha: '2026-10-20', receta_id: 'lentejas' }, { fecha: '2026-10-22', receta_id: 'lentejas' }];
    const u = ultimaVezPorReceta(comidas, planificadas, '2026-10-26');
    expect(u.get('pisto')).toBe('2026-10-20');
    expect(u.get('lentejas')).toBe('2026-10-22');
    expect(u.has('curry')).toBe(false);
  });
});

describe('proponerHuecos y sugerir', () => {
  it('la energética al hueco 1 y la otra al 2', () => {
    expect(proponerHuecos(rs, '2026-10-26')).toEqual({ '1': 'arroz', '2': 'nueva' });
  });
  it('con un solo tipo llena los dos huecos sin repetir, y sin recetas los deja vacíos', () => {
    expect(proponerHuecos(rs.filter((r) => r.energetica), '2026-10-26')).toEqual({ '1': 'arroz', '2': 'curry' });
    expect(proponerHuecos(rs.filter((r) => !r.energetica), '2026-10-26')).toEqual({ '1': 'pisto', '2': 'nueva' });
    expect(proponerHuecos([], '2026-10-26')).toEqual({ '1': null, '2': null });
  });
  it('sugiere la mejor de cada tipo fuera del menú', () => {
    expect(sugerir(rs, ['arroz', 'nueva'], '2026-10-26').map((r) => r.id)).toEqual(['curry', 'pisto']);
  });
  it('dice cuánto hace con semanas enteras hacia arriba', () => {
    expect(haceCuanto(null, '2026-10-26')).toBe('Por probar');
    expect(haceCuanto('2026-10-23', '2026-10-26')).toBe('Hace 1 semana');
    expect(haceCuanto('2026-09-28', '2026-10-26')).toBe('Hace 4 semanas');
    expect(haceCuanto('2026-09-27', '2026-10-26')).toBe('Hace 5 semanas');
  });
  it('una sugerencia va al hueco de su tipo, si no al vacío, si no al 2', () => {
    expect(huecoDelMismoTipo(false, [{ hueco: '1', energetica: true }, { hueco: '2', energetica: false }])).toBe('2');
    expect(huecoDelMismoTipo(true, [{ hueco: '1', energetica: false }, { hueco: '2', energetica: null }])).toBe('2');
    expect(huecoDelMismoTipo(true, [{ hueco: '1', energetica: false }, { hueco: '2', energetica: false }])).toBe('2');
  });
});

describe('estadoLista', () => {
  it('compara las recetas de la lista con las del menú', () => {
    expect(estadoLista(null, ['a', 'b'])).toBe('pendiente');
    expect(estadoLista('["b","a"]', ['a', 'b'])).toBe('hecha');
    expect(estadoLista('["a","b"]', ['a', 'c'])).toBe('cambiada');
    expect(estadoLista('roto', ['a'])).toBe('cambiada');
  });
});

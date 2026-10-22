import { describe, expect, it } from 'vitest';
import { ingredientesDe, ingredientesGastados, marcarPaso, quitarMarcas, sugerirMarcas, trozos } from './pasos';

const p = [
  'Lava {500 g de lentejas|lentejas} y escúrrelas.',
  'Pica {2 cebollas|cebolla} y {2 dientes de ajo|ajo}.',
  'Sofríe con {aceite|aceite}.',
  'Fríe el ajo con {más aceite|aceite}.',
];

describe('trozos', () => {
  it('separa el texto de las marcas', () => {
    expect(trozos(p[0]!)).toEqual([
      { texto: 'Lava ' },
      { texto: '500 g de lentejas', ingrediente: 'lentejas' },
      { texto: ' y escúrrelas.' },
    ]);
  });

  it('no deja trozos vacíos entre marcas contiguas', () => {
    expect(trozos('{a|x}{b|y}')).toEqual([
      { texto: 'a', ingrediente: 'x' },
      { texto: 'b', ingrediente: 'y' },
    ]);
  });

  it('sin marcas devuelve un solo trozo, y vacío devuelve nada', () => {
    expect(trozos('Mezcla {sin barra} bien')).toEqual([{ texto: 'Mezcla {sin barra} bien' }]);
    expect(trozos('')).toEqual([]);
  });
});

describe('ingredientesDe', () => {
  it('lista los ingredientes en orden y sin repetir', () => {
    expect(ingredientesDe('{a|x} y {b|y} y {c|x}')).toEqual(['x', 'y']);
  });
});

describe('ingredientesGastados', () => {
  it('gasta un ingrediente cuando todos sus pasos están hechos', () => {
    expect(ingredientesGastados(p, new Set([0, 2]))).toEqual(new Set(['lentejas']));
    expect(ingredientesGastados(p, new Set([0, 1, 2, 3]))).toEqual(new Set(['lentejas', 'cebolla', 'ajo', 'aceite']));
  });

  it('ignora índices fuera de la lista', () => {
    expect(ingredientesGastados(p, new Set([9]))).toEqual(new Set());
  });
});

describe('sugerirMarcas', () => {
  const cebolla = [{ id: 'cebolla', nombre: 'Cebolla' }];

  it('encuentra el nombre sin tildes ni mayúsculas', () => {
    expect(sugerirMarcas('Pica la cebolla', cebolla)).toEqual([{ id: 'cebolla', desde: 8, hasta: 15 }]);
  });

  it('mantiene los índices del texto original con tildes antes', () => {
    expect(sugerirMarcas('Sofríe la CEBOLLA', cebolla)).toEqual([{ id: 'cebolla', desde: 10, hasta: 17 }]);
  });

  it('salta lo que ya está dentro de una marca', () => {
    expect(sugerirMarcas('Pica {la cebolla|cebolla} y otra cebolla', cebolla)).toEqual([
      { id: 'cebolla', desde: 33, hasta: 40 },
    ]);
  });

  it('cubre el plural completo', () => {
    expect(sugerirMarcas('Pica 2 cebollas', cebolla)).toEqual([{ id: 'cebolla', desde: 7, hasta: 15 }]);
  });

  it('usa la primera palabra si el nombre entero no aparece', () => {
    expect(sugerirMarcas('Lava las lentejas', [{ id: 'l', nombre: 'Lentejas pardinas' }])).toEqual([
      { id: 'l', desde: 9, hasta: 17 },
    ]);
  });
});

describe('marcarPaso', () => {
  const ings = [
    { id: 'lentejas', nombre: 'Lentejas pardinas' }, { id: 'cebolla', nombre: 'Cebolla' },
    { id: 'pimiento', nombre: 'Pimiento verde' }, { id: 'ajo', nombre: 'Ajo' },
    { id: 'laurel', nombre: 'Laurel' }, { id: 'sal', nombre: 'Sal' }, { id: 'jengibre', nombre: 'Jengibre' },
  ];
  it('marca lo que nombra cada paso con la cantidad que lleva delante', () => {
    expect(marcarPaso('Lava 500 g de lentejas y escúrrelas.', ings)).toBe('Lava {500 g de lentejas|lentejas} y escúrrelas.');
    expect(marcarPaso('Pica 2 cebollas, 1 pimiento verde y 2 dientes de ajo.', ings))
      .toBe('Pica {2 cebollas|cebolla}, {1 pimiento verde|pimiento} y {2 dientes de ajo|ajo}.');
    expect(marcarPaso('Ralla un trozo de jengibre.', ings)).toBe('Ralla {un trozo de jengibre|jengibre}.');
    expect(marcarPaso('Añade la hoja de laurel.', ings)).toBe('Añade la hoja de {laurel|laurel}.');
  });
  it('no confunde la sal con la salsa', () => {
    expect(marcarPaso('Liga la salsa y echa sal.', ings)).toBe('Liga la salsa y echa {sal|sal}.');
  });
  it('no toma por cantidad lo que no lo es', () => {
    expect(marcarPaso('Hornea a 200 °C con las lentejas.', ings)).toBe('Hornea a 200 °C con las {lentejas|lentejas}.');
  });
  it('quitar las marcas devuelve el texto escrito', () => {
    const texto = 'Pica 2 cebollas y sofríe con sal.';
    expect(quitarMarcas(marcarPaso(texto, ings))).toBe(texto);
  });
  it('no deja que unas llaves escritas a mano rompan las marcas', () => {
    expect(marcarPaso('Sala {al gusto} | sal', ings)).toBe('Sala (al gusto) / {sal|sal}');
  });
});

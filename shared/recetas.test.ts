import { describe, expect, it } from 'vitest';
import {
  coincide,
  cortoDe,
  esBasico,
  esEnergetica,
  fraseTipos,
  formatearMinutos,
  leerTipos,
  mediasPorReceta,
  tiposDe,
} from './recetas';

describe('recetas', () => {
  it('saca los tipos de los ingredientes, sin repetir y en su orden', () => {
    expect(tiposDe([{ tipo: 'fibra' }, { tipo: 'hidratos' }, { tipo: null }, { tipo: 'ninguno' }, { tipo: 'hidratos' }])).toEqual(['hidratos', 'fibra']);
    expect(esEnergetica(['hidratos', 'proteína'])).toBe(true);
    expect(esEnergetica(['proteína', 'grasas'])).toBe(false);
  });
  it('escribe los tipos como el prototipo y lee los guardados', () => {
    expect(fraseTipos(['hidratos', 'proteína', 'fibra'])).toBe('Hidratos, proteína y fibra');
    expect(fraseTipos(['proteína'])).toBe('Proteína');
    expect(fraseTipos([])).toBe('');
    expect(leerTipos('["proteína","grasas"]')).toEqual(['proteína', 'grasas']);
    expect(leerTipos('no es json')).toEqual([]);
    expect(leerTipos('["azúcar"]')).toEqual([]);
    expect(leerTipos(null)).toEqual([]);
  });
  it('escribe el tiempo en horas y minutos', () => {
    expect(formatearMinutos(45)).toBe('45 min');
    expect(formatearMinutos(60)).toBe('1 h');
    expect(formatearMinutos(75)).toBe('1 h 15 min');
    expect(formatearMinutos(0)).toBe('');
    expect(formatearMinutos(null)).toBe('');
  });
  it('saca el nombre corto y reconoce los básicos', () => {
    expect(cortoDe('Lentejas estofadas')).toBe('lentejas');
    expect(cortoDe('  Albóndigas en salsa ')).toBe('albóndigas');
    expect(esBasico('Aceite de oliva')).toBe(true);
    expect(esBasico('SAL')).toBe(true);
    expect(esBasico('Salmón')).toBe(false);
  });
  it('busca por plato o ingrediente sin tildes ni mayúsculas', () => {
    const albondigas = { nombre: 'Albóndigas en salsa', ingredientes: ['Carne picada mixta', 'Huevo'] };
    expect(coincide(albondigas, 'albondigas')).toBe(true);
    expect(coincide(albondigas, 'PICADA')).toBe(true);
    expect(coincide(albondigas, 'merluza')).toBe(false);
    expect(coincide(albondigas, '  ')).toBe(true);
  });
  it('hace la media de todas las notas de lo que se comió de cada receta', () => {
    const comidas = [{ id: 'c1', receta_id: 'lentejas' }, { id: 'c2', receta_id: 'lentejas' }, { id: 'c3', receta_id: null }];
    const notas = [{ comida_id: 'c1', valor: 8 }, { comida_id: 'c1', valor: 9 }, { comida_id: 'c2', valor: 7 }, { comida_id: 'c3', valor: 2 }];
    expect(mediasPorReceta(comidas, notas)).toEqual(new Map([['lentejas', 8]]));
  });
});

import { describe, expect, it } from 'vitest';
import { listaDesdeRecetas, type IngredienteParaLista, type RecetaParaLista } from './lista';
import { SECCIONES, seccionDe } from './secciones';

// Recetas inventadas del prototipo (lentejas y merluza).
const ing = (
  nombre: string,
  cantidad: string,
  seccion: IngredienteParaLista['seccion'],
  extra: Partial<IngredienteParaLista> = {},
): IngredienteParaLista => ({ nombre, cantidad, compra: null, aLaLista: true, seccion, ...extra });

const lentejas: RecetaParaLista = {
  corto: 'lentejas',
  ingredientes: [
    ing('Lentejas pardinas', '500 g', 'Despensa'),
    ing('Cebolla', '2', 'Frutería y verdura'),
    ing('Pimiento verde', '1', 'Frutería y verdura'),
    ing('Zanahorias', '3', 'Frutería y verdura'),
    ing('Ajo', '2 dientes', 'Frutería y verdura', { compra: '1 cabeza' }),
    ing('Chorizo', '200 g', 'Carnicería'),
    ing('Aceite de oliva', '3 cucharadas', 'Despensa', { aLaLista: false }),
    ing('Pimentón dulce', '1 cucharadita', 'Despensa', { compra: '1 bote' }),
    ing('Laurel', '1 hoja', 'Despensa', { aLaLista: false }),
    ing('Agua', '1,5 l', 'Despensa', { aLaLista: false }),
    ing('Sal', 'al gusto', 'Despensa', { aLaLista: false }),
  ],
};

const merluza: RecetaParaLista = {
  corto: 'merluza',
  ingredientes: [
    ing('Merluza en rodajas', '1 kg', 'Pescadería'),
    ing('Almejas', '300 g', 'Pescadería'),
    ing('Patatas', '1,5 kg', 'Frutería y verdura'),
    ing('Ajo', '4 dientes', 'Frutería y verdura', { compra: '1 cabeza' }),
    ing('Perejil', '1 manojo', 'Frutería y verdura'),
    ing('Vino blanco', '1 vaso', 'Despensa', { compra: '1 botella' }),
    ing('Harina', '1 cucharada', 'Despensa', { aLaLista: false }),
    ing('Aceite de oliva', '4 cucharadas', 'Despensa', { aLaLista: false }),
    ing('Sal', 'al gusto', 'Despensa', { aLaLista: false }),
  ],
};

describe('listaDesdeRecetas', () => {
  const lineas = listaDesdeRecetas([lentejas, merluza]);

  it('una compra repetida sale una vez y recuerda de qué recetas viene', () => {
    expect(lineas.find((l) => l.nombre === 'Ajo')).toEqual({
      nombre: 'Ajo',
      cantidad: '1 cabeza',
      seccion: 'Frutería y verdura',
      origen: ['lentejas', 'merluza'],
    });
  });

  it('deja fuera lo que no va a la lista', () => {
    expect(lineas.some((l) => ['Sal', 'Aceite de oliva', 'Agua', 'Laurel', 'Harina'].includes(l.nombre))).toBe(false);
  });

  it('usa la compra o suma las cantidades', () => {
    expect(lineas.find((l) => l.nombre === 'Patatas')?.cantidad).toBe('1,5 kg');
    expect(lineas.find((l) => l.nombre === 'Pimentón dulce')?.cantidad).toBe('1 bote');
    expect(lineas.find((l) => l.nombre === 'Vino blanco')?.cantidad).toBe('1 botella');
  });

  it('va ordenada por las secciones del súper', () => {
    expect(lineas.map((l) => l.seccion)).toEqual(
      [...lineas.map((l) => l.seccion)].sort((a, b) => SECCIONES.indexOf(a) - SECCIONES.indexOf(b)),
    );
  });

  it('agrupa por nombre sin mirar mayúsculas y suma', () => {
    const l = listaDesdeRecetas([
      { corto: 'a', ingredientes: [{ nombre: 'cebolla', cantidad: '1', compra: null, aLaLista: true, seccion: 'Frutería y verdura' }] },
      { corto: 'b', ingredientes: [{ nombre: 'Cebolla', cantidad: '2', compra: null, aLaLista: true, seccion: 'Frutería y verdura' }] },
    ]);
    expect(l[0]).toMatchObject({ nombre: 'Cebolla', cantidad: '3', origen: ['a', 'b'] });
  });

  it('se muestra con el texto de la primera aparición, solo con la inicial en mayúscula', () => {
    const l = listaDesdeRecetas([
      { corto: 'a', ingredientes: [ing('  aceite de oliva ', '1 l', 'Despensa'), ing('Pimiento ROJO', '1', 'Frutería y verdura')] },
      { corto: 'b', ingredientes: [ing('Aceite de Oliva', '1 l', 'Despensa')] },
    ]);
    expect(l.map((x) => x.nombre)).toEqual(['Pimiento ROJO', 'Aceite de oliva']);
    expect(l.find((x) => x.nombre === 'Aceite de oliva')?.cantidad).toBe('2 l');
  });
});

describe('seccionDe', () => {
  it('reconoce un nombre conocido sin mirar mayúsculas ni tildes, y el resto es Otros', () => {
    expect(seccionDe('  CAFÉ ')).toBe('Despensa');
    expect(seccionDe('Calabacin')).toBe('Frutería y verdura');
    expect(seccionDe('Pienso para gatos')).toBe('Otros');
  });
});

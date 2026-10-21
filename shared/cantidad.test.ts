import { formatearCantidades, leerCantidad, sumarCantidades } from './cantidad';

const sumar = (...textos: string[]) => formatearCantidades(sumarCantidades(textos.map(leerCantidad)));

describe('cantidades', () => {
  it('lee números con coma, unidades y texto libre', () => {
    expect(leerCantidad('1,5 kg')).toEqual({ valor: 1.5, unidad: 'kg' });
    expect(leerCantidad('500 g')).toEqual({ valor: 500, unidad: 'g' });
    expect(leerCantidad('3')).toEqual({ valor: 3, unidad: '' });
    expect(leerCantidad('2 dientes')).toEqual({ valor: 2, unidad: 'dientes' });
    expect(leerCantidad('al gusto')).toEqual({ valor: null, unidad: 'al gusto' });
  });

  it('suma unidades compatibles y deja juntas las que no', () => {
    const s = sumarCantidades(['1 kg', '500 g', '2 dientes', '1 cabeza', '3', '2'].map(leerCantidad));
    expect(formatearCantidades(s)).toBe('1,5 kg + 2 dientes + 1 cabeza + 5');
    expect(formatearCantidades(sumarCantidades(['750 ml', '500 ml'].map(leerCantidad)))).toBe('1,25 l');
    expect(formatearCantidades(sumarCantidades(['al gusto', '200 g'].map(leerCantidad)))).toBe('200 g');
  });

  it('acepta coma o punto decimal y espacios sobrantes', () => {
    expect(leerCantidad('1.5 kg')).toEqual({ valor: 1.5, unidad: 'kg' });
    expect(leerCantidad('  2,5   KG ')).toEqual({ valor: 2.5, unidad: 'KG' });
    expect(sumar('1 KG', '500 g')).toBe('1,5 kg');
  });

  it('trata el texto sin número, vacío o con fracción como texto', () => {
    expect(leerCantidad('   ')).toEqual({ valor: null, unidad: '' });
    expect(leerCantidad('1/2 taza')).toEqual({ valor: null, unidad: '1/2 taza' });
    expect(sumar('', '200 g', '  ')).toBe('200 g');
    expect(sumar('', '')).toBe('');
  });

  it('conserva cada texto una vez si ninguna cantidad tiene valor', () => {
    expect(sumar('al gusto', 'al gusto')).toBe('al gusto');
    expect(sumar('al gusto', 'una pizca', 'al gusto')).toBe('al gusto + una pizca');
  });

  it('muestra g o ml bajo 1000 y sin ruido decimal', () => {
    expect(sumar('125 g')).toBe('125 g');
    expect(sumar('1000 g')).toBe('1 kg');
    expect(sumar('999 ml')).toBe('999 ml');
    expect(sumar('0,1 g', '0,2 g')).toBe('0,3 g');
    expect(formatearCantidades([])).toBe('');
  });
});

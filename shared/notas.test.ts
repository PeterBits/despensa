import { describe, expect, it } from 'vitest';
import { formatearNota, media } from './notas';

describe('notas', () => {
  it('formatea la media con coma y una cifra', () => {
    expect(media([8, 7])).toBe(7.5);
    expect(formatearNota(7.5)).toBe('7,5');
    expect(formatearNota(8)).toBe('8');
    expect(formatearNota(7.333)).toBe('7,3');
    expect(media([])).toBeNull();
  });
});

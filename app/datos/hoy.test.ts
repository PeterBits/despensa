import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHoy } from './hoy';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

// Este fichero no usa Dexie ni Testing Library asíncrono: puede falsear también los temporizadores.
beforeEach(() => vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] }));
afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(document, 'visibilityState');
});

const visible = (estado: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => estado });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useHoy', () => {
  it('cambia a medianoche de Madrid aunque la pantalla siga abierta', () => {
    vi.setSystemTime(new Date('2026-11-01T22:59:30Z')); // domingo, 23:59:30 en Madrid
    const { result } = renderHook(() => useHoy());
    expect(result.current).toBe('2026-11-01');
    act(() => vi.advanceTimersByTime(29_000));
    expect(result.current).toBe('2026-11-01');
    act(() => vi.advanceTimersByTime(2_000));
    expect(result.current).toBe('2026-11-02');
  });

  it('el día que se atrasa la hora dura 25 horas y no cambia antes de tiempo', () => {
    vi.setSystemTime(new Date('2026-10-24T22:30:00Z')); // domingo 25, 00:30 en Madrid
    const { result } = renderHook(() => useHoy());
    act(() => vi.advanceTimersByTime(24 * HORA));
    expect(result.current).toBe('2026-10-25');
    act(() => vi.advanceTimersByTime(31 * MINUTO));
    expect(result.current).toBe('2026-10-26');
  });

  it('el día que se adelanta la hora dura 23 horas y no cambia tarde', () => {
    vi.setSystemTime(new Date('2026-03-28T23:30:00Z')); // domingo 29, 00:30 en Madrid
    const { result } = renderHook(() => useHoy());
    act(() => vi.advanceTimersByTime(22 * HORA + 29 * MINUTO));
    expect(result.current).toBe('2026-03-29');
    act(() => vi.advanceTimersByTime(2 * MINUTO));
    expect(result.current).toBe('2026-03-30');
  });

  it('al volver a la app se pone al día, sin esperar a medianoche', () => {
    vi.setSystemTime(new Date('2026-10-30T10:00:00+01:00'));
    const { result } = renderHook(() => useHoy());
    // Con la app en segundo plano, el iPhone congela los temporizadores: la fecha avanza sin que salten.
    vi.setSystemTime(new Date('2026-11-02T08:00:00+01:00'));
    act(() => visible('hidden'));
    expect(result.current).toBe('2026-10-30');
    act(() => visible('visible'));
    expect(result.current).toBe('2026-11-02');
  });

  it('al desmontar no deja temporizadores ni escucha', () => {
    vi.setSystemTime(new Date('2026-10-30T10:00:00+01:00'));
    const quitar = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useHoy());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(quitar).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});

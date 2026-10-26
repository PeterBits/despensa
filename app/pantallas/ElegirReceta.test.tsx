import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirCopia, copia } from '../datos/local';
import { guardarReceta } from '../datos/recetas';
import { RECETAS_DE_EJEMPLO } from '../datos/semilla';
import { leerSemana } from '../datos/semana';
import { escribir } from '../datos/sync';
import { ElegirReceta } from './ElegirReceta';

const VIERNES = '2026-10-30T10:00:00+01:00';

// Cada prueba abre la copia de un hogar nuevo, con la fecha fija (solo `Date`: Dexie y Testing Library usan timers).
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(VIERNES));
  abrirCopia(crypto.randomUUID());
  for (const clave of ['lentejas', 'merluza', 'arroz', 'pisto']) {
    await guardarReceta(RECETAS_DE_EJEMPLO.find((r) => r.id === `ejemplo-${clave}`)!);
  }
  await escribir('comida', { id: 'c-arroz', fecha: '2026-10-20', receta_id: 'ejemplo-arroz' });
  await escribir('comida', { id: 'c-lentejas', fecha: '2026-09-28', receta_id: 'ejemplo-lentejas' });
  await escribir('comida', { id: 'c-pisto', fecha: '2026-10-05', receta_id: 'ejemplo-pisto' });
});
afterEach(() => vi.useRealTimers());

const Ubicacion = () => {
  const { pathname, search } = useLocation();
  return <p data-testid="ubicacion">{pathname + search}</p>;
};

type Entrada = string | { pathname: string; state: unknown };

const pintar = (entradas: Entrada[], indice?: number) =>
  render(
    <MemoryRouter initialEntries={entradas} initialIndex={indice}>
      <Routes>
        <Route path="/semana" element={<p>Semana de prueba</p>} />
        <Route path="/semana/elegir/:lunes/:hueco" element={<ElegirReceta />} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  );

describe('ElegirReceta', () => {
  it('la receta del hueco se ofrece como contexto y la búsqueda filtra el resto', async () => {
    pintar(['/semana/elegir/2026-11-02/1']);
    expect(await screen.findByRole('heading', { level: 1, name: 'Elegir receta' })).toBeInTheDocument();
    expect(screen.getByText(/En lugar de/)).toHaveTextContent('Lentejas estofadas');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Todas/ })).toHaveTextContent('2');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar receta' }), 'pisto');
    expect(screen.getByRole('heading', { level: 2, name: /Resultados/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /Pisto con huevo/ })).toBeInTheDocument();
  });

  it('sin venir de Semana, elegir escribe el plato y reemplaza la ruta por La que viene', async () => {
    pintar(['/semana/elegir/2026-11-02/1']);
    await userEvent.click(await screen.findByRole('button', { name: /Pisto con huevo/ }));
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/semana?ver=viene'));
    expect((await leerSemana('2026-11-02')).menu[0]?.receta?.id).toBe('ejemplo-pisto');
  });

  it('sin venir de Semana, Cancelar vuelve a La que viene', async () => {
    pintar(['/semana/elegir/2026-11-02/2']);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent('/semana?ver=viene'));
  });

  // Solo se planifica la semana que viene: una dirección vieja o tocada no escribe en otra semana.
  it.each([
    ['el lunes de esta semana', '2026-10-26'],
    ['un martes', '2026-11-03'],
    ['el lunes de dentro de dos semanas', '2026-11-09'],
  ])('%s redirige a Semana sin escribir nada', async (_, lunes) => {
    pintar([`/semana/elegir/${lunes}/1`]);
    expect(await screen.findByText('Semana de prueba')).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/semana$/);
    expect((await copia().cola.toArray()).filter((o) => o.tabla.startsWith('semana'))).toEqual([]);
  });

  it('viniendo de Semana, Cancelar vuelve atrás', async () => {
    pintar(['/semana', { pathname: '/semana/elegir/2026-11-02/1', state: { desde: 'semana' } }], 1);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/semana$/));
    expect(screen.getByText('Semana de prueba')).toBeInTheDocument();
  });

  it('un hueco que no es 1 ni 2 redirige a Semana', async () => {
    pintar(['/semana/elegir/2026-11-02/3']);
    expect(await screen.findByText('Semana de prueba')).toBeInTheDocument();
  });

  it.each(['2026-02-31', '2026-02-32', '2026-13-01', '2026-00-10'])('un lunes imposible (%s) redirige a Semana', async (lunes) => {
    pintar([`/semana/elegir/${lunes}/1`]);
    expect(await screen.findByText('Semana de prueba')).toBeInTheDocument();
  });
});

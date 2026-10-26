import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirCopia } from '../datos/local';
import { borrarReceta, guardarReceta } from '../datos/recetas';
import { RECETAS_DE_EJEMPLO } from '../datos/semilla';
import { ponerPlato } from '../datos/semana';
import { escribir } from '../datos/sync';
import { Semana } from './Semana';

const VIERNES = '2026-10-30T10:00:00+01:00';

async function sembrar(): Promise<void> {
  for (const clave of ['lentejas', 'merluza', 'arroz', 'pisto']) {
    await guardarReceta(RECETAS_DE_EJEMPLO.find((r) => r.id === `ejemplo-${clave}`)!);
  }
  await escribir('comida', { id: 'c-arroz', fecha: '2026-10-20', receta_id: 'ejemplo-arroz' });
  await escribir('comida', { id: 'c-lentejas', fecha: '2026-09-28', receta_id: 'ejemplo-lentejas' });
  await escribir('comida', { id: 'c-pisto', fecha: '2026-10-05', receta_id: 'ejemplo-pisto' });
}

// Cada prueba abre la copia de un hogar nuevo, con la fecha fija (solo `Date`: Dexie y Testing Library usan timers).
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(VIERNES));
  abrirCopia(crypto.randomUUID());
  await sembrar();
});
afterEach(() => vi.useRealTimers());

const Ubicacion = () => {
  const { pathname, search } = useLocation();
  return <p data-testid="ubicacion">{pathname + search}</p>;
};

const pintar = (ruta = '/semana') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/semana" element={<Semana />} />
        <Route path="/lista" element={<p>Lista de prueba</p>} />
        <Route path="/recetas/nueva" element={<p>Nueva receta de prueba</p>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  );

// Los dos paneles llevan platos con los mismos nombres: cada fila se busca en el suyo.
const filaEn = (panel: string, nombre: string) =>
  within(document.getElementById(panel)!).getByText(nombre).closest('li');
const fila = (nombre: string) => filaEn('p-viene', nombre);

describe('Semana, la que viene', () => {
  it('el viernes abre La que viene con la propuesta', async () => {
    pintar();
    expect(await screen.findByRole('heading', { level: 1, name: 'Del 2 al 8 nov' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'La que viene' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'lunes 2, activo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'domingo 8, fuera' })).toBeDisabled();
    expect(fila('Lentejas estofadas')).toHaveTextContent(/estofadas\s*L · X · V/);
    expect(fila('Lentejas estofadas')).toHaveTextContent('va a los días activos');
    expect(fila('Merluza en salsa verde')).toHaveTextContent(/verde\s*M · J · S/);
  });

  it('tocar un día recoloca los platos', async () => {
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'martes 3' }));
    await waitFor(() => expect(fila('Lentejas estofadas')).toHaveTextContent(/estofadas\s*L · M · X · V/));
    expect(fila('Merluza en salsa verde')).toHaveTextContent(/verde\s*J · S/);
  });

  it('el domingo se puede comer en casa y volver a comer fuera', async () => {
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Comer en casa el domingo' }));
    await waitFor(() => expect(fila('Merluza en salsa verde')).toHaveTextContent(/verde\s*M · J · S · D/));
    await userEvent.click(screen.getByRole('button', { name: 'Comer fuera el domingo' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'domingo 8, fuera' })).toBeDisabled());
  });

  it('cambiar por una sugerencia tacha el plato y deja deshacer', async () => {
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar por lentejas' }));
    await waitFor(() => expect(fila('Arroz con pollo')).toHaveTextContent(/En lugar de\s*Lentejas estofadas/));
    await userEvent.click(within(fila('Arroz con pollo')!).getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(fila('Lentejas estofadas')).not.toHaveTextContent('En lugar de'));
  });

  it('con movimiento reducido el cambio se aplica sin trazo', async () => {
    vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: consulta.includes('reduce'), media: consulta }));
    try {
      pintar();
      await userEvent.click(await screen.findByRole('button', { name: 'Cambiar por lentejas' }));
      expect(document.querySelector('.striking')).toBeNull();
      await waitFor(() => expect(fila('Arroz con pollo')).toHaveTextContent(/En lugar de\s*Lentejas estofadas/));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('hacer la lista cambia el botón; cambiar un plato pide actualizarla y cambiar un día no', async () => {
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Hacer la lista de la compra' }));
    expect(await screen.findByText(/^Lista hecha con \d+ productos$/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver la lista' })).toHaveAttribute('href', '/lista');
    await userEvent.click(screen.getByRole('button', { name: 'martes 3' }));
    await waitFor(() => expect(fila('Lentejas estofadas')).toHaveTextContent(/L · M · X · V/));
    expect(screen.getByRole('link', { name: 'Ver la lista' })).toBeInTheDocument();
    expect(screen.queryByText('Has cambiado el menú desde que hiciste la lista')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar por lentejas' }));
    expect(await screen.findByText('Has cambiado el menú desde que hiciste la lista')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar la lista de la compra' })).toBeInTheDocument();
  });

  it('sin recetas lo dice y lleva a crear una', async () => {
    abrirCopia(crypto.randomUUID());
    pintar();
    expect(await screen.findByText(/Todavía no hay recetas/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva receta' })).toHaveAttribute('href', '/recetas/nueva');
    expect(screen.queryByRole('button', { name: /la lista de la compra/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver la lista' })).not.toBeInTheDocument();
  });

  it('una receta borrada deja "Sin plato" con sus días', async () => {
    await ponerPlato('2026-11-02', '2', 'ejemplo-pisto');
    await borrarReceta('ejemplo-pisto');
    pintar();
    const sin = await screen.findByText('Sin plato');
    expect(sin.closest('li')).toHaveTextContent(/Sin plato\s*M · J · S/);
  });

  it('una sugerencia sin notas dice "Por probar", sin puntos ni cifra', async () => {
    // Copia aparte: lentejas y arroz con comidas, albóndigas sin ninguna.
    abrirCopia(crypto.randomUUID());
    for (const clave of ['lentejas', 'merluza', 'arroz', 'albondigas']) {
      await guardarReceta(RECETAS_DE_EJEMPLO.find((r) => r.id === `ejemplo-${clave}`)!);
    }
    await escribir('comida', { id: 'c-merluza', fecha: '2026-10-20', receta_id: 'ejemplo-merluza' });
    await escribir('comida', { id: 'c-arroz', fecha: '2026-10-21', receta_id: 'ejemplo-arroz' });
    await escribir('comida', { id: 'c-lentejas', fecha: '2026-09-28', receta_id: 'ejemplo-lentejas' });
    // Con la merluza fija en el menú, las albóndigas quedan como la sugerencia sin notas.
    await ponerPlato('2026-11-02', '2', 'ejemplo-merluza');
    pintar();
    await screen.findByRole('heading', { name: 'Hace tiempo que no coméis' });
    const li = within(document.querySelector<HTMLElement>('.sug')!).getByText('Albóndigas en salsa').closest('li')!;
    expect(li).toHaveTextContent('Por probar');
    expect(li.querySelector('.leader')).toBeNull();
    expect(li.querySelector('.fig')).toBeNull();
  });

  it('el domingo a las 23:30 abre La que viene y el lunes a las 00:30 Esta semana', async () => {
    vi.setSystemTime(new Date('2026-11-01T22:30:00Z'));
    const primero = pintar();
    expect(await screen.findByRole('heading', { level: 1, name: 'Del 2 al 8 nov' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'La que viene' })).toHaveAttribute('aria-selected', 'true');
    primero.unmount();

    vi.setSystemTime(new Date('2026-11-01T23:30:00Z'));
    pintar();
    expect(await screen.findByRole('heading', { level: 1, name: 'Del 2 al 8 nov' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Esta semana' })).toHaveAttribute('aria-selected', 'true');
  });

  it('el segmento elegido queda en la dirección', async () => {
    const primero = pintar();
    await userEvent.click(await screen.findByRole('tab', { name: 'Esta semana' }));
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/semana?ver=esta');
    expect(screen.getByRole('tab', { name: 'Esta semana' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'Del 26 oct al 1 nov' })).toBeInTheDocument();
    primero.unmount();

    vi.setSystemTime(new Date('2026-10-29T10:00:00+01:00'));
    pintar('/semana?ver=viene');
    expect(await screen.findByRole('tab', { name: 'La que viene' })).toHaveAttribute('aria-selected', 'true');
    await act(async () => {});
  });
});

describe('Semana, esta semana', () => {
  beforeEach(async () => {
    await ponerPlato('2026-10-26', '1', 'ejemplo-lentejas');
    await ponerPlato('2026-10-26', '2', 'ejemplo-merluza');
  });

  it('un miércoles abre Esta semana con lo que toca hoy y los días pasados tachados', async () => {
    vi.setSystemTime(new Date('2026-10-28T10:00:00+01:00'));
    pintar();
    expect(await screen.findByRole('heading', { level: 1, name: 'Del 26 oct al 1 nov' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Esta semana' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Hoy toca/)).toHaveTextContent('Hoy toca lentejas estofadas');
    expect(screen.getByRole('img', { name: 'lunes 26, activo' })).toHaveClass('past');
    expect(screen.getByRole('img', { name: 'miércoles 28, activo' })).toHaveClass('is-today');
    expect(screen.getByRole('img', { name: 'jueves 29' })).not.toHaveClass('past');
    expect(screen.queryByRole('button', { name: /lista de la compra/ })).not.toBeInTheDocument();
    const lentejas = filaEn('p-esta', 'Lentejas estofadas')!;
    expect(lentejas.querySelector('.dl.past')).toHaveTextContent('L');
    expect(lentejas.querySelectorAll('.dl.past')).toHaveLength(1);
    const merluza = filaEn('p-esta', 'Merluza en salsa verde')!;
    expect(merluza).toHaveTextContent(/verde\s*M · J · S/);
    expect(merluza.querySelectorAll('.dl.past')).toHaveLength(1);
    // Es de solo lectura: sin sugerencias ni acciones sobre los platos.
    expect(document.getElementById('p-esta')!.querySelector('button, a')).toBeNull();
  });

  it('el domingo de esta semana se come fuera', async () => {
    vi.setSystemTime(new Date('2026-11-01T12:00:00+01:00'));
    pintar('/semana?ver=esta');
    expect(await screen.findByText('Hoy coméis fuera')).toBeInTheDocument();
    const domingo = within(document.getElementById('p-esta')!).getByText('Domingo').closest('li')!;
    expect(domingo).toHaveTextContent(/Domingo\s*fuera/);
    expect(screen.getByRole('img', { name: 'domingo 1, fuera' })).toHaveClass('is-today');
  });

  it('un hueco vacío enseña "Sin plato" con sus días y sin acciones, y hoy no dice nada', async () => {
    await borrarReceta('ejemplo-merluza');
    vi.setSystemTime(new Date('2026-10-29T10:00:00+01:00'));
    pintar('/semana?ver=esta');
    await screen.findByRole('heading', { level: 1, name: 'Del 26 oct al 1 nov' });
    const esta = within(document.getElementById('p-esta')!);
    expect(esta.queryByText(/Hoy toca/)).not.toBeInTheDocument();
    expect(esta.queryByText(/Hoy coméis fuera/)).not.toBeInTheDocument();
    expect(esta.getByText('Sin plato').closest('li')).toHaveTextContent(/Sin plato\s*M · J · S/);
    expect(esta.getByText('Sin plato').closest('li')!.querySelector('button, a')).toBeNull();
  });
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, type InitialEntry } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LineaEstado } from '../componentes/LineaEstado';
import { ponerAviso } from '../datos/avisos';
import { abrirCopia } from '../datos/local';
import { guardarProgreso, leerProgreso } from '../datos/progreso';
import { borradorVacio, guardarReceta } from '../datos/recetas';
import { Receta } from './Receta';

let recetaId = '';

// Cada prueba abre la copia de un hogar nuevo y no hereda progreso ni avisos de la anterior.
beforeEach(async () => {
  abrirCopia(crypto.randomUUID());
  ponerAviso(null);
  localStorage.clear();
  window.scrollTo = vi.fn();

  const b = { ...borradorVacio(), nombre: 'Lentejas estofadas', raciones: 6, minutos: 60 };
  b.ingredientes = [
    { id: 'i1', nombre: 'Lentejas pardinas', cantidad: '500 g', tipo: 'hidratos', seccion: 'Otros', aLaLista: true, compra: '' },
    { id: 'i2', nombre: 'Sal', cantidad: '', tipo: null, seccion: 'Otros', aLaLista: true, compra: '' },
  ];
  b.pasos = [
    { id: 'p1', texto: 'Lava 500 g de lentejas.', minutos: null },
    { id: 'p2', texto: 'Cuece las lentejas con sal.', minutos: 40 },
  ];
  recetaId = b.id;
  await guardarReceta(b);
});

afterEach(() => {
  delete (navigator as { wakeLock?: unknown }).wakeLock;
});

const pintar = (entrada: InitialEntry = `/recetas/${recetaId}`, extra?: { initialIndex: number; entradas: InitialEntry[] }) =>
  render(
    <MemoryRouter initialEntries={extra?.entradas ?? [entrada]} initialIndex={extra?.initialIndex}>
      <Routes>
        <Route path="/recetas" element={<p>Índice de prueba</p>} />
        <Route path="/recetas/:id" element={<Receta />} />
      </Routes>
      <LineaEstado />
    </MemoryRouter>,
  );

const paso = (n: number) => screen.findByRole('button', { name: new RegExp(`Paso ${n}`) });

describe('Receta', () => {
  it('tachar el último paso que usa un ingrediente lo tacha arriba', async () => {
    pintar();
    await userEvent.click(await paso(1));
    expect(screen.getByText('Lentejas pardinas').closest('li')).not.toHaveClass('used');
    await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
    expect(screen.getByText('Lentejas pardinas').closest('li')).toHaveClass('used');
    expect(screen.getByText('Sal').closest('li')).toHaveClass('used');
    expect(screen.getByRole('heading', { name: /Pasos/ })).toHaveTextContent('2 de 2');
    expect(screen.getByText(/Receta terminada/)).toBeInTheDocument();
  });

  it('destachar un paso devuelve el ingrediente a la lista', async () => {
    pintar();
    await userEvent.click(await paso(1));
    await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
    await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
    expect(screen.getByText('Sal').closest('li')).not.toHaveClass('used');
    expect(screen.getByRole('button', { name: /Paso 2/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/Receta terminada/)).not.toBeInTheDocument();
  });

  it('marca el paso actual', async () => {
    pintar();
    const uno = await paso(1);
    const dos = screen.getByRole('button', { name: /Paso 2/ });
    expect(uno).toHaveAttribute('aria-current', 'step');
    expect(dos).not.toHaveAttribute('aria-current');
    await userEvent.click(uno);
    expect(uno).toHaveAttribute('aria-pressed', 'true');
    expect(uno).toHaveClass('done');
    expect(uno).not.toHaveAttribute('aria-current');
    expect(dos).toHaveAttribute('aria-current', 'step');
  });

  it('enseña la cabecera, las cantidades en negrita y el tiempo de cada paso', async () => {
    pintar();
    expect(await screen.findByRole('heading', { level: 1, name: 'Lentejas estofadas' })).toBeInTheDocument();
    expect(screen.getByText('Hidratos · 6 raciones · 1 h')).toBeInTheDocument();
    expect((await paso(1)).querySelector('b')).toHaveTextContent('500 g de lentejas');
    expect(screen.getByRole('button', { name: /Paso 2/ })).toHaveTextContent('40 min');
    expect(screen.getByRole('button', { name: /Paso 1/ }).querySelector('.time')).toBeNull();
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', `/recetas/${recetaId}/editar`);
  });

  it('empezar de nuevo se puede deshacer', async () => {
    pintar();
    await userEvent.click(await paso(1));
    await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));

    expect(screen.getByRole('button', { name: /Paso 1/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Paso 2/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Progreso borrado/)).toBeInTheDocument();
    expect(leerProgreso(recetaId)).toEqual(new Set());

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Paso 1/ })).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('button', { name: /Paso 2/ })).toHaveAttribute('aria-pressed', 'true');
    expect(leerProgreso(recetaId)).toEqual(new Set(['p1', 'p2']));
  });

  it('el aviso de empezar de nuevo se retira al tocar cualquier paso', async () => {
    pintar();
    await userEvent.click(await paso(1));
    await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));
    expect(screen.getByText(/Progreso borrado/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Paso 1/ }));
    expect(screen.queryByText(/Progreso borrado/)).not.toBeInTheDocument();
  });

  it('recuerda el progreso al volver a abrir la receta', async () => {
    const primera = pintar();
    await userEvent.click(await paso(1));
    primera.unmount();
    pintar();
    expect(await paso(1)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Paso 2/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('un paso que ya no existe no cuenta en el progreso', async () => {
    guardarProgreso(recetaId, new Set(['paso-borrado', 'p1']));
    pintar();
    expect(await screen.findByRole('heading', { name: /Pasos/ })).toHaveTextContent('1 de 2');
    expect(screen.queryByText(/Receta terminada/)).not.toBeInTheDocument();
  });

  it('una receta borrada enseña que ya no existe', async () => {
    pintar('/recetas/no-esta');
    expect(await screen.findByText('Esta receta ya no existe.')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Recetas' })).toHaveAttribute('href', '/recetas');
  });

  it('"Recetas" vuelve atrás si se vino del índice', async () => {
    pintar(undefined, {
      entradas: ['/recetas', { pathname: `/recetas/${recetaId}`, state: { desde: 'indice' } }],
      initialIndex: 1,
    });
    await userEvent.click(within(await screen.findByRole('main')).getByRole('button', { name: 'Recetas' }));
    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();
  });

  it('"Recetas" va al índice si no se vino de él', async () => {
    pintar();
    await userEvent.click(within(await screen.findByRole('main')).getByRole('button', { name: 'Recetas' }));
    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();
  });

  it('pide que la pantalla no se apague mientras está abierta', async () => {
    const bloqueo = { release: vi.fn().mockResolvedValue(undefined), addEventListener: vi.fn() };
    const request = vi.fn().mockResolvedValue(bloqueo);
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });

    const { unmount } = pintar();
    expect(await screen.findByText('La pantalla no se apagará mientras cocináis')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('screen');
    expect(bloqueo.release).not.toHaveBeenCalled();
    unmount();
    expect(bloqueo.release).toHaveBeenCalledTimes(1);
  });

  it('sin wakeLock no enseña la línea de pantalla encendida', async () => {
    pintar();
    await paso(1);
    expect(screen.queryByText(/La pantalla no se apagará/)).not.toBeInTheDocument();
  });
});

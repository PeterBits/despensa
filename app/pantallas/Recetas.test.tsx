import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LineaEstado } from '../componentes/LineaEstado';
import { ponerAviso } from '../datos/avisos';
import { abrirCopia } from '../datos/local';
import { borradorVacio, guardarReceta, type BorradorReceta } from '../datos/recetas';
import { escribir } from '../datos/sync';
import { Recetas } from './Recetas';

// Cada prueba abre la copia de un hogar nuevo, que empieza vacía y sin cola.
beforeEach(() => {
  abrirCopia(crypto.randomUUID());
  ponerAviso(null);
});

function receta(nombre: string, ingredientes: { nombre: string; tipo: 'hidratos' | 'proteína' | null }[]): BorradorReceta {
  const b = { ...borradorVacio(), nombre, minutos: 40 };
  b.ingredientes = ingredientes.map((i) => ({
    id: crypto.randomUUID(),
    nombre: i.nombre,
    cantidad: '',
    tipo: i.tipo,
    seccion: 'Otros',
    aLaLista: true,
    compra: '',
  }));
  b.pasos = [];
  return b;
}

async function sembrar(): Promise<void> {
  const merluza = receta('Merluza en salsa verde', [{ nombre: 'Merluza', tipo: 'proteína' }]);
  const lentejas = receta('Lentejas estofadas', [{ nombre: 'Lentejas pardinas', tipo: 'hidratos' }]);
  await guardarReceta(merluza);
  await guardarReceta(lentejas);
  await escribir('comida', { id: 'c1', fecha: '2026-10-19', receta_id: lentejas.id });
  await escribir('nota', { id: 'n1', comida_id: 'c1', valor: 8 });
}

const pintar = () =>
  render(
    <MemoryRouter initialEntries={['/recetas']}>
      <Recetas />
    </MemoryRouter>,
  );

describe('Recetas', () => {
  it('lista las recetas por nombre con su nota, y sin nota no pinta cifra', async () => {
    await sembrar();
    pintar();
    const lentejas = await screen.findByRole('link', { name: /Lentejas estofadas/ });
    expect(lentejas).toHaveAttribute('href', expect.stringMatching(/^\/recetas\/.+/));
    expect(lentejas).toHaveTextContent(/nota\s*8/);
    expect(screen.getByRole('link', { name: /Merluza/ })).not.toHaveTextContent(/nota/);
    expect(screen.getByRole('heading', { name: /Todas/ })).toHaveTextContent('2');
    // Con recetas, "Nueva receta" vive en la fila de arriba y es la única.
    expect(screen.getAllByRole('link', { name: 'Nueva receta' })).toHaveLength(1);
  });

  it('busca por ingrediente y dice cuando no hay ninguna', async () => {
    await sembrar();
    const usuario = userEvent.setup();
    pintar();
    const buscador = await screen.findByRole('searchbox', { name: 'Buscar receta' });

    await usuario.type(buscador, 'pardinas');
    expect(screen.getByRole('heading', { name: /Resultados/ })).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Lentejas estofadas/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Merluza/ })).not.toBeInTheDocument();

    await usuario.clear(buscador);
    await usuario.type(buscador, 'xyz');
    expect(screen.getByRole('heading', { name: /Resultados/ })).toHaveTextContent('0');
    expect(screen.getByText('Ninguna receta coincide con «xyz».')).toBeInTheDocument();
  });

  it('con el recetario vacío ofrece crear la primera', async () => {
    pintar();
    expect(await screen.findByRole('link', { name: 'Nueva receta' })).toHaveAttribute('href', '/recetas/nueva');
    expect(
      screen.getByText(
        'Todavía no hay recetas. Empezad por una que cocinéis a menudo: con dos o tres ya se puede planificar la semana.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nueva receta' })).toHaveLength(1);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});

// Una sola LineaEstado fuera de las rutas, como en Rutas: ve todos los cambios de ruta.
function pintarAvisos(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route
          path="*"
          element={
            <nav>
              <Link to="/recetas">ir a recetas</Link>
              <Link to="/lista">ir a lista</Link>
            </nav>
          }
        />
      </Routes>
      <LineaEstado />
    </MemoryRouter>,
  );
}

describe('LineaEstado', () => {
  it('el aviso con deshacer se queda hasta usarlo', async () => {
    const deshacer = vi.fn();
    const usuario = userEvent.setup();
    pintarAvisos('/recetas');
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();

    act(() => ponerAviso({ texto: 'Receta borrada', deshacer, en: '/recetas' }));
    expect(await screen.findByText(/Receta borrada/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(deshacer).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();
  });

  it('un aviso puesto para /recetas justo antes de navegar allí se ve', async () => {
    const usuario = userEvent.setup();
    pintarAvisos('/lista');
    act(() => ponerAviso({ texto: 'Receta borrada', deshacer: vi.fn(), en: '/recetas' }));
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('link', { name: 'ir a recetas' }));
    expect(await screen.findByText(/Receta borrada/)).toBeInTheDocument();
  });

  it('se retira al cambiar de ruta y no vuelve al regresar', async () => {
    const usuario = userEvent.setup();
    pintarAvisos('/recetas');
    act(() => ponerAviso({ texto: 'Receta borrada', deshacer: vi.fn(), en: '/recetas' }));
    expect(await screen.findByText(/Receta borrada/)).toBeInTheDocument();

    await usuario.click(screen.getByRole('link', { name: 'ir a lista' }));
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('link', { name: 'ir a recetas' }));
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();
  });

  it('no enseña el aviso de otra ruta', async () => {
    pintarAvisos('/lista');
    act(() => ponerAviso({ texto: 'Receta borrada', deshacer: vi.fn(), en: '/recetas' }));
    // Se espera a que el almacén y los efectos se asienten antes de comprobar la ausencia.
    await act(async () => {});
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();
  });
});

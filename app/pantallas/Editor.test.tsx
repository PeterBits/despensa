import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FilaDe } from '../../shared/esquema';
import { LineaEstado } from '../componentes/LineaEstado';
import { ponerAviso } from '../datos/avisos';
import { subirFoto } from '../datos/fotos';
import { abrirCopia, copia } from '../datos/local';
import { borradorVacio, guardarReceta, ingredienteVacio } from '../datos/recetas';
import { Editor } from './Editor';

// La subida se sustituye; urlFoto sigue siendo la de verdad.
vi.mock('../datos/fotos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../datos/fotos')>()),
  subirFoto: vi.fn(),
}));

// Cada prueba abre la copia de un hogar nuevo, que empieza vacía y sin cola, y sin avisos de la anterior.
beforeEach(() => {
  abrirCopia(crypto.randomUUID());
  ponerAviso(null);
  vi.mocked(subirFoto).mockReset();
});

function Ubicacion() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacion">{pathname}</output>;
}

const pintar = (entradas: InitialEntry[] = ['/recetas/nueva'], indice?: number) =>
  render(
    <MemoryRouter initialEntries={entradas} initialIndex={indice}>
      <Routes>
        <Route path="/recetas" element={<p>Índice de prueba</p>} />
        <Route path="/recetas/nueva" element={<Editor />} />
        <Route path="/recetas/:id" element={<p>Vista de prueba</p>} />
        <Route path="/recetas/:id/editar" element={<Editor />} />
      </Routes>
      <Ubicacion />
      <LineaEstado />
    </MemoryRouter>,
  );

// Abre el editor de una receta guardada, viniendo de su vista.
const pintarEdicion = (id: string) => pintar([`/recetas/${id}`, `/recetas/${id}/editar`], 1);

async function guardarLentejas(): Promise<string> {
  const b = { ...borradorVacio(), nombre: 'Lentejas estofadas', raciones: 6, minutos: 60 };
  b.ingredientes = [
    { ...ingredienteVacio(), id: 'i1', nombre: 'Lentejas pardinas', cantidad: '500 g', tipo: 'hidratos', seccion: 'Despensa' },
    { ...ingredienteVacio(), id: 'i2', nombre: 'Sal', cantidad: 'al gusto', seccion: 'Despensa', aLaLista: false },
  ];
  b.pasos = [{ id: 'p1', texto: 'Lava 500 g de lentejas.', minutos: null }];
  await guardarReceta(b);
  return b.id;
}

const parte = (nombre: 'Receta' | 'Ingredientes' | 'Pasos') => screen.getByRole('tab', { name: nombre });

describe('Editor', () => {
  // Escribe letra a letra unos 60 caracteres: solo tarda unos 2 s, pero con toda la suite en paralelo
  // pasaba a veces de los 5 s por defecto, y lo que quedaba por escribir caía en la prueba siguiente.
  it('crea una receta y abre su vista', { timeout: 15_000 }, async () => {
    const usuario = userEvent.setup();
    pintar();
    expect(screen.getByRole('heading', { level: 1, name: 'Nueva receta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Borrar receta' })).not.toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Nombre'), 'Lentejas estofadas');

    await usuario.click(parte('Ingredientes'));
    await usuario.type(screen.getByLabelText('Ingrediente 1'), 'Lentejas pardinas');
    await usuario.type(screen.getByLabelText('Cantidad del ingrediente 1'), '500 g');
    const hidratos = within(screen.getByRole('group', { name: 'Tipo del ingrediente 1' })).getByRole('button', {
      name: 'Hidratos',
    });
    await usuario.click(hidratos);
    expect(hidratos).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Hidratos: plato energético, irá a los días activos.')).toBeInTheDocument();

    await usuario.click(parte('Pasos'));
    await usuario.type(screen.getByLabelText('Paso 1'), 'Lava 500 g de lentejas.');
    expect(screen.getByLabelText('Paso 1')).toHaveAccessibleDescription('Usa: Lentejas pardinas');

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Vista de prueba')).toBeInTheDocument();
    const id = screen.getByTestId('ubicacion').textContent!.split('/')[2]!;

    expect(await copia().receta.toArray()).toEqual([
      expect.objectContaining({ id, nombre: 'Lentejas estofadas', tipos: '["hidratos"]' }),
    ]);
    const ingredientes = (await copia().ingrediente.where('receta_id').equals(id).toArray()) as FilaDe<'ingrediente'>[];
    expect(ingredientes).toEqual([
      expect.objectContaining({ nombre: 'Lentejas pardinas', cantidad: '500 g', tipo: 'hidratos', seccion: 'Despensa', a_la_lista: 1 }),
    ]);
    expect(await copia().paso.where('receta_id').equals(id).toArray()).toEqual([
      expect.objectContaining({ texto: `Lava {500 g de lentejas|${ingredientes[0]!.id}}.` }),
    ]);
  });

  it('propone la sección y si va a la lista al escribir el ingrediente', async () => {
    const usuario = userEvent.setup();
    pintar();
    await usuario.click(parte('Ingredientes'));
    await usuario.type(screen.getByLabelText('Ingrediente 1'), 'Sal');
    expect(screen.getByLabelText('Sección del ingrediente 1')).toHaveValue('Despensa');
    expect(screen.getByLabelText('No va a la lista')).toBeChecked();

    // Una vez tocado a mano, el nombre ya no lo cambia.
    await usuario.click(screen.getByRole('button', { name: /más opciones de Sal/ }));
    await usuario.click(screen.getByRole('switch', { name: 'No va a la lista' }));
    await usuario.type(screen.getByLabelText('Ingrediente 1'), 'món');
    expect(screen.getByLabelText('No va a la lista')).not.toBeChecked();
    expect(screen.getByLabelText('Sección del ingrediente 1')).toHaveValue('Despensa');
    expect(screen.getByRole('button', { name: /más opciones de Salmón/ })).toHaveTextContent(/Despensa · va a la lista/);
  });

  it('sin nombre no guarda y lo dice', async () => {
    const usuario = userEvent.setup();
    pintar();
    await usuario.click(parte('Pasos'));
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(parte('Receta')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Ponle nombre a la receta.')).toBeVisible();
    const nombre = screen.getByLabelText('Nombre');
    expect(nombre).toHaveFocus();
    expect(nombre).toHaveAttribute('aria-invalid', 'true');
    expect(nombre).toHaveAccessibleDescription('Ponle nombre a la receta.');
    expect(await copia().cola.count()).toBe(0);
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/recetas/nueva');

    // El error se retira al escribir.
    await usuario.type(nombre, 'L');
    expect(screen.getByText('Ponle nombre a la receta.')).not.toBeVisible();
    expect(nombre).not.toHaveAttribute('aria-invalid');
  });

  it('editar conserva los ids y quitar un ingrediente lo borra', async () => {
    const id = await guardarLentejas();
    const usuario = userEvent.setup();
    pintarEdicion(id);
    expect(await screen.findByLabelText('Nombre')).toHaveValue('Lentejas estofadas');
    expect(screen.getByRole('heading', { level: 1, name: 'Editar receta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Raciones')).toHaveValue('6');
    expect(screen.getByLabelText('Tiempo en minutos')).toHaveValue('60');

    await usuario.click(parte('Ingredientes'));
    expect(screen.getByLabelText('Ingrediente 2')).toHaveValue('Sal');
    await usuario.click(screen.getByRole('button', { name: 'Quitar ingrediente 2' }));
    // Era el último: el foco pasa a "Añadir ingrediente".
    expect(screen.getByRole('button', { name: 'Añadir ingrediente' })).toHaveFocus();
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    // Al editar, Guardar vuelve a la vista de la que se vino.
    expect(await screen.findByText('Vista de prueba')).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(new RegExp(`^/recetas/${id}$`));
    await waitFor(async () => expect(await copia().ingrediente.get('i2')).toBeUndefined());
    expect(await copia().ingrediente.get('i1')).toMatchObject({ id: 'i1', receta_id: id, orden: 0 });
    expect(await copia().paso.get('p1')).toMatchObject({ id: 'p1', texto: 'Lava {500 g de lentejas|i1}.' });
  });

  it('quitar un ingrediente se puede deshacer', async () => {
    const id = await guardarLentejas();
    const usuario = userEvent.setup();
    pintarEdicion(id);
    await screen.findByLabelText('Nombre');
    await usuario.click(parte('Ingredientes'));
    await usuario.click(screen.getByRole('button', { name: 'Quitar ingrediente 1' }));

    expect(screen.getByLabelText('Ingrediente 1')).toHaveValue('Sal');
    expect(screen.queryByLabelText('Ingrediente 2')).not.toBeInTheDocument();
    // El foco no cae al body: pasa al "Quitar" del bloque que ocupa su sitio.
    expect(screen.getByRole('button', { name: 'Quitar ingrediente 1' })).toHaveFocus();
    // Sin barra de pestañas, la línea de estado va abajo del todo.
    expect(screen.getByText(/Ingrediente quitado/).closest('.dock')).toHaveClass('abajo');

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    // Vuelve a su sitio, no al final.
    await waitFor(() => expect(screen.getByLabelText('Ingrediente 1')).toHaveValue('Lentejas pardinas'));
    expect(screen.getByLabelText('Ingrediente 2')).toHaveValue('Sal');
    expect(screen.queryByText(/Ingrediente quitado/)).not.toBeInTheDocument();
    // "Deshacer" desaparece: el foco pasa al "Quitar" del bloque que vuelve.
    expect(screen.getByRole('button', { name: 'Quitar ingrediente 1' })).toHaveFocus();

    // Quitar y deshacer deja la receta como estaba: Cancelar sale sin preguntar.
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Vista de prueba')).toBeInTheDocument();
  });

  it('quitar un paso deja deshacer hasta la siguiente acción', async () => {
    const usuario = userEvent.setup();
    pintar();
    await usuario.click(parte('Pasos'));
    await usuario.type(screen.getByLabelText('Paso 1'), 'Lava las lentejas.');
    await usuario.click(screen.getByRole('button', { name: 'Añadir paso' }));
    expect(screen.getByLabelText('Paso 2')).toHaveFocus();
    await usuario.type(screen.getByLabelText('Paso 2'), 'Cuécelas.');

    await usuario.click(screen.getByRole('button', { name: 'Quitar paso 1' }));
    expect(screen.getByLabelText('Paso 1')).toHaveValue('Cuécelas.');
    expect(screen.getByRole('button', { name: 'Quitar paso 1' })).toHaveFocus();
    expect(screen.getByText(/Paso quitado/)).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Minutos del paso 1'), '40');
    expect(screen.queryByText(/Paso quitado/)).not.toBeInTheDocument();
  });

  it('cancelar sin cambios vuelve atrás', async () => {
    const usuario = userEvent.setup();
    pintar(['/recetas', '/recetas/nueva'], 1);
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();
  });

  it('cancelar con cambios pide descartarlos', async () => {
    const usuario = userEvent.setup();
    pintar(['/recetas', '/recetas/nueva'], 1);
    await usuario.type(screen.getByLabelText('Nombre'), 'Lentejas');
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Hay cambios sin guardar.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Descartar cambios' })).toHaveFocus();
    // "Seguir editando" lo cierra y devuelve el foco a Cancelar.
    await usuario.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(screen.getByText('Hay cambios sin guardar.')).not.toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    await usuario.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();
    expect(await copia().cola.count()).toBe(0);
    expect(await copia().receta.count()).toBe(0);
  });

  it('borrar la receta vuelve al índice con un aviso que deshace', async () => {
    const id = await guardarLentejas();
    const usuario = userEvent.setup();
    pintarEdicion(id);
    await usuario.click(await screen.findByRole('button', { name: 'Borrar receta' }));

    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();
    const aviso = screen.getByText(/Receta borrada/);
    // En el índice, la línea de estado queda sobre la barra de pestañas.
    expect(aviso.closest('.dock')).not.toHaveClass('abajo');
    expect(await copia().receta.get(id)).toBeUndefined();

    await usuario.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect(await copia().receta.get(id)).toMatchObject({ nombre: 'Lentejas estofadas' }));
    expect(await copia().ingrediente.where('receta_id').equals(id).count()).toBe(2);
    expect(screen.queryByText(/Receta borrada/)).not.toBeInTheDocument();
  });

  it('la foto se sube al elegirla y se puede quitar', async () => {
    let terminar: (id: string) => void = () => {};
    vi.mocked(subirFoto).mockImplementation(
      () =>
        new Promise<string>((resolver) => {
          terminar = resolver;
        }),
    );
    const usuario = userEvent.setup();
    const { container } = pintar();
    const archivo = new File(['foto'], 'lentejas.jpg', { type: 'image/jpeg' });

    await usuario.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, archivo);
    expect(subirFoto).toHaveBeenCalledWith(archivo);
    expect(screen.getByText('Subiendo la foto…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Añadir foto' })).not.toBeInTheDocument();
    // La foto que se está subiendo ya cuenta como cambio: Cancelar pregunta.
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('Hay cambios sin guardar.')).toBeVisible();
    await usuario.click(screen.getByRole('button', { name: 'Seguir editando' }));

    await act(async () => terminar('f1'));
    expect(container.querySelector('.hueco img')).toHaveAttribute('src', '/api/fotos/f1');
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument();
    expect(screen.queryByText('Subiendo la foto…')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Quitar foto' }));
    expect(container.querySelector('.hueco img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Añadir foto' })).toBeInTheDocument();
  });

  it('descartar mientras Guardar espera a la foto no guarda nada', async () => {
    let terminar: (id: string) => void = () => {};
    vi.mocked(subirFoto).mockImplementation(
      () =>
        new Promise<string>((resolver) => {
          terminar = resolver;
        }),
    );
    const usuario = userEvent.setup();
    const { container } = pintar(['/recetas', '/recetas/nueva'], 1);
    await usuario.type(screen.getByLabelText('Nombre'), 'Lentejas estofadas');
    await usuario.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['foto'], 'lentejas.jpg', { type: 'image/jpeg' }),
    );

    await usuario.click(parte('Pasos'));
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    // Guardar espera a la foto a la vista: vuelve a Receta, donde se ve la subida, y queda ocupado.
    expect(parte('Receta')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Subiendo la foto…')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('aria-busy', 'true');

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));
    await usuario.click(screen.getByRole('button', { name: 'Descartar cambios' }));
    expect(await screen.findByText('Índice de prueba')).toBeInTheDocument();

    // La foto termina de subir después: el Guardar que esperaba no escribe ni vuelve a navegar.
    await act(async () => {
      terminar('f1');
      await new Promise((resolver) => setTimeout(resolver, 50));
    });
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/recetas$/);
    expect(screen.getByText('Índice de prueba')).toBeInTheDocument();
    expect(await copia().receta.count()).toBe(0);
    expect(await copia().cola.count()).toBe(0);
  });

  it('lo escrito mientras Guardar espera a la foto también se guarda', async () => {
    let terminar: (id: string) => void = () => {};
    vi.mocked(subirFoto).mockImplementation(
      () =>
        new Promise<string>((resolver) => {
          terminar = resolver;
        }),
    );
    const usuario = userEvent.setup();
    const { container } = pintar();
    await usuario.type(screen.getByLabelText('Nombre'), 'Lentejas');
    await usuario.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['foto'], 'lentejas.jpg', { type: 'image/jpeg' }),
    );
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    // Un segundo toque mientras espera no guarda dos veces.
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    await usuario.type(screen.getByLabelText('Nombre'), ' estofadas');

    await act(async () => terminar('f1'));
    expect(await screen.findByText('Vista de prueba')).toBeInTheDocument();
    expect(await copia().receta.toArray()).toEqual([
      expect.objectContaining({ nombre: 'Lentejas estofadas', foto_key: 'f1' }),
    ]);
  });

  it('si la foto no sube, dice por qué', async () => {
    vi.mocked(subirFoto).mockRejectedValue(new Error('No se pudo leer la foto. Prueba con otra.'));
    const usuario = userEvent.setup();
    const { container } = pintar();

    await usuario.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      new File(['foto'], 'lentejas.jpg', { type: 'image/jpeg' }),
    );
    expect(await screen.findByText('No se pudo leer la foto. Prueba con otra.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir foto' })).toBeInTheDocument();
    expect(container.querySelector('.hueco img')).toBeNull();
  });

  it('las partes se recorren con las flechas', async () => {
    const usuario = userEvent.setup();
    pintar();
    expect(parte('Receta')).toHaveAttribute('tabindex', '0');
    expect(parte('Pasos')).toHaveAttribute('tabindex', '-1');

    await usuario.click(parte('Receta'));
    await usuario.keyboard('{ArrowRight}');
    expect(parte('Ingredientes')).toHaveFocus();
    expect(parte('Ingredientes')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Ingredientes' })).toBeVisible();

    await usuario.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(parte('Pasos')).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Pasos' })).toBeVisible();
  });

  it('una receta que no existe lo dice', async () => {
    pintar(['/recetas/no-esta/editar']);
    expect(await screen.findByRole('heading', { level: 1, name: 'Esta receta ya no existe.' })).toBeInTheDocument();
  });
});

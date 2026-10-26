import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirCopia, copia } from '../datos/local';
import { guardarReceta } from '../datos/recetas';
import { RECETAS_DE_EJEMPLO } from '../datos/semilla';
import { Ajustes } from './Ajustes';

const ENLACE = 'http://localhost:5173/invitacion#abc';
const CADUCA = '2026-10-27T10:00:00.000Z';
const SIN_RED = 'No hay conexión. Inténtalo otra vez.';

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

// Un fetch falso por ruta que apunta a qué se llamó y en qué orden; sin red, todo lanza.
function servidor({ miembros = 1, sinRed = false }: { miembros?: number; sinRed?: boolean } = {}) {
  const llamadas: string[] = [];
  vi.stubGlobal('fetch', async (url: RequestInfo | URL) => {
    const ruta = String(url).split('?')[0]!;
    llamadas.push(ruta);
    if (sinRed) throw new TypeError('offline');
    if (ruta === '/api/yo') return json(200, { miembroId: 'm1', hogarId: 'h1', miembros });
    if (ruta === '/api/invitaciones') return json(201, { enlace: ENLACE, caduca: CADUCA });
    if (ruta === '/api/ops') return json(200, { version: 1 });
    if (ruta === '/api/cambios') return json(200, { version: 1 });
    if (ruta === '/api/salir') return json(200, { ok: true });
    return json(404, { error: 'No existe.' });
  });
  return llamadas;
}

const ponerNavigator = (nombre: 'share' | 'clipboard', valor: unknown) =>
  Object.defineProperty(navigator, nombre, { configurable: true, value: valor });

const pintar = (alSalir = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={['/semana/ajustes']}>
      <Routes>
        <Route path="/semana" element={<p>Semana de prueba</p>} />
        <Route path="/semana/ajustes" element={<Ajustes alSalir={alSalir} />} />
      </Routes>
    </MemoryRouter>,
  );
  return alSalir;
};

beforeEach(() => abrirCopia(crypto.randomUUID()));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('Ajustes', () => {
  it('con una sola persona invita y comparte el enlace', async () => {
    servidor();
    const share = vi.fn().mockResolvedValue(undefined);
    ponerNavigator('share', share);
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    expect(share).toHaveBeenCalledWith({ title: 'Despensa', text: 'Te invito a nuestra Despensa.', url: ENLACE });
    expect(await screen.findByText('Invitación lista. Vale 24 horas y una sola vez.')).toBeInTheDocument();
  });

  it('sin hoja de compartir copia el enlace', async () => {
    servidor();
    const writeText = vi.fn().mockResolvedValue(undefined);
    ponerNavigator('clipboard', { writeText });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    expect(await screen.findByText('Enlace copiado. Vale 24 horas y una sola vez.')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(ENLACE);
  });

  it('si la hoja de compartir falla de otra forma, copia el enlace', async () => {
    servidor();
    ponerNavigator('share', vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')));
    const writeText = vi.fn().mockResolvedValue(undefined);
    ponerNavigator('clipboard', { writeText });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    expect(await screen.findByText('Enlace copiado. Vale 24 horas y una sola vez.')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(ENLACE);
  });

  it('si se cancela la hoja no dice nada', async () => {
    servidor();
    ponerNavigator('share', vi.fn().mockRejectedValue(new DOMException('', 'AbortError')));
    const writeText = vi.fn().mockResolvedValue(undefined);
    ponerNavigator('clipboard', { writeText });
    pintar();
    const boton = await screen.findByRole('button', { name: 'Invitar a tu pareja' });
    await userEvent.click(boton);
    await vi.waitFor(() => expect(boton).not.toHaveAttribute('aria-disabled', 'true'));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText(/Vale 24 horas/)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('sin hoja ni portapapeles enseña el enlace para copiarlo a mano', async () => {
    servidor();
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    const campo = await screen.findByRole('textbox', { name: 'Enlace de invitación' });
    expect(campo).toHaveValue(ENLACE);
    expect(campo).toHaveAttribute('readonly');
    expect(campo).toHaveFocus();
    expect(screen.getByText('Vale 24 horas y una sola vez.')).toBeInTheDocument();
  });

  it('nunca escribe el enlace en la consola', async () => {
    servidor();
    const consola = [vi.spyOn(console, 'log'), vi.spyOn(console, 'debug'), vi.spyOn(console, 'error')];
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    await screen.findByRole('textbox', { name: 'Enlace de invitación' });
    for (const espia of consola) expect(JSON.stringify(espia.mock.calls)).not.toContain('abc');
  });

  it('sin red al invitar lo dice con la frase de enviar', async () => {
    servidor({ sinRed: true });
    pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(SIN_RED);
  });

  it('con los dos dentro no ofrece invitar', async () => {
    servidor({ miembros: 2 });
    pintar();
    expect(await screen.findByText('Ya estáis los dos en este hogar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Invitar a tu pareja' })).not.toBeInTheDocument();
  });

  it('cerrar sesión envía lo pendiente y sale', async () => {
    const llamadas = servidor();
    await guardarReceta(RECETAS_DE_EJEMPLO[0]!);
    expect(await copia().cola.count()).toBeGreaterThan(0);
    const alSalir = pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await vi.waitFor(() => expect(alSalir).toHaveBeenCalledTimes(1));
    expect(llamadas.indexOf('/api/ops')).toBeGreaterThan(-1);
    expect(llamadas.indexOf('/api/ops')).toBeLessThan(llamadas.indexOf('/api/salir'));
    expect(await copia().cola.count()).toBe(0);
  });

  it('sin red no cierra la sesión y lo dice', async () => {
    servidor({ sinRed: true });
    await guardarReceta(RECETAS_DE_EJEMPLO[0]!);
    const alSalir = pintar();
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(SIN_RED);
    expect(alSalir).not.toHaveBeenCalled();
  });

  it('enseña la versión y vuelve a Semana', async () => {
    servidor();
    pintar();
    expect(await screen.findByText('Versión 0.3.0')).toBeInTheDocument();
    const volver = within(screen.getByRole('main')).getByRole('link', { name: 'Semana' });
    expect(volver).toHaveAttribute('href', '/semana');
    await userEvent.click(volver);
    expect(await screen.findByText('Semana de prueba')).toBeInTheDocument();
  });
});

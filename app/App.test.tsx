import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Rutas } from './App';
import { copia } from './datos/local';

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('abre la copia del hogar y vuelve a la bienvenida si la sincronización recibe un 401', async () => {
  vi.stubGlobal('fetch', async (url: RequestInfo | URL) => {
    const ruta = String(url);
    if (ruta === '/api/yo') return json(200, { miembroId: 'm1', hogarId: 'h1', miembros: 2 });
    if (ruta === '/api/cambios?desde=0') return json(401, { error: 'Entra con tu passkey para seguir.' });
    return json(404, { error: 'Ruta no prevista.' });
  });
  render(<MemoryRouter initialEntries={['/semana']}><Rutas /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Despensa' })).toBeInTheDocument();
  expect(copia().name).toBe('despensa-h1');
  await waitFor(() => expect(localStorage.getItem('despensa.sesion')).toBeNull());
});

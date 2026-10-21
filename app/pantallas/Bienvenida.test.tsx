import { startRegistration } from '@simplewebauthn/browser';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Rutas } from '../App';
import { Bienvenida } from './Bienvenida';
import { Invitacion } from './Invitacion';

vi.mock('@simplewebauthn/browser', () => ({ startRegistration: vi.fn(), startAuthentication: vi.fn() }));

// Servidor falso: cada ruta responde lo que diga el test; una ruta no prevista, 404.
const servidor = {
  respuestas: new Map<string, { estado: number; cuerpo: unknown }>(),
  peticiones: [] as string[],
  responde(ruta: string, estado: number, cuerpo: unknown) {
    servidor.respuestas.set(ruta, { estado, cuerpo });
  },
};

beforeEach(() => {
  servidor.respuestas.clear();
  servidor.peticiones = [];
  vi.stubGlobal('fetch', async (url: RequestInfo | URL) => {
    const ruta = String(url);
    servidor.peticiones.push(ruta);
    const { estado, cuerpo } = servidor.respuestas.get(ruta) ?? { estado: 404, cuerpo: { error: 'Ruta no prevista.' } };
    return new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Invitación', () => {
  it('muestra el error del servidor si la invitación ya no vale', async () => {
    servidor.responde('/api/invitaciones/aceptar/opciones', 410, { error: 'Esta invitación ya no vale. Pide otra.' });
    render(<MemoryRouter initialEntries={['/invitacion#tok']}><Invitacion /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar con Face ID' }));
    expect(await screen.findByText('Esta invitación ya no vale. Pide otra.')).toBeInTheDocument();
  });

  it('sin token en el enlace, la da por caducada sin preguntar al servidor', () => {
    render(<MemoryRouter initialEntries={['/invitacion']}><Invitacion /></MemoryRouter>);
    expect(screen.getByText('Esta invitación ya no vale. Pide otra.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entrar con Face ID' })).not.toBeInTheDocument();
    expect(servidor.peticiones).toEqual([]);
  });
});

describe('Bienvenida', () => {
  it('avisa si Face ID se cancela', async () => {
    servidor.responde('/api/hogar/opciones', 200, { retoId: 'reto-1', opciones: { challenge: 'reto' } });
    vi.mocked(startRegistration).mockRejectedValueOnce(new DOMException('Cancelado.', 'NotAllowedError'));
    render(<Bienvenida />);
    await userEvent.click(screen.getByRole('button', { name: 'Crear nuestro hogar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo usar Face ID. Vuelve a intentarlo.');
  });
});

describe('Entrada a la app', () => {
  it('sin sesión, cualquier ruta lleva a la bienvenida', async () => {
    servidor.responde('/api/yo', 401, { error: 'Entra con tu passkey para seguir.' });
    render(<MemoryRouter initialEntries={['/semana']}><Rutas /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Despensa' })).toBeInTheDocument();
  });

  it('con sesión, la bienvenida lleva a la semana', async () => {
    servidor.responde('/api/yo', 200, { miembroId: 'miembro-1', hogarId: 'hogar-1', miembros: 2 });
    render(<MemoryRouter initialEntries={['/bienvenida']}><Rutas /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Semana' })).toBeInTheDocument();
  });
});

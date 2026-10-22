import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { Rutas } from '../App';
import { Bienvenida } from './Bienvenida';
import { Invitacion } from './Invitacion';

vi.mock('@simplewebauthn/browser', () => ({ startRegistration: vi.fn(), startAuthentication: vi.fn() }));

// Datos inventados: ni las opciones ni la respuesta se parecen a una passkey real.
const OPCIONES = { challenge: 'reto' };
const RESPUESTA = { id: 'credencial-1' } as unknown as Awaited<ReturnType<typeof startRegistration>>;
const RESPUESTA_ENTRADA = { id: 'credencial-1' } as unknown as Awaited<ReturnType<typeof startAuthentication>>;
const SIN_SESION = { error: 'Entra con tu passkey para seguir.' };

// Servidor falso: cada ruta responde lo que diga el test; una ruta no prevista, 404.
// Una ruta que "no responde" no contesta nunca: solo falla si se aborta la petición, como un fetch real.
type Respuesta = { estado: number; cuerpo: unknown } | 'nunca';
const servidor = {
  respuestas: new Map<string, Respuesta>(),
  peticiones: [] as { ruta: string; cuerpo?: unknown }[],
  responde(ruta: string, estado: number, cuerpo: unknown) {
    servidor.respuestas.set(ruta, { estado, cuerpo });
  },
  noResponde(ruta: string) {
    servidor.respuestas.set(ruta, 'nunca');
  },
  cuerpo(ruta: string) {
    return servidor.peticiones.findLast((p) => p.ruta === ruta)?.cuerpo;
  },
};

beforeEach(() => {
  servidor.respuestas.clear();
  servidor.peticiones = [];
  localStorage.clear();
  vi.stubGlobal('fetch', async (url: RequestInfo | URL, init?: RequestInit) => {
    const ruta = String(url);
    servidor.peticiones.push({ ruta, cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined });
    const respuesta = servidor.respuestas.get(ruta) ?? { estado: 404, cuerpo: { error: 'Ruta no prevista.' } };
    if (respuesta === 'nunca') {
      return new Promise<Response>((_, rechazar) => {
        init?.signal?.addEventListener('abort', () => rechazar(init.signal?.reason));
      });
    }
    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.estado,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

// Tras la ceremonia, el servidor ya reconoce la sesión: /api/yo deja de dar 401.
const iniciaSesion = () => servidor.responde('/api/yo', 200, { miembroId: 'miembro-1', hogarId: 'hogar-1', miembros: 1 });

// Enseña la ruta en la que está el router, con su hash.
function Ubicacion() {
  const { pathname, hash } = useLocation();
  return <p>{pathname + hash}</p>;
}

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

  it('quita el token de la URL nada más leerlo', () => {
    window.history.replaceState(null, '', '/invitacion#tok');
    render(
      <MemoryRouter initialEntries={['/invitacion#tok']}>
        <Invitacion />
        <Ubicacion />
      </MemoryRouter>,
    );
    expect(screen.getByText('/invitacion')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('si el hogar ya está completo, no deja reintentar y lleva el foco al título', async () => {
    servidor.responde('/api/invitaciones/aceptar/opciones', 409, { error: 'Este hogar ya tiene dos personas.' });
    render(<MemoryRouter initialEntries={['/invitacion#tok']}><Invitacion /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar con Face ID' }));
    expect(await screen.findByRole('heading', { name: 'Este hogar ya tiene dos personas.' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Entrar con Face ID' })).not.toBeInTheDocument();
  });

  it('si ya no vale, "Entrar con mi passkey" entra y lleva a la semana', async () => {
    servidor.responde('/api/yo', 401, SIN_SESION);
    servidor.responde('/api/invitaciones/aceptar/opciones', 410, { error: 'Esta invitación ya no vale. Pide otra.' });
    servidor.responde('/api/entrar/opciones', 200, { retoId: 'reto-3', opciones: OPCIONES });
    servidor.responde('/api/entrar', 200, { ok: true });
    vi.mocked(startAuthentication).mockImplementationOnce(async () => {
      iniciaSesion();
      return RESPUESTA_ENTRADA;
    });
    render(<MemoryRouter initialEntries={['/invitacion#tok']}><Rutas /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar con Face ID' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar con mi passkey' }));
    expect(await screen.findByRole('heading', { name: 'Semana' })).toBeInTheDocument();
    expect(servidor.cuerpo('/api/entrar')).toEqual({ retoId: 'reto-3', respuesta: RESPUESTA_ENTRADA });
  });

  it('si entrar falla tras un 410, la invitación sigue sin valer y se ve el error', async () => {
    servidor.responde('/api/invitaciones/aceptar/opciones', 410, { error: 'Esta invitación ya no vale. Pide otra.' });
    servidor.responde('/api/entrar/opciones', 200, { retoId: 'reto-3', opciones: OPCIONES });
    vi.mocked(startAuthentication).mockRejectedValueOnce(new DOMException('Cancelado.', 'NotAllowedError'));
    render(<MemoryRouter initialEntries={['/invitacion#tok']}><Invitacion /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar con Face ID' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar con mi passkey' }));
    expect(await screen.findByText('No se pudo usar Face ID. Vuelve a intentarlo.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Esta invitación ya no vale. Pide otra.' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entrar con Face ID' })).not.toBeInTheDocument();
  });

  it('al aceptar con Face ID, lleva a la semana', async () => {
    servidor.responde('/api/yo', 401, SIN_SESION);
    servidor.responde('/api/invitaciones/aceptar/opciones', 200, { retoId: 'reto-2', opciones: OPCIONES });
    servidor.responde('/api/invitaciones/aceptar', 201, { ok: true });
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      iniciaSesion();
      return RESPUESTA;
    });
    render(<MemoryRouter initialEntries={['/invitacion#tok']}><Rutas /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar con Face ID' }));
    expect(await screen.findByRole('heading', { name: 'Semana' })).toBeInTheDocument();
    expect(servidor.cuerpo('/api/invitaciones/aceptar')).toEqual({ token: 'tok', retoId: 'reto-2', respuesta: RESPUESTA });
  });
});

describe('Bienvenida', () => {
  it('avisa si Face ID se cancela', async () => {
    servidor.responde('/api/hogar/opciones', 200, { retoId: 'reto-1', opciones: OPCIONES });
    vi.mocked(startRegistration).mockRejectedValueOnce(new DOMException('Cancelado.', 'NotAllowedError'));
    render(<Bienvenida />);
    await userEvent.click(screen.getByRole('button', { name: 'Crear nuestro hogar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo usar Face ID. Vuelve a intentarlo.');
  });

  it('al crear el hogar, lleva a la semana', async () => {
    servidor.responde('/api/yo', 401, SIN_SESION);
    servidor.responde('/api/hogar/opciones', 200, { retoId: 'reto-1', opciones: OPCIONES });
    servidor.responde('/api/hogar', 201, { ok: true });
    vi.mocked(startRegistration).mockImplementationOnce(async () => {
      iniciaSesion();
      return RESPUESTA;
    });
    render(<MemoryRouter initialEntries={['/bienvenida']}><Rutas /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: 'Crear nuestro hogar' }));
    expect(await screen.findByRole('heading', { name: 'Semana' })).toBeInTheDocument();
    expect(servidor.cuerpo('/api/hogar')).toEqual({ retoId: 'reto-1', respuesta: RESPUESTA });
  });

  it('un doble toque en "Crear nuestro hogar" lanza una sola ceremonia', async () => {
    servidor.responde('/api/hogar/opciones', 200, { retoId: 'reto-1', opciones: OPCIONES });
    vi.mocked(startRegistration).mockReturnValueOnce(new Promise(() => {}));
    render(<Bienvenida />);
    await userEvent.dblClick(screen.getByRole('button', { name: 'Crear nuestro hogar' }));
    await waitFor(() => expect(startRegistration).toHaveBeenCalledTimes(1));
    expect(servidor.peticiones.filter((p) => p.ruta === '/api/hogar/opciones')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Ya tengo cuenta: entrar' })).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('Entrada a la app', () => {
  it('sin sesión, cualquier ruta lleva a la bienvenida', async () => {
    servidor.responde('/api/yo', 401, SIN_SESION);
    render(<MemoryRouter initialEntries={['/semana']}><Rutas /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Despensa' })).toBeInTheDocument();
  });

  it('con sesión, la bienvenida lleva a la semana', async () => {
    servidor.responde('/api/yo', 200, { miembroId: 'miembro-1', hogarId: 'hogar-1', miembros: 2 });
    render(<MemoryRouter initialEntries={['/bienvenida']}><Rutas /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Semana' })).toBeInTheDocument();
  });

  it('si /api/yo no responde en 4 s, abre la app', async () => {
    vi.useFakeTimers();
    // Lo guardado en una visita anterior: sin respuesta no se puede saber más.
    localStorage.setItem('despensa.sesion', JSON.stringify({ hogarId: 'hogar-1', miembroId: 'miembro-1' }));
    servidor.noResponde('/api/yo');
    const { container } = render(<MemoryRouter initialEntries={['/semana']}><Rutas /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
    await act(() => vi.advanceTimersByTimeAsync(4000));
    expect(screen.getByRole('heading', { name: 'Semana' })).toBeInTheDocument();
  });
});

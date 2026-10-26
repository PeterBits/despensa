import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirCopia, copia } from './local';
import { iniciarSincronizacion } from './sincronizacion';
import { escribir } from './sync';

type Llamada = { url: string; cuerpo?: { ops: { id: string; tabla: string; fila: { id: string } }[] } };

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });

// Fetcher falso: apunta las llamadas y responde con lo que decida `responder`.
function falso(responder: (llamada: Llamada) => Response | Promise<Response>) {
  const llamadas: Llamada[] = [];
  const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
    const llamada: Llamada = { url: String(url), cuerpo: init?.body ? JSON.parse(String(init.body)) : undefined };
    llamadas.push(llamada);
    return responder(llamada);
  };
  return { fetcher: fetcher as typeof fetch, llamadas };
}

const normal = ({ url }: Llamada) =>
  url === '/api/ops' ? json(200, { version: 1 }) : json(200, { version: 1, filas: {} });
const rutas = (llamadas: Llamada[]) => llamadas.map((l) => l.url);
const opsEnviadas = (llamadas: Llamada[]) =>
  llamadas.filter((l) => l.url === '/api/ops').flatMap((l) => l.cuerpo?.ops ?? []);
const cambios = (llamadas: Llamada[]) => llamadas.filter((l) => l.url.startsWith('/api/cambios')).length;
const pasar = (ms: number) => new Promise((r) => setTimeout(r, ms));

let parar: (() => void) | undefined;
beforeEach(() => {
  abrirCopia(crypto.randomUUID());
});
afterEach(() => {
  parar?.();
  parar = undefined;
  vi.restoreAllMocks();
});

describe('iniciarSincronizacion', () => {
  it('sincroniza al empezar y otra vez cuando se escribe', async () => {
    const { fetcher, llamadas } = falso(normal);
    parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
    await vi.waitFor(() => expect(rutas(llamadas)).toContain('/api/cambios?desde=0'));
    await escribir('receta', { id: 'r1', nombre: 'Lentejas estofadas' });
    await vi.waitFor(() => expect(opsEnviadas(llamadas)).toEqual([expect.objectContaining({ tabla: 'receta' })]));
  });

  it('vuelve a sincronizar al volver a primer plano y al recuperar la red', async () => {
    const { fetcher, llamadas } = falso(normal);
    parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
    await vi.waitFor(() => expect(cambios(llamadas)).toBe(1));
    const visibilidad = vi.spyOn(document, 'visibilityState', 'get');
    visibilidad.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(cambios(llamadas)).toBe(2));
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(cambios(llamadas)).toBe(3));
    // En segundo plano no sincroniza.
    visibilidad.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    await pasar(50);
    expect(cambios(llamadas)).toBe(3);
  });

  it('un fallo de red no se reintenta en bucle', async () => {
    const llamadas: string[] = [];
    const fetcher = (async (url: RequestInfo | URL) => {
      llamadas.push(String(url));
      throw new TypeError('offline');
    }) as typeof fetch;
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
    await vi.waitFor(() => expect(llamadas).toHaveLength(1));
    await pasar(200);
    expect(llamadas).toHaveLength(1);
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(llamadas).toHaveLength(2));
  });

  it('lo escrito durante un envío sale en el siguiente', async () => {
    let soltar!: () => void;
    const retenido = new Promise<void>((r) => (soltar = r));
    let primera = true;
    const { fetcher, llamadas } = falso(async (l) => {
      if (l.url === '/api/ops' && primera) {
        primera = false;
        await retenido;
      }
      return normal(l);
    });
    await escribir('receta', { id: 'r1', nombre: 'Lentejas estofadas' });
    parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
    await vi.waitFor(() => expect(opsEnviadas(llamadas)).toHaveLength(1));
    await escribir('receta', { id: 'r2', nombre: 'Tortilla de patata' });
    soltar();
    await vi.waitFor(() => expect(opsEnviadas(llamadas).map((o) => o.fila.id)).toEqual(['r1', 'r2']));
    expect(llamadas.filter((l) => l.url === '/api/ops')).toHaveLength(2);
  });

  it('un disparo que llega con una vuelta en marcha pide los cambios otra vez al acabar', async () => {
    let soltar!: () => void;
    const retenido = new Promise<void>((r) => (soltar = r));
    let primera = true;
    const { fetcher, llamadas } = falso(async (l) => {
      if (l.url.startsWith('/api/cambios') && primera) {
        primera = false;
        await retenido;
      }
      return normal(l);
    });
    parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
    await vi.waitFor(() => expect(cambios(llamadas)).toBe(1));
    // La primera vuelta ya pidió los cambios: lo que motivó el disparo pudo llegar después.
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    soltar();
    await vi.waitFor(() => expect(cambios(llamadas)).toBe(2));
    await pasar(50);
    expect(cambios(llamadas)).toBe(2);
  });

  it('avisa una sola vez si no hay sesión, deja de sincronizar y no pierde la cola', async () => {
    const { fetcher, llamadas } = falso((l) => (l.url === '/api/ops' ? json(401, { error: 'Sin sesión.' }) : normal(l)));
    const alPerderSesion = vi.fn();
    await escribir('receta', { id: 'r1', nombre: 'Lentejas estofadas' });
    parar = iniciarSincronizacion({ alPerderSesion, fetcher, espera: 0 });
    await vi.waitFor(() => expect(alPerderSesion).toHaveBeenCalledTimes(1));
    const antes = llamadas.length;
    await escribir('receta', { id: 'r2', nombre: 'Tortilla de patata' });
    await pasar(100);
    expect(llamadas).toHaveLength(antes);
    expect(alPerderSesion).toHaveBeenCalledTimes(1);
    expect(await copia().cola.count()).toBe(2);
  });
});

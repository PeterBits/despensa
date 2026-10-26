// Acceso con passkeys: crear el hogar, aceptar la invitación de tu pareja y entrar.
// Cada función pide las opciones al servidor, hace la ceremonia en el móvil y envía la respuesta;
// si algo falla, lanza un Error con la frase en español que se enseña tal cual.

import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { sincronizar, SinSesion } from './sync';

export const FALLO_FACE_ID = 'No se pudo usar Face ID. Vuelve a intentarlo.';
const SIN_CONEXION = 'No hay conexión. Inténtalo otra vez.';
const FALLO = 'Algo ha fallado. Inténtalo otra vez.';

// El servidor rechazó la petición: el mensaje es su frase y `estado`, el código HTTP
// (410: la invitación no existe, ya se usó o caducó; 409: el hogar ya tiene dos personas).
export class RechazoDelServidor extends Error {
  readonly estado: number;

  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.name = 'RechazoDelServidor';
    this.estado = estado;
  }
}

type Reto<Opciones> = { retoId: string; opciones: Opciones };

async function enviar<T>(ruta: string, cuerpo: Record<string, unknown> = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error(SIN_CONEXION);
  }
  const datos: unknown = await respuesta.json().catch(() => ({}));
  if (respuesta.ok) return datos as T;
  const error = (datos as { error?: unknown }).error;
  const mensaje = typeof error === 'string' ? error : FALLO;
  throw new RechazoDelServidor(mensaje, respuesta.status);
}

// Cancelar Face ID o que se agote su tiempo llega como NotAllowedError o AbortError; @simplewebauthn los envuelve
// en un WebAuthnError que conserva ese `name`. Cualquier otro fallo (opciones mal formadas, por ejemplo) es genérico,
// y solo se apunta su nombre: ni el token ni las opciones.
const CANCELACIONES = ['NotAllowedError', 'AbortError'];

async function ceremonia<T>(paso: () => Promise<T>): Promise<T> {
  try {
    return await paso();
  } catch (e) {
    const nombre = typeof e === 'object' && e !== null && 'name' in e ? String(e.name) : typeof e;
    if (CANCELACIONES.includes(nombre)) throw new Error(FALLO_FACE_ID);
    console.debug('La ceremonia de passkey ha fallado:', nombre);
    throw new Error(FALLO);
  }
}

export async function crearHogar(): Promise<void> {
  const { retoId, opciones } = await enviar<Reto<PublicKeyCredentialCreationOptionsJSON>>('/api/hogar/opciones');
  const respuesta = await ceremonia(() => startRegistration({ optionsJSON: opciones }));
  await enviar('/api/hogar', { retoId, respuesta });
}

export async function aceptarInvitacion(token: string): Promise<void> {
  const { retoId, opciones } = await enviar<Reto<PublicKeyCredentialCreationOptionsJSON>>(
    '/api/invitaciones/aceptar/opciones',
    { token },
  );
  const respuesta = await ceremonia(() => startRegistration({ optionsJSON: opciones }));
  await enviar('/api/invitaciones/aceptar', { token, retoId, respuesta });
}

export async function entrar(): Promise<void> {
  const { retoId, opciones } = await enviar<Reto<PublicKeyCredentialRequestOptionsJSON>>('/api/entrar/opciones');
  const respuesta = await ceremonia(() => startAuthentication({ optionsJSON: opciones }));
  await enviar('/api/entrar', { retoId, respuesta });
}

const ESPERA_SESION = 4000;
const CLAVE_SESION = 'despensa.sesion';

export type Sesion = { hogarId: string; miembroId: string };

// Un localStorage que lanza (modo privado, datos bloqueados) cuenta como vacío.
function guardada(): Sesion | null {
  try {
    const dato = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null') as Partial<Sesion> | null;
    return typeof dato?.hogarId === 'string' && typeof dato.miembroId === 'string'
      ? { hogarId: dato.hogarId, miembroId: dato.miembroId }
      : null;
  } catch {
    return null;
  }
}

export function olvidarSesion(): void {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Sin almacenamiento no hay nada que olvidar.
  }
}

// Solo un 401 significa que no hay sesión. Sin red, o si /api/yo tarda más de 4 s, no se puede saber,
// y la app abre con lo guardado: si la sesión ya no vale, la sincronización recibirá el 401.
// Limitación conocida: sin red y sin nada guardado (primer arranque offline) devuelve null y se ve la bienvenida;
// se arregla en el plan 6.
export async function leerSesion(): Promise<Sesion | null> {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_SESION);
  try {
    const respuesta = await fetch('/api/yo', { signal: corte.signal });
    if (respuesta.status === 401) {
      olvidarSesion();
      return null;
    }
    if (respuesta.ok) {
      const { hogarId, miembroId } = (await respuesta.json()) as Partial<Sesion>;
      if (typeof hogarId === 'string' && typeof miembroId === 'string') {
        const sesion = { hogarId, miembroId };
        try {
          localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        } catch {
          // Se abre igual; solo se pierde recordarla sin red.
        }
        return sesion;
      }
    }
    return guardada();
  } catch {
    return guardada();
  } finally {
    clearTimeout(reloj);
  }
}

// Cuántas personas hay en el hogar (1: falta invitar a la pareja). Sin red o sin respuesta válida, null.
export async function contarMiembros(): Promise<number | null> {
  try {
    const respuesta = await fetch('/api/yo');
    if (!respuesta.ok) return null;
    const { miembros } = (await respuesta.json()) as { miembros?: unknown };
    return typeof miembros === 'number' ? miembros : null;
  } catch {
    return null;
  }
}

// Pide un enlace de invitación nuevo: vale 24 horas y una sola vez. Nunca se escribe en la consola.
export async function invitar(): Promise<string> {
  const { enlace } = await enviar<{ enlace: string; caduca: string }>('/api/invitaciones');
  return enlace;
}

// Lo pendiente se envía antes de cerrar la sesión: después ya no habría con qué subirlo. Sin sesión
// (401) no hay nada que enviar y se sigue; cualquier otro fallo impide salir.
export async function salir(): Promise<void> {
  try {
    await sincronizar();
  } catch (e) {
    if (!(e instanceof SinSesion)) throw new Error(SIN_CONEXION);
  }
  await enviar('/api/salir');
}

export type ResultadoCompartir = 'compartida' | 'copiada' | 'cancelada' | 'a mano';

// La hoja de compartir del iPhone; sin ella, o si falla, el portapapeles; y si tampoco, 'a mano'.
// Cerrar la hoja (AbortError) no es un fallo: no se copia ni se dice nada.
export async function compartirInvitacion(enlace: string): Promise<ResultadoCompartir> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Despensa', text: 'Te invito a nuestra Despensa.', url: enlace });
      return 'compartida';
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'name' in e && e.name === 'AbortError') return 'cancelada';
    }
  }
  try {
    await navigator.clipboard.writeText(enlace);
    return 'copiada';
  } catch {
    return 'a mano';
  }
}

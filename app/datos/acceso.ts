// Acceso con passkeys: crear el hogar, aceptar la invitación de tu pareja y entrar.
// Cada función pide las opciones al servidor, hace la ceremonia en el móvil y envía la respuesta;
// si algo falla, lanza un Error con la frase en español que se enseña tal cual.

import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

export const FALLO_FACE_ID = 'No se pudo usar Face ID. Vuelve a intentarlo.';
const SIN_CONEXION = 'No hay conexión. Inténtalo otra vez.';
const FALLO = 'Algo ha fallado. Inténtalo otra vez.';

// El servidor respondió 410: la invitación no existe, ya se usó o caducó.
export class InvitacionCaducada extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'InvitacionCaducada';
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
  throw respuesta.status === 410 ? new InvitacionCaducada(mensaje) : new Error(mensaje);
}

// Cancelar Face ID, o que el móvil no pueda hacer la ceremonia, se cuenta igual: se puede volver a intentar.
async function ceremonia<T>(paso: () => Promise<T>): Promise<T> {
  try {
    return await paso();
  } catch {
    throw new Error(FALLO_FACE_ID);
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

// Solo un 401 significa que no hay sesión. Sin red no se puede saber, y la app abre con su copia local:
// si la sesión ya no vale, la sincronización recibirá el 401.
export async function haySesion(): Promise<boolean> {
  try {
    return (await fetch('/api/yo')).status !== 401;
  } catch {
    return true;
  }
}

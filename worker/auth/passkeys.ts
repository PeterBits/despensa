// Passkeys: el verificador (real sobre @simplewebauthn/server, falso en los tests) y los retos de un solo uso.

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

export type Credencial = { id: string; clavePublica: Uint8Array; contador: number; transportes: string[] };

// Lo que necesita el navegador para crear o usar una passkey; `challenge` es el reto que se guarda.
export type OpcionesPasskey = { challenge: string };

export interface VerificadorPasskeys {
  opcionesRegistro(miembroId: string): Promise<OpcionesPasskey>;
  verificarRegistro(respuesta: unknown, reto: string): Promise<Credencial | null>;
  opcionesEntrada(): Promise<OpcionesPasskey>;
  verificarEntrada(respuesta: unknown, reto: string, credencial: Credencial): Promise<{ id: string; contador: number } | null>;
}

// Sin datos personales: la app no pide nombre, así que la passkey lleva una etiqueta fija.
const ETIQUETA = 'Despensa';

export function verificadorReal(env: Env): VerificadorPasskeys {
  const esperado = { expectedRPID: env.RP_ID, expectedOrigin: env.ORIGEN };
  return {
    opcionesRegistro: (miembroId) =>
      generateRegistrationOptions({
        rpName: ETIQUETA,
        rpID: env.RP_ID,
        userName: ETIQUETA,
        userDisplayName: ETIQUETA,
        userID: isoUint8Array.fromUTF8String(miembroId),
        // Descubrible: "Entrar con mi passkey" funciona sin nombre de usuario.
        authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      }),

    async verificarRegistro(respuesta, reto) {
      const r = await intentar(() =>
        verifyRegistrationResponse({ response: respuesta as RegistrationResponseJSON, expectedChallenge: reto, ...esperado }),
      );
      if (!r?.verified) return null;
      const { id, publicKey, counter, transports } = r.registrationInfo.credential;
      return { id, clavePublica: publicKey, contador: counter, transportes: transports ?? [] };
    },

    opcionesEntrada: () => generateAuthenticationOptions({ rpID: env.RP_ID, userVerification: 'preferred' }),

    async verificarEntrada(respuesta, reto, credencial) {
      const r = await intentar(() =>
        verifyAuthenticationResponse({
          response: respuesta as AuthenticationResponseJSON,
          expectedChallenge: reto,
          ...esperado,
          credential: {
            id: credencial.id,
            publicKey: new Uint8Array(credencial.clavePublica),
            counter: credencial.contador,
            transports: credencial.transportes,
          },
        }),
      );
      return r?.verified ? { id: r.authenticationInfo.credentialID, contador: r.authenticationInfo.newCounter } : null;
    },
  };
}

// La librería lanza ante una respuesta mal formada o que no cuadra: para la app es un rechazo más.
async function intentar<T>(verificar: () => Promise<T>): Promise<T | null> {
  try {
    return await verificar();
  } catch (e) {
    console.warn('Passkey rechazada:', e instanceof Error ? e.message : e);
    return null;
  }
}

const RETO_DURA = 5 * 60_000;

export async function guardarReto(db: D1Database, id: string, valor: string): Promise<void> {
  await db.prepare('INSERT INTO reto (id, valor, caduca) VALUES (?, ?, ?)')
    .bind(id, valor, new Date(Date.now() + RETO_DURA).toISOString())
    .run();
}

// Lo borra al leerlo, así vale una sola vez aunque luego falle la verificación. null si no existe o caducó.
export async function gastarReto(db: D1Database, id: string): Promise<string | null> {
  const fila = await db.prepare('DELETE FROM reto WHERE id = ? RETURNING valor, caduca')
    .bind(id)
    .first<{ valor: string; caduca: string }>();
  return fila && fila.caduca > new Date().toISOString() ? fila.valor : null;
}

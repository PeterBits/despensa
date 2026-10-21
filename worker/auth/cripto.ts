// Tokens aleatorios para cookies e invitaciones, y su huella: en D1 solo se guarda la huella.

export function tokenAleatorio(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// SHA-256 en hexadecimal.
export async function sha256(texto: string): Promise<string> {
  const huella = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(huella)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

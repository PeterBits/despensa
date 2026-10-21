import { Hono } from 'hono';
import { verificadorReal, type VerificadorPasskeys } from './auth/passkeys';
import { rutasConSesion, rutasPublicas } from './auth/rutas';
import { requiereSesion, soloMismoOrigen, type Entorno } from './auth/sesiones';
import { rutasSync } from './sync/rutas';

// Primero el filtro de origen; luego las rutas públicas, antes del middleware de sesión; el resto de /api/* exige sesión.
// El verificador se inyecta para poder probar sin passkeys reales.
export function crearApp(verificador: (env: Env) => VerificadorPasskeys) {
  const app = new Hono<Entorno>();
  app.use('/api/*', soloMismoOrigen);
  app.get('/api/salud', (c) => c.json({ ok: true }));
  rutasPublicas(app, verificador);
  app.use('/api/*', requiereSesion);
  rutasConSesion(app);
  rutasSync(app);
  // Un fallo inesperado (D1, por ejemplo) no enseña detalles: se registra y se responde en español.
  app.onError((e, c) => {
    console.error(e);
    return c.json({ error: 'Algo ha fallado. Inténtalo otra vez.' }, 500);
  });
  return app;
}

export default { fetch: crearApp(verificadorReal).fetch };

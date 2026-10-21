import { Hono } from 'hono';
import { verificadorReal, type VerificadorPasskeys } from './auth/passkeys';
import { rutasConSesion, rutasPublicas } from './auth/rutas';
import { requiereSesion, type Entorno } from './auth/sesiones';

// Las rutas públicas se registran antes del middleware; el resto de /api/* exige sesión.
// El verificador se inyecta para poder probar sin passkeys reales.
export function crearApp(verificador: (env: Env) => VerificadorPasskeys) {
  const app = new Hono<Entorno>();
  app.get('/api/salud', (c) => c.json({ ok: true }));
  rutasPublicas(app, verificador);
  app.use('/api/*', requiereSesion);
  rutasConSesion(app);
  return app;
}

export default { fetch: crearApp(verificadorReal).fetch };

import { Hono } from 'hono';

export const app = new Hono<{ Bindings: Env }>();

app.get('/api/salud', (c) => c.json({ ok: true }));

export default { fetch: app.fetch };

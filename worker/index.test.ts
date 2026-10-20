import { SELF } from 'cloudflare:test';

it('responde a /api/salud', async () => {
  const r = await SELF.fetch('https://despensa.test/api/salud');
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ ok: true });
});

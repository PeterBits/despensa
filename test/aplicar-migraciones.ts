import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

// TEST_MIGRATIONS lo inyecta vitest.config.ts; vacío mientras migrations/ no tenga SQL.
const migraciones = (env as unknown as { TEST_MIGRATIONS?: Parameters<typeof applyD1Migrations>[1] })
  .TEST_MIGRATIONS ?? [];
if (migraciones.length > 0) {
  await applyD1Migrations(env.DB, migraciones);
}

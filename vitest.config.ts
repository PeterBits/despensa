import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest(async () => {
            const migrations = await readD1Migrations(path.join(import.meta.dirname, 'migrations'));
            return {
              wrangler: { configPath: './wrangler.jsonc' },
              miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
            };
          }),
        ],
        test: {
          name: 'worker',
          globals: true,
          include: ['worker/**/*.test.ts'],
          setupFiles: ['./test/aplicar-migraciones.ts'],
        },
      },
      {
        test: {
          name: 'app',
          globals: true,
          environment: 'jsdom',
          include: ['app/**/*.test.tsx', 'shared/**/*.test.ts'],
          setupFiles: ['./app/preparar-pruebas.ts'],
        },
      },
    ],
  },
});

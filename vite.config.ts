import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), cloudflare()],
  // ORIGEN (wrangler.jsonc) es http://localhost:5173: en otro puerto cada escritura da 403 y las passkeys fallan
  // por el origen. Si el puerto está ocupado, mejor que Vite no arranque a que arranque en otro.
  server: { port: 5173, strictPort: true },
});

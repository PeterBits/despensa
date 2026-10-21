// Bindings del Worker (declarados en wrangler.jsonc). Los tipos de runtime
// salen de `wrangler types --include-env=false` (worker-configuration.d.ts).
interface Env {
  DB: D1Database;
  FOTOS: R2Bucket;
  RP_ID: string;
  ORIGEN: string;
}

// `env` de cloudflare:workers y de cloudflare:test se tipa con Cloudflare.Env.
declare namespace Cloudflare {
  interface Env extends globalThis.Env {}
}

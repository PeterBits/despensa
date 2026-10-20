# Despensa, plan 1: cimientos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar en pie el proyecto real de Despensa: una PWA React servida por un Worker de Cloudflare con D1, con las reglas del dominio probadas, el acceso por passkeys con invitación y la sincronización básica (operaciones y cambios) sobre una copia local en el móvil.

**Architecture:** Un único Worker (Hono) sirve la SPA como static assets y la API en `/api/*`; D1 es la fuente de verdad. Las reglas del dominio son funciones puras en `shared/`, usadas por el cliente y el Worker. El cliente guarda una copia en IndexedDB (Dexie), encola operaciones y pide cambios por versión. El Durable Object, el service worker y las pantallas reales llegan en los planes 2 a 6.

**Tech Stack:**
- Node 20 o superior; TypeScript en modo estricto.
- Vite con `@cloudflare/vite-plugin`; React 19 y React Router.
- Hono, Zod y `@simplewebauthn/server` / `@simplewebauthn/browser` para passkeys.
- Dexie para la copia local; Wrangler 4.
- Vitest: `@cloudflare/vitest-pool-workers` para el Worker, jsdom con Testing Library para la app y `fake-indexeddb` para Dexie.
- Versiones: la estable más reciente en el momento de instalar, fijadas en `package.json`.

**Spec:** `docs/superpowers/specs/2026-10-20-despensa-app-design.md`. Lee también `DESIGN.md`, `PRODUCT.md` y `prototipo/*.html`, que son la referencia aprobada.

## Global Constraints

- La interfaz en español; todo número de la app con cifras tabulares (`font-feature-settings: "tnum" 1`) y coma decimal ("1,5 kg", "7,5").
- Los tokens de color, tipografía, radios y espaciado son exactamente los del frontmatter de `DESIGN.md`, en claro y en oscuro según `prefers-color-scheme`. No se introduce ningún color sin su pareja.
- Pila tipográfica: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`; sin fuentes externas ni Google Fonts.
- Datos personales (POL-MMNSEG-001-1.1): seeds, fixtures y tests solo con datos inventados (las recetas de los prototipos). La app no pide nombre, email ni teléfono.
- Cookie de sesión `sesion`: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=15552000`. En D1 se guarda el SHA-256 del token, nunca el token.
- Invitación: un solo uso, caduca a las 24 h, se guarda como SHA-256 y el hogar admite como mucho 2 miembros.
- Ids de contenido: UUID de texto generado en el cliente (`crypto.randomUUID()`).
- Fechas del dominio en `Europe/Madrid`, formato `YYYY-MM-DD`; la semana va de lunes a domingo y el domingo es fuera.
- Commits como PeterBits: antes del primer commit, `git var GIT_AUTHOR_IDENT` debe empezar por `PeterBits`; nada de `--author` ni `-c user.*`. Nunca `git push`.
- Planes gratuitos de Cloudflare: nada que exija Workers Paid.

## Review Focus

- **Reintentos de la cola:** reenviar las mismas operaciones tras una reconexión no puede duplicar filas ni subir la versión dos veces. Test en la Task 9.
- **Abrir desde WhatsApp con sesión iniciada:** con la cookie `SameSite=Lax`, una navegación de primer nivel desde otro sitio llega con sesión. Test en la Task 8 que comprueba el atributo exacto.
- **Cambio de hora (domingo 25 de octubre de 2026):** el lunes de la semana y "hoy" se calculan en Madrid; el 26/10 a las 00:30 hora de Madrid (23:30 UTC del 25) ya es lunes 26. Test en la Task 6.
- **Unidades mezcladas en la lista:** "1 kg" más "500 g" es "1,5 kg"; "2 dientes" más "1 cabeza" se muestran juntos sin sumar; "al gusto" no suma. Tests en las Tasks 4 y 5.
- **Tercer miembro e invitación gastada o caducada:** aceptar responde 409 o 410 con un mensaje en español, y no crea miembro ni sesión. Tests en la Task 8.

## Plan de planes

Este es el plan 1 de 6. Los siguientes se escriben al terminar este, sobre lo que haya quedado:

2. Recetas: índice, vista para cocinar, editor y fotos (R2 tras una interfaz que admite pasar a KV).
3. Semana: propuesta, días activos, cambiar plato y hacer la lista.
4. Lista: repaso en casa, en el súper, frecuentes, terminar y vaciar.
5. Registro: diario, notas de cada uno y "Comimos otra cosa".
6. En vivo y sin conexión (Durable Object, service worker), `docs/cloudflare.md` y primer despliegue.

## File Structure

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, wrangler.jsonc, index.html
migrations/0001_inicial.sql            esquema D1 completo
shared/cantidad.ts                     leer, sumar y formatear cantidades
shared/secciones.ts                    secciones del súper y sección por nombre
shared/lista.ts                        lista de la compra desde recetas
shared/fechas.ts                       hoy y lunes en Europe/Madrid
shared/semana.ts                       reparto, propuesta y recomendaciones
shared/notas.ts                        media y formato de nota
shared/pasos.ts                        marcas {texto|ingrediente} y tachado enlazado
shared/esquema.ts                      tablas sincronizables y sus columnas (Zod)
worker/index.ts                        app Hono y export default
worker/auth/cripto.ts                  tokens aleatorios y SHA-256
worker/auth/sesiones.ts                crear, leer y borrar sesión; cookie
worker/auth/passkeys.ts                interfaz VerificadorPasskeys y la real
worker/auth/rutas.ts                   /api/hogar, /api/invitaciones, /api/entrar, /api/salir, /api/yo
worker/sync/ops.ts                     aplicar operaciones y leer cambios
worker/sync/rutas.ts                   /api/ops, /api/cambios
app/main.tsx, app/App.tsx              arranque y rutas
app/estilos/tokens.css, base.css       tokens de DESIGN.md y base
app/componentes/BarraPestanas.tsx      barra de 4 pestañas
app/datos/local.ts                     Dexie: tablas espejo y cola
app/datos/sync.ts                      enviar cola y pedir cambios
app/datos/acceso.ts                    llamadas de passkeys desde el cliente
app/pantallas/Bienvenida.tsx           crear hogar o entrar
app/pantallas/Invitacion.tsx           aceptar invitación
tests (junto a cada módulo como *.test.ts / *.test.tsx; los del Worker en worker/**/*.test.ts)
```

---

### Task 1: Base del repo, Worker con assets y pruebas

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, `index.html`, `app/main.tsx`, `app/App.tsx`, `worker/index.ts`, `worker/env.d.ts`, `worker/index.test.ts`, `test/aplicar-migraciones.ts`
- Modify: `.gitignore` (añadir `node_modules/`, `dist/`, `.wrangler/`, `.dev.vars`)

**Interfaces:**
- Produces:
  - `worker/index.ts` exporta `default { fetch }` y `app: Hono<{ Bindings: Env }>`.
  - `Env = { DB: D1Database; FOTOS: R2Bucket; ASSETS: Fetcher; RP_ID: string; ORIGEN: string }`, declarado en `worker/env.d.ts`.
  - Scripts de `package.json`: `dev`, `build`, `test`, `typecheck`, `db:migrar:local`.

- [ ] **Step 1: Comprobar la identidad de git**

Run: `git var GIT_AUTHOR_IDENT`
Expected: empieza por `PeterBits`. Si no, para y pregunta al usuario.

- [ ] **Step 2: Instalar dependencias y escribir la configuración**

`wrangler.jsonc`:
- `name: "despensa"` y `main: "worker/index.ts"`;
- `compatibility_date` = la fecha de hoy;
- `assets: { not_found_handling: "single-page-application", run_worker_first: ["/api/*"] }`;
- `d1_databases: [{ binding: "DB", database_name: "despensa", database_id: "local", migrations_dir: "migrations" }]`;
- `r2_buckets: [{ binding: "FOTOS", bucket_name: "despensa-fotos" }]`;
- `vars: { RP_ID: "localhost", ORIGEN: "http://localhost:5173" }`.

`vitest.config.ts` define dos proyectos:
- `worker`: `worker/**/*.test.ts` con el pool de workers según la página "Vitest integration" de Cloudflare. Apunta a `wrangler.jsonc` y aplica `migrations/` en `test/aplicar-migraciones.ts` con `readD1Migrations`/`applyD1Migrations`.
- `app`: `app/**/*.test.tsx` y `shared/**/*.test.ts`, en jsdom.

- [ ] **Step 3: Escribir el test que falla**

```ts
// worker/index.test.ts
import { SELF } from 'cloudflare:test';
it('responde a /api/salud', async () => {
  const r = await SELF.fetch('https://despensa.test/api/salud');
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({ ok: true });
});
```

- [ ] **Step 4: Ejecutar y ver que falla**

Run: `npx vitest run worker/index.test.ts`
Expected: FAIL (la ruta no existe o el módulo no exporta `default`).

- [ ] **Step 5: Implementar `GET /api/salud` en `worker/index.ts`**

Devuelve `{ ok: true }`. Las rutas que no son `/api/*` las sirve `ASSETS` por configuración.

- [ ] **Step 6: Verificar test, tipos y build**

Run: `npm test -- --project worker && npm run typecheck && npm run build`
Expected: 1 test PASS, sin errores de tipos, `dist/` generado.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts wrangler.jsonc index.html app worker test .gitignore
git commit -m "chore: set up the Vite, React and Worker project with tests"
```

### Task 2: Tokens de DESIGN.md y barra de pestañas

**Files:**
- Create: `app/estilos/tokens.css`, `app/estilos/base.css`, `app/componentes/BarraPestanas.tsx`, `app/componentes/BarraPestanas.test.tsx`
- Modify: `app/App.tsx` (rutas `/semana`, `/recetas`, `/lista`, `/registro`; `/` redirige a `/semana`), `index.html` (metas de `prototipo/semana.html:5-11`)

**Interfaces:**
- Produces:
  - `<BarraPestanas />`: cuatro enlaces (Semana, Recetas, Lista, Registro) con los SVG de `prototipo/semana.html:158-161`; el activo lleva `aria-current="page"`.
  - Las custom properties `--ground`, `--bar`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--hair`, `--tint`, `--tint-ink`, `--on-tint`, `--fill`, `--on-fill`, `--seg`, `--seg-on`, `--font`, `--ease`.

- [ ] **Step 1: Escribir el test que falla**

```tsx
it('marca la pestaña actual', () => {
  render(<MemoryRouter initialEntries={['/lista']}><BarraPestanas /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Lista' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Semana' })).not.toHaveAttribute('aria-current');
  expect(screen.getAllByRole('link')).toHaveLength(4);
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run app/componentes/BarraPestanas.test.tsx`
Expected: FAIL (no existe el componente).

- [ ] **Step 3: Implementar**

- `tokens.css` copia los valores de `prototipo/semana.html:14-34`, incluido el bloque oscuro con `:root:not([data-theme="light"])` y el atributo `data-theme`.
- `base.css` copia la base de `prototipo/semana.html:36-44`: reset, `body`, `::selection`, `:focus-visible` y `.sr`.
- `.tabs` copia `prototipo/semana.html:109-113`.
- `BarraPestanas` usa `NavLink` de React Router.

- [ ] **Step 4: Verificar**

Run: `npx vitest run app/componentes/BarraPestanas.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app index.html
git commit -m "feat: add the design tokens and the four-tab bar"
```

### Task 3: Esquema de D1

**Files:**
- Create: `migrations/0001_inicial.sql`, `worker/esquema.test.ts`

**Interfaces:**
- Produces:
  - Las tablas del apartado 5 del spec con estos nombres de columna en snake_case:
    - `hogar(id, version, creado)`;
    - `miembro(id, hogar_id, creado)`;
    - `credencial(id, miembro_id, clave_publica BLOB, contador, transportes)`;
    - `sesion(id, miembro_id, caduca)`;
    - `invitacion(token_hash, hogar_id, caduca, usada)`;
    - `reto(id, valor, caduca)`;
    - `op_vista(id, hogar_id, creada)`.
  - Las tablas sincronizables comparten `id TEXT PRIMARY KEY, hogar_id TEXT NOT NULL, version INTEGER NOT NULL, borrado INTEGER NOT NULL DEFAULT 0`:
    - `receta(nombre, corto, raciones, minutos, tipos, foto_key, notas)`;
    - `ingrediente(receta_id, orden, nombre, cantidad, compra, a_la_lista, tipo, seccion)`;
    - `paso(receta_id, orden, texto, minutos)`;
    - `semana(lunes, propuesta_aceptada)`;
    - `semana_dia(semana_id, dia, activo, fuera)`;
    - `semana_plato(semana_id, hueco, receta_id, sustituye_a)`;
    - `comida(fecha, receta_id, texto, fuera, planificada_receta_id)`;
    - `nota(comida_id, miembro_id, valor)`;
    - `producto(nombre, cantidad, seccion, origen, estado, cogido_por)`;
    - `frecuente(nombre, seccion, cantidad_habitual, veces)`.
  - Índice `(hogar_id, version)` en cada tabla sincronizable.
  - CHECK en `nota.valor BETWEEN 1 AND 10` y en `producto.estado IN ('pendiente','carro','casa')`.

- [ ] **Step 1: Escribir el test que falla**

```ts
it('crea las tablas y rechaza una nota fuera de rango', async () => {
  const tablas = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const nombres = tablas.results.map(t => t.name);
  for (const t of ['hogar','miembro','credencial','sesion','invitacion','reto','op_vista','receta','ingrediente','paso','semana','semana_dia','semana_plato','comida','nota','producto','frecuente'])
    expect(nombres).toContain(t);
  await expect(env.DB.prepare("INSERT INTO nota (id,hogar_id,version,comida_id,miembro_id,valor) VALUES ('n','h',1,'c','m',11)").run()).rejects.toThrow();
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run worker/esquema.test.ts`
Expected: FAIL (faltan tablas).

- [ ] **Step 3: Escribir `migrations/0001_inicial.sql`** con las tablas, índices y CHECK de arriba.

- [ ] **Step 4: Verificar**

Run: `npx vitest run worker/esquema.test.ts && npm run db:migrar:local`
Expected: PASS, y la migración se aplica a la D1 local sin errores.

- [ ] **Step 5: Commit**

```bash
git add migrations worker/esquema.test.ts
git commit -m "feat: add the initial D1 schema"
```

### Task 4: Cantidades

**Files:**
- Create: `shared/cantidad.ts`, `shared/cantidad.test.ts`

**Interfaces:**
- Produces:
  - `type Cantidad = { valor: number | null; unidad: string }`;
  - `leerCantidad(texto: string): Cantidad`;
  - `sumarCantidades(lista: Cantidad[]): Cantidad[]`;
  - `formatearCantidades(lista: Cantidad[]): string`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
it('lee números con coma, unidades y texto libre', () => {
  expect(leerCantidad('1,5 kg')).toEqual({ valor: 1.5, unidad: 'kg' });
  expect(leerCantidad('500 g')).toEqual({ valor: 500, unidad: 'g' });
  expect(leerCantidad('3')).toEqual({ valor: 3, unidad: '' });
  expect(leerCantidad('2 dientes')).toEqual({ valor: 2, unidad: 'dientes' });
  expect(leerCantidad('al gusto')).toEqual({ valor: null, unidad: 'al gusto' });
});
it('suma unidades compatibles y deja juntas las que no', () => {
  const s = sumarCantidades(['1 kg', '500 g', '2 dientes', '1 cabeza', '3', '2'].map(leerCantidad));
  expect(formatearCantidades(s)).toBe('1,5 kg + 2 dientes + 1 cabeza + 5');
  expect(formatearCantidades(sumarCantidades(['750 ml', '500 ml'].map(leerCantidad)))).toBe('1,25 l');
  expect(formatearCantidades(sumarCantidades(['al gusto', '200 g'].map(leerCantidad)))).toBe('200 g');
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/cantidad.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar en `shared/cantidad.ts`**

- Familias: masa (g, kg), volumen (ml, l) y unidades sin texto. Se suman en g o ml y se muestran en kg o l desde 1000.
- El resto de unidades se suma solo con la misma unidad textual.
- Las cantidades sin valor desaparecen si hay alguna con valor.
- Coma decimal, sin ceros sobrantes.
- El orden de salida es el de primera aparición.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared/cantidad.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/cantidad.ts shared/cantidad.test.ts
git commit -m "feat: parse, add up and format ingredient quantities"
```

### Task 5: Secciones y lista desde recetas

**Files:**
- Create: `shared/secciones.ts`, `shared/lista.ts`, `shared/lista.test.ts`

**Interfaces:**
- Consumes: `leerCantidad`, `sumarCantidades` y `formatearCantidades` (Task 4).
- Produces:
  - `SECCIONES: readonly Seccion[]`, en el orden de `prototipo/lista.html` (SECCIONES): Frutería y verdura, Panadería, Carnicería, Pescadería, Despensa, Lácteos y huevos, Congelados, Limpieza y hogar, Otros.
  - `seccionDe(nombre: string): Seccion`, a partir de CONOCIDOS del prototipo más las secciones de los ingredientes; si no se conoce, 'Otros'.
  - `type IngredienteParaLista = { nombre: string; cantidad: string; compra: string | null; aLaLista: boolean; seccion: Seccion }`.
  - `type RecetaParaLista = { corto: string; ingredientes: IngredienteParaLista[] }`.
  - `type LineaLista = { nombre: string; cantidad: string; seccion: Seccion; origen: string[] }`.
  - `listaDesdeRecetas(recetas: RecetaParaLista[]): LineaLista[]`, ordenada por sección y, dentro de cada sección, por primera aparición.

- [ ] **Step 1: Escribir los tests que fallan**

Usa las lentejas y la merluza de `prototipo/recetas.html` (`RECETAS`): sal, aceite, agua, laurel y harina con `aLaLista: false`; ajo con `compra: '1 cabeza'` en las dos; pimentón con `compra: '1 bote'`; vino con `compra: '1 botella'`.

```ts
const lineas = listaDesdeRecetas([lentejas, merluza]);
expect(lineas.find(l => l.nombre === 'Ajo')).toEqual({ nombre: 'Ajo', cantidad: '1 cabeza', seccion: 'Frutería y verdura', origen: ['lentejas', 'merluza'] });
expect(lineas.some(l => ['Sal', 'Aceite de oliva', 'Agua', 'Laurel', 'Harina'].includes(l.nombre))).toBe(false);
expect(lineas.find(l => l.nombre === 'Patatas')?.cantidad).toBe('1,5 kg');
expect(lineas.map(l => l.seccion)).toEqual([...lineas.map(l => l.seccion)].sort((a, b) => SECCIONES.indexOf(a) - SECCIONES.indexOf(b)));
expect(listaDesdeRecetas([{ corto: 'a', ingredientes: [{ nombre: 'cebolla', cantidad: '1', compra: null, aLaLista: true, seccion: 'Frutería y verdura' }] }, { corto: 'b', ingredientes: [{ nombre: 'Cebolla', cantidad: '2', compra: null, aLaLista: true, seccion: 'Frutería y verdura' }] }])[0]).toMatchObject({ nombre: 'Cebolla', cantidad: '3', origen: ['a', 'b'] });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/lista.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- Agrupar por nombre normalizado: minúsculas, sin tildes y sin espacios sobrantes. Se muestra con la primera letra en mayúscula.
- Si alguna aparición tiene `compra`, la línea muestra esa compra, una vez, en vez de sumar.
- Si no, se suman las cantidades.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared/lista.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/secciones.ts shared/lista.ts shared/lista.test.ts
git commit -m "feat: build the shopping list from the week's recipes"
```

### Task 6: Fechas, semana, propuesta y notas

**Files:**
- Create: `shared/fechas.ts`, `shared/semana.ts`, `shared/notas.ts`, `shared/semana.test.ts`, `shared/notas.test.ts`

**Interfaces:**
- Produces:
  - `hoyEnMadrid(ahora: Date): string`, en `YYYY-MM-DD`;
  - `lunesDe(fecha: string): string`;
  - `sumarDias(fecha: string, n: number): string`;
  - `type Dia = 'L'|'M'|'X'|'J'|'V'|'S'|'D'`;
  - `repartir(platos: { id: string; energetico: boolean }[], activos: Dia[]): Record<Dia, string | null>`. Con 2 platos, D es siempre `null`.
  - `type RecetaResumen = { id: string; energetica: boolean; media: number | null; ultimaVez: string | null }`;
  - `proponer(recetas: RecetaResumen[], hoy: string): { energetica: string; otra: string } | null`;
  - `recomendar(recetas: RecetaResumen[], enPlan: string[], hoy: string): RecetaResumen[]`;
  - `media(valores: number[]): number | null`;
  - `formatearNota(n: number): string`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
it('calcula hoy y el lunes en Madrid también con el cambio de hora', () => {
  expect(hoyEnMadrid(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26');
  expect(lunesDe('2026-10-25')).toBe('2026-10-19');
  expect(lunesDe('2026-10-26')).toBe('2026-10-26');
});
it('lleva el plato energético a los días activos y deja el domingo fuera', () => {
  const r = repartir([{ id: 'lentejas', energetico: true }, { id: 'merluza', energetico: false }], ['L', 'X', 'V']);
  expect(r).toEqual({ L: 'lentejas', M: 'merluza', X: 'lentejas', J: 'merluza', V: 'lentejas', S: 'merluza', D: null });
});
it('propone media ≥ 7 sin repetir en tres semanas, lo más antiguo primero, y lo nuevo cuenta como 7', () => {
  const rs = [
    { id: 'arroz', energetica: true, media: 9, ultimaVez: '2026-09-07' },
    { id: 'curry', energetica: true, media: 8, ultimaVez: '2026-10-19' },
    { id: 'pisto', energetica: false, media: 8.5, ultimaVez: '2026-08-17' },
    { id: 'nueva', energetica: false, media: null, ultimaVez: null },
    { id: 'macarrones', energetica: true, media: 6.5, ultimaVez: '2026-08-01' },
  ];
  expect(proponer(rs, '2026-10-20')).toEqual({ energetica: 'arroz', otra: 'nueva' });
});
it('formatea la media con coma y una cifra', () => {
  expect(media([8, 7])).toBe(7.5);
  expect(formatearNota(7.5)).toBe('7,5');
  expect(formatearNota(8)).toBe('8');
  expect(media([])).toBeNull();
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/semana.test.ts shared/notas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `hoyEnMadrid` con `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' })`.
- `lunesDe` y `sumarDias` operan sobre fechas de calendario (mediodía UTC), sin horas.
- Orden de `proponer` y `recomendar`:
  1. filtrar las que tienen media de 7 o más (sin media cuenta como 7);
  2. descartar las comidas en los últimos 21 días;
  3. empezar por la `ultimaVez` más antigua (sin fecha va primero) y, a igual fecha, por la media más alta.
- Si no hay candidatas, relajar en este orden: primero los 21 días y después la media.
- `recomendar` excluye `enPlan`.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared/semana.test.ts shared/notas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/fechas.ts shared/semana.ts shared/notas.ts shared/semana.test.ts shared/notas.test.ts
git commit -m "feat: add week planning, proposals and rating rules"
```

### Task 7: Marcas en los pasos y tachado enlazado

**Files:**
- Create: `shared/pasos.ts`, `shared/pasos.test.ts`

**Interfaces:**
- Produces:
  - `type Trozo = { texto: string; ingrediente?: string }`;
  - `trozos(texto: string): Trozo[]`;
  - `ingredientesDe(texto: string): string[]`;
  - `ingredientesGastados(pasos: string[], hechos: Set<number>): Set<string>`;
  - `sugerirMarcas(texto: string, ingredientes: { id: string; nombre: string }[]): { id: string; desde: number; hasta: number }[]`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
const p = ['Lava {500 g de lentejas|lentejas} y escúrrelas.', 'Pica {2 cebollas|cebolla} y {2 dientes de ajo|ajo}.', 'Sofríe con {aceite|aceite}.', 'Fríe el ajo con {más aceite|aceite}.'];
expect(trozos(p[0])).toEqual([{ texto: 'Lava ' }, { texto: '500 g de lentejas', ingrediente: 'lentejas' }, { texto: ' y escúrrelas.' }]);
expect(ingredientesGastados(p, new Set([0, 2]))).toEqual(new Set(['lentejas']));
expect(ingredientesGastados(p, new Set([0, 1, 2, 3]))).toEqual(new Set(['lentejas', 'cebolla', 'ajo', 'aceite']));
expect(sugerirMarcas('Pica la cebolla', [{ id: 'cebolla', nombre: 'Cebolla' }])).toEqual([{ id: 'cebolla', desde: 8, hasta: 15 }]);
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/pasos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar.** Marca: `/\{([^|}]+)\|([^}]+)\}/g`. Un ingrediente está gastado cuando todos los pasos que lo marcan están hechos (la regla de `prototipo/recetas.html` `gastados()`). `sugerirMarcas` busca el nombre del ingrediente sin tildes ni mayúsculas, fuera de marcas ya puestas.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared/pasos.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/pasos.ts shared/pasos.test.ts
git commit -m "feat: parse quantity marks in recipe steps"
```

### Task 8: Sesiones, passkeys e invitaciones en el Worker

**Files:**
- Create:
  - `worker/auth/cripto.ts`, `worker/auth/sesiones.ts`, `worker/auth/passkeys.ts`, `worker/auth/rutas.ts`;
  - tests: `worker/auth/rutas.test.ts`, `worker/auth/sesiones.test.ts`.
- Modify: `worker/index.ts` (montar las rutas y el middleware `requiereSesion` en `/api/*` salvo las públicas).

**Interfaces:**
- Produces:
  - `tokenAleatorio(): string` (32 bytes en base64url) y `sha256(texto: string): Promise<string>`;
  - `crearSesion(db, miembroId): Promise<string>`, que devuelve el valor de `Set-Cookie`;
  - `leerSesion(db, cookie: string | null): Promise<{ miembroId: string; hogarId: string } | null>`;
  - `cookieBorrada(): string`;
  - `interface VerificadorPasskeys { opcionesRegistro(...); verificarRegistro(...): Promise<{ id: string; clavePublica: Uint8Array; contador: number; transportes: string[] } | null>; opcionesEntrada(...); verificarEntrada(...): Promise<{ id: string; contador: number } | null> }`, con `verificadorReal(env)` sobre `@simplewebauthn/server` (rpID `env.RP_ID`, origin `env.ORIGEN`) y `crearApp(verificador)` para inyectarlo en los tests;
  - las rutas:

| Ruta | Respuesta | Errores |
|---|---|---|
| `POST /api/hogar/opciones` | `{ retoId, opciones }` | |
| `POST /api/hogar` (`{ retoId, respuesta }`) | 201 + `Set-Cookie` | |
| `POST /api/invitaciones` (con sesión) | `{ enlace: ORIGEN + '/invitacion#' + token, caduca }` | |
| `POST /api/invitaciones/aceptar/opciones` (`{ token }`) | | 410 `{ error: 'Esta invitación ya no vale. Pide otra.' }` si caducó o se usó; 409 `{ error: 'Este hogar ya tiene dos personas.' }` |
| `POST /api/invitaciones/aceptar` (`{ token, retoId, respuesta }`) | 201 + `Set-Cookie` | |
| `POST /api/entrar/opciones` | | |
| `POST /api/entrar` | 200 + `Set-Cookie` | |
| `POST /api/salir` | `cookieBorrada()` | |
| `GET /api/yo` | `{ miembroId, hogarId, miembros }` | |

  - Todas las demás rutas `/api/*` sin sesión responden 401.

- [ ] **Step 1: Escribir los tests que fallan** (con un verificador falso que acepta cualquier respuesta)

```ts
it('crea hogar con cookie Lax y entra en /api/yo', async () => {
  const r = await pedir('POST', '/api/hogar', { retoId: await reto(), respuesta: {} });
  expect(r.status).toBe(201);
  expect(r.headers.get('Set-Cookie')).toMatch(/^sesion=[\w-]+; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=15552000$/);
  const yo = await pedir('GET', '/api/yo', undefined, cookieDe(r));
  expect(await yo.json()).toMatchObject({ miembros: 1 });
});
it('invita a una segunda persona y rechaza una tercera', async () => {
  const { cookie } = await crearHogar();
  const { enlace } = await (await pedir('POST', '/api/invitaciones', {}, cookie)).json();
  const token = enlace.split('#')[1];
  expect((await aceptar(token)).status).toBe(201);
  expect((await pedir('POST', '/api/invitaciones/aceptar/opciones', { token })).status).toBe(410);
  const { enlace: otro } = await (await pedir('POST', '/api/invitaciones', {}, cookie)).json();
  const tercera = await pedir('POST', '/api/invitaciones/aceptar/opciones', { token: otro.split('#')[1] });
  expect(tercera.status).toBe(409);
  expect(await tercera.json()).toEqual({ error: 'Este hogar ya tiene dos personas.' });
});
it('rechaza una invitación caducada y no guarda tokens en claro', async () => { /* caduca en el pasado → 410; SELECT token_hash no contiene el token */ });
it('responde 401 sin sesión', async () => { expect((await pedir('GET', '/api/yo')).status).toBe(401); });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run worker/auth`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- Los retos se guardan en `reto`, caducan a los 5 minutos y se borran al usarse.
- La sesión dura 180 días y se renueva si le quedan menos de 90 al usarse.
- `credencial.contador` se actualiza en cada entrada.

- [ ] **Step 4: Verificar**

Run: `npx vitest run worker/auth && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker
git commit -m "feat: add passkey sign-up, invitations and sessions"
```

### Task 9: Operaciones y cambios

**Files:**
- Create: `shared/esquema.ts`, `worker/sync/ops.ts`, `worker/sync/rutas.ts`, `worker/sync/ops.test.ts`
- Modify: `worker/index.ts` (montar `/api/ops` y `/api/cambios`)

**Interfaces:**
- Consumes: `leerSesion` (Task 8) y las tablas de la Task 3.
- Produces:
  - `TABLAS_SYNC`: las 10 tablas sincronizables de la Task 3, con un esquema Zod de sus columnas propias, sin `hogar_id` ni `version`;
  - `type Op = { id: string; tabla: TablaSync; fila: { id: string } & Record<string, unknown>; borrar?: boolean }`;
  - `aplicarOps(db: D1Database, hogarId: string, miembroId: string, ops: Op[]): Promise<{ version: number; aplicadas: number }>`;
  - `cambiosDesde(db, hogarId, desde: number): Promise<{ version: number; filas: Partial<Record<TablaSync, Fila[]>> }>`;
  - `POST /api/ops` (`{ ops }`) → `{ version }`;
  - `GET /api/cambios?desde=N` → `{ version, filas }`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
it('aplica una vez aunque se reenvíe la misma operación', async () => {
  const op = { id: 'op-1', tabla: 'producto', fila: { id: 'p1', nombre: 'Leche', cantidad: '6 l', seccion: 'Lácteos y huevos', origen: 'a mano', estado: 'pendiente', cogido_por: null } };
  const a = await aplicarOps(env.DB, H, M, [op]);
  const b = await aplicarOps(env.DB, H, M, [op]);
  expect(b).toEqual({ version: a.version, aplicadas: 0 });
});
it('devuelve solo lo cambiado desde una versión, borrados incluidos', async () => { /* crear p1 y p2, borrar p1; cambiosDesde(v_inicial) trae p2 y p1 con borrado=1 */ });
it('no deja escribir en filas de otro hogar ni la nota de la pareja', async () => {
  /* fila de otro hogar con el mismo id → no cambia */
  /* nota con miembro_id de la pareja → se guarda con miembro_id del que escribe */
});
it('rechaza columnas desconocidas con 400', async () => { /* POST /api/ops con fila.{columna_rara} → 400 */ });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run worker/sync`
Expected: FAIL.

- [ ] **Step 3: Implementar.** Un solo `db.batch`:
  1. `UPDATE hogar SET version = version + 1`.
  2. Por cada operación nueva, un `INSERT ... ON CONFLICT(id) DO UPDATE ... WHERE <tabla>.hogar_id = excluded.hogar_id`, con `version = (SELECT version FROM hogar WHERE id = ?)` y `hogar_id` tomado de la sesión, nunca de la operación.
  3. `INSERT OR IGNORE INTO op_vista`.

Las operaciones ya vistas se filtran antes del batch; si no queda ninguna, la versión no sube. En `nota`, `miembro_id` se fuerza al de la sesión.

- [ ] **Step 4: Verificar**

Run: `npx vitest run worker/sync && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/esquema.ts worker
git commit -m "feat: apply idempotent operations and serve changes by version"
```

### Task 10: Copia local y cliente de sincronización

**Files:**
- Create: `app/datos/local.ts`, `app/datos/sync.ts`, `app/datos/sync.test.ts`

**Interfaces:**
- Consumes: `TABLAS_SYNC` y `Op` (Task 9), y las rutas `/api/ops` y `/api/cambios`.
- Produces:
  - `db` (Dexie): una tabla por `TablaSync`, más `cola` (Op, por orden de llegada) y `meta` (`{ clave: 'version', valor: number }`).
  - `escribir(tabla: TablaSync, fila, opciones?: { borrar?: boolean }): Promise<void>`: aplica en local y encola.
  - `sincronizar(fetcher = fetch): Promise<{ enviadas: number; version: number }>`: envía la cola, la vacía si responde 200 y pide `cambios` desde la versión guardada.
  - Lectura reactiva con `useLiveQuery` de `dexie-react-hooks`, que la usarán las pantallas en los planes 2 a 5.

- [ ] **Step 1: Escribir los tests que fallan** (`fake-indexeddb/auto` y un `fetcher` falso)

```ts
it('escribe al momento y conserva la cola si no hay red', async () => {
  await escribir('producto', { id: 'p1', nombre: 'Leche', estado: 'pendiente' });
  expect(await db.producto.get('p1')).toMatchObject({ nombre: 'Leche' });
  await expect(sincronizar(async () => { throw new TypeError('offline'); })).rejects.toThrow();
  expect(await db.cola.count()).toBe(1);
});
it('vacía la cola al enviarla y aplica cambios ajenos y borrados', async () => {
  /* fetcher: /api/ops → {version:5}; /api/cambios → {version:6, filas:{producto:[{id:'p2',...},{id:'p1',borrado:1}]}} */
  /* cola vacía, meta.version = 6, p2 existe, p1 no existe */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/datos/sync.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar.** Las filas con `borrado: 1` se eliminan de la copia local. Las operaciones viajan en lotes de hasta 100 y en orden. Un reintento envía las mismas operaciones con los mismos ids (la idempotencia es de la Task 9).

- [ ] **Step 4: Verificar**

Run: `npx vitest run app/datos/sync.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/datos package.json package-lock.json
git commit -m "feat: keep a local copy with an operation queue and sync it"
```

### Task 11: Bienvenida, invitación y entrada

**Files:**
- Create: `app/datos/acceso.ts`, `app/pantallas/Bienvenida.tsx`, `app/pantallas/Invitacion.tsx`, `app/pantallas/Bienvenida.test.tsx`
- Modify: `app/App.tsx`. Sin sesión (`GET /api/yo` → 401), todo lleva a `/bienvenida`, salvo `/invitacion`. Con sesión, `/bienvenida` lleva a `/semana`.

**Interfaces:**
- Consumes: las rutas de la Task 8 y `@simplewebauthn/browser` (`startRegistration` y `startAuthentication`).
- Produces:
  - `crearHogar(): Promise<void>`, `entrar(): Promise<void>` y `aceptarInvitacion(token: string): Promise<void>`;
  - errores con el mensaje en español del servidor, o "No se pudo usar Face ID. Vuelve a intentarlo." si el usuario cancela.

- [ ] **Step 1: Diseñar las dos pantallas antes del código**

Con impeccable, como extensión del mundo de `DESIGN.md`, sin concurso de conceptos:
- **Bienvenida:** "Despensa" en 34px, una línea de qué es, "Crear nuestro hogar" como botón principal y "Ya tengo cuenta: entrar" como enlace.
- **Invitación:** "Tu pareja te invita a su Despensa", el botón "Entrar con Face ID" y el estado de invitación caducada.

Registra el brief de superficie y pasa la revisión de acabado antes del Step 5.

- [ ] **Step 2: Escribir el test que falla**

```tsx
it('muestra el error del servidor si la invitación ya no vale', async () => {
  servidor.responde('/api/invitaciones/aceptar/opciones', 410, { error: 'Esta invitación ya no vale. Pide otra.' });
  render(<MemoryRouter initialEntries={['/invitacion#tok']}><Invitacion /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Entrar con Face ID' }));
  expect(await screen.findByText('Esta invitación ya no vale. Pide otra.')).toBeInTheDocument();
});
```

- [ ] **Step 3: Ejecutar y ver que falla**

Run: `npx vitest run app/pantallas/Bienvenida.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implementar** `acceso.ts` y las dos pantallas según el diseño del Step 1. El token se lee de `location.hash` y se borra de la URL con `history.replaceState` nada más leerlo.

- [ ] **Step 5: Verificar en local, de punta a punta**

Run: `npm test && npm run dev`
Expected:
- Todos los tests pasan.
- En Chrome, en `http://localhost:5173`, con el autenticador virtual de DevTools (WebAuthn): crear hogar lleva a `/semana`, que de momento es un marcador.
- "Ajustes" no existe aún. Para la invitación, `POST /api/invitaciones` desde la consola devuelve el enlace, y abrirlo en otro perfil permite entrar.

- [ ] **Step 6: Commit**

```bash
git add app .impeccable
git commit -m "feat: add the welcome and invitation screens with passkeys"
```

# Despensa, plan 2: recetas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La pestaña Recetas con datos reales. Incluye:
- el índice con búsqueda;
- la receta para cocinar con el tachado enlazado;
- un editor para crear, cambiar y borrar recetas;
- las fotos, guardadas en R2.

Todo funciona sobre la copia local, que a partir de este plan se abre con el hogar de la sesión y se sincroniza sola.

**Architecture:**
- **Pantallas:** leen la copia local de Dexie con `useLiveQuery` y escriben con `escribir()` (plan 1), que encola operaciones.
- **Sincronizador:** arranca con la sesión. Vacía la cola y trae cambios al abrir la app, al escribir, al volver a primer plano y al recuperar la red.
- **Reglas nuevas** (tipos, tiempos, búsqueda, medias, marcas automáticas en los pasos y cantidades escritas a mano): funciones puras en `shared/`.
- **Fotos:** se reducen en el móvil y se suben a `POST /api/fotos`. El Worker las guarda en R2 detrás de la interfaz `AlmacenFotos`.

**Tech Stack:** lo del plan 1, sin dependencias nuevas. Del navegador se usan `createImageBitmap` y `canvas.toBlob` para reducir fotos, y la Wake Lock API para que la pantalla no se apague; del Worker, R2.

**Spec:** `docs/superpowers/specs/2026-10-20-despensa-app-design.md`. Sus apartados 13 (decisiones 15 a 23, las de este plan) y 14 recogen lo decidido el 22/10/2026. Lee también:
- `DESIGN.md`, `PRODUCT.md` y `prototipo/recetas.html`;
- desde la Task 6, `prototipo/editor.html`;
- el plan anterior, `docs/superpowers/plans/2026-10-20-despensa-cimientos.md`.

## Global Constraints

- La interfaz en español; todo número con cifras tabulares (`font-feature-settings: "tnum" 1`) y coma decimal ("1,5 kg", "7,5").
- Los tokens de color, tipografía, radios y espaciado son exactamente los del frontmatter de `DESIGN.md`, en claro y en oscuro. No se introduce ningún color sin su pareja.
- Cada pantalla copia las medidas y clases de su prototipo aprobado en `prototipo/` y las reglas con nombre de `DESIGN.md`:
  - Strike, Don't Erase;
  - Linked Strike;
  - Ink Links;
  - Scale-Only Hierarchy.
- Con `prefers-reduced-motion`, sin trazos ni entradas animadas.
- Pila tipográfica: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`. Sin fuentes externas.
- **Datos personales (POL-MMNSEG-001-1.1):** seeds, fixtures, tests y capturas solo con datos inventados, las recetas de `prototipo/recetas.html`. La app no pide nombre, email ni teléfono.
- Ids de contenido: `crypto.randomUUID()`. La semilla usa ids fijos que empiezan por `ejemplo-`.
- Toda escritura en la copia local pasa por `escribir()` de `app/datos/sync.ts`; ninguna pantalla llama a `/api/ops` por su cuenta.
- Fechas del dominio en `Europe/Madrid`, en formato `YYYY-MM-DD`.
- **Git:**
  - Commits como PeterBits: antes del primer commit, `git var GIT_AUTHOR_IDENT` empieza por `PeterBits`.
  - Nada de `--author` ni `-c user.*`.
  - Nunca `git push`.
  - Rama `recetas`.
- Planes gratuitos de Cloudflare: nada que exija Workers Paid.
- Repo en Windows (Git Bash / PowerShell).

## Review Focus

- **"sal" dentro de "salsa":** una marca automática solo alarga el nombre con su plural ("cebolla" → "cebollas"). "Liga la salsa y echa sal" marca solo la segunda "sal". Lo prueba la Task 3.
- **Guardar sin red:** en la cocina puede no haber cobertura. La receta queda en la copia y sus operaciones en la cola, sin error. Solo la foto necesita red. Lo prueba la Task 4.
- **Editar una receta a medio cocinar:** el progreso se guarda por id de paso. Un paso borrado no cuenta y el resto sigue tachado. Lo prueba la Task 8.
- **Receta borrada mientras está abierta** (desde el otro móvil o desde el editor): la vista y el editor dicen "Esta receta ya no existe." en vez de quedarse en blanco. Lo prueban las Tasks 8 y 9.
- **La sesión caduca con cambios sin enviar:**
  - la app vuelve a la bienvenida;
  - la cola sigue en la copia de ese hogar;
  - al volver a entrar en el mismo hogar, sale con la siguiente sincronización.

  Lo prueba la Task 1.

## Plan de planes

Este es el plan 2 de 6.

3. **Semana:** propuesta, días activos, el domingo como día de comer, cambiar plato y hacer la lista. También:
   - añade al índice de Recetas "Esta semana" y "La que viene";
   - el modo elegir del recetario, para "Elegir otra receta";
   - Ajustes: invitar a tu pareja, cerrar sesión y versión.
4. **Lista:** repaso en casa, en el súper, frecuentes, terminar, vaciar y el botón de borrar producto.
5. **Registro:** diario, notas de cada uno y "Comimos otra cosa".
6. **En vivo y sin conexión:**
   - Durable Object y service worker;
   - abrir sin red en un móvil que nunca entró;
   - limpiar fotos sin receta y pasar a KV si no se quiere R2;
   - `docs/cloudflare.md` y primer despliegue.

## File Structure

```
shared/recetas.ts            tipos, frase de tipos, tiempo, nombre corto, básicos, búsqueda y medias
shared/cantidad.ts           (cambia) miles con punto, rangos y fracciones
shared/pasos.ts              (cambia) marcarPaso, quitarMarcas; plural en sugerirMarcas
shared/esquema.ts            (cambia) tipo FilaDe<T>
app/datos/acceso.ts          (cambia) leerSesion / olvidarSesion en lugar de haySesion
app/datos/sincronizacion.ts  cuándo se sincroniza: al abrir, al escribir, en primer plano, con red
app/datos/recetas.ts         leer, guardar y borrar recetas en la copia; borradores del editor
app/datos/semilla.ts         las diez recetas del prototipo, solo en desarrollo
app/datos/fotos.ts           reducir y subir fotos; su URL
app/datos/progreso.ts        pasos hechos de cada receta en este móvil (12 h)
app/datos/avisos.ts          el aviso con "Deshacer" de la línea de estado
app/componentes/LineaEstado.tsx
app/pantallas/Recetas.tsx    índice
app/pantallas/Receta.tsx     receta para cocinar
app/pantallas/Editor.tsx     crear y editar
app/estilos/recetas.css, editor.css
worker/fotos/almacen.ts      interfaz AlmacenFotos y su versión R2
worker/fotos/rutas.ts        POST /api/fotos, GET /api/fotos/:id
prototipo/editor.html        prototipo del editor (Task 6)
```

---

### Task 1: La copia local se abre con el hogar y se sincroniza sola

**Files:**
- Modify:
  - `app/datos/acceso.ts`: `haySesion` pasa a ser `leerSesion`, y se añade `olvidarSesion`.
  - `app/App.tsx`.
  - `app/preparar-pruebas.ts`: añade `import 'fake-indexeddb/auto'`, porque `Rutas` ya abre la copia.
  - `app/pantallas/Bienvenida.test.tsx`: `/api/yo` responde `{ miembroId, hogarId, miembros }`.
- Create: `app/datos/sincronizacion.ts`, `app/datos/sincronizacion.test.ts`, `app/App.test.tsx`.

**Interfaces:**
- Consumes:
  - `abrirCopia` y `copia` de `app/datos/local.ts`;
  - `sincronizar`, `escribir` y `SinSesion` de `app/datos/sync.ts`;
  - `GET /api/yo`, que responde `{ miembroId, hogarId, miembros }`.
- Produces:
  - `type Sesion = { hogarId: string; miembroId: string }`.
  - `leerSesion(): Promise<Sesion | null>`:
    - con 200, guarda `{ hogarId, miembroId }` en `localStorage['despensa.sesion']` y la devuelve;
    - con 401, la borra y devuelve `null`;
    - sin red, o si `/api/yo` tarda más de 4 s, devuelve lo guardado, o `null` si no hay nada.

    Un `localStorage` que lanza cuenta como vacío.
  - `olvidarSesion(): void`.
  - `iniciarSincronizacion(opciones: { alPerderSesion: () => void; fetcher?: typeof fetch; espera?: number }): () => void`. `espera` es la pausa antes de enviar lo escrito y vale 300 ms por defecto. Devuelve la función que lo para.
  - `Rutas`:
    - con sesión, llama a `abrirCopia(sesion.hogarId)` antes de pintar las pestañas y arranca la sincronización;
    - si `alPerderSesion` salta, llama a `olvidarSesion()` y vuelve a `/bienvenida`;
    - `alEntrar` de Bienvenida e Invitación pasa a ser `() => leerSesion().then(setSesion)`.

- [ ] **Step 1: Escribir los tests que fallan**

Cada test abre una copia con un hogar distinto (`abrirCopia(crypto.randomUUID())`), así no comparten cola. El `fetcher` falso responde según la ruta y guarda lo que recibe.

```ts
// app/datos/sincronizacion.test.ts
it('sincroniza al empezar y otra vez cuando se escribe', async () => {
  const parar = iniciarSincronizacion({ alPerderSesion: vi.fn(), fetcher, espera: 0 });
  await vi.waitFor(() => expect(rutas(fetcher)).toContain('/api/cambios?desde=0'));
  await escribir('receta', { id: 'r1', nombre: 'Lentejas estofadas' });
  await vi.waitFor(() => expect(opsEnviadas(fetcher)).toEqual([expect.objectContaining({ tabla: 'receta' })]));
  parar();
});
it('vuelve a sincronizar al volver a primer plano y al recuperar la red', async () => {
  /* tras la primera vuelta: document dispara visibilitychange con visibilityState 'visible' → otra llamada a /api/cambios;
     window dispara 'online' → otra más */
});
it('un fallo de red no se reintenta en bucle', async () => {
  /* fetcher que lanza TypeError; tras 200 ms sigue habiendo 1 llamada; window 'online' → 2 */
});
it('lo escrito durante un envío sale en el siguiente', async () => {
  /* /api/ops tarda hasta que el test lo suelta; se escribe r2 mientras; al soltar, hay un segundo /api/ops con r2 */
});
it('avisa una sola vez si no hay sesión, deja de sincronizar y no pierde la cola', async () => {
  /* /api/ops → 401: alPerderSesion llamado 1 vez; otra escritura no llama al fetcher; copia().cola.count() === 2 */
});
```

```ts
// app/datos/acceso (en Bienvenida.test.tsx o en un acceso.test.ts nuevo)
it('leerSesion recuerda el hogar para abrir sin red y lo olvida con un 401', async () => {
  servidor.responde('/api/yo', 200, { miembroId: 'm1', hogarId: 'h1', miembros: 1 });
  expect(await leerSesion()).toEqual({ hogarId: 'h1', miembroId: 'm1' });
  /* fetch que lanza → { hogarId: 'h1', miembroId: 'm1' }; 401 → null; luego fetch que lanza → null */
});
```

```tsx
// app/App.test.tsx
it('abre la copia del hogar y vuelve a la bienvenida si la sincronización recibe un 401', async () => {
  /* /api/yo 200 { hogarId: 'h1', … }; /api/cambios?desde=0 401 → se ve la Bienvenida; copia().name === 'despensa-h1' */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/datos/sincronizacion.test.ts app/App.test.tsx app/pantallas/Bienvenida.test.tsx`
Expected: FAIL (`iniciarSincronizacion` y `leerSesion` no existen).

- [ ] **Step 3: Implementar**

- **La cola:** se vigila con `liveQuery(() => copia().cola.count())` de `dexie`. Cuando cambia a más de 0, se programa una vuelta tras `espera`.
- **Una vuelta a la vez:** ya lo garantiza `sincronizar()`. Si acaba bien y `cola.count() > 0`, se programa otra vuelta. Si falla, no se reintenta hasta el siguiente disparo (escritura, primer plano o `online`).
- **Errores:**
  - `SinSesion` llama a `alPerderSesion` una vez y deja de escuchar;
  - cualquier otro error se apunta con `console.debug` y se espera al siguiente disparo.
- **Si arranca sin red y sin nada guardado,** `leerSesion` devuelve `null` y la app enseña la bienvenida. Es una limitación que se arregla en el plan 6; deja un comentario.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS, sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: open each hogar's local copy and keep it in sync on its own"
```

### Task 2: Reglas de las recetas

**Files:**
- Create: `shared/recetas.ts`, `shared/recetas.test.ts`

**Interfaces:**
- Consumes:
  - `TIPOS_INGREDIENTE` de `shared/esquema.ts`;
  - `normalizar` de `shared/secciones.ts`;
  - `media` de `shared/notas.ts`.
- Produces:
  - `type Tipo = 'hidratos' | 'proteína' | 'grasas' | 'fibra'` y `TIPOS: readonly Tipo[]`, en ese orden;
  - `tiposDe(ingredientes: { tipo: string | null }[]): Tipo[]`, sin repetir, en el orden de `TIPOS` e ignorando `null` y `'ninguno'`;
  - `esEnergetica(tipos: readonly Tipo[]): boolean`, verdadero si incluye `'hidratos'` (spec, apartado 8);
  - `fraseTipos(tipos: readonly Tipo[]): string`;
  - `leerTipos(json: string | null): Tipo[]`; `receta.tipos` viaja como texto JSON y, si es inválido, da `[]`;
  - `formatearMinutos(minutos: number | null): string`;
  - `cortoDe(nombre: string): string`;
  - `esBasico(nombre: string): boolean`;
  - `coincide(receta: { nombre: string; ingredientes: readonly string[] }, consulta: string): boolean`;
  - `mediasPorReceta(comidas: { id: string; receta_id: string | null }[], notas: { comida_id: string; valor: number }[]): Map<string, number>`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
it('saca los tipos de los ingredientes, sin repetir y en su orden', () => {
  expect(tiposDe([{ tipo: 'fibra' }, { tipo: 'hidratos' }, { tipo: null }, { tipo: 'ninguno' }, { tipo: 'hidratos' }])).toEqual(['hidratos', 'fibra']);
  expect(esEnergetica(['hidratos', 'proteína'])).toBe(true);
  expect(esEnergetica(['proteína', 'grasas'])).toBe(false);
});
it('escribe los tipos como el prototipo y lee los guardados', () => {
  expect(fraseTipos(['hidratos', 'proteína', 'fibra'])).toBe('Hidratos, proteína y fibra');
  expect(fraseTipos(['proteína'])).toBe('Proteína');
  expect(fraseTipos([])).toBe('');
  expect(leerTipos('["proteína","grasas"]')).toEqual(['proteína', 'grasas']);
  expect(leerTipos('no es json')).toEqual([]);
  expect(leerTipos('["azúcar"]')).toEqual([]);
  expect(leerTipos(null)).toEqual([]);
});
it('escribe el tiempo en horas y minutos', () => {
  expect(formatearMinutos(45)).toBe('45 min');
  expect(formatearMinutos(60)).toBe('1 h');
  expect(formatearMinutos(75)).toBe('1 h 15 min');
  expect(formatearMinutos(0)).toBe('');
  expect(formatearMinutos(null)).toBe('');
});
it('saca el nombre corto y reconoce los básicos', () => {
  expect(cortoDe('Lentejas estofadas')).toBe('lentejas');
  expect(cortoDe('  Albóndigas en salsa ')).toBe('albóndigas');
  expect(esBasico('Aceite de oliva')).toBe(true);
  expect(esBasico('SAL')).toBe(true);
  expect(esBasico('Salmón')).toBe(false);
});
it('busca por plato o ingrediente sin tildes ni mayúsculas', () => {
  const albondigas = { nombre: 'Albóndigas en salsa', ingredientes: ['Carne picada mixta', 'Huevo'] };
  expect(coincide(albondigas, 'albondigas')).toBe(true);
  expect(coincide(albondigas, 'PICADA')).toBe(true);
  expect(coincide(albondigas, 'merluza')).toBe(false);
  expect(coincide(albondigas, '  ')).toBe(true);
});
it('hace la media de todas las notas de lo que se comió de cada receta', () => {
  const comidas = [{ id: 'c1', receta_id: 'lentejas' }, { id: 'c2', receta_id: 'lentejas' }, { id: 'c3', receta_id: null }];
  const notas = [{ comida_id: 'c1', valor: 8 }, { comida_id: 'c1', valor: 9 }, { comida_id: 'c2', valor: 7 }, { comida_id: 'c3', valor: 2 }];
  expect(mediasPorReceta(comidas, notas)).toEqual(new Map([['lentejas', 8]]));
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/recetas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar en `shared/recetas.ts`**

- **Básicos** (spec, decisión 21): `sal`, `aceite`, `aceite de oliva`, `agua`, `laurel`, `harina`, `pimienta` y `pimienta negra`, comparados con `normalizar`.
- **`cortoDe`:** la primera palabra del nombre recortado, en minúsculas con `toLocaleLowerCase('es')`.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared/recetas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/recetas.ts shared/recetas.test.ts
git commit -m "feat: add recipe rules for types, times, search and ratings"
```

### Task 3: Lo que se escribe en el editor: cantidades y marcas

**Files:**
- Modify: `shared/cantidad.ts`, `shared/cantidad.test.ts`, `shared/pasos.ts`, `shared/pasos.test.ts`

**Interfaces:**
- Produces:
  - `leerCantidad` lee también miles con punto, rangos y fracciones (spec, decisión 19);
  - `marcarPaso(texto: string, ingredientes: { id: string; nombre: string }[]): string`, que marca un texto sin marcas;
  - `quitarMarcas(texto: string): string`, que cambia cada `{t|id}` por `t`;
  - `sugerirMarcas` mantiene su firma. Solo alarga la coincidencia con el plural: `s`, o `es` seguido de algo que no sea letra. Si detrás hay otra letra, esa aparición no vale y se busca la siguiente.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// shared/cantidad.test.ts
it('lee miles con punto, rangos por lo alto y fracciones', () => {
  expect(leerCantidad('1.000 g')).toEqual({ valor: 1000, unidad: 'g' });
  expect(leerCantidad('1.5 kg')).toEqual({ valor: 1.5, unidad: 'kg' });
  expect(leerCantidad('2-3 dientes')).toEqual({ valor: 3, unidad: 'dientes' });
  expect(leerCantidad('2 a 3 dientes')).toEqual({ valor: 3, unidad: 'dientes' });
  expect(leerCantidad('1/2 taza')).toEqual({ valor: 0.5, unidad: 'taza' });
  expect(leerCantidad('1 1/2 tazas')).toEqual({ valor: 1.5, unidad: 'tazas' });
  expect(leerCantidad('½ limón')).toEqual({ valor: 0.5, unidad: 'limón' });
  expect(formatearCantidades(sumarCantidades(['1.000 g', '500 g'].map(leerCantidad)))).toBe('1,5 kg');
});
it('una unidad con nombre de propiedad de objeto no rompe la suma', () => {
  expect(formatearCantidades(sumarCantidades([leerCantidad('2 constructor')]))).toBe('2 constructor');
});
```

```ts
// shared/pasos.test.ts
const ings = [
  { id: 'lentejas', nombre: 'Lentejas pardinas' }, { id: 'cebolla', nombre: 'Cebolla' },
  { id: 'pimiento', nombre: 'Pimiento verde' }, { id: 'ajo', nombre: 'Ajo' },
  { id: 'laurel', nombre: 'Laurel' }, { id: 'sal', nombre: 'Sal' }, { id: 'jengibre', nombre: 'Jengibre' },
];
it('marca lo que nombra cada paso con la cantidad que lleva delante', () => {
  expect(marcarPaso('Lava 500 g de lentejas y escúrrelas.', ings)).toBe('Lava {500 g de lentejas|lentejas} y escúrrelas.');
  expect(marcarPaso('Pica 2 cebollas, 1 pimiento verde y 2 dientes de ajo.', ings))
    .toBe('Pica {2 cebollas|cebolla}, {1 pimiento verde|pimiento} y {2 dientes de ajo|ajo}.');
  expect(marcarPaso('Ralla un trozo de jengibre.', ings)).toBe('Ralla {un trozo de jengibre|jengibre}.');
  expect(marcarPaso('Añade la hoja de laurel.', ings)).toBe('Añade la hoja de {laurel|laurel}.');
});
it('no confunde la sal con la salsa', () => {
  expect(marcarPaso('Liga la salsa y echa sal.', ings)).toBe('Liga la salsa y echa {sal|sal}.');
});
it('no toma por cantidad lo que no lo es', () => {
  expect(marcarPaso('Hornea a 200 °C con las lentejas.', ings)).toBe('Hornea a 200 °C con las {lentejas|lentejas}.');
});
it('quitar las marcas devuelve el texto escrito', () => {
  const texto = 'Pica 2 cebollas y sofríe con sal.';
  expect(quitarMarcas(marcarPaso(texto, ings))).toBe(texto);
});
it('no deja que unas llaves escritas a mano rompan las marcas', () => {
  expect(marcarPaso('Sala {al gusto} | sal', ings)).toBe('Sala (al gusto) / {sal|sal}');
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/cantidad.test.ts shared/pasos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`leerCantidad`, en `shared/cantidad.ts`:
- **Miles:** un punto seguido de exactamente tres cifras, y nada más, es separador de miles.
- **Rangos:** `N-M` y `N a M` valen M.
- **Fracciones:** `a/b`, `N a/b`, `½`, `¼` y `¾`.

Cambia también `u in MASA` por `Object.hasOwn`. Es el aviso pendiente de la Task 4 del plan 1, y lo prueba el test de `'2 constructor'`.

`marcarPaso`, en `shared/pasos.ts`:
1. Cambia `{` por `(`, `}` por `)` y `|` por `/`.
2. Toma `sugerirMarcas(texto, ingredientes)`, ordenadas por posición.
3. Para cada sugerencia, alarga `desde` hacia atrás si el texto que queda entre el final de la anterior (o el principio) y `desde` termina en una cantidad. Usa esta expresión regular:

   ```ts
   const CANTIDAD_DELANTE = /(?:^|[^\p{L}\p{N}])((?:\d+(?:[.,]\d+)*(?:\s*(?:-|a)\s*\d+(?:[.,]\d+)?)?(?:\s+\d+\/\d+)?|\d+\/\d+|[½¼¾]|un|una|unos|unas|medio|media|dos|tres|cuatro|cinco|seis)\s+(?:\p{L}+\s+)?(?:de\s+)?)$/iu;
   // el grupo 1 es lo que se suma a la marca
   ```

4. Escribe las marcas `{texto|id}` empezando por el final, así no cambian los índices de las que quedan.

- [ ] **Step 4: Verificar**

Run: `npx vitest run shared`
Expected: PASS, también los tests anteriores de `cantidad`, `lista` y `pasos`.

- [ ] **Step 5: Commit**

```bash
git add shared/cantidad.ts shared/cantidad.test.ts shared/pasos.ts shared/pasos.test.ts
git commit -m "feat: read typed quantities and mark the ingredients each step names"
```

### Task 4: Recetas en la copia local y semilla de desarrollo

**Files:**
- Modify:
  - `shared/esquema.ts`: exporta `FilaDe`;
  - `app/main.tsx`: en desarrollo crea `window.despensa.semilla`.
- Create: `app/datos/recetas.ts`, `app/datos/recetas.test.ts`, `app/datos/semilla.ts`, `app/datos/semilla.test.ts`

**Interfaces:**
- Consumes:
  - `escribir` y `copia` (plan 1);
  - de la Task 2: `Tipo`, `tiposDe`, `leerTipos`, `cortoDe`, `esBasico` y `mediasPorReceta`;
  - de la Task 3: `marcarPaso` y `quitarMarcas`;
  - `seccionDe` y `Seccion` de `shared/secciones.ts`.
- Produces:
  - **Tipos:**
    - `type FilaDe<T extends TablaSync> = z.output<(typeof TABLAS_SYNC)[T]>`, en `shared/esquema.ts`;
    - `type RecetaCompleta = { receta: FilaDe<'receta'>; ingredientes: FilaDe<'ingrediente'>[]; pasos: FilaDe<'paso'>[] }`, con ingredientes y pasos por `orden`;
    - `type ResumenReceta = { id: string; nombre: string; tipos: Tipo[]; minutos: number | null; media: number | null; ingredientes: string[] }`;
    - `type BorradorIngrediente = { id: string; nombre: string; cantidad: string; tipo: Tipo | null; seccion: Seccion; aLaLista: boolean; compra: string }`;
    - `type BorradorPaso = { id: string; texto: string; minutos: number | null }`, donde `texto` va sin marcas;
    - `type BorradorReceta = { id: string; nombre: string; raciones: number | null; minutos: number | null; fotoKey: string | null; ingredientes: BorradorIngrediente[]; pasos: BorradorPaso[] }`.
  - **Borradores:**
    - `borradorVacio(): BorradorReceta`: id nuevo, un ingrediente vacío y un paso vacío;
    - `ingredienteVacio(): BorradorIngrediente`: `seccion: 'Otros'`, `aLaLista: true`, `tipo: null`;
    - `pasoVacio(): BorradorPaso`;
    - `borradorDe(completa: RecetaCompleta): BorradorReceta`: pasos con `quitarMarcas` y `compra` vacía en vez de `null`.
  - **`guardarReceta(borrador: BorradorReceta): Promise<void>`:**
    - Con el nombre vacío lanza `Error('Ponle nombre a la receta.')`.
    - Se descartan los ingredientes sin nombre y los pasos sin texto.
    - Escribe la receta:
      - `corto` con `cortoDe(nombre)`;
      - `tipos` con `JSON.stringify(tiposDe(ingredientes))`;
      - `foto_key` con el `fotoKey` del borrador;
      - `notas` conservadas.
    - Escribe cada ingrediente con su `orden`. `cantidad` vacía y `compra` vacía se guardan como `null`, y `a_la_lista` como 0/1.
    - Escribe cada paso con `texto` igual a `marcarPaso(texto, ingredientes)`.
    - Borra, con `escribir(…, { borrar: true })`, los ingredientes y pasos de esa receta que estén en la copia y no en el borrador.
  - **`borrarReceta(id: string): Promise<() => Promise<void>>`:** borra la receta, sus ingredientes y sus pasos. Devuelve una función que los vuelve a escribir tal cual.
  - **Lecturas:**
    - `useRecetas(): ResumenReceta[] | undefined`, ordenadas con `localeCompare(…, 'es')`, con la media de `mediasPorReceta`;
    - `useReceta(id: string): RecetaCompleta | null | undefined`, donde `null` significa que no existe.
  - **Semilla:**
    - `RECETAS_DE_EJEMPLO: BorradorReceta[]`;
    - `cargarSemilla(): Promise<number>`, que guarda las diez con `guardarReceta` y devuelve 10.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// app/datos/recetas.test.ts (abrirCopia con un hogar nuevo en cada test; sin fetch)
it('guarda la receta con sus tipos, su nombre corto y los pasos marcados', async () => {
  const b = { ...borradorVacio(), nombre: 'Lentejas estofadas', raciones: 6, minutos: 60 };
  b.ingredientes = [
    { ...ingredienteVacio(), id: 'i1', nombre: 'Lentejas pardinas', cantidad: '500 g', tipo: 'hidratos', seccion: 'Despensa' },
    { ...ingredienteVacio(), id: 'i2', nombre: 'Sal', cantidad: 'al gusto', aLaLista: false, seccion: 'Despensa' },
    { ...ingredienteVacio(), id: 'i3', nombre: '  ' },
  ];
  b.pasos = [{ id: 'p1', texto: 'Lava 500 g de lentejas.', minutos: null }, { id: 'p2', texto: '', minutos: 5 }];
  await guardarReceta(b);
  expect(await copia().receta.get(b.id)).toMatchObject({ nombre: 'Lentejas estofadas', corto: 'lentejas', raciones: 6, minutos: 60, tipos: '["hidratos"]' });
  expect(await copia().ingrediente.get('i2')).toMatchObject({ a_la_lista: 0, cantidad: 'al gusto', compra: null, orden: 1 });
  expect(await copia().ingrediente.get('i3')).toBeUndefined();
  expect(await copia().paso.where('receta_id').equals(b.id).toArray())
    .toEqual([expect.objectContaining({ id: 'p1', orden: 0, texto: 'Lava {500 g de lentejas|i1}.' })]);
});
it('al volver a guardar borra lo que se quitó y conserva los ids', async () => { /* quitar i2 → copia().ingrediente.get('i2') undefined y una op borrar en la cola */ });
it('guardar sin red deja la receta en la copia y sus operaciones en la cola', async () => {
  /* sin fetcher: tras guardar 1 receta + 2 ingredientes + 1 paso, copia().cola.count() === 4 */
});
it('rechaza una receta sin nombre', async () => {
  await expect(guardarReceta({ ...borradorVacio(), nombre: '  ' })).rejects.toThrow('Ponle nombre a la receta.');
});
it('borrar una receta se puede deshacer', async () => {
  /* tras borrarReceta: no queda receta, ni ingredientes, ni pasos; tras deshacer(): vuelven con los mismos campos */
});
it('borradorDe devuelve los pasos sin marcas', async () => { /* 'Lava {500 g de lentejas|i1}.' → 'Lava 500 g de lentejas.' */ });
it('useRecetas trae la media y los ingredientes para buscar', async () => {
  /* renderHook; comida { id: 'c1', fecha: '2026-10-19', receta_id } y nota { id: 'n1', comida_id: 'c1', valor: 8 } con escribir → media 8 */
});
```

```ts
// app/datos/semilla.test.ts
it('carga las diez recetas del prototipo y repetirla no duplica', async () => {
  expect(await cargarSemilla()).toBe(10);
  await cargarSemilla();
  expect(await copia().receta.count()).toBe(10);
});
it('los tipos salen como en el prototipo', async () => {
  await cargarSemilla();
  expect(leerTipos((await copia().receta.get('ejemplo-lentejas'))!.tipos as string)).toEqual(['hidratos', 'proteína', 'fibra']);
  expect(leerTipos((await copia().receta.get('ejemplo-merluza'))!.tipos as string)).toEqual(['proteína', 'grasas']);
});
it('cada paso marca ingredientes de su propia receta', async () => {
  /* para cada paso, ingredientesDe(texto) ⊆ ids de ingredientes con el mismo receta_id; la de lentejas marca al menos 6 ingredientes */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/datos/recetas.test.ts app/datos/semilla.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`RECETAS_DE_EJEMPLO` son las diez recetas de `RECETAS` en `prototipo/recetas.html`:
- **Ids:** `ejemplo-<clave>`, `ejemplo-<clave>-i<n>` y `ejemplo-<clave>-p<n>`.
- **Pasos:** el texto del prototipo pasado por `quitarMarcas`, así `guardarReceta` vuelve a marcarlos solos.
- **Tiempo:** `minutos` sale de `tiempo` ('1 h' → 60, '45 min' → 45, '1 h 15 min' → 75), y `raciones` vale 6.
- **Ingredientes:**
  - `seccion` con `seccionDe(nombre)`;
  - `aLaLista` igual a `!esBasico(nombre)`;
  - `compra`: '1 cabeza' en Ajo, '1 bote' en Pimentón dulce y '1 botella' en Vino blanco;
  - un `tipo` por ingrediente, elegido para que `tiposDe` dé, como conjunto, los `tipos` del prototipo.

En `app/main.tsx`, solo con `import.meta.env.DEV`, se crea `window.despensa = { semilla: () => import('./datos/semilla').then((m) => m.cargarSemilla()) }`, con su tipo declarado. Así la semilla no entra en el build de producción.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo PASS. `grep -r "ejemplo-lentejas" dist` no encuentra nada.

- [ ] **Step 5: Commit**

```bash
git add shared/esquema.ts app
git commit -m "feat: read, save and delete recipes in the local copy, with a dev seed"
```

### Task 5: Fotos

**Files:**
- Create:
  - `worker/fotos/almacen.ts`, `worker/fotos/rutas.ts`, `worker/fotos/rutas.test.ts`;
  - `app/datos/fotos.ts`, `app/datos/fotos.test.ts`.

  Si las ayudas de `worker/auth/rutas.test.ts` (verificador falso, `pedir`, `crearHogar`) hacen falta en los dos ficheros de test, muévelas a `worker/pruebas.ts`.
- Modify:
  - `worker/index.ts`: monta `rutasFotos(app)` después de `requiereSesion`;
  - `worker/sync/ops.ts` y `worker/sync/ops.test.ts`: los ajustes pendientes del plan 1.

**Interfaces:**
- Produces:
  - **Almacén:**
    - `type TipoFoto = 'image/jpeg' | 'image/webp'`;
    - `interface AlmacenFotos { guardar(clave: string, datos: ArrayBuffer, tipo: TipoFoto): Promise<void>; leer(clave: string): Promise<{ cuerpo: ReadableStream; tipo: string } | null>; borrar(clave: string): Promise<void> }`;
    - `almacenR2(bucket: R2Bucket): AlmacenFotos`.
  - **`POST /api/fotos`**, con los bytes en el cuerpo y `Content-Type: image/jpeg` o `image/webp`:
    - responde 201 `{ id }`, con `id = crypto.randomUUID()`, y guarda en la clave `<hogarId>/<id>`;
    - 415 `{ error: 'La foto tiene que ser JPEG o WebP.' }` si la cabecera o los primeros bytes no cuadran (JPEG: `FF D8 FF`; WebP: `RIFF` y `WEBP` en la posición 8);
    - 413 `{ error: 'La foto pesa demasiado. Prueba con otra.' }` por encima de 5 MB (`5 * 1024 * 1024`);
    - 400 si el cuerpo viene vacío.
  - **`GET /api/fotos/:id`:**
    - responde 200 con el `Content-Type` guardado, `Cache-Control: private, max-age=31536000, immutable` y `X-Content-Type-Options: nosniff`;
    - 404 `{ error: 'Esa foto no existe.' }` si no está en el hogar de la sesión o el id no tiene forma de UUID.
  - **Cliente:**
    - `reducirFoto(archivo: Blob): Promise<Blob>`, a 1600 px de lado mayor; prueba `image/webp` al 0,8 y, si el blob no sale en WebP, usa `image/jpeg` al 0,8;
    - `subirFoto(archivo: Blob, opciones?: { reducir?: (b: Blob) => Promise<Blob>; fetcher?: typeof fetch }): Promise<string>`, que devuelve el id;
    - `urlFoto(id: string): string`, que devuelve `/api/fotos/<id>`.
  - **Errores de `subirFoto`:**
    - si `reducir` lanza: 'No se pudo leer la foto. Prueba con otra.';
    - sin red: 'No hay conexión. Prueba otra vez con cobertura.';
    - si el servidor la rechaza: su `error`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// worker/fotos/rutas.test.ts (JPEG = bytes inventados que empiezan por FF D8 FF E0)
it('guarda una foto y solo la sirve a su hogar', async () => {
  const { cookie } = await crearHogar();
  const r = await subir(JPEG, 'image/jpeg', cookie);
  expect(r.status).toBe(201);
  const { id } = await r.json<{ id: string }>();
  const foto = await pedir('GET', `/api/fotos/${id}`, undefined, cookie);
  expect(foto.status).toBe(200);
  expect(foto.headers.get('Content-Type')).toBe('image/jpeg');
  expect(foto.headers.get('Cache-Control')).toBe('private, max-age=31536000, immutable');
  expect(new Uint8Array(await foto.arrayBuffer())).toEqual(JPEG);
  const otro = await crearHogar();
  expect((await pedir('GET', `/api/fotos/${id}`, undefined, otro.cookie)).status).toBe(404);
});
it('rechaza lo que no es JPEG ni WebP aunque lo diga la cabecera', async () => {
  expect((await subir(new TextEncoder().encode('<html>'), 'text/html', cookie)).status).toBe(415);
  expect((await subir(new TextEncoder().encode('<html>'), 'image/jpeg', cookie)).status).toBe(415);
});
it('rechaza una foto de más de 5 MB', async () => { /* JPEG de 5 * 1024 * 1024 + 1 bytes → 413 con el mensaje */ });
it('pide sesión', async () => { expect((await subir(JPEG, 'image/jpeg')).status).toBe(401); });
```

```ts
// worker/sync/ops.test.ts
it('una operación vista en otro hogar no impide aplicarla en este', async () => {
  /* op_vista ('op-x', otroHogar); aplicarOps(H, …, [op con id 'op-x']) → aplicadas 1 y la fila existe */
});
```

```ts
// app/datos/fotos.test.ts
it('sube la foto reducida y devuelve su id', async () => {
  /* reducir → Blob JPEG; fetcher('/api/fotos', { method: 'POST', headers Content-Type image/jpeg, body }) → 201 { id: 'f1' }; resultado 'f1' */
});
it('avisa en español si no hay red o la foto no se puede leer', async () => {
  /* fetcher lanza TypeError → 'No hay conexión. Prueba otra vez con cobertura.'; reducir lanza → 'No se pudo leer la foto. Prueba con otra.' */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run worker/fotos worker/sync app/datos/fotos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar las fotos**

- El id se valida con `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/`.
- Las rutas reciben el almacén como `almacenR2(c.env.FOTOS)`.
- `soloMismoOrigen` ya protege el POST.
- `reducirFoto` usa `createImageBitmap` y un `canvas`. No se prueba en jsdom, así que se inyecta en los tests.

- [ ] **Step 4: Ajustes pendientes del plan 1 en `worker/sync/ops.ts`**

- Cambia el nombre de `marcas` por `huecos`. Son los `?` de SQL; `marcas` son las de los pasos.
- La consulta de operaciones vistas filtra por hogar: `SELECT id FROM op_vista WHERE hogar_id = ? AND id IN (…)`.

- [ ] **Step 5: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS.

- [ ] **Step 6: Commit**

```bash
git add worker app/datos/fotos.ts app/datos/fotos.test.ts
git commit -m "feat: store recipe photos in R2 behind a small storage interface"
```

(Si los ajustes del Step 4 quedan mejor aparte: `refactor: name SQL placeholders apart from step marks and scope seen ops to the hogar`.)

### Task 6: Diseño del editor y de lo que falta en Recetas

**Quién:** el controlador de la sesión, no un subagente. La ronda de impeccable necesita la sesión principal (regla R3 del plan 1). Si el usuario no elige entre opciones, se construye la principal y se le dice qué se supuso.

**Files:**
- Create: `prototipo/editor.html`, `.impeccable/surfaces/prototipo-editor-html.md`
- Modify:
  - `prototipo/recetas.html` y `prototipo/index.html`;
  - `DESIGN.md`;
  - `app/estilos/acceso.css` y `app/pantallas/Bienvenida.tsx` / `Invitacion.tsx`, solo si la revisión de acabado de esas pantallas lo pide.

**Fijado por este plan** (el diseño decide el aspecto, no esto; las Tasks 7 a 9 lo prueban con estos nombres accesibles):
- **Índice:**
  - "Nueva receta" es un enlace a `/recetas/nueva` y se ve también con el índice vacío;
  - sin recetas no hay buscador ni sección "Todas";
  - una receta sin notas no lleva puntos guía ni cifra.
- **Receta:**
  - "Editar", a la derecha de "‹ Recetas", es un enlace a `/recetas/<id>/editar`;
  - la foto no empuja los ingredientes fuera de la primera pantalla (contrato de Recetas: nada de ficha con foto grande).
- **Editor, arriba:** botones "Cancelar" y "Guardar".
- **Editor, campos generales:** "Nombre", "Raciones" y "Tiempo en minutos".
- **Editor, foto:** botones "Añadir foto" (o "Cambiar foto") y "Quitar foto".
- **Editor, cada ingrediente N:**
  - campos "Ingrediente N" y "Cantidad del ingrediente N";
  - grupo "Tipo del ingrediente N": botones Hidratos, Proteína, Grasas y Fibra con `aria-pressed`; uno como mucho, y otro toque lo quita;
  - "Sección del ingrediente N": un `select` con `SECCIONES`;
  - casilla "No va a la lista";
  - campo "Se compra", opcional;
  - botón "Quitar ingrediente N".
- **Editor, al final de los ingredientes:** botón "Añadir ingrediente".
- **Editor, cada paso N:**
  - "Paso N", un `textarea`;
  - "Minutos del paso N";
  - una línea "Usa: …" con los nombres de los ingredientes que nombra;
  - botón "Quitar paso N".
- **Editor, al final de los pasos:** botón "Añadir paso"; al editar una receta, además, "Borrar receta".
- **Editor, cancelar:** con cambios sin guardar, "Cancelar" ofrece "Descartar cambios".
- **Editor, mensajes:** "Subiendo la foto…", el error de la foto y "Ponle nombre a la receta.".

- [ ] **Step 1: Preparar la D1 local**

La D1 local de desarrollo aún tiene el `0001` viejo (`ingrediente.cantidad REAL` y `unidad`). Las cantidades "3" volverían como número y romperían el editor.
1. Renombrar `.wrangler/state` a `.wrangler/state-antes-de-recetas`. Es reversible y conserva todo.
2. `npm run db:migrar:local`.
3. Decírselo al usuario: con renombrarla al revés vuelve la anterior.

- [ ] **Step 2: Ronda de impeccable**

Diseña el editor y lo que falta en Recetas (Nueva receta, Editar, foto, índice vacío) como extensión del mundo de `DESIGN.md`. Prototipo en `prototipo/editor.html` y cambios en `prototipo/recetas.html`, con datos inventados.

- [ ] **Step 3: Revisión de acabado**

Capturas en claro y oscuro, a 375 y 390. Corrige lo que salga.

- [ ] **Step 4: Documentar**

- El contrato de superficie del editor.
- En `DESIGN.md`:
  - los componentes nuevos (campos del editor, foto de receta, índice vacío);
  - "enlazadas por el hash de la URL" pasa a ser "enlazadas por la URL".

- [ ] **Step 5: Acabado de Bienvenida e Invitación**

Revisión de acabado de las dos pantallas en la app real (`npm run dev`, claro y oscuro), pendiente del plan 1. Aplica las correcciones.

- [ ] **Step 6: Commit**

```bash
git add prototipo .impeccable DESIGN.md
git commit -m "feat: add the recipe editor prototype and extend the design system"
```

Si hay correcciones de Bienvenida e Invitación, van en su propio commit `fix:`.

### Task 7: Índice de recetas

**Files:**
- Create:
  - `app/pantallas/Recetas.tsx`, `app/pantallas/Recetas.test.tsx`, `app/estilos/recetas.css`;
  - `app/componentes/LineaEstado.tsx`, `app/datos/avisos.ts`.
- Modify: `app/App.tsx`. Rutas `/recetas`, `/recetas/nueva`, `/recetas/:id` y `/recetas/:id/editar`. Las tres últimas pintan de momento el marcador `Pantalla` hasta las Tasks 8 y 9.

**Interfaces:**
- Consumes:
  - `useRecetas` (Task 4);
  - `coincide`, `fraseTipos` y `formatearMinutos` (Task 2);
  - `formatearNota` (plan 1);
  - el índice de `prototipo/recetas.html` tal como lo dejó la Task 6.
- Produces:
  - `type Aviso = { texto: string; deshacer: () => void | Promise<void> }`;
  - `ponerAviso(aviso: Aviso | null): void` y `useAviso(): Aviso | null`;
  - `<LineaEstado />`:
    - es la línea de estado de `DESIGN.md` para pantallas sin botón fijo: "texto · Deshacer", sobre `ground` y encima de la barra de pestañas;
    - "Deshacer" ejecuta y limpia;
    - cualquier cambio de ruta limpia el aviso.
  - `<Recetas />` en `/recetas`:
    - **Arriba:** título "Recetas", buscador (`label` "Buscar receta", marcador "Buscar por plato o ingrediente") y el enlace "Nueva receta".
    - **"Todas":** sección con el número de recetas a la derecha.
    - **Cada fila** es un enlace a `/recetas/<id>`:
      - el nombre;
      - la nota con su rótulo, o nada si no tiene;
      - debajo, `fraseTipos · formatearMinutos`, sin las partes vacías.
    - **Al buscar:**
      - la sección pasa a ser "Resultados" con su número;
      - sin coincidencias, se lee "Ninguna receta coincide con «…».".
    - **Al volver** de una receta con el botón atrás, el índice recupera la posición de scroll y entra desde la izquierda.

- [ ] **Step 1: Escribir los tests que fallan**

```tsx
it('lista las recetas por nombre con su nota, y sin nota no pinta cifra', async () => {
  /* guardarReceta de 'Merluza en salsa verde' y 'Lentejas estofadas'; comida + nota 8 para lentejas */
  render(<MemoryRouter initialEntries={['/recetas']}><Recetas /></MemoryRouter>);
  const lentejas = await screen.findByRole('link', { name: /Lentejas estofadas/ });
  expect(lentejas).toHaveAttribute('href', expect.stringMatching(/^\/recetas\/.+/));
  expect(lentejas).toHaveTextContent(/nota\s*8/);
  expect(screen.getByRole('link', { name: /Merluza/ })).not.toHaveTextContent(/nota/);
  expect(screen.getByRole('heading', { name: /Todas/ })).toHaveTextContent('2');
});
it('busca por ingrediente y dice cuando no hay ninguna', async () => {
  /* escribir 'pardinas' → 'Resultados' con 1; 'xyz' → 'Ninguna receta coincide con «xyz».' */
});
it('con el recetario vacío ofrece crear la primera', async () => {
  expect(await screen.findByRole('link', { name: 'Nueva receta' })).toHaveAttribute('href', '/recetas/nueva');
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});
it('el aviso con deshacer se queda hasta usarlo', async () => {
  /* ponerAviso({ texto: 'Receta borrada', deshacer }); <LineaEstado /> enseña 'Receta borrada'; clic en 'Deshacer' → deshacer llamado y la línea desaparece */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Recetas.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** según el prototipo. Mientras `useRecetas()` es `undefined`, solo se pinta la cabecera.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: PASS.

En `npm run dev`, con sesión y tras `await despensa.semilla()` en la consola, el índice enseña las diez recetas en claro y en oscuro.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: add the recipe index with search"
```

### Task 8: La receta para cocinar

**Files:**
- Create: `app/pantallas/Receta.tsx`, `app/pantallas/Receta.test.tsx`, `app/datos/progreso.ts`, `app/datos/progreso.test.ts`
- Modify: `app/App.tsx` (`/recetas/:id`), `app/estilos/recetas.css`

**Interfaces:**
- Consumes:
  - `useReceta` (Task 4);
  - `trozos` e `ingredientesGastados` (plan 1);
  - `fraseTipos`, `leerTipos` y `formatearMinutos` (Task 2);
  - `urlFoto` (Task 5);
  - `ponerAviso` y `<LineaEstado />` (Task 7);
  - la receta de `prototipo/recetas.html` tal como la dejó la Task 6.
- Produces:
  - `leerProgreso(recetaId: string, ahora?: number): Set<string>`, con los ids de los pasos hechos;
  - `guardarProgreso(recetaId: string, hechos: Set<string>, ahora?: number): void`:
    - guarda en `localStorage['despensa.progreso.' + recetaId]` el valor `{ hechos: string[], hasta: ahora + 12 h }`;
    - con el conjunto vacío borra la clave;
    - pasado `hasta`, se lee vacío;
    - si `localStorage` lanza, el progreso se queda en memoria.
  - `<Receta />` en `/recetas/:id`:
    - **Arriba:**
      - "‹ Recetas" vuelve atrás si se vino del índice; si no, va a `/recetas`;
      - "Editar".
    - **Cabecera:**
      - el título;
      - debajo, `fraseTipos · N raciones · formatearMinutos`, sin las partes vacías;
      - la foto según la Task 6;
      - la línea "La pantalla no se apagará mientras cocináis" mientras dure el `wakeLock` de la pantalla, que se vuelve a pedir al volver a primer plano y se suelta al salir.
    - **Ingredientes:** cada `li` lleva la clase `used` cuando está gastado.
    - **Pasos:**
      - cada paso es un `button` con `aria-pressed` y la clase `done` cuando está hecho;
      - el primero sin hacer lleva `aria-current="step"`;
      - las cantidades van en `<b>`;
      - el tiempo de cada paso se escribe con `formatearMinutos`.
    - **"N de M":** al lado de "Pasos" en cuanto hay alguno hecho.
    - **Al terminar:** "Receta terminada · Empezar de nuevo". Empezar de nuevo pone el aviso "Progreso borrado" con un deshacer que devuelve el progreso y la posición.
    - **Si la receta no existe** (`null`): "Esta receta ya no existe." y el enlace de vuelta.

- [ ] **Step 1: Escribir los tests que fallan**

```tsx
// receta de prueba: i1 'Lentejas pardinas', i2 'Sal'; pasos 'Lava 500 g de lentejas.' y 'Cuece las lentejas con sal.' (marcados al guardar)
it('tachar el último paso que usa un ingrediente lo tacha arriba', async () => {
  await userEvent.click(await screen.findByRole('button', { name: /Paso 1/ }));
  expect(screen.getByText('Lentejas pardinas').closest('li')).not.toHaveClass('used');
  await userEvent.click(screen.getByRole('button', { name: /Paso 2/ }));
  expect(screen.getByText('Lentejas pardinas').closest('li')).toHaveClass('used');
  expect(screen.getByText('Sal').closest('li')).toHaveClass('used');
  expect(screen.getByRole('heading', { name: /Pasos/ })).toHaveTextContent('2 de 2');
  expect(screen.getByText(/Receta terminada/)).toBeInTheDocument();
});
it('marca el paso actual', async () => { /* el paso 1 lleva aria-current="step"; tras tocarlo, el 2 */ });
it('empezar de nuevo se puede deshacer', async () => { /* tras terminar: 'Empezar de nuevo' → ningún paso hecho y aviso 'Progreso borrado'; 'Deshacer' → los dos hechos */ });
it('un paso que ya no existe no cuenta en el progreso', async () => {
  /* guardarProgreso(id, new Set([pasoBorrado, p1])) → al abrir, 'Pasos' muestra '1 de 2' */
});
it('una receta borrada enseña que ya no existe', async () => { /* /recetas/no-esta → 'Esta receta ya no existe.' */ });
it('pide que la pantalla no se apague mientras está abierta', async () => {
  /* navigator.wakeLock.request falso → llamado con 'screen'; se ve la línea; al desmontar, release() */
});
```

```ts
// app/datos/progreso.test.ts
it('recuerda los pasos hechos y los olvida a las 12 horas', () => {
  guardarProgreso('r1', new Set(['p1']), 0);
  expect(leerProgreso('r1', 12 * 3600_000 - 1)).toEqual(new Set(['p1']));
  expect(leerProgreso('r1', 12 * 3600_000 + 1)).toEqual(new Set());
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Receta.test.tsx app/datos/progreso.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar** según el prototipo, incluidos `fresh` y `fresh-off`. El tachado se calcula con `ingredientesGastados(textos, índices hechos)`, pasando de ids a índices en el borde.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: PASS.

En `npm run dev`:
- las lentejas de la semilla se cocinan entera;
- recargar mantiene el progreso;
- "Empezar de nuevo" se deshace.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: cook a recipe step by step with linked strikes"
```

### Task 9: El editor

**Files:**
- Create: `app/pantallas/Editor.tsx`, `app/pantallas/Editor.test.tsx`, `app/estilos/editor.css`
- Modify: `app/App.tsx` (`/recetas/nueva` y `/recetas/:id/editar`)

**Interfaces:**
- Consumes:
  - de la Task 4: `borradorVacio`, `borradorDe`, `ingredienteVacio`, `pasoVacio`, `guardarReceta`, `borrarReceta` y `useReceta`;
  - de la Task 3: `marcarPaso`, y del plan 1, `ingredientesDe`;
  - `esBasico` (Task 2), `seccionDe` y `SECCIONES`;
  - `subirFoto` y `urlFoto` (Task 5);
  - `ponerAviso` (Task 7);
  - `prototipo/editor.html` (Task 6), con los nombres accesibles fijados allí.
- Produces: `<Editor />`:
  - **Carga:**
    - en `/recetas/nueva`, con `borradorVacio()`;
    - en `/recetas/:id/editar`, con `borradorDe(...)` una sola vez cuando carga la receta;
    - si la receta no existe: "Esta receta ya no existe.".
  - **Nombre de un ingrediente:** mientras no se hayan tocado esos campos, al escribirlo se pone la sección con `seccionDe(nombre)` y "No va a la lista" con `esBasico(nombre)`.
  - **Línea "Usa: …"** de cada paso: los nombres de `ingredientesDe(marcarPaso(texto, ingredientes))`, o nada si no nombra ninguno.
  - **Guardar:**
    - llama a `guardarReceta`;
    - una receta nueva navega a `/recetas/<id>` con `replace`;
    - al editar, vuelve atrás.
    - El error de nombre se enseña y lleva el foco al campo "Nombre".
  - **Cancelar:**
    - sin cambios, vuelve atrás;
    - con cambios, enseña "Descartar cambios", que vuelve atrás sin escribir nada.
  - **Borrar receta:** llama a `borrarReceta`, navega a `/recetas` con `replace` y pone el aviso `{ texto: 'Receta borrada', deshacer }`.
  - **Foto:**
    - elegir un archivo llama a `subirFoto`, enseña "Subiendo la foto…" mientras tanto y pone `fotoKey` con el id;
    - si falla, enseña el mensaje;
    - "Quitar foto" pone `fotoKey` a `null`.

- [ ] **Step 1: Escribir los tests que fallan**

```tsx
it('crea una receta y abre su vista', async () => {
  /* /recetas/nueva dentro de <Routes> con /recetas/:id → <Ubicacion /> */
  await userEvent.type(screen.getByLabelText('Nombre'), 'Lentejas estofadas');
  await userEvent.type(screen.getByLabelText('Ingrediente 1'), 'Lentejas pardinas');
  await userEvent.type(screen.getByLabelText('Cantidad del ingrediente 1'), '500 g');
  await userEvent.click(within(screen.getByRole('group', { name: 'Tipo del ingrediente 1' })).getByRole('button', { name: 'Hidratos' }));
  await userEvent.type(screen.getByLabelText('Paso 1'), 'Lava 500 g de lentejas.');
  expect(screen.getByText(/Usa: Lentejas pardinas/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  /* la ubicación es /recetas/<id>; copia().receta tiene una fila con tipos '["hidratos"]'; su paso lleva la marca */
});
it('propone la sección y si va a la lista al escribir el ingrediente', async () => {
  await userEvent.type(screen.getByLabelText('Ingrediente 1'), 'Sal');
  expect(screen.getByLabelText('Sección del ingrediente 1')).toHaveValue('Despensa');
  expect(screen.getByLabelText('No va a la lista')).toBeChecked();
});
it('sin nombre no guarda y lo dice', async () => { /* Guardar → 'Ponle nombre a la receta.' y foco en Nombre; copia().cola.count() === 0 */ });
it('editar conserva los ids y quitar un ingrediente lo borra', async () => { /* receta guardada con i1 e i2; 'Quitar ingrediente 2', Guardar → i1 sigue, i2 no */ });
it('cancelar con cambios pide descartarlos', async () => { /* escribir en Nombre, 'Cancelar' → aparece 'Descartar cambios'; al pulsarlo sale sin escribir nada */ });
it('borrar la receta vuelve al índice con un aviso que deshace', async () => { /* 'Borrar receta' → /recetas; aviso 'Receta borrada'; su deshacer devuelve la receta */ });
it('la foto se sube al elegirla y se puede quitar', async () => {
  /* vi.mock('../datos/fotos') con subirFoto → 'f1'; userEvent.upload en el input de la foto; se ve img con src /api/fotos/f1; 'Quitar foto' la quita */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Editor.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** según `prototipo/editor.html`. Raciones, tiempo y minutos se leen como enteros; lo que no sea un entero mayor que 0 es `null`.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS.

En `npm run dev`:
- crear una receta con foto (una imagen inventada, por ejemplo un JPEG de color liso) lleva a su vista, con la foto;
- editarla conserva lo escrito;
- borrarla y deshacer la devuelve.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: create, edit and delete recipes with photos"
```

### Task 10: De punta a punta, capturas y README

**Files:**
- Modify: `README.md`
- Create: `docs/capturas/app-recetas-*.png`

- [ ] **Step 1: Verificar todo**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo PASS. Apunta el número de tests.

- [ ] **Step 2: De punta a punta en Chrome**

En `http://localhost:5173`, con un autenticador virtual (como en la Task 11 del plan 1, en Chrome sin interfaz si el MCP no deja usar WebAuthn):
1. Crear hogar.
2. `/recetas` vacío.
3. `await despensa.semilla()`, y el índice enseña diez recetas.
4. Cocinar las lentejas, recargar y que el progreso siga.
5. Crear una receta con foto, editarla, borrarla y deshacer.
6. Comprobar en la D1 local que las filas llegaron, con `npx wrangler d1 execute despensa --local --command "SELECT count(*) FROM receta"`.

- [ ] **Step 3: Capturas**

Claro y oscuro a 390 px: el índice, una receta a medio cocinar y el editor, con las recetas inventadas. Van en `docs/capturas/` con el patrón de nombres actual.

- [ ] **Step 4: README**

- En la tabla de estado, "Recetas: Funciona".
- La sección "La app hoy", con las capturas nuevas.
- En "Cómo se usa hoy", las recetas.
- En "Comandos" o "Instalar en tu ordenador", la semilla (`await despensa.semilla()` en la consola, solo en desarrollo).
- El número de tests.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/capturas
git commit -m "docs: show the recipes tab in the README"
```

Después, el controlador hace la revisión de acabado de las tres pantallas con impeccable y corrige lo que salga, antes de la revisión final de la rama.

# Despensa, plan 3: semana — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La pestaña Semana con datos reales. Incluye:
- "La que viene": la propuesta, los días activos, el domingo en casa o fuera, cambiar un plato por una sugerencia o por cualquier receta, y hacer o actualizar la lista;
- "Esta semana": lo que toca hoy y los días que ya pasaron;
- en el índice de Recetas, las secciones "Esta semana" y "La que viene";
- Ajustes: invitar a tu pareja, cerrar sesión y la versión.

**Architecture:**
- **Reglas puras** en `shared/semana.ts` y `shared/fechas.ts`: reparto con días fuera, días de una semana nueva, última vez de cada receta, propuesta por huecos, sugerencias, "Hace N semanas" y el estado de la lista.
- **La semana en la copia local** (`app/datos/semana.ts`): compone la vista de una semana a partir de lo guardado y, para lo que no se ha guardado, de la propuesta. Cada gesto escribe con `escribir()` solo las filas que toca, con ids fijos sacados del lunes. "Hacer la lista" escribe los productos.
- **Pantallas:** `Semana.tsx` lee `useSemana(lunes)`; el modo elegir del recetario y Ajustes cuelgan de `/semana/…`.

**Tech Stack:** lo de los planes 1 y 2, sin dependencias nuevas. Del navegador, la Web Share API (`navigator.share`) y el portapapeles (`navigator.clipboard.writeText`).

**Spec:** `docs/superpowers/specs/2026-10-20-despensa-app-design.md`. Sus apartados 8, 9 y 13 (decisiones 24 a 34, las de este plan) mandan. Lee también:
- `DESIGN.md`, `PRODUCT.md`, `prototipo/semana.html` y `.impeccable/surfaces/prototipo-semana-html.md`;
- desde la Task 4, lo que la Task 3 deje en `prototipo/`;
- el plan anterior, `docs/superpowers/plans/2026-10-22-despensa-recetas.md`.

## Global Constraints

- La interfaz en español; todo número con cifras tabulares y coma decimal ("8,5").
- Los tokens de color, tipografía, radios y espaciado son exactamente los del frontmatter de `DESIGN.md`, en claro y en oscuro. No se introduce ningún color sin su pareja.
- Cada pantalla copia las medidas y clases de su prototipo aprobado y las reglas con nombre de `DESIGN.md`: Activity Tint, Strike Don't Erase, Moving Letters, Ink Links, Scale-Only Hierarchy, Undo Don't Ask.
- Con `prefers-reduced-motion`, sin trazos, entradas ni FLIP. En jsdom `window.matchMedia` no existe: se lee como `window.matchMedia?.(…)`.
- Pila tipográfica del sistema; sin fuentes externas.
- **Datos personales (POL-MMNSEG-001-1.1):** semilla, tests y capturas solo con datos inventados (las recetas de `prototipo/recetas.html` y notas inventadas). La app no pide nombre, email ni teléfono. El enlace de invitación no se registra en consola ni en logs.
- Toda escritura en la copia local pasa por `escribir()` de `app/datos/sync.ts`.
- Fechas del dominio en `Europe/Madrid`, en `YYYY-MM-DD`; `hoy` sale de `hoyEnMadrid(new Date())`. Los tests de pantallas fijan la fecha con `vi.useFakeTimers({ toFake: ['Date'] })` y `vi.setSystemTime(…)`, sin falsear los temporizadores (Dexie y Testing Library los necesitan).
- **Ids fijos de la semana:** `semana-<lunes>`, `semana-<lunes>-d<0..6>` y `semana-<lunes>-h<1|2>`. Productos e ids de contenido nuevos: `crypto.randomUUID()`. La semilla usa ids que empiezan por `ejemplo-`.
- Un texto solo para lectores de pantalla nunca empieza por espacio dentro del `.sr`: el espacio va fuera (`Quitar <span className="sr">paso 1</span>`), o el nombre se calcula mal.
- **Git:**
  - Commits como PeterBits: antes del primer commit, `git var GIT_AUTHOR_IDENT` empieza por `PeterBits`.
  - Nada de `--author` ni `-c user.*`.
  - Nunca `git push`.
  - Rama `semana`, que sale de `recetas`.
- Planes gratuitos de Cloudflare: nada que exija Workers Paid.
- Repo en Windows (Git Bash / PowerShell).

## Review Focus

- **Los dos planifican la misma semana, uno sin red:** ids fijos por lunes, día y hueco. Nunca hay dos semanas para el mismo lunes, y un gesto no pisa lo que no tocó: cambiar un día no reescribe los platos. Lo prueba la Task 2.
- **Una receta del menú se borra** (desde el otro móvil o desde el editor): el hueco queda "Sin plato" y ofrece "Elegir receta", la lista no la incluye y el índice de Recetas no la enseña. Lo prueban las Tasks 2, 4 y 6.
- **El domingo por la noche, con el cambio de hora y entre años:** el domingo a las 23:30 de Madrid ya es fin de semana y se abre "La que viene"; a las 00:30 del lunes, "Esta semana". La semana del 28 de diciembre se llama "Del 28 dic al 3 ene". Lo prueban las Tasks 1 y 4.
- **Hacer la lista dos veces o actualizarla:** no duplica productos, no toca lo añadido a mano y, al actualizar, conserva "en casa" y "en el carro". Lo prueba la Task 2.
- **El menú de esta semana no cambia a mitad de semana:** apuntar lo que se come esta semana no recalcula su propuesta. Lo prueban las Tasks 1 y 2.

## Plan de planes

Este es el plan 3 de 6.

4. **Lista:** repaso en casa, en el súper, frecuentes, terminar, vaciar y el botón de borrar producto. Lee los productos que escribe la Task 2 de este plan (`origen` con los nombres cortos unidos por " · ", y `null` lo añadido a mano).
5. **Registro:** diario, notas de cada uno y "Comimos otra cosa". Sus comidas alimentan la última vez de cada receta (Task 1).
6. **En vivo y sin conexión:** Durable Object y service worker, abrir sin red en un móvil que nunca entró, limpiar fotos sin receta, KV si no se quiere R2, `docs/cloudflare.md` y primer despliegue.

## File Structure

```
shared/fechas.ts             (cambia) rangoDeFechas, diasEntre
shared/semana.ts             (cambia) días, reparto con días fuera, semana que se abre, días de una semana nueva,
                             última vez, propuesta por huecos, sugerencias, "Hace N semanas", estado de la lista
shared/esquema.ts            (cambia) semana.lista
migrations/0002_lista_de_la_semana.sql
app/datos/semana.ts          ids, componer y leer la semana, useSemana, cambiar días, domingo, platos y hacer la lista
app/datos/semilla.ts         (cambia) historial inventado: esta semana planificada y seis semanas de comidas con notas
app/datos/acceso.ts          (cambia) contarMiembros, invitar, salir
app/componentes/DiasDelPlato.tsx   las letras de los días de un plato, con los pasados tachados
app/componentes/FilaReceta.tsx     la fila del índice, como enlace o como botón (sale de Recetas.tsx)
app/pantallas/Semana.tsx     las dos vistas de la semana
app/pantallas/ElegirReceta.tsx     el recetario en modo elegir
app/pantallas/Ajustes.tsx
app/estilos/semana.css, ajustes.css
prototipo/semana.html, recetas.html, ajustes.html, index.html   (Task 3)
```

---

### Task 1: Reglas de la semana

**Files:**
- Modify: `shared/fechas.ts`, `shared/semana.ts`, `shared/semana.test.ts`

**Interfaces:**
- Consumes: `sumarDias`, `lunesDe`, `hoyEnMadrid` (plan 1); `RecetaResumen`, `repartir`, `proponer`, `recomendar` de `shared/semana.ts`.
- Produces:
  - `rangoDeFechas(lunes: string): string`: "Del 26 oct al 1 nov"; el mismo mes, "Del 2 al 8 nov". Meses: ene feb mar abr may jun jul ago sep oct nov dic.
  - `diasEntre(desde: string, hasta: string): number` (hasta − desde, en días).
  - `DIAS: readonly Dia[] = ['L','M','X','J','V','S','D']`. El índice es `semana_dia.dia`.
  - `NOMBRE_DIA: Record<Dia, string>`: lunes … domingo.
  - `repartir(platos, activos, fuera: readonly Dia[] = ['D'])`: un día fuera no lleva plato aunque esté activo; el resto, como hasta ahora.
  - `semanaQueSeAbre(hoy: string): 'esta' | 'viene'`: de lunes a jueves, `'esta'`.
  - `type DiaDeSemana = { activo: boolean; fuera: boolean }`.
  - `diasDeLaSemana(lunes: string, guardados: { lunes: string; dia: number; activo: boolean; fuera: boolean }[]): DiaDeSemana[]` (siete). Para cada día:
    - la fila de ese lunes;
    - si no hay, la del mismo día en la semana guardada más reciente anterior;
    - si no hay ninguna, L, X y V activos y el domingo fuera.

    Las filas de semanas posteriores no cuentan.
  - `ultimaVezPorReceta(comidas: { fecha: string; receta_id: string | null }[], planificadas: { fecha: string; receta_id: string }[], antesDe: string): Map<string, string>`:
    - la fecha más reciente anterior a `antesDe`;
    - un día planificado cuenta solo si ese día no tiene comida apuntada.
  - `type Hueco = '1' | '2'` y `HUECOS: readonly Hueco[]`.
  - `proponerHuecos(recetas: RecetaResumen[], lunes: string): Record<Hueco, string | null>`:
    - '1', la primera candidata energética; '2', la primera no energética;
    - un hueco sin candidata de su tipo toma `recomendar(<las del otro tipo>, <las ya puestas>, lunes)[0]`;
    - sin ninguna, `null`.
  - `sugerir(recetas: RecetaResumen[], enMenu: string[], lunes: string): RecetaResumen[]`:
    - como mucho dos: primero la de `recomendar` entre las energéticas, luego entre las otras;
    - si un tipo no tiene ninguna, dos del otro.
  - `haceCuanto(ultimaVez: string | null, lunes: string): string`:
    - `null`: "Por probar";
    - si no, N = techo(días / 7): "Hace 1 semana" o "Hace N semanas".
  - `huecoDelMismoTipo(energetica: boolean, menu: { hueco: Hueco; energetica: boolean | null }[]): Hueco`. Por orden:
    - el primer hueco del mismo tipo;
    - el primer hueco vacío (`energetica: null`);
    - `'2'`.
  - `estadoLista(lista: string | null, enMenu: string[]): 'pendiente' | 'hecha' | 'cambiada'`:
    - `lista` es el JSON de ids de cuando se hizo; se compara como conjunto;
    - `null`: pendiente;
    - un JSON roto: cambiada.

`proponer` y `recomendar` no cambian. Quien llama pasa el lunes de la semana que se planifica como `hoy`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
// shared/semana.test.ts (se añade; rs es el de 'proponer y recomendar')
describe('la semana en el calendario', () => {
  it('escribe el rango de la semana, también entre meses y entre años', () => {
    expect(rangoDeFechas('2026-10-26')).toBe('Del 26 oct al 1 nov');
    expect(rangoDeFechas('2026-11-02')).toBe('Del 2 al 8 nov');
    expect(rangoDeFechas('2026-12-28')).toBe('Del 28 dic al 3 ene');
  });
  it('de lunes a jueves abre esta semana y de viernes a domingo la que viene, en hora de Madrid', () => {
    expect(semanaQueSeAbre('2026-10-29')).toBe('esta');
    expect(semanaQueSeAbre('2026-10-30')).toBe('viene');
    expect(semanaQueSeAbre(hoyEnMadrid(new Date('2026-11-01T22:30:00Z')))).toBe('viene'); // domingo, 23:30
    expect(semanaQueSeAbre(hoyEnMadrid(new Date('2026-11-01T23:30:00Z')))).toBe('esta'); // lunes, 00:30
  });
});

describe('repartir con días fuera', () => {
  const platos = [{ id: '1', energetico: true }, { id: '2', energetico: false }];
  it('el domingo en casa entra en el reparto como los demás', () => {
    expect(repartir(platos, ['L', 'X', 'V'], []).D).toBe('2');
    expect(repartir(platos, ['L', 'X', 'V', 'D'], []).D).toBe('1');
  });
  it('un día fuera no lleva plato aunque esté activo', () => {
    expect(repartir(platos, ['L', 'S'], ['S', 'D'])).toMatchObject({ L: '1', S: null, D: null });
  });
});

describe('diasDeLaSemana', () => {
  it('sin nada guardado: L, X y V activos y el domingo fuera', () => {
    const d = diasDeLaSemana('2026-11-02', []);
    expect(d.map((x) => x.activo)).toEqual([true, false, true, false, true, false, false]);
    expect(d.map((x) => x.fuera)).toEqual([false, false, false, false, false, false, true]);
  });
  it('copia cada día de la última semana guardada antes que ella', () => {
    const guardados = [
      { lunes: '2026-10-26', dia: 1, activo: true, fuera: false },
      { lunes: '2026-10-26', dia: 6, activo: false, fuera: false },
      { lunes: '2026-10-19', dia: 1, activo: false, fuera: false },
      { lunes: '2026-11-09', dia: 0, activo: false, fuera: false },
    ];
    const d = diasDeLaSemana('2026-11-02', guardados);
    expect(d[1]).toEqual({ activo: true, fuera: false });
    expect(d[6]).toEqual({ activo: false, fuera: false });
    expect(d[0]).toEqual({ activo: true, fuera: false });
  });
});

describe('ultimaVezPorReceta', () => {
  it('manda lo apuntado; lo planificado cuenta en los días sin apuntar, y solo antes del lunes', () => {
    const comidas = [{ fecha: '2026-10-20', receta_id: 'pisto' }, { fecha: '2026-10-27', receta_id: 'curry' }];
    const planificadas = [{ fecha: '2026-10-20', receta_id: 'lentejas' }, { fecha: '2026-10-22', receta_id: 'lentejas' }];
    const u = ultimaVezPorReceta(comidas, planificadas, '2026-10-26');
    expect(u.get('pisto')).toBe('2026-10-20');
    expect(u.get('lentejas')).toBe('2026-10-22');
    expect(u.has('curry')).toBe(false);
  });
});

describe('proponerHuecos y sugerir', () => {
  it('la energética al hueco 1 y la otra al 2', () => {
    expect(proponerHuecos(rs, '2026-10-26')).toEqual({ '1': 'arroz', '2': 'nueva' });
  });
  it('con un solo tipo llena los dos huecos sin repetir, y sin recetas los deja vacíos', () => {
    expect(proponerHuecos(rs.filter((r) => r.energetica), '2026-10-26')).toEqual({ '1': 'arroz', '2': 'curry' });
    expect(proponerHuecos(rs.filter((r) => !r.energetica), '2026-10-26')).toEqual({ '1': 'pisto', '2': 'nueva' });
    expect(proponerHuecos([], '2026-10-26')).toEqual({ '1': null, '2': null });
  });
  it('sugiere la mejor de cada tipo fuera del menú', () => {
    expect(sugerir(rs, ['arroz', 'nueva'], '2026-10-26').map((r) => r.id)).toEqual(['curry', 'pisto']);
  });
  it('dice cuánto hace con semanas enteras hacia arriba', () => {
    expect(haceCuanto(null, '2026-10-26')).toBe('Por probar');
    expect(haceCuanto('2026-10-23', '2026-10-26')).toBe('Hace 1 semana');
    expect(haceCuanto('2026-09-28', '2026-10-26')).toBe('Hace 4 semanas');
    expect(haceCuanto('2026-09-27', '2026-10-26')).toBe('Hace 5 semanas');
  });
  it('una sugerencia va al hueco de su tipo, si no al vacío, si no al 2', () => {
    expect(huecoDelMismoTipo(false, [{ hueco: '1', energetica: true }, { hueco: '2', energetica: false }])).toBe('2');
    expect(huecoDelMismoTipo(true, [{ hueco: '1', energetica: false }, { hueco: '2', energetica: null }])).toBe('2');
    expect(huecoDelMismoTipo(true, [{ hueco: '1', energetica: false }, { hueco: '2', energetica: false }])).toBe('2');
  });
});

describe('estadoLista', () => {
  it('compara las recetas de la lista con las del menú', () => {
    expect(estadoLista(null, ['a', 'b'])).toBe('pendiente');
    expect(estadoLista('["b","a"]', ['a', 'b'])).toBe('hecha');
    expect(estadoLista('["a","b"]', ['a', 'c'])).toBe('cambiada');
    expect(estadoLista('roto', ['a'])).toBe('cambiada');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run shared/semana.test.ts`
Expected: FAIL (las funciones nuevas no existen).

- [ ] **Step 3: Implementar** en `shared/fechas.ts` y `shared/semana.ts`. `DIAS_DE_COMER` desaparece: los días sin plato son los de `fuera`.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS (también los tests de `repartir` que ya había), sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add shared
git commit -m "feat: add week rules for days out, new weeks, proposals and suggestions"
```

### Task 2: La semana en la copia local

**Files:**
- Create:
  - `migrations/0002_lista_de_la_semana.sql`;
  - `app/datos/semana.ts`, `app/datos/semana.test.ts`.
- Modify:
  - `shared/esquema.ts`: `semana` acepta `lista: textoOpcional`;
  - `worker/esquema.test.ts`, si compara columnas con la D1;
  - `app/datos/semilla.ts`, `app/datos/semilla.test.ts`.

**Interfaces:**
- Consumes:
  - Task 1 entera;
  - `escribir` y `copia`;
  - `guardarReceta`, `borrarReceta`, `RECETAS_DE_EJEMPLO`;
  - `leerTipos`, `esEnergetica`, `mediasPorReceta` (plan 2);
  - `listaDesdeRecetas` y `normalizar` (plan 1).
- Produces:
  - **La migración:** `ALTER TABLE semana ADD COLUMN lista TEXT;`, con un comentario: es el array JSON con los ids de las recetas del menú cuando se hizo la lista.
  - **Ids:** `idSemana(lunes)`, `idDia(lunes, dia: number)` e `idHueco(lunes, hueco: Hueco)`, con el formato de Global Constraints.
  - **Tipos:**

    ```ts
    export type RecetaDelMenu = { id: string; nombre: string; corto: string; tipos: Tipo[]; energetica: boolean };
    export type PlatoEnSemana = {
      hueco: Hueco;
      receta: RecetaDelMenu | null;              // null: "Sin plato"
      enLugarDe: { id: string; nombre: string } | null;
      dias: Dia[];                               // los que lleva este plato
      vaAActivos: boolean;                       // es el que va a los días activos y tiene alguno
    };
    export type DiaEnSemana = { dia: Dia; fecha: string; activo: boolean; fuera: boolean };
    export type Sugerencia = {
      id: string; nombre: string; media: number | null; haceCuanto: string;
      hueco: Hueco;                              // huecoDelMismoTipo
      sustituye: string | null;                  // corto del plato de ese hueco
    };
    export type VistaSemana = {
      lunes: string; dias: DiaEnSemana[]; menu: PlatoEnSemana[]; sugerencias: Sugerencia[];
      lista: 'pendiente' | 'hecha' | 'cambiada'; productos: number; hayRecetas: boolean;
    };
    ```

    - `menu` lleva siempre los dos huecos, en orden.
    - `productos` es el número de líneas que daría `listaDesdeRecetas` con el menú de ahora.
  - **Lecturas:** `leerSemana(lunes: string): Promise<VistaSemana>` y `useSemana(lunes: string): VistaSemana | undefined` (`useLiveQuery` sobre `leerSemana`).
  - **Gestos** (todos `Promise<void>`):
    - `cambiarDia(lunes, dia: Dia)`: alterna `activo`; en un día fuera no hace nada.
    - `cambiarFuera(lunes, dia: Dia, fuera: boolean)`: al volver a casa, el día queda no activo.
    - `ponerPlato(lunes, hueco, recetaId)`: `sustituye_a` sigue la regla del prototipo (`antes === nuevo ? null : antes ?? viejo`), donde "viejo" es el plato que se veía en el hueco, guardado o propuesto.

    Cada gesto escribe la fila `semana` y solo su día o su hueco.
  - **`hacerLista(lunes): Promise<number>`**, en una sola transacción:
    - escribe la semana con `lista` y `propuesta_aceptada: 1`, los dos huecos con `sustituye_a: null` y los siete días tal como se ven;
    - escribe los productos: `{ nombre, cantidad, seccion, origen: origen.join(' · '), estado: 'pendiente', cogido_por: null }`;
    - devuelve el número de líneas.
  - **Productos en `hacerLista`:**
    - los de recetas son los que tienen `origen` no nulo;
    - si la semana no tenía `lista`, se borran todos los de recetas y se escriben de nuevo;
    - si ya la tenía (actualizar), los que siguen por nombre normalizado conservan id, `estado` y `cogido_por`; los que ya no salen se borran; los nuevos entran pendientes;
    - los de `origen` nulo no se tocan.
  - **Composición de `leerSemana`:**
    - días: `diasDeLaSemana` con todas las filas `semana_dia`;
    - platos: el guardado en el hueco y, si no hay fila, `proponerHuecos`;
    - un `receta_id` que ya no existe es "Sin plato";
    - reparto: `repartir` con los ids '1' y '2', sin los huecos vacíos;
    - `ultimaVez`: las comidas y lo planificado en semanas guardadas anteriores (sus platos guardados repartidos con sus días), con `antesDe = lunes`.
  - **`cargarSemilla(hoy = hoyEnMadrid(new Date())): Promise<number>`** (sigue devolviendo 10):
    - planifica esta semana: Pollo al curry y Crema de calabacín, días por defecto;
    - apunta las seis semanas anteriores: la energética en L, X y V y la otra en M, J y S, con una nota tuya por comida.

    | Semanas atrás | Energética (nota) | Otra (nota) |
    |---|---|---|
    | 1 | macarrones (7) | albondigas (9) |
    | 2 | salmon (8) | merluza (7) |
    | 3 | lentejas (8) | pisto (8) |
    | 4 | arroz (9) | crema (6) |
    | 5 | garbanzos (6) | albondigas (9) |
    | 6 | curry (8) | pisto (9) |

    Ids: `ejemplo-comida-<semanas atrás>-<dia>` y `ejemplo-nota-<semanas atrás>-<dia>`, con fechas desde el lunes de `hoy`. Repetirla otro día sobrescribe las mismas filas. Las notas van sin `miembro_id`: lo pone el servidor.

- [ ] **Step 1: Escribir los tests que fallan**

Cada test abre una copia nueva y guarda lentejas, merluza, arroz y pisto de `RECETAS_DE_EJEMPLO`, con estas comidas:
- arroz el `2026-10-20`;
- lentejas el `2026-09-28`;
- pisto el `2026-10-05`.

Con `LUNES = '2026-11-02'`, la propuesta es lentejas y merluza.

```ts
// app/datos/semana.test.ts
it('sin nada guardado propone la semana y no escribe nada', async () => {
  const s = await leerSemana(LUNES);
  expect(s.dias.map((d) => d.activo)).toEqual([true, false, true, false, true, false, false]);
  expect(s.menu.map((p) => [p.receta?.id, p.dias, p.vaAActivos])).toEqual([
    ['ejemplo-lentejas', ['L', 'X', 'V'], true],
    ['ejemplo-merluza', ['M', 'J', 'S'], false],
  ]);
  expect(s.sugerencias.map((x) => [x.id, x.haceCuanto, x.hueco])).toEqual([
    ['ejemplo-arroz', 'Hace 2 semanas', '1'],
    ['ejemplo-pisto', 'Hace 4 semanas', '2'],
  ]);
  expect(s.lista).toBe('pendiente');
  expect((await copia().cola.toArray()).filter((o) => o.tabla.startsWith('semana'))).toHaveLength(0);
});
it('cambiar un día escribe solo la semana y ese día, con ids fijos', async () => {
  const antes = await copia().cola.count();
  await cambiarDia(LUNES, 'M');
  const ops = (await copia().cola.toArray()).slice(antes).map((o) => [o.tabla, o.fila.id]);
  expect(ops).toEqual([['semana', 'semana-2026-11-02'], ['semana_dia', 'semana-2026-11-02-d1']]);
  expect((await leerSemana(LUNES)).menu[0]!.dias).toEqual(['L', 'M', 'X', 'V']);
});
it('el domingo en casa entra en el reparto y fuera sale', async () => {
  await cambiarFuera(LUNES, 'D', false);
  expect((await leerSemana(LUNES)).menu[1]!.dias).toEqual(['M', 'J', 'S', 'D']);
  await cambiarFuera(LUNES, 'D', true);
  expect((await leerSemana(LUNES)).menu[1]!.dias).toEqual(['M', 'J', 'S']);
});
it('poner un plato guarda "En lugar de" y volver al de antes lo quita', async () => {
  await ponerPlato(LUNES, '1', 'ejemplo-arroz');
  await ponerPlato(LUNES, '1', 'ejemplo-pisto');
  expect((await leerSemana(LUNES)).menu[0]!.enLugarDe).toEqual({ id: 'ejemplo-lentejas', nombre: 'Lentejas estofadas' });
  await ponerPlato(LUNES, '1', 'ejemplo-lentejas');
  expect((await leerSemana(LUNES)).menu[0]!.enLugarDe).toBeNull();
});
it('una receta del menú borrada deja su hueco sin plato y fuera de la lista', async () => {
  await ponerPlato(LUNES, '2', 'ejemplo-pisto');
  await borrarReceta('ejemplo-pisto');
  const s = await leerSemana(LUNES);
  expect(s.menu[1]).toMatchObject({ receta: null, dias: [] });
  expect(s.menu[0]!.dias).toEqual(['L', 'X', 'V']);
  await hacerLista(LUNES);
  expect((await copia().producto.toArray()).every((p) => p.origen === 'lentejas')).toBe(true);
});
it('hacer la lista escribe los productos y fija el menú', async () => {
  const n = await hacerLista(LUNES);
  const productos = await copia().producto.toArray();
  expect(productos).toHaveLength(n);
  expect(productos.find((p) => p.nombre === 'Ajo')).toMatchObject({ cantidad: '1 cabeza', origen: 'lentejas · merluza', estado: 'pendiente' });
  expect(productos.some((p) => p.nombre === 'Sal')).toBe(false);
  expect(await copia().semana_plato.count()).toBe(2);
  expect(await copia().semana_dia.count()).toBe(7);
  expect(await leerSemana(LUNES)).toMatchObject({ lista: 'hecha', productos: n });
});
it('actualizar conserva estados y lo añadido a mano; no duplica', async () => {
  await hacerLista(LUNES);
  const chorizo = (await copia().producto.toArray()).find((p) => p.nombre === 'Chorizo')!;
  await escribir('producto', { ...chorizo, estado: 'casa' });
  await escribir('producto', { id: 'a-mano', nombre: 'Cebolla', origen: null });
  await ponerPlato(LUNES, '2', 'ejemplo-pisto');
  expect((await leerSemana(LUNES)).lista).toBe('cambiada');
  await hacerLista(LUNES);
  const despues = await copia().producto.toArray();
  expect(despues.find((p) => p.id === chorizo.id)).toMatchObject({ estado: 'casa' });
  expect(despues.some((p) => p.nombre === 'Merluza en rodajas')).toBe(false);
  expect(despues.filter((p) => p.nombre === 'Cebolla').map((p) => p.origen)).toEqual(expect.arrayContaining([null, expect.any(String)]));
  expect(despues.filter((p) => p.nombre === 'Cebolla')).toHaveLength(2);
});
it('la lista de una semana nueva rehace desde cero lo que sale de recetas', async () => {
  await hacerLista(LUNES);
  const viejos = (await copia().producto.toArray()).map((p) => p.id as string);
  await hacerLista('2026-11-09');
  const nuevos = await copia().producto.toArray();
  expect(nuevos.some((p) => viejos.includes(p.id as string))).toBe(false);
  expect(nuevos.every((p) => p.estado === 'pendiente')).toBe(true);
});
it('apuntar lo que se come esta semana no cambia su menú', async () => {
  const antes = (await leerSemana(LUNES)).menu.map((p) => p.receta?.id);
  await escribir('comida', { id: 'c-hoy', fecha: '2026-11-03', receta_id: 'ejemplo-lentejas' });
  expect((await leerSemana(LUNES)).menu.map((p) => p.receta?.id)).toEqual(antes);
});
```

```ts
// app/datos/semilla.test.ts (se añade)
it('deja esta semana planificada y un historial que propone la que viene', async () => {
  await cargarSemilla('2026-10-28');
  expect(await copia().comida.count()).toBe(36);
  expect(await copia().nota.count()).toBe(36);
  expect((await leerSemana('2026-10-26')).menu.map((p) => p.receta?.id)).toEqual(['ejemplo-curry', 'ejemplo-crema']);
  const viene = await leerSemana('2026-11-02');
  expect(viene.menu.map((p) => p.receta?.id)).toEqual(['ejemplo-arroz', 'ejemplo-pisto']);
  expect(viene.sugerencias.map((x) => [x.id, x.haceCuanto])).toEqual([
    ['ejemplo-lentejas', 'Hace 4 semanas'],
    ['ejemplo-merluza', 'Hace 3 semanas'],
  ]);
});
```

Si los tipos de la semilla dan otra propuesta, se ajusta la tabla del historial, no la regla.

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/datos/semana.test.ts app/datos/semilla.test.ts`
Expected: FAIL (`app/datos/semana.ts` no existe).

- [ ] **Step 3: Implementar.** La composición es una función pura (`componerSemana`) que recibe las filas leídas; `leerSemana` lee las tablas una vez y la llama. `hacerLista` y los gestos usan una transacción `rw` sobre las tablas que tocan y `db.cola`, como `guardarReceta`.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS, también los del Worker con la migración nueva.

- [ ] **Step 5: Commit**

```bash
git add migrations shared/esquema.ts worker app/datos
git commit -m "feat: keep each week in the local copy and make the shopping list from its menu"
```

### Task 3: Diseño de lo que falta en Semana, el modo elegir y Ajustes

**Quién:** el controlador de la sesión, no un subagente. La ronda de impeccable necesita la sesión principal. Si el usuario no elige entre opciones, se construye la principal y se le dice qué se supuso.

**Files:**
- Create: `prototipo/ajustes.html`, `.impeccable/surfaces/prototipo-ajustes-html.md`
- Modify:
  - `prototipo/semana.html`, `prototipo/recetas.html` y `prototipo/index.html`;
  - `.impeccable/surfaces/prototipo-semana-html.md`;
  - `DESIGN.md`.

**Fijado por este plan** (el diseño decide el aspecto y el sitio; las Tasks 4 a 7 lo prueban con estos nombres accesibles):
- **Semana, arriba:** el control segmentado ("Esta semana", "La que viene") es un `tablist`. Un enlace "Ajustes" lleva a `/semana/ajustes`.
- **La que viene, días:** grupo "Días activos" con un botón por día. Su nombre es "lunes 2", "martes 3, activo" o "domingo 8, fuera", con `aria-pressed`. Un día fuera no se puede tocar.
- **El domingo:**
  - un botón "Comer en casa el domingo" cuando está fuera;
  - uno "Comer fuera el domingo" cuando está en casa.

  Al volver a casa, D entra en la tira como un día más y en los días del plato que le toque.
- **Menú:**
  - un `h2` "Menú" con una fila por hueco;
  - el plato con sus días, como en el prototipo;
  - "En lugar de ~~plato~~" con un botón "Deshacer";
  - un enlace "Elegir otra receta en lugar de <nombre>" a `/semana/elegir/<lunes>/<hueco>`;
  - un hueco vacío dice "Sin plato" y su enlace es "Elegir receta".
- **Hace tiempo que no coméis:**
  - un `h2` con ese texto;
  - cada sugerencia, con su nota a la derecha y "Hace N semanas";
  - un botón "Cambiar por <corto>" (por ejemplo, "Cambiar por lentejas"), o "Poner en el menú" si su hueco está vacío;
  - sin notas, sin puntos guía ni cifra, y "Por probar" en lugar de "Hace N semanas".
- **Botón fijo:**
  - "Hacer la lista de la compra";
  - con la lista hecha, el enlace "Ver la lista" (a `/lista`) y el estado "Lista hecha con N productos";
  - con el menú cambiado, "Actualizar la lista de la compra" y "Has cambiado el menú desde que hiciste la lista".
- **Sin recetas:** "Todavía no hay recetas. Con una que lleve hidratos y otra que no, la semana se propone sola." y un enlace "Nueva receta" a `/recetas/nueva`. Sin tira de días, menú ni botón fijo.
- **Esta semana:**
  - "Hoy toca <plato en minúscula>", u "Hoy coméis fuera";
  - días de solo lectura (`role="img"` con el mismo nombre que en La que viene);
  - los pasados, tachados;
  - sin botón fijo ni sugerencias.
- **Índice de Recetas:** sin búsqueda, encima de "Todas", las secciones "Esta semana" y "La que viene" del prototipo de Recetas. Cada plato es un enlace a su receta; el de hoy lleva "Hoy" delante del detalle. Una semana sin platos no sale.
- **Elegir receta** (`/semana/elegir/<lunes>/<hueco>`, sin barra de pestañas):
  - botón "Cancelar" y título "Elegir receta";
  - una línea "En lugar de <nombre>", si el hueco tiene plato;
  - el buscador "Buscar receta";
  - cada receta es un botón con su nombre, sin las que ya están en el menú.
- **Ajustes** (`/semana/ajustes`, con barra de pestañas):
  - "‹ Semana" para volver y el título "Ajustes";
  - el botón "Invitar a tu pareja", o "Ya estáis los dos en este hogar." si ya son dos;
  - el estado tras invitar: "Invitación lista. Vale 24 horas y una sola vez." o "Enlace copiado. Vale 24 horas y una sola vez.";
  - sin hoja de compartir ni portapapeles, un campo de solo lectura "Enlace de invitación";
  - el botón "Cerrar sesión", y "Versión 0.3.0" en 13px `ink-2`.

- [ ] **Step 1: Ronda de impeccable.** Diseña lo que falta como extensión del mundo de `DESIGN.md`, con datos inventados:
  - en `prototipo/semana.html`: el domingo, el enlace a Ajustes, "Elegir otra receta", "Sin plato", la sugerencia sin notas y el estado sin recetas;
  - en `prototipo/recetas.html` con `?elegir=1`: el modo elegir;
  - `prototipo/ajustes.html`, nuevo, enlazado desde `prototipo/index.html`.

- [ ] **Step 2: Revisión de acabado.** Capturas en claro y oscuro, a 375 y 390. Corrige lo que salga.

- [ ] **Step 3: Documentar.**
  - Los contratos de superficie de Semana (actualizado) y de Ajustes (nuevo).
  - En `DESIGN.md`:
    - los componentes nuevos;
    - "Fuera (domingo): deshabilitado" pasa a describir el domingo que se puede cambiar;
    - en Pendientes se quitan el domingo y qué segmento se abre entre semana (decisión 24 del spec).

- [ ] **Step 4: Commit**

```bash
git add prototipo .impeccable DESIGN.md
git commit -m "feat: design the Sunday switch, the recipe picker and the settings screen"
```

### Task 4: Semana, la que viene

**Files:**
- Create:
  - `app/pantallas/Semana.tsx`, `app/pantallas/Semana.test.tsx`, `app/estilos/semana.css`;
  - `app/componentes/DiasDelPlato.tsx`.
- Modify: `app/App.tsx`. `/semana` pinta `Semana`.

**Interfaces:**
- Consumes:
  - `useSemana`, `cambiarDia`, `cambiarFuera`, `ponerPlato` y `hacerLista` (Task 2);
  - `semanaQueSeAbre`, `rangoDeFechas`, `NOMBRE_DIA` y `DIAS` (Task 1);
  - `lunesDe`, `sumarDias`, `hoyEnMadrid`, `fraseTipos` y `formatearNota`;
  - `prototipo/semana.html` tal como lo dejó la Task 3.
- Produces:
  - `<Semana />`:
    - el segmento sale de `?ver=esta|viene` y, sin él, de `semanaQueSeAbre(hoy)`;
    - tocar el segmentado cambia `ver` con `replace`.
  - `<DiasDelPlato dias={Dia[]} activo={boolean} pasados?={Set<Dia>} />`:
    - las letras unidas por " · " (el separador `aria-hidden`);
    - cada letra en un `span.dl` con `data-d`, y los pasados con `.past`;
    - sin días, "sin días".

  La vista "Esta semana" llega en la Task 5. Hasta entonces, su panel solo lleva el título.

- [ ] **Step 1: Escribir los tests que fallan**

Mismas recetas y comidas que en la Task 2. Fecha fija: viernes `2026-10-30T10:00:00+01:00`. Rutas de prueba: `/semana`, `/lista` ("Lista de prueba") y una `Ubicacion` que enseña `pathname + search`. `fila(nombre)` es `screen.getByText(nombre).closest('li')`.

```tsx
it('el viernes abre La que viene con la propuesta', async () => {
  pintar();
  expect(await screen.findByRole('heading', { level: 1, name: 'Del 2 al 8 nov' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'La que viene' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('button', { name: 'lunes 2, activo' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'domingo 8, fuera' })).toBeDisabled();
  expect(fila('Lentejas estofadas')).toHaveTextContent(/estofadas\s*L · X · V/);
});
it('tocar un día recoloca los platos', async () => {
  pintar();
  await userEvent.click(await screen.findByRole('button', { name: 'martes 3' }));
  await waitFor(() => expect(fila('Lentejas estofadas')).toHaveTextContent(/estofadas\s*L · M · X · V/));
  expect(fila('Merluza en salsa verde')).toHaveTextContent(/verde\s*J · S/);
});
it('el domingo se puede comer en casa y volver a comer fuera', async () => {
  pintar();
  await userEvent.click(await screen.findByRole('button', { name: 'Comer en casa el domingo' }));
  await waitFor(() => expect(fila('Merluza en salsa verde')).toHaveTextContent(/verde\s*M · J · S · D/));
  await userEvent.click(screen.getByRole('button', { name: 'Comer fuera el domingo' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'domingo 8, fuera' })).toBeDisabled());
});
it('cambiar por una sugerencia tacha el plato y deja deshacer', async () => {
  pintar();
  await userEvent.click(await screen.findByRole('button', { name: 'Cambiar por lentejas' }));
  await waitFor(() => expect(fila('Arroz con pollo')).toHaveTextContent(/En lugar de\s*Lentejas estofadas/));
  await userEvent.click(within(fila('Arroz con pollo')!).getByRole('button', { name: 'Deshacer' }));
  await waitFor(() => expect(fila('Lentejas estofadas')).not.toHaveTextContent('En lugar de'));
});
it('hacer la lista cambia el botón; cambiar un plato pide actualizarla y cambiar un día no', async () => {
  pintar();
  await userEvent.click(await screen.findByRole('button', { name: 'Hacer la lista de la compra' }));
  expect(await screen.findByText(/^Lista hecha con \d+ productos$/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver la lista' })).toHaveAttribute('href', '/lista');
  await userEvent.click(screen.getByRole('button', { name: 'martes 3' }));
  expect(screen.getByRole('link', { name: 'Ver la lista' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar por lentejas' }));
  expect(await screen.findByText('Has cambiado el menú desde que hiciste la lista')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Actualizar la lista de la compra' })).toBeInTheDocument();
});
it('sin recetas lo dice y lleva a crear una', async () => { /* copia vacía: el texto, el enlace "Nueva receta" a /recetas/nueva y ningún botón de lista */ });
it('una receta borrada deja "Sin plato"', async () => { /* ponerPlato(…,'2','ejemplo-pisto'); borrarReceta('ejemplo-pisto') → "Sin plato" en el menú */ });
it('el domingo a las 23:30 abre La que viene y el lunes a las 00:30 Esta semana', async () => {
  /* setSystemTime(new Date('2026-11-01T22:30:00Z')) → tab "La que viene" seleccionado, h1 "Del 2 al 8 nov";
     setSystemTime(new Date('2026-11-01T23:30:00Z')) y otro pintado → tab "Esta semana" seleccionado, h1 "Del 2 al 8 nov" */
});
it('el segmento elegido queda en la dirección', async () => {
  /* clic en "Esta semana" → Ubicacion "/semana?ver=esta"; pintar('/semana?ver=viene') un jueves → "La que viene" */
});
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Semana.test.tsx`
Expected: FAIL (`Semana` no existe).

- [ ] **Step 3: Implementar** según el prototipo:
  - el trazo que tacha el plato (0,3 s) antes de escribir el nuevo, con `ponerPlato` al acabar el trazo;
  - el FLIP de las letras al cambiar un día;
  - "Hacer la lista" deshabilitado (`aria-disabled`) mientras escribe.

  Mientras `useSemana` es `undefined`, solo se pinta el segmentado.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: plan next week with active days, Sunday at home, swaps and the shopping list"
```

### Task 5: Esta semana y la semana en el índice de Recetas

**Files:**
- Modify:
  - `app/pantallas/Semana.tsx`, `app/pantallas/Semana.test.tsx`;
  - `app/pantallas/Recetas.tsx`, `app/pantallas/Recetas.test.tsx`, `app/estilos/recetas.css`.

**Interfaces:**
- Consumes: `useSemana` (Task 2); `DiasDelPlato` (Task 4); `lunesDe`, `sumarDias` y `hoyEnMadrid`.
- Produces: el panel "Esta semana" de `Semana` y, en `Recetas`, las dos secciones de la semana encima de "Todas".

- [ ] **Step 1: Escribir los tests que fallan**

Recetas y comidas de la Task 2. Esta semana se guarda con `ponerPlato('2026-10-26', '1', 'ejemplo-lentejas')` y `ponerPlato('2026-10-26', '2', 'ejemplo-merluza')`.

```tsx
// Semana.test.tsx
it('un miércoles abre Esta semana con lo que toca hoy y los días pasados tachados', async () => {
  /* setSystemTime(new Date('2026-10-28T10:00:00+01:00')) */
  pintar();
  expect(await screen.findByRole('heading', { level: 1, name: 'Del 26 oct al 1 nov' })).toBeInTheDocument();
  expect(screen.getByText(/Hoy toca/)).toHaveTextContent('Hoy toca lentejas estofadas');
  expect(screen.getByRole('img', { name: 'lunes 26, activo' })).toHaveClass('past');
  expect(screen.queryByRole('button', { name: /lista de la compra/ })).not.toBeInTheDocument();
  expect(fila('Lentejas estofadas')!.querySelector('.dl.past')).toHaveTextContent('L');
});
it('el domingo de esta semana se come fuera', async () => {
  /* setSystemTime(new Date('2026-11-01T12:00:00+01:00')); pintar('/semana?ver=esta') → "Hoy coméis fuera" */
});
```

```tsx
// Recetas.test.tsx
it('enseña Esta semana y La que viene encima de Todas, y el plato de hoy lleva "Hoy"', async () => {
  /* setSystemTime(new Date('2026-10-28T10:00:00+01:00')) */
  /* h2 "Esta semana", "La que viene" y "Todas", en ese orden;
     en Esta semana, el enlace de Lentejas estofadas a /recetas/ejemplo-lentejas tiene el texto "Hoy" */
});
it('al buscar desaparecen las secciones de la semana', async () => { /* escribir "pisto" → sin h2 "Esta semana" */ });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Semana.test.tsx app/pantallas/Recetas.test.tsx`
Expected: FAIL en los tests nuevos.

- [ ] **Step 3: Implementar** según los prototipos de Semana y de Recetas. En el índice, las filas de la semana usan la clase `menu` del prototipo y `DiasDelPlato`.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: show this week with today's dish and both weeks on the recipe index"
```

### Task 6: Elegir otra receta

**Files:**
- Create:
  - `app/pantallas/ElegirReceta.tsx`, `app/pantallas/ElegirReceta.test.tsx`;
  - `app/componentes/FilaReceta.tsx`, que sale de la `Fila` de `Recetas.tsx`.
- Modify:
  - `app/pantallas/Recetas.tsx`: usa `FilaReceta`;
  - `app/pantallas/Semana.tsx`, `app/pantallas/Semana.test.tsx`: los enlaces de cada hueco;
  - `app/App.tsx`: la ruta `/semana/elegir/:lunes/:hueco`;
  - `app/componentes/LineaEstado.tsx`: la ruta va en `SIN_PESTANAS`.

**Interfaces:**
- Consumes: `useRecetas`, `coincide` (plan 2); `useSemana` y `ponerPlato` (Task 2).
- Produces:
  - `<FilaReceta receta={ResumenReceta} como="enlace" | "boton" alElegir? />`, con la misma fila de carta en los dos casos.
  - `<ElegirReceta />`:
    - con un lunes que no es fecha, o un hueco que no es '1' ni '2', redirige a `/semana`;
    - al elegir, `ponerPlato` y vuelve: `navigate(-1)` si se vino de Semana (`state.desde === 'semana'`) y, si no, `/semana?ver=…` con `replace`;
    - "Cancelar" vuelve igual, sin cambiar nada.

- [ ] **Step 1: Escribir los tests que fallan**

Recetas y comidas de la Task 2, viernes `2026-10-30T10:00:00+01:00`. Las rutas de prueba montan `Semana` y `ElegirReceta`.

```tsx
it('cada plato lleva a elegir otra receta para su hueco', async () => {
  pintar(['/semana']);
  expect(await screen.findByRole('link', { name: 'Elegir otra receta en lugar de Lentejas estofadas' }))
    .toHaveAttribute('href', '/semana/elegir/2026-11-02/1');
});
it('elegir una receta la pone en el hueco y vuelve a La que viene', async () => {
  pintar(['/semana?ver=viene']);
  await userEvent.click(await screen.findByRole('link', { name: 'Elegir otra receta en lugar de Lentejas estofadas' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Elegir receta' })).toBeInTheDocument();
  expect(screen.getByText(/En lugar de/)).toHaveTextContent('Lentejas estofadas');
  expect(screen.queryByRole('button', { name: /Merluza en salsa verde/ })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Pisto con huevo/ }));
  await waitFor(() => expect(fila('Pisto con huevo')).toHaveTextContent(/En lugar de\s*Lentejas estofadas/));
  expect(screen.getByTestId('ubicacion')).toHaveTextContent('/semana?ver=viene');
});
it('Cancelar vuelve sin cambiar nada', async () => { /* … el menú sigue con Lentejas estofadas */ });
it('un hueco sin plato ofrece "Elegir receta"', async () => { /* receta del hueco 2 borrada → enlace "Elegir receta" a /semana/elegir/2026-11-02/2 */ });
it('una dirección rara vuelve a Semana', async () => { /* pintar(['/semana/elegir/ayer/3']) → h1 "Del 2 al 8 nov" */ });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/ElegirReceta.test.tsx app/pantallas/Semana.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** según el modo elegir de `prototipo/recetas.html`. Los enlaces de Semana llevan `state={{ desde: 'semana' }}`.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck`
Expected: todo PASS, también los de `Recetas`.

- [ ] **Step 5: Commit**

```bash
git add app
git commit -m "feat: pick any recipe for a slot of next week's menu"
```

### Task 7: Ajustes

**Files:**
- Create: `app/pantallas/Ajustes.tsx`, `app/pantallas/Ajustes.test.tsx`, `app/estilos/ajustes.css`
- Modify:
  - `app/datos/acceso.ts`, `app/datos/acceso.test.ts`;
  - `app/pantallas/Semana.tsx`: el enlace "Ajustes";
  - `app/App.tsx`: la ruta `/semana/ajustes`, con `alSalir`;
  - `package.json`: `"version": "0.3.0"`;
  - `tsconfig.json`: `"resolveJsonModule": true`.

**Interfaces:**
- Consumes:
  - `POST /api/invitaciones` (`{ enlace, caduca }`), `POST /api/salir` y `GET /api/yo` (`{ miembros }`), del plan 1;
  - `sincronizar` y `SinSesion`;
  - `olvidarSesion`.
- Produces:
  - `contarMiembros(): Promise<number | null>`: `null` si no hay red.
  - `invitar(): Promise<string>`: el enlace. Si falla, lanza con la frase de `enviar`.
  - `salir(): Promise<void>`:
    1. primero `sincronizar()`. Un `SinSesion` sigue adelante; cualquier otro fallo lanza "No hay conexión. Inténtalo otra vez.";
    2. luego `POST /api/salir`.
  - `compartirInvitacion(enlace: string): Promise<'compartida' | 'copiada' | 'cancelada' | 'a mano'>`:
    - `navigator.share({ title: 'Despensa', text: 'Te invito a nuestra Despensa.', url: enlace })`;
    - un `AbortError` es `'cancelada'`;
    - sin `share`, o si falla de otra forma, `navigator.clipboard.writeText`;
    - si tampoco, `'a mano'`.
  - `<Ajustes alSalir={() => void} />`. La versión sale de `import { version } from '../../package.json'`.
  - En `Rutas`, `alSalir` llama a `olvidarSesion()` y a `setSesion(null)`.

- [ ] **Step 1: Escribir los tests que fallan**

`fetch` falso por ruta. `navigator.share` y `navigator.clipboard` se definen con `Object.defineProperty(…, { configurable: true })`.

```tsx
it('con una sola persona invita y comparte el enlace', async () => {
  /* /api/yo → { miembros: 1 }; /api/invitaciones → 201 { enlace: 'http://localhost:5173/invitacion#abc', caduca } */
  /* share = vi.fn().mockResolvedValue(undefined) */
  await userEvent.click(await screen.findByRole('button', { name: 'Invitar a tu pareja' }));
  expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'http://localhost:5173/invitacion#abc' }));
  expect(await screen.findByText('Invitación lista. Vale 24 horas y una sola vez.')).toBeInTheDocument();
});
it('sin hoja de compartir copia el enlace', async () => { /* sin share; writeText → "Enlace copiado. Vale 24 horas y una sola vez." */ });
it('si se cancela la hoja no dice nada', async () => { /* share rechaza DOMException('', 'AbortError') → sin estado, sin copiar */ });
it('sin hoja ni portapapeles enseña el enlace para copiarlo a mano', async () => { /* textbox "Enlace de invitación" con el enlace */ });
it('con los dos dentro no ofrece invitar', async () => { /* miembros 2 → "Ya estáis los dos en este hogar." y sin botón */ });
it('cerrar sesión envía lo pendiente y sale', async () => {
  /* escribir una receta → cola 1; clic "Cerrar sesión" → /api/ops antes que /api/salir; alSalir llamado una vez */
});
it('sin red no cierra la sesión y lo dice', async () => { /* fetch lanza → "No hay conexión. Inténtalo otra vez."; alSalir no llamado */ });
it('enseña la versión y vuelve a Semana', async () => { /* "Versión 0.3.0"; dentro de main, el enlace "Semana" a /semana (la barra de pestañas tiene otro) */ });
```

```tsx
// Semana.test.tsx (se añade)
it('el enlace Ajustes lleva a /semana/ajustes', async () => { /* … */ });
```

- [ ] **Step 2: Ejecutar y ver que fallan**

Run: `npx vitest run app/pantallas/Ajustes.test.tsx app/pantallas/Semana.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar** según `prototipo/ajustes.html`. El enlace nunca va a `console`. "Cerrar sesión" queda `aria-disabled` mientras sale.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo PASS y el build sin errores.

- [ ] **Step 5: Commit**

```bash
git add app package.json package-lock.json tsconfig.json
git commit -m "feat: add settings to invite your partner, sign out and see the version"
```

### Task 8: De punta a punta, capturas y README

**Files:**
- Modify: `README.md`
- Create: `docs/capturas/app-semana-*.png`, `docs/capturas/app-ajustes-*.png`

- [ ] **Step 1: Verificar todo**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo PASS. Apunta el número de tests. Repite `npm test` tres veces: ningún test intermitente.

- [ ] **Step 2: Preparar la D1 local.** `npm run db:migrar:local` aplica la `0002`. Díselo al usuario: su D1 local también la necesita.

- [ ] **Step 3: De punta a punta en Chrome** (`http://localhost:5173`, autenticador virtual como en el plan 2):
  1. Crear hogar.
  2. Semana vacía, sin recetas.
  3. `await despensa.semilla()`. Semana enseña esta semana (curry y crema) y la que viene (arroz y pisto).
  4. Tocar un día, el domingo en casa, cambiar por una sugerencia, deshacer y elegir otra receta.
  5. Hacer la lista y comprobar los productos en la D1 local: `npx wrangler d1 execute despensa --local --command "SELECT nombre, origen FROM producto"`.
  6. Ajustes: invitar (el enlace se copia) y cerrar sesión.

- [ ] **Step 4: Capturas.** Claro y oscuro a 390 px, con la semilla:
  - La que viene con la lista hecha;
  - Esta semana;
  - Elegir receta;
  - Ajustes.

  Van en `docs/capturas/` con el patrón de nombres actual. La de "Semana tras entrar, aún vacía" (`app-semana-*`) se sustituye.

- [ ] **Step 5: README**
  - En la tabla de estado, "Semana: Funciona".
  - "En qué punto está": tres planes de seis.
  - "La app hoy", con las capturas nuevas.
  - "Cómo se usa hoy":
    - invitar pasa a ser Ajustes, "Invitar a tu pareja" (fuera la consola);
    - la semana: proponer, días, domingo, cambiar y hacer la lista.
  - "Instalar en tu ordenador": tras actualizar el repo, `npm run db:migrar:local` otra vez.
  - El número de tests.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/capturas
git commit -m "docs: show the week tab and settings in the README"
```

Después, el controlador hace la revisión de acabado de Semana, Elegir receta y Ajustes con impeccable y corrige lo que salga, antes de la revisión final de la rama.

# Despensa: la app real

Documento de diseño técnico para pasar de los prototipos a la PWA que usaréis los dos. Fecha:
20/10/2026.

La verdad del producto está en `PRODUCT.md` y el sistema visual en `DESIGN.md`; aquí no se
repiten, se citan. Las cuatro pantallas de `prototipo/` (Semana, Lista, Recetas, Registro) son
la referencia aprobada de aspecto y comportamiento. El usuario pidió saltarse las preguntas de
esta fase, así que las decisiones que no salen de esos documentos son de Claude y van marcadas
**[Decisión de Claude]**; están reunidas al final para revisarlas de un vistazo.

## 1. Intención

Una app para una pareja que planifica la comida de mediodía de la semana siguiente, hace la
compra con una lista que se rellena sola, cocina con la receta delante y apunta qué tal estuvo.
Los dos usan iPhone, cada uno con su móvil, y lo que cambia uno aparece en el del otro sin
recargar. Éxito: decidir la semana en un par de minutos y no volver a escribir la lista a mano.

## 2. Objetivos, no objetivos y antiobjetivos

Objetivos de la primera versión:

- Las cuatro pestañas funcionando con datos reales y compartidos: Semana, Recetas, Lista y
  Registro, con el comportamiento de los prototipos.
- Crear y editar recetas con ingredientes, pasos y foto (los prototipos no tienen editor: hay
  que diseñarlo).
- Entrar los dos en un mismo hogar sin contraseñas.
- Sincronización en vivo entre los dos móviles.
- La Lista y las recetas funcionan sin cobertura (el súper y la cocina) y se sincronizan al
  volver.
- Instalable en el iPhone desde Safari, en claro y oscuro según el sistema.
- Una guía paso a paso de Cloudflare en el repo para alguien que no lo ha usado nunca.

No objetivos (fuera de la primera versión):

- Cenas, macros, calorías e inventario de despensa (fuera por decisión de producto).
- Recomendaciones con IA (los datos se guardan para poder añadirla después).
- App nativa, notificaciones push, varios hogares por persona, más de dos miembros.
- Importar recetas de webs o fotos.

Antiobjetivos, lo que haría fallar la app aunque funcione:

- Que la lista no esté disponible en el súper por falta de cobertura.
- Que uno marque algo y el otro siga viéndolo pendiente.
- Que el aspecto se aleje de los prototipos aprobados (tarjetas, sombras, más colores).
- Pedir más datos personales de los necesarios.

## 3. Restricciones

- **Fijadas por el usuario:** iPhone los dos; PWA; React + Vite + TypeScript en Cloudflare
  (stack delegado en Claude y anotado en `PRODUCT.md`); guía de Cloudflare en el repo; modo claro
  y oscuro automático; español.
- **Visuales:** `DESIGN.md` es ley. Los tokens, la escala tipográfica, las reglas con nombre
  (Activity Tint, Strike Don't Erase, Linked Strike, Two Columns…) y los componentes se
  trasladan tal cual.
- **Datos personales (POL-MMNSEG-001-1.1):** seeds, fixtures, tests y ejemplos solo con datos
  inventados. La app no pide nombre, email ni teléfono: cada uno ve "tú" y "tu pareja". Los
  días activos y lo que se come son datos de hábitos; se guardan solo en el hogar y no se mandan
  a ningún servicio de terceros salvo Cloudflare, que aloja la app. Sin analítica ni rastreo.
- **Git:** commits como PeterBits (`.claude/rules/git-conventions.md`); Claude no hace push.
- **Coste:** cabe en los planes gratuitos de Cloudflare (Workers Free, D1, Durable Objects con
  SQLite y R2 hasta 10 GB). R2 pide registrar una tarjeta para activarse aunque no cobre.

## 4. Arquitectura

**Un solo Worker de Cloudflare** que sirve la web, la API y la sincronización
**[Decisión de Claude]**. `PRODUCT.md` decía Pages; hoy Cloudflare recomienda Workers con
static assets para proyectos nuevos, y así todo se despliega con un solo `wrangler deploy`.

```
iPhone (Safari / PWA)
  React + Vite + TS ── IndexedDB (Dexie): copia local + cola de operaciones
  service worker (Workbox): app shell y fotos en caché
        │ HTTPS /api/*           │ WebSocket /api/vivo
        ▼                        ▼
Worker "despensa" (Hono)  ──►  Durable Object "Hogar" (uno por hogar)
  ├─ assets: la SPA                avisa a los móviles conectados de que hay cambios
  ├─ D1 "despensa": los datos      (WebSockets con hibernación; no guarda datos)
  └─ R2 "despensa-fotos": fotos de recetas
```

- **Frontend:** React 19, React Router, Vite y el plugin de Vite de Cloudflare. Dexie para la
  base local en IndexedDB y `vite-plugin-pwa` (Workbox) para el service worker y el manifest.
  CSS propio con los tokens de `DESIGN.md` como custom properties, sin librería de componentes
  **[Decisión de Claude]**.
- **Backend:** Hono en el Worker, Zod para validar entradas y `@simplewebauthn/server` para
  passkeys **[Decisión de Claude]**.
- **D1 es la fuente de verdad.** El Durable Object solo reparte avisos de "hay cambios hasta la
  versión N" a los móviles conectados.
- **Estructura del repo:**

```
app/            el cliente React (pantallas, componentes, estilos con tokens, store local)
worker/         el Worker (rutas de la API, auth, sincronización, Durable Object)
shared/         tipos y reglas de dominio puras que usan los dos lados
migrations/     SQL de D1, numerado
docs/cloudflare.md  la guía paso a paso
prototipo/      los prototipos aprobados (referencia, no se despliegan)
```

## 5. Datos (D1)

Todas las tablas de contenido llevan `id` de texto (UUID generado en el móvil, para poder crear
sin conexión), `hogar_id`, `version` (secuencia del hogar en la última escritura) y `borrado`
(borrado lógico, para que el borrado también se sincronice).

| Tabla | Campos principales |
|---|---|
| `hogar` | id, version (contador de cambios), creado |
| `miembro` | id, hogar_id, creado (sin nombre) |
| `credencial` | id (passkey), miembro_id, clave_publica, contador, transportes |
| `sesion` | id (hash), miembro_id, caduca |
| `invitacion` | token_hash, hogar_id, caduca, usada |
| `receta` | id, nombre, corto (nombre corto para el origen en la lista: "lentejas"), raciones, minutos, tipos (calculados de sus ingredientes), foto_key, notas |
| `ingrediente` | id, receta_id, orden, nombre, cantidad, unidad, tipo (hidratos, proteína, grasas, fibra o ninguno), seccion, a_la_lista (no para básicos como sal, aceite o agua), compra (texto opcional de lo que se compra: "1 cabeza", "1 bote") |
| `paso` | id, receta_id, orden, texto (con marcas `{texto\|ingrediente_id}`), minutos |
| `semana` | id, lunes (fecha), propuesta_aceptada |
| `semana_dia` | semana_id, dia (0–6), activo, fuera |
| `semana_plato` | semana_id, hueco, receta_id, sustituye_a (para "En lugar de") |
| `comida` | id, fecha, receta_id o texto, fuera, planificada_receta_id |
| `nota` | comida_id, miembro_id, valor (1–10) |
| `producto` | id, nombre, cantidad, seccion, origen (recetas o "a mano"), estado (pendiente, carro, casa), cogido_por |
| `frecuente` | nombre, seccion, cantidad_habitual, veces |
| `reto` | id, valor, caduca (retos de passkeys de un solo uso; sin hogar) |
| `op_vista` | id, hogar_id, creada (operaciones ya aplicadas, para no repetirlas) |

Las migraciones van en `migrations/` y se aplican con `wrangler d1 migrations apply`.

## 6. Sincronización y uso sin conexión

- El cliente escribe primero en Dexie y apunta una **operación** en una cola local (id único,
  entidad, cambio). La pantalla responde al momento, con o sin red.
- Con red, la cola se envía a `POST /api/ops`. El Worker aplica cada operación en una
  transacción (batch de D1): sube `hogar.version`, la estampa en las filas tocadas y descarta
  las operaciones ya vistas por su id, así reintentar no duplica nada.
- Después avisa al Durable Object del hogar, que manda `{version}` por WebSocket al otro móvil.
  Ese móvil pide `GET /api/cambios?desde=N` y aplica las filas con versión mayor.
- **Conflictos:** gana la última escritura según el orden del servidor, por fila
  **[Decisión de Claude]**. Para dos personas que rara vez editan lo mismo a la vez basta; las
  operaciones de la Lista (marcar, desmarcar) se escriben como cambios de estado idempotentes.
- **Sin conexión:** la Lista, las recetas, la semana y el registro se leen y se editan desde la
  copia local. Al volver la red se vacía la cola y se piden cambios. El WebSocket se reconecta
  solo y, en cada vuelta a primer plano, se piden cambios por si se perdió algún aviso.
- **Deshacer** (Strike, Don't Erase) es local: genera la operación inversa y la encola.

## 7. Acceso: hogar y passkeys

**[Decisión de Claude]**, a falta de que el usuario hable de cómo entran:

- La primera persona abre la web, pulsa "Crear nuestro hogar" y registra una **passkey** (Face
  ID); no hay usuario ni contraseña. Queda dentro con una cookie de sesión (HttpOnly, Secure,
  SameSite=Lax, 180 días, renovada al usarse; Lax y no Strict para que abrir la app desde un enlace de WhatsApp no la muestre como si no hubierais entrado).
- Desde Ajustes genera un **enlace de invitación** de un solo uso, que caduca en 24 horas, y se
  lo manda a su pareja (WhatsApp, AirDrop). Al abrirlo, la pareja registra su passkey y entra
  en el mismo hogar. Como mucho, dos miembros por hogar.
- **Volver a entrar:** "Entrar con mi passkey" usa la passkey ya registrada (credencial
  descubrible), sin invitación. Es necesario porque la app instalada en la pantalla de inicio no
  comparte la sesión de Safari.
- **Recuperación:** las passkeys viajan con el llavero de iCloud. Si alguien pierde el acceso,
  el otro le genera una invitación nueva.
- La invitación se guarda como hash. La API exige sesión en todo salvo crear hogar, aceptar
  invitación y los assets.

## 8. Reglas del dominio

Son funciones puras en `shared/`, con tests:

- **Platos por semana:** dos en la primera versión, como en la pantalla aprobada; el tercer
  plato que permite `PRODUCT.md` queda para después **[Decisión de Claude]**.
- **Reparto de la semana:** el domingo empieza fuera, como en los prototipos, pero se puede
  cambiar (decidido por el usuario el 22/10/2026): si se marca como día de comer, entra en el
  reparto como los demás. El plato con algún ingrediente de tipo hidratos va a los días
  activos y el otro al resto, igual que `reparto()` en `prototipo/semana.html`. El diseño de
  cómo se cambia el domingo va en el plan 3.
- **Propuesta de la semana siguiente** **[Decisión de Claude]:** un plato energético y uno que
  no lo sea. Se eligen entre recetas con media de 7 o más que no se hayan comido en las tres
  últimas semanas, empezando por las que hace más tiempo que no se comen. Una receta sin notas
  cuenta como "por probar" y entra como si tuviera un 7, para que lo nuevo llegue a proponerse.
  Con pocas recetas se relajan los filtros por ese orden.
- **"Hace tiempo que no coméis":** el mismo criterio, mostrando la nota media y "Hace N
  semanas"; "Cambiar por…" sustituye al plato del mismo tipo (energético por energético).
  Debajo, un enlace "Elegir otra receta" abre el recetario en modo elegir para poner cualquier
  receta en un hueco **[Decisión de Claude]**.
- **Lista desde la semana:** une los ingredientes de los platos de la semana siguiente.
  - Cada receta cuenta una vez, con sus cantidades tal cual: se cocina una vez para todos sus
    días **[Decisión de Claude]**.
  - Como en `prototipo/lista.html`, no entran los ingredientes marcados como básicos
    (`a_la_lista` desactivado: sal, aceite, agua, laurel, harina…). Si un ingrediente tiene
    cantidad de compra ("1 cabeza", "1 bote"), la lista muestra esa en vez de la de la receta;
    si dos recetas piden lo mismo con cantidad de compra, se muestra una sola vez.
  - Los repetidos se juntan por nombre normalizado. Las unidades compatibles se suman
    (g con kg, ml con l, unidades con unidades); si no son compatibles, se muestran juntas
    ("200 g + 1 bote").
  - "Actualizar la lista" rehace solo la parte que sale de recetas y respeta lo añadido a mano
    y los estados.
- **Productos frecuentes:** cada producto añadido a mano suma una vez por nombre. "Lo de siempre"
  muestra los cuatro más usados que no estén ya en la lista. Cada producto recuerda su sección;
  si es nuevo y no se reconoce, va a "Otros".
- **Notas:** una por miembro y comida, del 1 al 10. Se pueden cambiar en cualquier momento
  **[Decisión de Claude]**. La nota de un plato en Semana y Recetas es la media de todas sus
  notas, con una cifra decimal y coma (el supuesto de `PRODUCT.md`).
- **Registro:** cada día con comida planificada genera su fila. "Comimos otra cosa" guarda la
  receta o el texto real y conserva lo planificado para mostrar "En lugar de". Las notas
  siempre van a lo que se comió de verdad.
- **Marcas en los pasos:** `{2 cebollas|ing_id}` se muestra en negrita y alimenta el tachado
  enlazado de ingredientes de Recetas. El editor ayuda a ponerlas: al escribir un paso, sugiere
  los ingredientes cuyo nombre aparece en el texto.

## 9. Pantallas

Las cuatro de `prototipo/` se trasladan con su comportamiento. Lo que cambia es de dónde salen
los datos y que la Lista ya no simula a la pareja: la ve de verdad.

Pantallas nuevas, sin prototipo. Se diseñan con impeccable como extensión del mundo que ya
existe, antes de construirlas:

- **Bienvenida:** crear hogar o entrar con una invitación.
- **Invitar a tu pareja y Ajustes:** mínimos: invitación, cerrar sesión y versión.
- **Editor de receta:** nombre, raciones, tiempo, foto, ingredientes (nombre, cantidad, unidad,
  tipo, sección) y pasos con sus marcas.
- **Estados sin datos:** primer arranque sin recetas, semana sin propuesta posible y registro
  vacío.

Fotos: se reducen en el móvil a 1600 px de lado mayor (WebP o JPEG al 80 %) antes de subirlas.
Se guardan en R2 con una clave aleatoria por hogar y las sirve el Worker solo a miembros del
hogar, con caché privada **[Decisión de Claude]**. El acceso a las fotos va detrás de una
interfaz pequeña (guardar, leer, borrar). Si no queréis registrar tarjeta para R2, se cambia a
Workers KV (gratis, sin tarjeta, de sobra para unos cientos de fotos) con un ajuste en la
configuración.

## 10. Pruebas y calidad

- TDD en la lógica de dominio de `shared/`: reparto, propuesta, agregación de la lista, unidades,
  marcas de pasos, medias y recomendaciones.
- La API y D1 se prueban con Vitest y `@cloudflare/vitest-pool-workers`, sobre una D1 local.
- Un humo de extremo a extremo con Playwright en local para cada pestaña: crear hogar, añadir
  receta, proponer semana, hacer la lista, marcar en dos contextos a la vez y comprobar que el
  otro lo ve.
- La interfaz se revisa con impeccable igual que los prototipos: capturas en claro y oscuro a
  390 y 375, y el revisor de acabado por pantalla.
- Datos de desarrollo: un seed con las recetas inventadas de los prototipos.

## 11. Despliegue y guía de Cloudflare

`docs/cloudflare.md`, escrita para alguien que nunca ha usado Cloudflare:

1. Crear la cuenta y verificar el email.
2. Instalar las dependencias del repo y hacer `wrangler login`.
3. Crear la D1 y apuntar su id en `wrangler.jsonc`.
4. Activar R2: avisa de que pide tarjeta, de lo que cubre el plan gratuito y de cómo poner una
   alerta de gasto.
5. Crear el bucket.
6. Aplicar las migraciones.
7. Configurar los valores del entorno: el dominio, que las passkeys necesitan. La app se
   queda en su dirección `*.workers.dev` **[Decisión de Claude]**; un dominio propio solo
   conviene ponerlo antes de empezar a usarla, porque las passkeys y la app instalada van
   atadas a la dirección y cambiarla obliga a volver a invitar.
8. `wrangler deploy` y abrir la URL `*.workers.dev`.
9. Instalar la app en el iPhone (Compartir, "Añadir a pantalla de inicio").
10. Invitar a la pareja.
11. Ver los registros y los límites de uso.
12. Volver a desplegar, y deshacer un despliegue.

Todo con capturas descritas en texto y qué hacer si algo falla. El desarrollo local
(`npm run dev`) funciona sin cuenta.

## 12. Orden de construcción

1. Base del repo: Vite, React, el Worker con assets, D1 local, tokens de `DESIGN.md` y la barra
   de pestañas.
2. Dominio en `shared/` con tests.
3. Acceso: crear hogar, passkeys, invitación y sesión. Incluye diseñar la Bienvenida.
4. Recetas: listado y vista para cocinar sobre datos reales. Después, el editor (diseño y
   construcción) y las fotos en R2.
5. Semana: propuesta, días activos, cambiar plato y hacer la lista.
6. Lista: los dos pasos, frecuentes, terminar y vaciar.
7. Registro: diario, notas de cada uno y "Comimos otra cosa".
8. Sincronización en vivo y sin conexión: cola, cambios, Durable Object y service worker.
9. Guía de Cloudflare y primer despliegue con el usuario.

## 13. Decisiones de Claude para revisar

1. Un único Worker con static assets en lugar de Cloudflare Pages.
2. Passkeys con invitación de un solo uso. Sin email, sin nombres y como mucho dos miembros.
3. D1 como fuente de verdad. El Durable Object solo avisa. Gana la última escritura por fila.
4. Todo funciona sin conexión con una copia local (Dexie) y una cola de operaciones.
5. Cada receta se cocina una vez para todos sus días: la lista suma las cantidades de la receta
   una sola vez.
6. Las notas se pueden cambiar siempre. La media de todas es la nota que ven Semana y Recetas.
7. La propuesta semanal sale de media de 7 o más, sin repetir en tres semanas y empezando por lo
   más antiguo.
8. Fotos reducidas en el móvil y servidas solo a miembros del hogar.
9. Sin librería de componentes: CSS propio con los tokens de `DESIGN.md`.
10. Dos platos por semana en la primera versión.
11. La lista sigue el prototipo: sin básicos y con cantidad de compra cuando la hay.
12. Las recetas sin nota cuentan como un 7 para proponerse, y "Elegir otra receta" permite poner
    cualquiera.
13. La app vive en `*.workers.dev`.
14. Las fotos van en R2 detrás de una interfaz que permite pasar a KV si no se quiere tarjeta.

Del plan 2 (recetas), 22/10/2026:

15. Cada receta tiene su dirección (`/recetas/<id>`), no un hash; al volver, el índice recupera
    la posición.
16. Los pasos se escriben como texto normal. Al guardar, la app marca sola los ingredientes que
    nombra cada paso, con la cantidad que lleve delante ("500 g de lentejas"). Un paso usa los
    ingredientes que nombra; no hay que marcar nada a mano.
17. El progreso al cocinar es de cada móvil, no se comparte y se olvida a las 12 horas del
    último toque.
18. En el índice, una receta sin notas no lleva puntos guía ni cifra.
19. Cantidades: "1.000 g" son mil gramos; un rango ("2-3 dientes") cuenta como el número mayor;
    las fracciones ("1/2", "1 1/2", "½") se leen como número.
20. El nombre corto que sale en la lista ("lentejas") es la primera palabra del nombre, sin
    campo propio en el editor.
21. Por defecto no van a la lista la sal, el aceite, el agua, el laurel, la harina y la
    pimienta. Se puede cambiar en cada ingrediente.
22. La foto se sube al elegirla, y para eso hace falta conexión. Cambiar o quitar una foto no
    borra la anterior: la limpieza de fotos sin receta va en el plan 6.
23. Borrar una receta se puede deshacer, como cualquier otro cambio.

Del plan 3 (semana), 26/10/2026. El usuario pidió continuar sin preguntas; son el supuesto
principal de cada punto:

24. Semana se abre en "Esta semana" de lunes a jueves y en "La que viene" de viernes a
    domingo (el supuesto del apartado 14). El segmento elegido va en la dirección
    (`/semana?ver=viene`), así se conserva al volver de elegir una receta.
25. La propuesta no se guarda hasta que alguien toca la semana, y cada gesto escribe solo lo
    que toca (un día o un hueco) con ids fijos sacados del lunes. Los dos móviles escriben las
    mismas filas y nunca hay dos semanas para el mismo lunes. La fila de la semana solo la
    escribe "Hacer la lista", que fija el menú y los siete días: así un móvil sin sincronizar
    no deshace, al tocar un día, la lista que hizo el otro.
26. Una semana nueva copia los días activos y el domingo de la última semana guardada; sin
    ninguna, L, X y V activos y el domingo fuera.
27. La propuesta, las sugerencias y "Hace N semanas" se calculan respecto al lunes de la
    semana que se planifica, y solo con lo anterior a ese lunes: lo apuntado en el Registro y,
    en los días sin registro, lo planificado. Así el menú de una semana no cambia a mitad de
    semana.
28. Con recetas de un solo tipo, los dos huecos se llenan con ese tipo, sin repetir receta. Un
    hueco sin receta posible, o cuya receta se borró, queda "Sin plato" y conserva sus días, para
    que se vea qué días se quedan sin plato.
29. "Hace tiempo que no coméis" enseña dos recetas: la mejor energética y la mejor que no lo
    es, fuera del menú. Una receta sin notas dice "Por probar".
30. Cada plato del menú tiene su "Elegir otra receta", que abre el recetario en modo elegir
    para ese hueco, sin las recetas que ya están en el menú.
31. La lista sabe de qué recetas salió (columna `semana.lista`). Cambiar un plato pide
    actualizarla; cambiar los días no, porque cada receta se cocina una vez.
32. "Hacer la lista" rehace desde cero los productos que salen de recetas; "Actualizar la
    lista" conserva el estado de los que siguen. Lo añadido a mano no se toca nunca, aunque
    se llame igual que un ingrediente.
33. Ajustes se abre desde Semana. Invitar usa la hoja de compartir del iPhone y, si no la
    hay, copia el enlace. Cerrar sesión envía antes lo pendiente.
34. La versión que enseña Ajustes es la de `package.json`: 0.3.0 con este plan.

## 14. Sigue abierto (no bloquea el plan)

- Temporizadores en los pasos con tiempo y cambiar las raciones de una receta. Fuera de la
  primera versión.

Decidido por el usuario el 22/10/2026:

- **Sacar a alguien del hogar:** no hace falta por ahora. Si alguien acepta una invitación por
  error, el hogar se queda completo (la regla R8 del plan 1 sigue como está).
- **El domingo:** se puede cambiar (ver apartado 8).
- **Borrar un producto añadido por error:** con un botón de borrar producto, en lugar de
  deslizar. El diseño va en el plan 4.

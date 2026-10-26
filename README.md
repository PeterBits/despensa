# Despensa

Decidir con tu pareja la comida de la semana en un par de minutos, con la lista de la compra hecha
sola. Es una PWA para iPhone: React, Vite y TypeScript, servida por un Worker de Cloudflare con D1.

- Producto: [`PRODUCT.md`](PRODUCT.md)
- Sistema visual: [`DESIGN.md`](DESIGN.md)
- Especificación técnica: [`docs/superpowers/specs/2026-10-20-despensa-app-design.md`](docs/superpowers/specs/2026-10-20-despensa-app-design.md)
- Prototipos aprobados: [`prototipo/`](prototipo/) (abre `prototipo/index.html`)

## En qué punto está

La app se construye en seis planes. Los tres primeros están terminados:
- **El 1, los cimientos:** acceso, base de datos, sincronización y las reglas de la semana.
- **El 2, las recetas:** el recetario, la receta para cocinar y el editor con fotos.
- **El 3, la semana:** la propuesta, los días activos, el domingo, cambiar platos, hacer la lista y
  Ajustes.

La pantalla de la lista y el registro llegan en los planes 4 y 5. Hay 276 tests y todos pasan.

| Parte | Estado |
|---|---|
| Entrar sin contraseñas: passkey, invitación y sesión | Funciona. La invitación y cerrar sesión están en Ajustes |
| Copia en el móvil y sincronización | Funciona. La copia se abre con tu hogar y se sincroniza sola al abrir, al escribir y al volver a la app |
| Reglas: reparto, propuesta, lista, cantidades y notas | Funcionan. Las recetas y la semana ya usan las suyas |
| Recetas: índice, búsqueda, cocinar, crear, editar, borrar y fotos | Funciona. El índice enseña también los platos de esta semana y de la que viene |
| Semana: propuesta, días activos, domingo, cambiar platos y hacer la lista | Funciona. La lista ya guarda sus productos; su pantalla llega en el plan 4 |
| Lista de la compra | Plan 4 |
| Registro | Plan 5 |
| En vivo entre los dos, sin conexión y publicación | Plan 6 |

## La app hoy

Las pantallas que ya existen, en un iPhone de 390 puntos.

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/app-bienvenida-claro.png" alt="Bienvenida: el título Despensa, una línea que explica la app, el botón Crear nuestro hogar y el enlace Ya tengo cuenta: entrar"></td>
    <td width="25%"><img src="docs/capturas/app-invitacion-claro.png" alt="Invitación: Tu pareja te invita a su Despensa, con el botón Entrar con Face ID"></td>
    <td width="25%"><img src="docs/capturas/app-invitacion-caducada-claro.png" alt="Invitación que ya no vale, con el enlace Entrar con mi passkey"></td>
    <td width="25%"><img src="docs/capturas/app-ajustes-claro.png" alt="Ajustes: Tu pareja con el botón Invitar a tu pareja, Sesión con Cerrar sesión y la versión 0.3.0"></td>
  </tr>
  <tr>
    <td><b>Bienvenida</b><br>Crear vuestro hogar o volver a entrar con tu passkey.</td>
    <td><b>Invitación</b><br>Lo que ve tu pareja al abrir el enlace.</td>
    <td><b>Invitación que ya no vale</b><br>Caducó, ya se usó o el hogar está completo.</td>
    <td><b>Ajustes</b><br>Invitar a tu pareja, cerrar sesión y la versión. Se abre con el engranaje de Semana.</td>
  </tr>
</table>

La semana y las recetas, con las diez recetas inventadas de la semilla de desarrollo, su historial de
notas también inventado y una foto ilustrada.

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/app-semana-esta-claro.png" alt="Esta semana: Hoy toca pollo al curry con arroz, los días activos y el menú de dos platos con el domingo fuera"></td>
    <td width="25%"><img src="docs/capturas/app-semana-claro.png" alt="La que viene: la propuesta de arroz con pollo y pisto con huevo, Elegir otra receta en cada plato, el domingo fuera con Comer en casa, una sugerencia y la lista ya hecha con 10 productos"></td>
    <td width="25%"><img src="docs/capturas/app-elegir-claro.png" alt="Elegir receta en lugar de pisto con huevo: Cancelar, el buscador y todas las recetas que no están en el menú"></td>
    <td width="25%"><img src="docs/capturas/app-recetas-claro.png" alt="Recetas: Nueva receta, el buscador, los platos de esta semana y de la que viene con sus días, y todas las recetas con su nota"></td>
  </tr>
  <tr>
    <td><b>Esta semana</b><br>Lo que toca hoy y los días que ya pasaron, tachados.</td>
    <td><b>La que viene</b><br>La propuesta ya escrita: tocas los días activos, cambias un plato y haces la lista.</td>
    <td><b>Elegir receta</b><br>Cualquier receta para un plato del menú, sin las que ya están.</td>
    <td><b>Recetas</b><br>Primero los platos de las dos semanas; luego todas, con búsqueda.</td>
  </tr>
</table>

<table>
  <tr>
    <td width="33%"><img src="docs/capturas/app-receta-claro.png" alt="Lentejas estofadas a medio cocinar: los dos primeros pasos y los ingredientes que ya no se usan, tachados"></td>
    <td width="33%"><img src="docs/capturas/app-editor-claro.png" alt="Editor de receta en la parte Ingredientes: cada ingrediente con su cantidad, su tipo y su sección"></td>
    <td width="33%"><img src="docs/capturas/app-receta-foto-claro.png" alt="Lentejas estofadas con la miniatura de su foto junto al título"></td>
  </tr>
  <tr>
    <td><b>Cocinar</b><br>Al tachar un paso se tachan arriba los ingredientes que ya no se usan.</td>
    <td><b>Editor</b><br>Por partes: la receta, los ingredientes y los pasos.</td>
    <td><b>Con foto</b><br>Una miniatura junto al título; al tocarla se abre a lo ancho.</td>
  </tr>
</table>

<details>
<summary>En oscuro</summary>

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/app-bienvenida-oscuro.png" alt="Bienvenida en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-invitacion-oscuro.png" alt="Invitación en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-invitacion-caducada-oscuro.png" alt="Invitación que ya no vale en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-ajustes-oscuro.png" alt="Ajustes en modo oscuro"></td>
  </tr>
  <tr>
    <td width="25%"><img src="docs/capturas/app-semana-esta-oscuro.png" alt="Esta semana en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-semana-oscuro.png" alt="La que viene en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-elegir-oscuro.png" alt="Elegir receta en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-recetas-oscuro.png" alt="Recetas en modo oscuro"></td>
  </tr>
  <tr>
    <td width="25%"><img src="docs/capturas/app-receta-oscuro.png" alt="Lentejas estofadas a medio cocinar en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/app-editor-oscuro.png" alt="Editor de receta en modo oscuro"></td>
  </tr>
</table>

</details>

## Cómo será

Los cuatro prototipos aprobados, con recetas inventadas. Semana y Recetas ya están construidas (arriba);
Lista y Registro son el diseño que se construye en los planes 4 y 5. El editor de recetas y Ajustes
tienen su propio prototipo, `prototipo/editor.html` y `prototipo/ajustes.html`.

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/proto-semana-claro.png" alt="Prototipo de Semana: días activos, el menú repartido por días, el domingo fuera y el botón Hacer la lista de la compra"></td>
    <td width="25%"><img src="docs/capturas/proto-recetas-claro.png" alt="Prototipo de Recetas: el recetario con la nota media de cada receta"></td>
    <td width="25%"><img src="docs/capturas/proto-lista-claro.png" alt="Prototipo de Lista: productos por sección con su cantidad y la receta de la que vienen"></td>
    <td width="25%"><img src="docs/capturas/proto-registro-claro.png" alt="Prototipo de Registro: un diario por días con la nota de cada uno"></td>
  </tr>
  <tr>
    <td><b>Semana</b><br>Marcas los días activos; el plato energético va a esos días y el otro al resto. El domingo es fuera.</td>
    <td><b>Recetas</b><br>Las cantidades van dentro de los pasos y cada ingrediente se tacha cuando lo has echado.</td>
    <td><b>Lista</b><br>Primero el repaso en casa, luego la compra por secciones del súper.</td>
    <td><b>Registro</b><br>Un diario: cada uno pone su nota del 1 al 10 ese mismo día.</td>
  </tr>
</table>

<details>
<summary>En oscuro</summary>

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/proto-semana-oscuro.png" alt="Prototipo de Semana en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/proto-recetas-oscuro.png" alt="Prototipo de Recetas en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/proto-lista-oscuro.png" alt="Prototipo de Lista en modo oscuro"></td>
    <td width="25%"><img src="docs/capturas/proto-registro-oscuro.png" alt="Prototipo de Registro en modo oscuro"></td>
  </tr>
</table>

</details>

## Cómo se usa hoy

1. **Crea vuestro hogar.** Abre la app y pulsa **Crear nuestro hogar**. Face ID crea tu passkey y
   entras en Semana. No hay usuario ni contraseña, y la app no pide nombre, correo ni teléfono.
2. **Invita a tu pareja.** En Semana, el engranaje de arriba abre **Ajustes**. **Invitar a tu pareja**
   abre la hoja de compartir del iPhone para mandarle el enlace por WhatsApp o AirDrop; si no hay hoja,
   el enlace se copia. Vale una sola vez durante 24 horas, y el hogar admite dos personas. Con los
   dos dentro, Ajustes ya no ofrece invitar.
3. **Tu pareja acepta.** Abre el enlace, pulsa **Entrar con Face ID** y crea su propia passkey. Desde
   ese momento los dos estáis en el mismo hogar.
4. **Volver a entrar.** **Ya tengo cuenta: entrar** usa la passkey que ya tienes. Lo necesitarás en la
   app instalada en la pantalla de inicio, que no comparte la sesión con Safari.
5. **Añade vuestras recetas.** En Recetas, **Nueva receta** abre el editor, que va por partes:
   - **Receta:** el nombre, las raciones, el tiempo y la foto.
   - **Ingredientes:** la cantidad de cada uno y su tipo. El tipo dice si el plato es energético. La
     sección del súper y si va a la lista se proponen solos.
   - **Pasos:** se escriben tal cual los diríais. Debajo de cada paso, la línea **Usa** dice qué
     ingredientes nombra. Esos ingredientes se tachan al cocinar.

   La foto se sube al elegirla y necesita conexión. El resto se guarda aunque no haya cobertura.
6. **Cocina.** Abre la receta y toca cada paso al terminarlo. Arriba se tachan los ingredientes que
   ya no vas a usar. El progreso se queda en el móvil 12 horas, y **Empezar de nuevo** lo borra (con
   **Deshacer**).
7. **Corrige o borra.** **Editar** abre la receta en el editor. **Borrar receta** la quita, y en el
   índice queda **Deshacer** hasta la siguiente acción.
8. **Planifica la semana que viene.** Semana se abre en **Esta semana** de lunes a jueves, con lo que
   toca hoy, y en **La que viene** de viernes a domingo. En La que viene la propuesta ya está escrita:
   un plato con hidratos para los días activos y otro para el resto, elegidos entre los que tienen
   buena nota y hace tiempo que no coméis.
   - **Días activos:** toca un día para cambiarlo y los platos se recolocan solos.
   - **El domingo:** empieza fuera; **Comer en casa** lo mete en el reparto.
   - **Cambiar un plato:** **Cambiar por …** en una sugerencia, o **Elegir otra receta** para poner
     cualquiera. El plato de antes queda en **En lugar de … · Deshacer**.
   - **La lista:** **Hacer la lista de la compra** la llena con los ingredientes de los dos platos. Si
     después cambias un plato, **Actualizar la lista** rehace lo que sale de las recetas y respeta lo
     demás. La pantalla de la lista llega en el plan 4.

   Nada de la propuesta se guarda hasta que tocáis algo, y lo que toca cada uno se ve en el otro
   móvil al sincronizar.
9. **Cerrar sesión.** En Ajustes, **Cerrar sesión** envía antes lo pendiente. Para volver, **Ya tengo
   cuenta: entrar**.

> Si una invitación ya no vale, pide un enlace nuevo. Si en realidad ya estabas dentro, usa **Entrar
> con mi passkey**. No se puede sacar a nadie de un hogar, y de momento no hace falta: si alguien
> acepta una invitación por error, el hogar se queda completo.

## Instalar en tu ordenador

Para desarrollar y probar en local. Necesitas **Node.js 20.19 o posterior**, npm y Chrome, que
permite probar las passkeys con un autenticador virtual.

1. Abre una terminal en la carpeta del proyecto e instala las dependencias:

   ```sh
   npm install
   ```

2. Crea la base de datos local con el esquema:

   ```sh
   npm run db:migrar:local
   ```

   Repítelo cada vez que actualices el repo: aplica solo las migraciones nuevas (la `0002` añade a
   cada semana de qué recetas salió su lista).

3. Comprueba que pasan los tests:

   ```sh
   npm test
   ```

4. Arranca la app y abre `http://localhost:5173`. Usa exactamente esa dirección: las passkeys y la
   protección contra peticiones de otras webs dependen de ella.

   ```sh
   npm run dev
   ```

5. Activa un autenticador en Chrome: DevTools, menú ⋮, *More tools*, *WebAuthn*, *Enable virtual
   authenticator environment* y *Add* con protocolo `ctap2`, transporte `internal` y *resident key* y
   *user verification* activados. Si tu ordenador tiene Touch ID o Windows Hello, también sirve.
6. Para tener recetas con las que probar, crea un hogar y escribe en la consola del navegador:

   ```js
   await despensa.semilla()
   ```

   Carga las diez recetas inventadas de los prototipos y un historial también inventado: esta semana
   planificada y seis semanas de comidas con una nota cada una, para que Semana tenga qué proponer y
   qué sugerir. Solo existe en desarrollo (`npm run dev`) y se puede repetir sin duplicar nada. Hazlo
   en un solo hogar: la semilla usa ids fijos.

### Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | La app en `localhost:5173`, con el Worker y la D1 locales. |
| `npm test` | Todos los tests: los de la app y los del Worker. |
| `npm run typecheck` | Comprueba los tipos de la app y del Worker. |
| `npm run build` | Genera la versión para publicar en `dist/`. |
| `npm run db:migrar:local` | Aplica las migraciones pendientes a la D1 local. |

### Si algo falla

- **"Esta petición no viene de Despensa."** La app no está abierta desde `http://localhost:5173`
  (por ejemplo, desde `127.0.0.1`). Cambia a esa dirección.
- **"No se pudo usar Face ID. Vuelve a intentarlo."** Se canceló la passkey o no hay autenticador.
  En Chrome, activa el virtual del paso 5.
- **El puerto 5173 está ocupado.** El puerto es fijo a propósito. Cierra el otro servidor y vuelve a
  ejecutar `npm run dev`.
- **Safari no mantiene la sesión en local.** Safari puede rechazar la cookie segura en
  `http://localhost`. Para desarrollar, usa Chrome.

## Instalar en el iPhone

Cuando esté publicada en Cloudflare, en el plan 6. La publicación usa el plan gratuito y una dirección
`*.workers.dev`, y la guía paso a paso irá en `docs/cloudflare.md`.

1. Abre la dirección de la app en Safari.
2. Toca **Compartir** y luego **Añadir a pantalla de inicio**.
3. Abre Despensa desde el icono. Crea el hogar o, si ya lo creaste en Safari, usa **Ya tengo cuenta:
   entrar**.

Las passkeys viajan con el llavero de iCloud, así que un iPhone nuevo con tu misma cuenta entra sin
hacer nada más.

## Tus datos

| Dato | Dónde queda |
|---|---|
| Nombre, correo o teléfono | No se piden |
| Tu passkey | En tu llavero |
| Sesiones e invitaciones | Solo su hash |
| Recetas, semana, lista y notas | En la D1 de tu cuenta de Cloudflare |
| Fotos de las recetas | En R2, en tu cuenta de Cloudflare, reducidas en el móvil y sin datos de la cámara ni de ubicación |
| Progreso al cocinar | Solo en tu móvil, 12 horas |

Cada hogar solo ve sus filas y sus fotos, y nadie puede cambiar ni borrar la nota de su pareja. Las
capturas de este README usan datos inventados, y la foto es una ilustración, no una foto real.

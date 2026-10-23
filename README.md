# Despensa

Decidir con tu pareja la comida de la semana en un par de minutos, con la lista de la compra hecha
sola. Es una PWA para iPhone: React, Vite y TypeScript, servida por un Worker de Cloudflare con D1.

- Producto: [`PRODUCT.md`](PRODUCT.md)
- Sistema visual: [`DESIGN.md`](DESIGN.md)
- Especificación técnica: [`docs/superpowers/specs/2026-10-20-despensa-app-design.md`](docs/superpowers/specs/2026-10-20-despensa-app-design.md)
- Prototipos aprobados: [`prototipo/`](prototipo/) (abre `prototipo/index.html`)

## En qué punto está

La app se construye en seis planes. Los dos primeros están terminados:
- **El 1, los cimientos:** acceso, base de datos, sincronización y las reglas de la semana.
- **El 2, las recetas:** el recetario, la receta para cocinar y el editor con fotos.

Las demás pantallas de uso diario llegan en los planes 3 a 5.

| Parte | Estado |
|---|---|
| Entrar sin contraseñas: passkey, invitación y sesión | Funciona |
| Copia en el móvil y sincronización | Funciona. La copia se abre con tu hogar y se sincroniza sola al abrir, al escribir y al volver a la app |
| Reglas: reparto, propuesta, lista, cantidades y notas | Funcionan. Las recetas ya usan las suyas: cantidades, tipos y marcas de los pasos |
| Recetas: índice, búsqueda, cocinar, crear, editar, borrar y fotos | Funciona |
| Semana | Plan 3 |
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
    <td width="25%"><img src="docs/capturas/app-semana-claro.png" alt="Semana tras entrar: el título y la barra de cuatro pestañas, aún vacía"></td>
  </tr>
  <tr>
    <td><b>Bienvenida</b><br>Crear vuestro hogar o volver a entrar con tu passkey.</td>
    <td><b>Invitación</b><br>Lo que ve tu pareja al abrir el enlace.</td>
    <td><b>Invitación que ya no vale</b><br>Caducó, ya se usó o el hogar está completo.</td>
    <td><b>Tras entrar</b><br>Semana, Lista y Registro aún están vacías.</td>
  </tr>
</table>

Las recetas, con las diez recetas inventadas de la semilla de desarrollo y una foto también inventada.

<table>
  <tr>
    <td width="25%"><img src="docs/capturas/app-recetas-claro.png" alt="Recetas: el título, Nueva receta, el buscador y la lista de todas las recetas con sus tipos y su tiempo"></td>
    <td width="25%"><img src="docs/capturas/app-receta-claro.png" alt="Lentejas estofadas a medio cocinar: los dos primeros pasos y los ingredientes que ya no se usan, tachados"></td>
    <td width="25%"><img src="docs/capturas/app-editor-claro.png" alt="Editor de receta en la parte Ingredientes: cada ingrediente con su cantidad, su tipo y su sección"></td>
    <td width="25%"><img src="docs/capturas/app-receta-foto-claro.png" alt="Lentejas estofadas con la miniatura de su foto junto al título"></td>
  </tr>
  <tr>
    <td><b>Recetas</b><br>Todas, por nombre, con búsqueda por plato o ingrediente.</td>
    <td><b>Cocinar</b><br>Al tachar un paso se tachan arriba los ingredientes que ya no se usan.</td>
    <td><b>Editor</b><br>Por partes: la receta, los ingredientes y los pasos.</td>
    <td><b>Con foto</b><br>Una miniatura junto al título; al tocarla se abre a lo ancho.</td>
  </tr>
</table>

<details>
<summary>En oscuro</summary>

<table>
  <tr>
    <td width="33%"><img src="docs/capturas/app-bienvenida-oscuro.png" alt="Bienvenida en modo oscuro"></td>
    <td width="33%"><img src="docs/capturas/app-invitacion-oscuro.png" alt="Invitación en modo oscuro"></td>
    <td width="33%"><img src="docs/capturas/app-invitacion-caducada-oscuro.png" alt="Invitación que ya no vale en modo oscuro"></td>
  </tr>
  <tr>
    <td width="33%"><img src="docs/capturas/app-recetas-oscuro.png" alt="Recetas en modo oscuro"></td>
    <td width="33%"><img src="docs/capturas/app-receta-oscuro.png" alt="Lentejas estofadas a medio cocinar en modo oscuro"></td>
    <td width="33%"><img src="docs/capturas/app-editor-oscuro.png" alt="Editor de receta en modo oscuro"></td>
  </tr>
</table>

</details>

## Cómo será

Los cuatro prototipos aprobados, con recetas inventadas. Recetas ya está construida (arriba); el resto
es el diseño que se construye en los planes 3 a 5. El editor de recetas tiene su propio prototipo,
`prototipo/editor.html`.

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
2. **Invita a tu pareja.** La pantalla de Ajustes con el botón de invitar llega más adelante.
   Mientras tanto, con la sesión abierta, pide el enlace desde la consola del navegador:

   ```js
   fetch('/api/invitaciones', { method: 'POST' }).then(r => r.json()).then(console.log)
   ```

   La respuesta trae el `enlace` y cuándo `caduca`. Mándaselo por WhatsApp o AirDrop. Vale una sola
   vez durante 24 horas, y el hogar admite dos personas.
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

   Carga las diez recetas inventadas de los prototipos. Solo existe en desarrollo (`npm run dev`) y se
   puede repetir sin duplicar nada. Hazlo en un solo hogar: las recetas de la semilla tienen ids fijos.

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
| Recetas, semana y notas | En la D1 de tu cuenta de Cloudflare |
| Fotos de las recetas | En R2, en tu cuenta de Cloudflare, reducidas en el móvil y sin datos de la cámara ni de ubicación |
| Progreso al cocinar | Solo en tu móvil, 12 horas |

Cada hogar solo ve sus filas y sus fotos, y nadie puede cambiar ni borrar la nota de su pareja. Las
capturas de este README usan datos inventados, y la foto es una ilustración, no una foto real.

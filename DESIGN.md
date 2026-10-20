---
name: Despensa
description: La semana de comidas leída como el menú del día de un bar, con la sobriedad de las apps de Apple.
colors:
  ground: "#ffffff"
  bar: "#f6f6f3"
  ink: "#1b1f1d"
  ink-2: "#5c6360"
  ink-3: "#6b726e"
  rule: "rgba(27,31,29,.22)"
  hair: "rgba(27,31,29,.14)"
  tint: "#ff9f0a"
  tint-ink: "#a65200"
  on-tint: "#1b1f1d"
  fill: "#1b1f1d"
  on-fill: "#ffffff"
  seg: "#ecece8"
  seg-on: "#ffffff"
  ground-dark: "#1e2422"
  bar-dark: "#161b19"
  ink-dark: "#f2f1ec"
  ink-2-dark: "#a7aea9"
  ink-3-dark: "#8d9590"
  rule-dark: "rgba(242,241,236,.2)"
  hair-dark: "rgba(242,241,236,.12)"
  tint-ink-dark: "#ff9f0a"
  on-tint-dark: "#161b19"
  fill-dark: "#f2f1ec"
  on-fill-dark: "#161b19"
  seg-dark: "#2a312e"
  seg-on-dark: "#47504c"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "\"tnum\" 1"
  body-secondary:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.35
  tab-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
rounded:
  thumb: "7px"
  segment: "9px"
  button: "14px"
  full: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  row-gap: "12px"
  md: "16px"
  gutter: "20px"
  lg: "24px"
  section: "32px"
components:
  segmented-control:
    backgroundColor: "{colors.seg}"
    rounded: "{rounded.segment}"
    padding: "2px"
  segmented-thumb:
    backgroundColor: "{colors.seg-on}"
    textColor: "{colors.ink}"
    rounded: "{rounded.thumb}"
    height: "32px"
  day-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "40px"
  day-chip-active:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.full}"
    size: "40px"
  button-primary:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.on-fill}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    height: "52px"
  button-quiet:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    height: "52px"
  menu-row:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "0 20px 16px"
  tab-bar:
    backgroundColor: "{colors.bar}"
    textColor: "{colors.ink-3}"
    typography: "{typography.tab-label}"
    height: "58px"
  tab-bar-active:
    textColor: "{colors.tint-ink}"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  list-row-done:
    textColor: "{colors.ink-3}"
    typography: "{typography.body}"
  list-origin:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  list-tag:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  list-section-heading:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
  list-count:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  add-field:
    backgroundColor: "{colors.seg}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.segment}"
    padding: "0 12px"
    height: "44px"
  usual-button:
    textColor: "{colors.ink}"
    typography: "{typography.body-secondary}"
    height: "44px"
  presence-dot:
    backgroundColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    size: "8px"
  dock-status:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  back-button:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "44px"
  ingredient-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-secondary}"
    padding: "4px 20px"
  ingredient-qty:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-secondary}"
  ingredient-row-used:
    textColor: "{colors.ink-3}"
    typography: "{typography.body-secondary}"
  step-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "10px 20px"
  step-number:
    textColor: "{colors.ink-2}"
    typography: "{typography.title}"
    width: "28px"
  step-number-current:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    width: "28px"
  step-row-done:
    textColor: "{colors.ink-3}"
    typography: "{typography.body}"
  step-time:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  awake-line:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  recipe-end:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-secondary}"
  diary-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "10px 20px"
  diary-date:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    width: "36px"
  diary-date-active:
    textColor: "{colors.tint-ink}"
    typography: "{typography.body}"
    width: "36px"
  diary-date-today:
    textColor: "{colors.ink}"
    typography: "{typography.body-secondary}"
    rounded: "{rounded.full}"
    size: "28px"
  diary-date-out:
    textColor: "{colors.ink-3}"
    typography: "{typography.body}"
  diary-today-dish:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
  week-range:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  rating-columns:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  rating-figure:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  rating-figure-missing:
    textColor: "{colors.ink-3}"
    typography: "{typography.body}"
  rating-label:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  rating-circle:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    size: "30px"
  rating-circle-chosen:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.on-fill}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    size: "30px"
  partner-line:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-secondary}"
  missing-rating:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  cancel-quiet:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-secondary}"
    height: "44px"
---

# Design System: Despensa

## Overview

**Creative North Star: "El menú del día, en limpio"**

La semana se escribe como la pizarra de un bar a mediodía: el plato a la izquierda, sus días a la derecha, unidos por puntos guía; la nota del plato ocupa el sitio del precio. Esa estructura se pasa a limpio con la sobriedad de las apps de Apple (Notas, Recordatorios, Salud): letra del sistema, una sola superficie, un único tinte. De la pizarra sobrevive la forma de leer, no el material: no hay tiza, ni textura, ni letra a mano.

Es una interfaz de una mano y pocos segundos. La jerarquía sale solo del tamaño y del peso; no hay tarjetas, cajas ni fondos de sección. El color tiene un único trabajo, señalar la actividad física, y por eso se reconoce de un vistazo. Lo que cambia no desaparece: se tacha y se escribe al lado, como en una carta corregida a mano, y siempre se puede deshacer.

Los dos temas son de primera clase. Cada miembro de la pareja usa uno (claro y oscuro en iPhone) y la app sigue el ajuste del sistema; ninguno es derivado del otro. El claro es blanco con tinta grafito; el oscuro, grafito verdoso con tinta blanca cálida.

**Key Characteristics:**
- Una superficie plana; jerarquía por escala y peso, nunca por contenedores.
- Un naranja que solo significa actividad.
- Filas de carta con puntos guía y cifras tabulares.
- Tachar en vez de borrar; cada cambio enseña lo que había y ofrece deshacer.
- Claro y oscuro con el mismo peso, emparejados token a token.

## Colors

Neutros grafito con un leve matiz verde, un naranja de sistema y nada más.

### Primary
- **Naranja actividad** (`tint`): relleno de los días activos, punto de la leyenda, cursor, selección de texto y anillo de foco. Sobre él, el texto va en `on-tint` (tinta oscura en ambos temas).
- **Naranja tinta** (`tint-ink` / `tint-ink-dark`): el mismo naranja cuando tiene que ser texto o icono: los días del plato que va a los días activos y la pestaña seleccionada. En claro se oscurece para leerse sobre blanco; en oscuro es el mismo naranja de sistema.

### Neutral
- **Blanco** (`ground`) / **Grafito verdoso** (`ground-dark`): la única superficie de la pantalla, también bajo el botón principal fijo.
- **Barra** (`bar` / `bar-dark`): fondo de la barra de pestañas; un paso más hundido que el suelo, nunca más.
- **Tinta grafito** (`ink`) / **Tinta blanca cálida** (`ink-dark`): nombres de plato, títulos, enlaces, números de día.
- **Tinta secundaria** (`ink-2` / `ink-2-dark`): fecha de hoy, descripción del plato, leyenda, estado del botón, letras de día.
- **Tinta apagada** (`ink-3` / `ink-3-dark`): lo que queda fuera o ya pasó: domingo, días pasados, "En lugar de", pestañas no seleccionadas.
- **Raya** (`rule` / `rule-dark`): puntos guía, subrayado de enlaces, barra de desplazamiento.
- **Pelo** (`hair` / `hair-dark`): filete superior de la barra de pestañas y contorno del botón tranquilo.
- **Relleno** (`fill` / `fill-dark`) con **sobre relleno** (`on-fill` / `on-fill-dark`): el botón principal es tinta sólida, invertido en cada tema.
- **Segmento** (`seg`, `seg-on` y sus `-dark`): pista y pulgar del control segmentado.

### Named Rules
**The Activity Tint Rule.** El naranja significa actividad: días activos, el plato que va a ellos y la pestaña seleccionada. Ningún otro contenido lleva naranja. La única excepción son los indicadores del sistema que en iOS toman el color de acento (cursor, selección y anillo de foco).

**The Ink Links Rule.** Los enlaces son tinta en peso 600 con subrayado fino en `rule`; nunca naranja ni azul.

**The Paired Themes Rule.** Todo token de color existe en claro y en oscuro; no se introduce un color nuevo sin su pareja.

## Typography

**Display Font:** pila del sistema de Apple (SF Pro en el dispositivo), con `system-ui, sans-serif` de respaldo
**Body Font:** la misma pila

**Character:** una sola familia, la del propio iPhone, para que la app se sienta nativa. Las cifras son tabulares en todo el documento (`"tnum" 1`) para que fechas, días y notas alineen en columna como en una carta.

### Hierarchy
- **Display** (700, 34px, 1.12, -0.02em): título grande con el rango de fechas de la semana. Equilibrado (`text-wrap: balance`).
- **Headline** (700, 24px, 1.2, -0.015em): títulos de sección ("Menú", "Hace tiempo que no coméis"), 32px por encima y 12px por debajo.
- **Title** (600, 19px, -0.01em): nombre del plato en el menú y sus días a la derecha.
- **Body** (400–600, 17px, 1.35): texto base, "Hoy toca", números de día, botón principal, filas secundarias (domingo, sugerencias) en 500.
- **Body secondary** (400, 15px): descripción del plato y enlaces de acción bajo él.
- **Label** (500–600, 13px): letras de día, leyenda, estado sobre el botón, "nota" y "En lugar de".
- **Tab label** (500, 11px): rótulos de la barra de pestañas.

### Named Rules
**The Scale-Only Hierarchy Rule.** Un elemento sube de rango con tamaño o peso, nunca con un fondo, un borde o un color. Lo secundario baja a `ink-2`; lo que quedó fuera, a `ink-3` y peso 500.

**The Tabular Figures Rule.** Las cifras siempre tabulares; las notas usan coma decimal ("8,5").

## Layout

Una columna para móvil, centrada y limitada a 440px; en escritorio la misma columna queda en el centro. Margen lateral de 20px (`gutter`) para texto y controles; la tira de días usa 12px para que los siete círculos de 40px quepan en 375px. Ritmo vertical: 4 / 8 / 12 / 16 / 24 / 32px. Cada fila de menú lleva 16px debajo; cada sección empieza con 32px.

La parte inferior está fija y apilada: barra de pestañas (58px más el área segura) y, encima, el botón principal sobre el mismo `ground`, con una línea de estado opcional de 13px centrada. El contenido reserva 176px más el área segura al final para no quedar oculto.

La tira de días es una rejilla de siete columnas iguales (L M X J V S D): letra arriba, número en círculo debajo.

En una pantalla sin botón fijo (Recetas) el contenido reserva 112px más el área segura al final: la barra de pestañas y, cuando aparece, la línea de estado. Una pestaña puede tener dos vistas en la misma columna (índice y detalle), enlazadas por el hash de la URL; al volver, el índice recupera la posición donde estaba.

Registro tampoco tiene botón fijo y reserva los mismos 112px más el área segura. Cada día es una fila en rejilla de dos columnas: 36px para la fecha y el resto para el cuerpo, separadas 10px, con 10px de relleno vertical y el margen de 20px. La escala de nota y el panel "Comimos otra cosa" ocupan el ancho entero de la fila, por debajo de las dos columnas. Las semanas van de la más reciente a la más antigua y, dentro de cada una, el día más reciente arriba.

## Elevation & Depth

Plano. La profundidad se expresa con el paso de `ground` a `bar` y con un filete de 0,5px, no con sombras.

### Shadow Vocabulary
- **Pulgar del segmentado** (`seg-shadow`, claro: `0 1px 3px rgba(27,31,29,.14), 0 1px 1px rgba(27,31,29,.06)`; oscuro: `0 1px 3px rgba(0,0,0,.35)`): solo el pulgar seleccionado del control segmentado, imitando el nativo de iOS.

### Named Rules
**The One Shadow Rule.** La única sombra del sistema es la del pulgar del segmentado. Ninguna tarjeta, botón, barra ni hoja lleva sombra decorativa.

## Shapes

Esquinas suaves de tipo iOS: pulgar 7px dentro de una pista de 9px, botón principal de 14px, días en círculo completo. Los contornos son anillos interiores, no bordes: 2px de `ink` para hoy, 2px de `tint` para un día activo ya pasado, 1,5px de `hair` para el botón tranquilo. El tachado es una forma del sistema: 1,5px en días y letras pasadas, 2px en el nombre de plato que se sustituye. Los puntos guía son un borde punteado de 2px en `rule`, subido 5px para alinear con la línea base.

En la lista de la compra, el nombre del producto se tacha con 1,5px, y el campo de añadir toma el radio de la pista del segmentado (9px).

En la receta, el paso hecho y el ingrediente gastado se tachan con el mismo trazo de 1,5px; en el ingrediente, el trazo cruza nombre y cantidad. En las filas compactas de 15px los puntos guía suben 4px en vez de 5px para seguir la línea base. El buscador comparte la forma del campo de añadir (9px).

En el registro, hoy lleva en la columna de fechas el mismo anillo interior de 2px en `ink` que en la tira de días, en un círculo de 28px con el número en 15px. Los círculos de la escala del 1 al 10 son de 30px (28px a 380px de ancho o menos) con un anillo interior de 1,5px en `hair`, como el botón tranquilo; el elegido pierde el anillo y se rellena de `fill`. Cuando el nombre del plato parte línea, los puntos guía siguen siendo el mismo borde punteado de 2px en `rule`: solo el trazo se alarga hacia la izquierda hasta 8px después de la última palabra.

## Components

### Segmented Control
Copia del nativo de iOS. Pista `seg` de 9px de radio con 2px de relleno; dos segmentos de 32px, 14px en peso 500; el seleccionado pasa a `seg-on`, peso 600 y la única sombra del sistema. Transición de fondo de 0,2s.

### Day Strip
- **Normal:** número en 17px peso 600 sobre círculo transparente de 40px; letra del día en 13px `ink-2` encima.
- **Activo:** círculo relleno de `tint` con número en `on-tint`.
- **Hoy:** anillo interior de 2px en `ink`; si además es activo, anillo de `ink` separado del relleno por 2px de `ground`.
- **Pasado:** número tachado en `ink-3`, peso 500; si fue activo, conserva un anillo de 2px en `tint` sin relleno.
- **Fuera (domingo):** `ink-3`, peso 500, deshabilitado.
- **Pulsación:** el círculo se encoge a 0,9.
- Debajo, una leyenda de 13px con un punto de 10px en `tint`.

### Menu Row (firma)
El nombre del plato (title) a la izquierda, puntos guía flexibles (mín. 32px) y los días a la derecha separados por " · ", alineados por la última línea base. Los días del plato que va a los días activos van en `tint-ink`; los del otro, en tinta. Debajo, la descripción en 15px `ink-2` (tipos de ingrediente · destino). La fila "Domingo … fuera" baja a 17px, peso 500, `ink-3`. En sugerencias, la cifra a la derecha es la nota con un rótulo "nota" de 13px en `ink-2` en el sitio del precio.

**The Strike, Don't Erase Rule.** Un cambio nunca borra en silencio. Al sustituir un plato, un trazo de 2px tacha el nombre (0,3s), y el nuevo entra desde 6px abajo (0,34s); debajo queda "En lugar de ~~plato anterior~~ · Deshacer" en 13px `ink-3`. Los días pasados se tachan, no se ocultan.

**The Moving Letters Rule.** Al activar o desactivar un día, cada letra viaja de su fila a la nueva (FLIP, 420ms, `cubic-bezier(.16,1,.3,1)`), para que se vea a dónde ha ido el día.

### Buttons
- **Principal:** ancho completo, 52px, radio 14px, relleno `fill` con texto `on-fill` en 17px peso 600. Pulsación: escala 0,98.
- **Tranquilo:** mismo tamaño, transparente, tinta, contorno interior de 1,5px en `hair`; admite icono de trazo de 20px a la izquierda. Se usa cuando la acción ya está hecha ("Ver la lista").
- **Tranquilo mientras falta algo:** en el súper, "Terminar la compra" va como botón tranquilo mientras quedan productos pendientes y pasa a principal cuando todo está en el carro.
- **Enlace:** texto en tinta, peso 600, subrayado de 1px en `rule` con 3px de separación; área táctil ampliada 14px en vertical y 10px en horizontal. Pulsación: opacidad 0,6.
- **Foco:** contorno de 2px en `tint` separado 3px.
- **Cancelar tranquilo:** texto de 15px peso 500 en `ink-2`, sin subrayado ni fondo, con 44px de alto táctil; cierra un panel o una escala sin cambiar nada. Pulsación: opacidad 0,6.

### Navigation
Barra de cuatro pestañas fija abajo (Semana, Recetas, Lista, Registro) sobre `bar`, con filete superior de 0,5px en `hair`. Iconos de trazo SVG de 26px (trazo 1,7) y rótulo de 11px en `ink-3`; la pestaña actual pasa a `tint-ink`.

- **Cambio de vista dentro de una pestaña:** al abrir un detalle, la vista entra desde 24px a la derecha con opacidad (0,32s, `cubic-bezier(.16,1,.3,1)`); al volver, el índice entra desde 24px a la izquierda, en espejo. Con `prefers-reduced-motion` el cambio es directo.
- **Volver:** "‹ Recetas" arriba a la izquierda, en tinta de 17px peso 600 con un chevrón de trazo de 22px (trazo 2,2), 44px de alto táctil y sin fondo. Pulsación: opacidad 0,6.

### List Row (firma, en la lista)
La fila de carta aplicada a la compra, un paso por debajo del menú: el producto en 17px peso 400 a la izquierda, puntos guía y la cantidad en 17px a la derecha, alineados por la última línea base. Debajo, de qué plato sale ("lentejas · merluza", "añadido a mano", "lo cogió tu pareja") en 13px peso 500 `ink-3`. Toda la fila es un botón: al pulsar, línea y origen bajan a opacidad 0,6, y el anillo de foco va por dentro de la fila. Sin casillas: el estado es el tachado.
- **Tachado:** un trazo de 1,5px en `currentColor` cruza el nombre en 0,3s; al deshacer se retira en 0,25s. Nombre y cantidad pasan a `ink-3`.
- **Etiqueta de estado:** en el repaso, "en casa" o "en el carro" ocupa el sitio de la cantidad en 13px peso 600 `ink-2`.
- **Plegado al carro (en el súper):** el producto tachado espera 800ms en su sitio (otro toque lo destacha), se pliega en 260ms (altura y opacidad a cero) y reaparece en "En el carro" subiendo 6px (0,34s), todo con `cubic-bezier(.16,1,.3,1)`. Con `prefers-reduced-motion` pasa directo.

### List Sections
Las secciones del súper son títulos de 19px peso 600 (-0,01em), 24px por encima, sin fondo ni filete. Los grupos del final ("En el carro", "En casa") usan el mismo título con el recuento a la derecha en 13px peso 500 `ink-2`.

En la receta, "Ingredientes" y "Pasos" usan este mismo título; "Pasos" lleva a la derecha "N de M" en cuanto hay un paso hecho, y nada mientras no hay ninguno.

### Add Field
El campo de texto de la app (también la búsqueda de Recetas): 44px de alto, relleno `seg` y radio de 9px, como la pista del segmentado; icono "+" de trazo de 20px en `ink-2`, texto de 17px y marcador en `ink-2`. Foco: el anillo del sistema (2px de `tint`, separado 3px) alrededor del campo entero. Es un control, no un contenedor.

El buscador de Recetas reutiliza el campo de añadir sin cambios (pista, radio, alto, foco y marcador); solo cambia el icono por una lupa de trazo de 20px. Sin resultados, debajo queda una frase de 15px en `ink-2` ("Ninguna receta coincide con «…»."), sin ilustración ni botón.

El campo de "Comimos otra cosa" en Registro es el mismo campo sin icono, con el marcador "¿Qué comisteis?": pista, radio, alto, foco y marcador iguales.

### Lo de siempre
Botones de un toque para lo que se compra cada semana: texto en tinta de 15px peso 600 con un "+" de trazo de 13px (trazo 2,4) en `ink-2`, separados 20px y con 44px de alto táctil, sin fondo ni contorno. Encima, el rótulo "Lo de siempre" en 13px peso 500 `ink-2`. Pulsación: opacidad 0,6. Lo que ya está en la lista no aparece aquí.

### Presence Dot
Cuando la pareja compra a la vez, el subtítulo empieza con un punto fijo de 8px en `ink-2`, sin latido ni naranja: la presencia no es actividad. Sin la pareja presente, no hay punto.

### Status Line
La línea de 13px `ink-2` sobre el botón fijo lleva el recuento ("2 en casa · 15 por comprar") y los avisos. Un aviso que se puede deshacer añade " · Deshacer" como enlace de 15px y se queda hasta la siguiente acción; uno sin deshacer caduca a los 4s y vuelve el recuento.

En una pantalla sin botón fijo (Recetas) la línea de estado queda sola sobre la barra de pestañas, sobre `ground`, y solo aparece mientras hay un aviso con "Deshacer" ("Progreso borrado · Deshacer").

### Recipe Index
El índice de Recetas es la carta entera. Arriba, "Recetas" en display y el buscador; las secciones del índice son headlines (24px peso 700, 32px por encima).
- **"Esta semana" y "La que viene":** filas de menú, como en Semana: plato en title, puntos guía y sus días a la derecha, en `tint-ink` los del plato que va a los días activos y los ya pasados tachados con 1,5px en `ink-3`. Debajo, tipos y tiempo en 15px `ink-2`; si el plato toca hoy, la línea empieza por "Hoy".
- **"Todas" y "Resultados":** filas de lista, un paso por debajo porque son decenas: nombre de 17px, debajo tipos y tiempo en 13px peso 500 `ink-3`, y a la derecha la nota con su rótulo "nota". El título lleva a la derecha el número de recetas, como en List Sections.
- Cada fila es un enlace a la receta con 10px de relleno vertical; al pulsar, la fila baja a opacidad 0,6, y el anillo de foco va por dentro.

### Ingredient Row
La fila de carta compacta: nombre de 15px a la izquierda, puntos guía y la cantidad en 15px `ink-2` a la derecha, con 4px de relleno vertical y 8px entre piezas, para que todos los ingredientes se lean de un vistazo encima de los pasos. No es un botón: el ingrediente no se toca, se tacha solo.
- **Gastado:** nombre y cantidad toman el trazo de 1,5px (0,3s; se retira en 0,25s) y pasan a `ink-3`.

### Step Row (firma, en la receta)
Cada paso es un botón de ancho completo: una columna de 28px con el número (19px peso 600 `ink-2`) y, a 8px, el texto de 17px; 10px de relleno vertical. Las cantidades van dentro del texto en peso 600 y sin partir línea. Si el paso tiene tiempo, va debajo en 13px peso 500 `ink-3`. Sin casillas: el estado es el tachado.
- **Paso actual:** el primero sin hacer; su número pasa a `ink` peso 700 y el botón lleva `aria-current="step"`.
- **Hecho:** el texto toma el trazo de 1,5px (0,3s; se retira en 0,25s) y número y texto pasan a `ink-3`. Las cantidades siguen en 600 al tacharse, para que nada se recoloque.
- **Pulsación:** el texto baja a opacidad 0,6; el anillo de foco va por dentro de la fila.

**The Linked Strike Rule.** Un ingrediente se tacha cuando están hechos todos los pasos que lo usan, en el mismo gesto que tacha el último de ellos, y se destacha si uno de esos pasos se deshace. Un ingrediente que ningún paso marca no se tacha nunca.

### Awake Line
Mientras la receta mantiene la pantalla encendida, bajo los tipos, raciones y tiempo aparece "La pantalla no se apagará mientras cocináis" en 13px peso 500 `ink-3`. Solo se muestra mientras el bloqueo está activo; si el navegador no lo concede, no hay línea.

### Recipe End
Con todos los pasos hechos, bajo el último aparece "Receta terminada · Empezar de nuevo" en 15px `ink-2`, con "Empezar de nuevo" como enlace de tinta. Al pulsarlo se destacha todo, la vista vuelve arriba y la línea de estado ofrece "Progreso borrado · Deshacer" hasta la siguiente acción; deshacer devuelve el progreso y la posición.

### Diary Row (firma, en el registro)
La fila de carta con fecha. A la izquierda, una columna de 36px con la letra del día (13px peso 600 `ink-2`, en una caja de 12px) y el número (17px peso 600); a 10px, el cuerpo con el plato, los puntos guía y las dos notas a la derecha, alineados por la última línea base con 8px entre piezas. En los días activos el número va en `tint-ink`; la letra, no. Los platos pasados van en 17px peso 400; el de hoy, en title (19px peso 600).
- **Hoy:** el número baja a 15px dentro de un anillo de 2px en `ink` de 28px, y el cuerpo se separa 6px más. Mientras nadie ha puntuado, la fila no lleva puntos guía ni cifras; en cuanto hay una nota, la tuya o la de tu pareja, los lleva como las demás y la escala sigue debajo.
- **Fuera:** fecha y "Fuera" en `ink-3` peso 500, sin puntos guía ni cifras.
- **Nombre en dos líneas:** el nombre se equilibra (`text-wrap: balance`) y los puntos guía empiezan 8px después de la última palabra. Un script mide la última línea y alarga solo el trazo punteado hacia la izquierda, sin tocar la caja, así nada se recoloca; vuelve a medir con cada cambio de tamaño.
- **Plato cambiado:** debajo, "En lugar de ~~plato planificado~~" en 13px peso 500 `ink-3`, con el tachado de 1,5px.

### Diary Weeks
Cada semana abre con un headline (24px peso 700, 32px por encima) y, a la derecha, el rango de fechas en 13px peso 500 `ink-2`, como el recuento de List Sections; las semanas antiguas llevan el rango en el propio título ("Del 5 al 11 oct") y nada a la derecha. Debajo del título va el rótulo de las columnas de nota.

### Rating Columns
Las dos notas son dos columnas fijas a la derecha, como las dos columnas de precio de una carta: la tuya en 22px y la de tu pareja en 40px, alineadas a la derecha y separadas 6px, con cifras de 17px peso 600. Se rotulan una vez por semana, bajo el título, con "tú" y "pareja" en 13px peso 500 `ink-2` sobre esas mismas columnas. Una nota que falta es "–" en `ink-3` peso 500. El lector de pantalla oye las dos con nombre ("tú 8, tu pareja 9", o "sin nota"); el rótulo y las cifras sueltas se le ocultan.

**The Two Columns Rule.** Las notas de cada fila van siempre en el mismo orden y en el mismo sitio: la tuya y luego la de tu pareja, en columnas de ancho fijo rotuladas una vez por semana, para que se lean en vertical.

### Rating Scale
Diez botones del 1 al 10 en una rejilla de ancho completo, cada uno de 44px de alto con un círculo de 30px (28px a 380px de ancho o menos) y la cifra en 17px peso 600. Encima, el rótulo "Tu nota" en 13px peso 500 `ink-2`; en un día pasado, "Tu nota del lunes 19". Es un grupo con nombre y cada botón lleva `aria-pressed`; al elegir hoy, el foco se queda en la cifra elegida.
- **Reposo:** anillo interior de 1,5px en `hair`.
- **Elegido:** relleno `fill` con la cifra en `on-fill`, sin anillo (180ms). La nota es tinta, no naranja: no es actividad.
- **Pulsación:** el círculo se encoge a 0,9 (120ms).
- **Foco:** el anillo del sistema en `tint` rodea el círculo, no el botón.

### Partner Line
Bajo la escala de hoy, en 15px `ink-2`: "Tu pareja aún no ha puntuado" o "Tu pareja le ha puesto **7**", con la nota en `ink` peso 600. Es una región `aria-live` educada; cuando la nota llega sin recargar, la línea sube desde 6px abajo con opacidad (0,34s), y la fila de hoy gana sus puntos guía y sus cifras.

### Today's Actions
12px por debajo, enlaces de tinta de 15px: "Comimos otra cosa" y, tras un cambio, "Deshacer · Comimos otra cosa". Deshacer recorre una pila: cada toque devuelve el estado anterior de hoy, hasta el plan original.

### Comimos otra cosa
Un panel en línea bajo la fila de hoy, sin hoja ni fondo; mientras está abierto, la línea de acciones desaparece. Arriba, el campo de añadir sin icono ("¿Qué comisteis?"); debajo, las sugerencias ("Fuera", las sobras de ayer o las recetas que coinciden con lo escrito) como enlaces de tinta de 15px, con 44px de alto táctil y separados 20px, como Lo de siempre; al final, "Cancelar" tranquilo.
- **Sustitución:** al elegir, el plato de hoy se tacha con el trazo de 2px (0,3s) y el nuevo entra desde 6px abajo (0,34s), como en Semana (The Strike, Don't Erase Rule); debajo queda "En lugar de ~~plato planificado~~", y "Deshacer" pasa a la línea de acciones. Las dos notas de hoy se vacían, porque puntuaban otro plato. Con `prefers-reduced-motion` el cambio es directo.

### Missing Rating
En un día pasado sin tu nota, debajo del plato: "Te falta tu nota · Puntuar" en 13px peso 500 `ink-3`, con "Puntuar" como enlace de tinta del mismo tamaño. Puntuar abre en la misma fila la escala de ese día, con su rótulo y un "Cancelar" tranquilo; al elegir, la escala se cierra y la cifra ocupa su columna.

### Pendientes
Sin decidir y fuera de este sistema hasta que se decidan: icono relleno para la pestaña seleccionada, filete al hacer scroll bajo las barras, título grande que se pliega, qué segmento se abre entre semana y si el domingo es editable.

## Do's and Don'ts

### Do:
- **Do** reservar el naranja (`tint` / `tint-ink`) para la actividad: días activos, el plato que va a ellos y la pestaña actual.
- **Do** escribir cada lista de platos como filas de carta: nombre a la izquierda, puntos guía, días o nota a la derecha.
- **Do** tachar lo cambiado o pasado y dejar a la vista lo que había, con "Deshacer" cuando aplique.
- **Do** marcar jerarquía con tamaño y peso (34 / 24 / 19 / 17 / 15 / 13 / 11px) y bajar lo secundario a `ink-2` o `ink-3`.
- **Do** definir cada color nuevo en claro y en oscuro y revisar los dos temas.
- **Do** usar la pila del sistema de Apple y cifras tabulares.
- **Do** respetar `prefers-reduced-motion`: sin trazo, entrada ni FLIP; el cambio se aplica directo.
- **Do** escribir la lista de la compra con la misma fila de carta: producto, puntos guía y cantidad, y debajo de qué plato sale en 13px `ink-3`.
- **Do** dejar los avisos con "Deshacer" hasta la siguiente acción y retirar los demás a los 4s.
- **Do** escribir las cantidades dentro de los pasos en peso 600 y sin partir línea, y tachar arriba el ingrediente cuando ya no queda ningún paso que lo use.
- **Do** escribir cada día del registro como fila de carta: fecha a la izquierda, plato, puntos guía y las dos notas en sus columnas fijas (tú · pareja).

### Don't:
- **Don't** usar tarjetas, cajas, fondos de sección ni sombras decorativas; la única sombra es la del pulgar del segmentado.
- **Don't** usar colores de tiza, texturas de pizarra ni letra a mano.
- **Don't** pintar enlaces de naranja ni de azul.
- **Don't** hacer desaparecer un plato o un día cambiado sin dejar rastro.
- **Don't** volver a la rejilla de siete días por comidas con fotos en tarjetas.
- **Don't** añadir un segundo color de acento.
- **Don't** marcar lo comprado o lo que ya hay en casa con casillas, tarjetas ni naranja; el estado es el tachado.
- **Don't** cambiar el peso ni el tamaño de lo que se tacha con un toque (pasos, ingredientes, productos); solo cambian el trazo y la tinta, para que nada se recoloque.
- **Don't** pintar de naranja la nota elegida ni la escala; la nota elegida es tinta (`fill`), y en el registro el naranja solo marca los días activos en la columna de fechas.

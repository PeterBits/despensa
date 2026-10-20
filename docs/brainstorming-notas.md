# Despensa · notas del brainstorming

Notas de trabajo de la conversación inicial (20/10/2026). No es el documento de diseño:
sirven para retomar el brainstorming desde una sesión nueva y se volcarán en
`docs/superpowers/specs/` cuando el diseño esté cerrado.

## Para qué sirve

Una pareja lleva dos años decidiendo en la semana 1 qué comerá en la semana 2. Organizarlo
no es el problema; decidir sí: da pereza y acaban repitiendo los mismos platos. La app
tiene que quitar esa carga mental y que la conversación dure lo mínimo. Sin IA por ahora,
quizá más adelante.

## Lo que ha pedido el usuario

- **Recetas**: recetario propio, con ingredientes por cantidades y fotos.
- **Registro**: lo que se come cada día, con una nota del 1 al 10.
- **Planificación**: la semana siguiente, teniendo en cuenta la actividad física prevista
  (semanas más activas: comidas más energéticas, calóricas, con hidratos).
- **Recomendaciones**: sugerir platos que hace tiempo que no comen.
- **Lista de la compra**:
  - Se rellena con los ingredientes de los platos elegidos.
  - Se pueden añadir productos a mano, también no alimentarios.
  - Cada producto se puede marcar como "ya lo tengo" (por ejemplo, arroz que sobró);
    entonces pasa al final de la lista.
  - Se puede vaciar la lista entera.
- **Uso**: los dos, cada uno desde su móvil, con los mismos datos. 99 % móvil: el diseño
  responsive es crítico.
- **Diseño**: sencillo y minimalista, trabajado con la skill impeccable (plugin instalado
  con ámbito de proyecto en este repo).
- **Backend**: Cloudflare (el usuario no lo ha usado nunca). El repo debe incluir una guía
  documentada de los pasos de cada proceso en Cloudflare.
- **Imágenes**: hay que poder almacenarlas.

## Supuestos de Claude pendientes de confirmar

- Recomendación sin IA: recetas con buena nota que hace tiempo que no se comen; lo que se
  puntuó bajo no aparece.
- Los datos se guardan de forma que meter IA después sea fácil.
- Lista: los ingredientes repetidos se suman en una línea y se indica de qué platos salen.
  Estados: pendiente, en el carro (comprado), ya lo tengo. Lo comprado también baja.
  "Ya lo tengo" aplica a toda la cantidad; no hay inventario de despensa.
- Los productos que se añaden a mano a menudo se recuerdan para añadirlos con un toque.
- Navegación con barra inferior de cuatro pestañas: Semana, Recetas, Lista, Registro.
- Los cambios de uno aparecen en el móvil del otro sin recargar.

## Decidido en la segunda sesión (20/10/2026)

El usuario pidió saltarse las preguntas y diseñar con impeccable. Lo confirmado está en
`PRODUCT.md`; el contrato de diseño de la pantalla Semana, en
`.impeccable/surfaces/prototipo-semana-html.md`.

- Solo la comida de mediodía; las cenas quedan fuera. Dos o tres platos por semana repetidos
  en días alternos (por ejemplo, L-X-V y M-J-S). Los dos comen lo mismo.
- Actividad física por día; el plato más energético va a los días activos.
- Nada de macros: cada ingrediente lleva solo su tipo (hidratos, proteína, grasas, fibra).
- Stack: la recomendación de Claude (PWA con React + Vite en Cloudflare Pages, Workers, D1,
  R2, Durable Objects).
- Estilo: estructura de "pizarra del menú del día" (platos a la izquierda, días a la derecha
  unidos por puntos guía; lo hecho se tacha), con la sobriedad de las apps de Apple: letra del
  sistema, un solo color naranja que significa actividad, sin tarjetas. Descartados: colores de
  tiza y letra a mano.
- Modo claro y oscuro según el ajuste del iPhone (los dos usan iPhone; uno claro, otro oscuro).
- Prototipo de la pantalla Semana en `prototipo/semana.html` (vista de los dos modos en
  `prototipo/index.html`).
- Lista de la compra: ordenada por secciones del súper; a veces compra uno y a veces los dos a
  la vez; "ya lo tengo" se marca en casa antes de salir. Se usa en dos pasos: "Antes de salir"
  (se tacha lo que hay en casa y se añade lo que falte) e "En el súper" (solo lo pendiente; lo
  cogido baja a "En el carro"). El usuario no eligió entre los tres bocetos y pidió continuar,
  así que se construyó el que salió por sorteo, y lo aprobó ("Todo perfecto, diseño
  correcto"). Prototipo en `prototipo/lista.html`; contrato en
  `.impeccable/surfaces/prototipo-lista-html.md`.

## Pendiente de hablar

- Nota del 1 al 10: común o por persona (supuesto: común).
- Acceso: cómo entran los dos (login) y si hay un "hogar" compartido.
- El domingo: siempre fuera o editable; cómo se registra un día en que no se comió lo planificado.
- Qué se ve al abrir la pestaña Semana entre semana: esta semana o la que viene.
- El resto de pantallas: Recetas y Registro.
- Lista: cómo se borra un producto añadido por error (de momento solo "Deshacer") y en qué
  sección cae un producto que la app no conoce (de momento "Otros").

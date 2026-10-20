# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: el usuario aceptó la recomendación de Claude. App web instalable en el móvil (PWA)
con React + Vite + TypeScript, alojada en Cloudflare Pages; API en Cloudflare Workers, datos
en D1, fotos en R2 y sincronización en vivo entre los dos móviles (Durable Objects). Elegido
porque el usuario pidió Cloudflare como backend y porque una PWA cubre el uso 99 % móvil sin
pasar por tiendas de aplicaciones. El usuario no ha usado nunca Cloudflare: el repo incluye
una guía documentada de cada paso que haya que dar en su panel o en su CLI.

## Users

Una pareja que vive junta y come lo mismo a mediodía. Los dos usan la app, cada uno desde su
iPhone, con los mismos datos. Uno tiene el teléfono en modo oscuro y el otro en modo claro: la
app sigue el ajuste del sistema. La abren en ratos cortos: el fin de semana para decidir los
platos de la semana siguiente, en el supermercado con la lista en la mano, y después de comer
para apuntar qué tal estuvo.

## Product Purpose

Llevan dos años decidiendo en una semana qué comerán la siguiente. Organizarlo no les cuesta;
decidir sí: da pereza y acaban repitiendo siempre los mismos platos. Despensa existe para
quitar esa carga: que la conversación de "¿qué comemos la semana que viene?" dure lo mínimo y
que vuelvan a aparecer platos que les gustaron y tenían olvidados.

Éxito: elegir la semana en un par de minutos, con la lista de la compra hecha sola.

## Positioning

No es un recetario genérico ni un planificador de 21 comidas a la semana. Está hecho para
la forma real en que come esta pareja: solo la comida de mediodía, dos o tres platos por
semana que se cocinan en tanda y se repiten en días alternos, y un historial propio con notas
que decide qué sugerir.

## Operating Context

- **Solo la comida de mediodía.** Las cenas quedan fuera: cenan siempre lo mismo y no entran
  en la dinámica de recetas.
- **Dos o tres platos por semana, repetidos.** Ejemplo real: lunes, miércoles y viernes un
  plato; martes, jueves y sábado otro. Con dos o tres platos semanales basta.
- **Actividad física por día.** Cada día se marca como activo o no; los días activos piden
  platos más energéticos (más calorías, más hidratos). Como los platos se repiten en días
  alternos, el plato que cae en los días activos es el que debe ser energético.
- **Planificación con una semana de antelación**: durante la semana actual se decide la
  siguiente.
- **Compra en el supermercado** con el móvil en una mano.

## Capabilities and Constraints

- **Recetas**: recetario propio, con ingredientes por cantidades y fotos.
- **Nada de macros.** No se registran calorías ni gramos de nutrientes. Cada ingrediente
  lleva solo su tipo: hidratos, proteína, grasas o fibra. Con eso basta para saber qué plato
  es más energético y llevarlo a los días activos.
- **Registro**: qué se ha comido cada día, con una nota del 1 al 10.
- **Planificación**: la semana siguiente, asignando los dos o tres platos a los días y
  teniendo en cuenta los días activos.
- **Recomendaciones sin IA**: sugerir platos con buena nota que hace tiempo que no comen; lo
  puntuado bajo no se sugiere. Los datos se guardan de forma que añadir IA más adelante sea
  fácil.
- **Lista de la compra**:
  - Se rellena con los ingredientes de los platos elegidos; los repetidos se suman en una
    línea que indica de qué platos salen.
  - Se pueden añadir productos a mano, también no alimentarios; los que se añaden a menudo se
    recuerdan para añadirlos con un toque.
  - Cada producto puede estar pendiente, en el carro o "ya lo tengo" (por ejemplo, arroz que
    sobró). Lo que está en el carro o ya se tiene baja al final de la lista. "Ya lo tengo"
    cubre toda la cantidad: no hay inventario de despensa.
  - Se puede vaciar la lista entera.
- **Datos compartidos en vivo**: lo que cambia uno aparece en el móvil del otro sin recargar.
- **Imágenes**: hay que poder subir y guardar fotos de las recetas.
- **Idioma**: español.
- **Modo claro y oscuro**: los dos, elegidos automáticamente según el ajuste del iPhone.

Decisiones abiertas:

- La nota del 1 al 10: una común por plato o una por persona. Supuesto de trabajo: una común.
- Acceso: cómo entran los dos y cómo se comparte el "hogar". Supuesto de trabajo: un hogar
  compartido al que se une cada uno desde su móvil.
- Qué pasa con el domingo y cómo se registra un día en que no se comió lo planificado.

## Evidence on Hand

No hay recetas, fotos ni historial reales en el repo. Los ejemplos de diseño usan datos
inventados y no se presentan como reales.

## Product Principles

1. **Decidir cuesta menos que no decidir.** Cada pantalla de planificación lleva a una
   propuesta que se acepta con un toque y se cambia con otro.
2. **Su ritmo, no el genérico.** Dos o tres platos, solo mediodía, días alternos. Nada de
   rejillas de 21 comidas.
3. **La memoria la lleva la app.** Notas e historial deciden las sugerencias para que no
   haga falta recordar qué hubo hace un mes.
4. **Una mano, de pie, con prisa.** Todo lo que se usa en el súper o en la cocina se maneja
   con el pulgar y sin leer párrafos.
5. **Los dos ven lo mismo.** Nunca hay que preguntar "¿lo has apuntado tú?".

## Brand Commitments

Referencia confirmada por el usuario: las apps de Apple (Notas, Recordatorios, Salud). Nada de
colores de tiza ni letra a mano; el primer boceto con tarjetas, grises y verde se descartó.

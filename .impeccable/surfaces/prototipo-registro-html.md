---
version: 1
slug: "prototipo-registro-html"
primary_target: "prototipo/registro.html"
related_targets: []
---

# Registro

Modo: Operate. Pestaña Registro, 99 % iPhone, PWA. Se abre después de comer, un momento, para
poner la nota del plato del día; cada uno desde su móvil.

Tarea: poner tu nota del 1 al 10 al plato de hoy, ver la de tu pareja cuando llegue, apuntar lo
que comisteis si no fue lo planificado y repasar qué se comió y qué tal estuvo en semanas
anteriores.

Estados que importan: hoy sin tu nota; hoy con tu nota y la de tu pareja pendiente; la nota de
tu pareja llega en vivo; "Comimos otra cosa" (otra receta o un texto) con deshacer; día pasado
al que le falta tu nota; domingo fuera; día que se cambió por otra cosa.

Restricciones fijadas por el usuario: nota de cada uno, puesta ese mismo día, y se ven las dos;
si no se comió lo planificado se apunta lo que se comió; mismo mundo visual que Semana, Lista y
Recetas (DESIGN.md), claro y oscuro según el sistema.

Pendiente: qué nota usan Semana y Recetas cuando hay dos (supuesto: la media); si una nota se
puede cambiar días después.

Adaptaciones respecto al boceto elegido: la fecha de cada día pasa de rótulo en mayúsculas encima
del plato a una columna a la izquierda con la letra y el número, como la tira de días de Semana,
para no poner un rótulo pequeño sobre cada título; y las dos notas van en dos columnas fijas con
su rótulo ("tú", "pareja") una vez por semana, como las columnas de precio de una carta, en vez
de rotular cada cifra, que partía casi todos los nombres en dos líneas.

## Direction contract

THESIS: El registro es un diario de comidas: un día por fila, lo más reciente arriba, con el plato a la izquierda y las dos notas a la derecha unidas por puntos guía. Hoy abre el diario con tu escala del 1 al 10. Rechaza el calendario de puntos y las estadísticas.

OWN-WORLD: El de DESIGN.md sin añadidos: blanco o grafito verdoso, tinta grafito, filas de carta, cifras tabulares y tachado para lo que no se comió. La escala del 1 al 10 son diez círculos y el elegido se rellena de tinta. El naranja solo marca los días activos en la columna de fechas y la pestaña actual.

STORY: Después de comer abren Registro, tocan su nota en la escala de hoy y ven llegar la de su pareja. Si comieron otra cosa, lo apuntan y lo planificado queda tachado debajo, con deshacer. Bajando, leen las semanas anteriores y puntúan algún día que se les olvidó.

FIRST VIEWPORT: "Registro" en 34px; "Esta semana" en 24px con el rótulo de columnas "tú · pareja" debajo, a la derecha; la fila de hoy con la columna de fecha (M · 20 con anillo), el plato en 19px, la escala del 1 al 10 en círculos de 30px, la línea de tu pareja y "Comimos otra cosa"; debajo, el lunes con su plato, los puntos guía y sus dos notas, 8 y 9, en las columnas.

FORM: Diario; estructura 4 de mi lista propia, una de las tres repartidas, elegida por el usuario. Gesto propio: al apuntar que comisteis otra cosa, el plato planificado se tacha con un trazo y el nuevo se escribe en su sitio, como en Semana. seed:97cf7b9b51a6dbc5

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

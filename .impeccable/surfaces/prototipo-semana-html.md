---
version: 1
slug: "prototipo-semana-html"
primary_target: "prototipo/semana.html"
related_targets: []
---

# Semana

Modo: Operate. Pantalla principal de la app (pestaña Semana), 99 % iPhone, PWA.

Tarea: decidir los dos o tres platos de la semana que viene en un par de minutos, marcar los
días activos y hacer la lista de la compra. También consultar qué toca esta semana.

Estados que importan: propuesta de la semana que viene, días activos cambiados, plato
cambiado por una sugerencia (con deshacer), plato elegido en el recetario (vuelve con "En
lugar de"), domingo fuera y domingo en casa, hueco sin plato, sugerencia sin notas ("Por
probar"), sin recetas, lista hecha y menú cambiado desde la lista, vista de esta semana con el
día de hoy.

Restricciones fijadas por el usuario: sin colores de tiza ni letra a mano; aspecto de las
apps de Apple; modo claro y oscuro según el ajuste del iPhone (uno usa claro, el otro
oscuro); los dos usan iPhone. El domingo empieza fuera pero se puede cambiar (22/10/2026).

Decidido en el plan 3 (supuestos principales, el usuario pidió continuar sin preguntas): de
lunes a jueves se abre Esta semana y de viernes a domingo La que viene; el domingo se cambia
desde su propia fila del menú ("Comer en casa" / "Comer fuera"); cada plato lleva su "Elegir
otra receta" en una línea propia; Ajustes se abre con el engranaje a la derecha del segmentado.

## Direction contract

THESIS: La semana se lee como el menú del día de un bar: platos a la izquierda, sus días a la derecha unidos por puntos guía. Rechaza la rejilla de siete días por comidas con fotos en tarjetas.

OWN-WORLD: Pizarra sobria. Oscuro: grafito verdoso con tinta tiza. Claro: blanco con tinta grafito. Sigue el ajuste del sistema. Un solo tinte naranja que siempre significa actividad (días activos, plato que va a ellos, pestaña activa). Letra del sistema (SF Pro). Sin tarjetas, cajas ni sombras: una superficie, jerarquía por tamaño y peso. Puntos guía de carta. Lo hecho se tacha, no desaparece.

STORY: Abren la semana que viene y la propuesta ya está escrita. Tocan los días activos y los platos se recolocan solos. Cambian un plato por una sugerencia con un toque. Hacen la lista.

FIRST VIEWPORT: Control segmentado Esta semana / La que viene arriba. Título grande con el rango de fechas. Tira L–D con los días activos en círculos naranjas. "Menú": dos platos y el domingo en filas con puntos guía y los días a la derecha. "Hace tiempo que no coméis" con la nota donde iría el precio. Botón principal "Hacer la lista de la compra" sobre la barra de cuatro pestañas.

FORM: Pizarra del menú del día, candidato 3 de 7 de la lista propia; elevado por el muestrario tipográfico (jerarquía solo por escala) y la cartera de billetes (nada desaparece, se tacha); reconducido por el usuario hacia la sobriedad de Apple. Gesto propio: cambiar un plato tacha el anterior con un trazo y escribe el nuevo en su sitio, y al tocar un día los días de la derecha se recolocan. seed:e1e535766387b1e0

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

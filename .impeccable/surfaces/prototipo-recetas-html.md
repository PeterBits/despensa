---
version: 1
slug: "prototipo-recetas-html"
primary_target: "prototipo/recetas.html"
related_targets: []
---

# Recetas

Modo: Operate. Pestaña Recetas, 99 % iPhone, PWA. Se usa sobre todo en la cocina, con la
receta delante mientras se cocina, el móvil apoyado y las manos ocupadas.

Tarea: encontrar la receta (entre 30 y 100 al cabo de un año) y cocinarla paso a paso sin
perder el sitio. Lo más probable es abrir uno de los platos de esta semana o de la que viene.

Estados que importan: índice con los platos de esta semana y la que viene; búsqueda por plato
o ingrediente, también sin resultados; receta sin empezar; pasos hechos tachados con sus
ingredientes ya usados tachados arriba; receta terminada; pantalla que no se apaga mientras la
receta está abierta (solo si el navegador lo permite); modo elegir (plan 3): el recetario que
abre Semana para poner cualquier receta en un hueco del menú, con "Cancelar" arriba, "Elegir
receta", "En lugar de <plato>", el buscador y cada receta como botón, sin las que ya están en
el menú y sin barra de pestañas.

Restricciones fijadas por el usuario: cocinar con la receta es el uso principal; cada receta
lleva pasos; mismo mundo visual que Semana y Lista (DESIGN.md), claro y oscuro según el
sistema.

Pendiente: dónde y cómo se crean y editan recetas (con sus fotos); si las raciones se pueden
cambiar; temporizadores en los pasos con tiempo.

## Direction contract

THESIS: La receta se cocina sin subir y bajar: cada paso lleva dentro sus cantidades en negrita, y al tachar un paso sus ingredientes se tachan arriba, así siempre se ve qué queda por echar. Rechaza la ficha con foto grande que empuja la receta fuera de la pantalla y el modo cocina a pantalla completa.

OWN-WORLD: El de DESIGN.md sin añadidos: blanco o grafito verdoso, tinta grafito, filas de carta con puntos guía y cifras tabulares, tachado como estado. El naranja solo aparece en los días activos del índice (el plato energético) y en la pestaña actual.

STORY: Abren Recetas y arriba están los platos de esta semana, con sus días como en Semana. Entran en la receta, leen los ingredientes de un vistazo y van tocando cada paso al terminarlo; lo usado se tacha arriba. Si buscan, encuentran por plato o por ingrediente.

FIRST VIEWPORT: Receta: "‹ Recetas", título de 34px, tipos, raciones y tiempo en 15px; "Ingredientes" en 19px con filas compactas de 15px (nombre, puntos guía, cantidad); "Pasos" con número a la izquierda y texto de 17px con las cantidades en negrita, el tiempo en 13px debajo. Índice: "Recetas" en 34px, campo de búsqueda, "Esta semana" y "La que viene" con los días a la derecha, y "Todas" con la nota a la derecha.

FORM: Cantidades dentro de los pasos; estructura 3 de mi lista propia, una de las tres repartidas, elegida por el usuario. Gesto propio: tachar un paso dibuja el trazo y tacha a la vez, arriba, los ingredientes que ya no se van a usar más. seed:43186c721b78b96a

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

---
version: 1
slug: "prototipo-editor-html"
primary_target: "prototipo/editor.html"
related_targets: []
---

# Editor de receta

Modo: Operate. Rutas `/recetas/nueva` y `/recetas/<id>/editar`, 99 % iPhone, PWA. Se usa de vez
en cuando y sin prisa, sentado y a dos pulgares: al pasar a la app una receta que ya cocinan (de
memoria, de una web o de un papel) y para corregir una cantidad, añadir un paso o poner la foto.

Tarea: escribir nombre, raciones, tiempo y foto; los ingredientes con su cantidad, su tipo (que
decide si el plato es energético), su sección del súper, si va a la lista y qué se compra; y los
pasos tal cual se dirían, sin marcas. Guardar o cancelar.

Estados que importan: receta nueva vacía; editando una con datos; foto subiendo, puesta o con
error; nombre vacío al guardar; cambios sin guardar al cancelar; paso que nombra ingredientes
("Usa: …") o ninguno; ingrediente básico que no va a la lista; receta que ya no existe.

Restricciones: los nombres accesibles fijados en el plan 2 (Task 6); mismo mundo que el resto de
pantallas (DESIGN.md), claro y oscuro según el sistema.

Pendiente: reordenar ingredientes y pasos (fuera de esta versión).

## Direction contract

THESIS: El editor va por partes, como se piensa una receta al pasarla: qué es, qué lleva y cómo se hace. Un control segmentado salta entre las tres y cada parte cabe en pocas pantallas. Rechaza el formulario único interminable y el asistente con "Siguiente".

OWN-WORLD: El de DESIGN.md sin añadidos: blanco o grafito verdoso, tinta grafito, campos con la forma del campo de añadir (pista `seg`, 9px), el segmentado nativo con su única sombra y enlaces de tinta. El tipo del ingrediente se elige con botones que se rellenan de tinta como la nota elegida. Nada de naranja salvo cursor, selección y foco.

STORY: Abren "Nueva receta", escriben el nombre y el tiempo y ponen la foto. En Ingredientes escriben cada uno con su cantidad, tocan su tipo y la app propone la sección y si va a la lista. En Pasos escriben cada paso como lo dirían y ven debajo qué ingredientes usa. Guardan y aterrizan en la receta.

FIRST VIEWPORT: Arriba, "Cancelar" a la izquierda (15px `ink-2`) y "Guardar" a la derecha (17px 600 tinta). "Nueva receta" en 34px. Debajo, el segmentado Receta · Ingredientes · Pasos. En Receta: el campo Nombre, Raciones y Tiempo en dos campos cortos en una fila, la línea de tipos en 15px `ink-2` y la foto de 88px con "Añadir foto".

FORM: Por partes con un segmentado; estructura 6 de mi lista propia, repartida como THE ROLL y construida sin elección explícita del usuario, que pidió continuar. Gesto propio: la línea "Usa: …" bajo cada paso se escribe sola mientras se teclea, y cada ingrediente nombrado entra subiendo 6px. seed:610a74dd98714b48

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

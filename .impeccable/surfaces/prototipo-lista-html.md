---
version: 1
slug: "prototipo-lista-html"
primary_target: "prototipo/lista.html"
related_targets: []
---

# Lista

Modo: Operate. Pestaña Lista, 99 % iPhone, PWA. Se usa en dos sitios: en casa antes de salir
y en el supermercado con el móvil en una mano.

Tarea: repasar en casa lo que ya hay, añadir lo que falte (también no alimentario) e ir
cogiendo en el súper lo pendiente por secciones. A veces compra uno solo y a veces los dos a
la vez, cada uno con su móvil.

Estados que importan: repaso con productos "en casa"; producto añadido a mano o de los de
siempre (con deshacer); compra con productos en el carro, también los que coge la pareja en
vivo; todo en el carro; compra terminada (con deshacer); lista vaciada (con deshacer); lista
vacía.

Restricciones fijadas por el usuario: orden por secciones del súper; "ya lo tengo" se marca en
casa antes de salir; mismo mundo visual que Semana (DESIGN.md), claro y oscuro según el
sistema.

Pendiente: cómo se borra un producto añadido por error (de momento solo "Deshacer"); en qué
sección cae un producto nuevo que la app no conoce (de momento "Otros").

## Direction contract

THESIS: La lista se usa en dos pasos, como se hace de verdad: en casa se repasa y se tacha lo que ya hay; en el súper queda solo lo que falta, por secciones, y se tacha al meterlo en el carro. Rechaza la lista única de casillas con todo mezclado y sus filtros.

OWN-WORLD: El de DESIGN.md sin añadidos: blanco o grafito verdoso, tinta grafito, filas de carta (producto a la izquierda, puntos guía, cantidad a la derecha) y debajo de qué plato sale. Sin casillas ni tarjetas: el estado es el tachado. Nada de naranja salvo la pestaña activa, porque la lista no es actividad.

STORY: Antes de salir abren la lista hecha desde Semana, tocan lo que tienen (queda tachado con "en casa"), añaden lo de siempre con un toque y pulsan "Ir a comprar". En el súper ven solo lo pendiente; cada toque tacha el producto y lo baja a "En el carro". Si compran los dos, lo que coge uno se tacha en el móvil del otro. Al terminar, lo cogido sale de la lista y lo que no encontraron sigue.

FIRST VIEWPORT: "Antes de salir" en 34px y una línea con el menú de referencia y la instrucción. Secciones del súper en 19px con filas de 17px: nombre, puntos guía, cantidad; el origen en 13px debajo. Cebolla y Ajo tachados con "en casa". Abajo, fijo sobre la barra de pestañas: "2 en casa · 15 por comprar" y el botón principal "Ir a comprar".

FORM: Primero el repaso, luego la compra; estructura 3 de mi lista propia, repartida como THE ROLL y construida sin elección explícita del usuario, que pidió continuar. Gesto propio: un trazo tacha el nombre al tocarlo y, en el súper, la fila se pliega y reaparece abajo en "En el carro". seed:1991428772a7a94c

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

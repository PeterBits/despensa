// Solo para desarrollo: las diez recetas inventadas de prototipo/recetas.html, con ids fijos `ejemplo-*`.
// main.tsx la carga con un import dinámico bajo import.meta.env.DEV, así no entra en el build de producción.

import { quitarMarcas } from '../../shared/pasos';
import { esBasico, type Tipo } from '../../shared/recetas';
import { seccionDe } from '../../shared/secciones';
import { guardarReceta, type BorradorReceta } from './recetas';

// [nombre, cantidad, tipo, compra]. Aceite de oliva y Sal no llevan tipo: así los tipos de cada receta
// salen solo de los ingredientes que los aportan, como en el prototipo.
type Ing = readonly [nombre: string, cantidad: string, tipo: Tipo | null, compra?: string];
// [texto con marcas del prototipo, minutos]
type Paso = readonly [texto: string, minutos?: number];

function receta(clave: string, nombre: string, minutos: number, ing: Ing[], pasos: Paso[]): BorradorReceta {
  return {
    id: `ejemplo-${clave}`,
    nombre,
    raciones: 6,
    minutos,
    fotoKey: null,
    ingredientes: ing.map(([n, cantidad, tipo, compra], i) => ({
      id: `ejemplo-${clave}-i${i + 1}`,
      nombre: n,
      cantidad,
      tipo,
      seccion: seccionDe(n),
      aLaLista: !esBasico(n),
      compra: compra ?? (n === 'Ajo' ? '1 cabeza' : n === 'Pimentón dulce' ? '1 bote' : n === 'Vino blanco' ? '1 botella' : ''),
    })),
    // Sin marcas: guardarReceta las vuelve a poner.
    pasos: pasos.map(([texto, min], i) => ({ id: `ejemplo-${clave}-p${i + 1}`, texto: quitarMarcas(texto), minutos: min ?? null })),
  };
}

export const RECETAS_DE_EJEMPLO: BorradorReceta[] = [
  receta('lentejas', 'Lentejas estofadas', 60, [
    ['Lentejas pardinas', '500 g', 'hidratos'], ['Cebolla', '2', 'fibra'], ['Pimiento verde', '1', 'fibra'],
    ['Zanahorias', '3', 'fibra'], ['Ajo', '2 dientes', null], ['Chorizo', '200 g', 'proteína'],
    ['Aceite de oliva', '3 cucharadas', null], ['Pimentón dulce', '1 cucharadita', null],
    ['Laurel', '1 hoja', null], ['Agua', '1,5 l', null], ['Sal', 'al gusto', null],
  ], [
    ['Lava {500 g de lentejas|lentejas} y escúrrelas.'],
    ['Pica {2 cebollas|cebolla}, {1 pimiento verde|pimiento} y {2 dientes de ajo|ajo}; corta {3 zanahorias|zanahoria} en rodajas.'],
    ['Sofríe la verdura con {3 cucharadas de aceite|aceite} a fuego medio.', 10],
    ['Añade {200 g de chorizo|chorizo} en rodajas y {1 cucharadita de pimentón|pimenton}; remueve un minuto sin que se queme.'],
    ['Echa las lentejas, cubre con {1,5 l de agua|agua} y añade {la hoja de laurel|laurel}. Cuece a fuego suave.', 40],
    ['Prueba, ajusta de {sal|sal} y deja reposar antes de servir.', 5],
  ]),
  receta('merluza', 'Merluza en salsa verde', 45, [
    ['Merluza en rodajas', '1 kg', 'proteína'], ['Almejas', '300 g', 'grasas'], ['Patatas', '1,5 kg', null],
    ['Ajo', '4 dientes', null], ['Perejil', '1 manojo', null], ['Vino blanco', '1 vaso', null],
    ['Harina', '1 cucharada', null], ['Aceite de oliva', '4 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Pon {las almejas|almejas} en agua con sal para que suelten la arena.', 30],
    ['Pela {1,5 kg de patatas|patatas}, córtalas en trozos y cuécelas en agua con sal.', 20],
    ['Dora {4 dientes de ajo|ajo} picados en {4 cucharadas de aceite|aceite} y añade {1 cucharada de harina|harina}.'],
    ['Vierte {1 vaso de vino blanco|vino}, deja que reduzca y añade {el perejil picado|perejil}.', 3],
    ['Coloca {la merluza|merluza} y las almejas, sala con {sal|sal} y mueve la cazuela hasta que ligue la salsa.', 8],
  ]),
  receta('arroz', 'Arroz con pollo', 50, [
    ['Muslos de pollo', '6', 'proteína'], ['Arroz', '400 g', 'hidratos'], ['Pimiento rojo', '1', null],
    ['Cebolla', '1', null], ['Ajo', '2 dientes', null], ['Tomate triturado', '200 g', null],
    ['Caldo de pollo', '1 l', null], ['Aceite de oliva', '3 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Salpimienta {6 muslos de pollo|pollo} y dóralos en {3 cucharadas de aceite|aceite}.', 10],
    ['Añade {1 cebolla|cebolla}, {1 pimiento rojo|pimiento} y {2 dientes de ajo|ajo} picados y sofríe.', 8],
    ['Incorpora {200 g de tomate triturado|tomate} y deja que pierda el agua.', 5],
    ['Echa {400 g de arroz|arroz}, remueve y vierte {1 l de caldo caliente|caldo}. Sala con {sal|sal}.'],
    ['Cuece sin remover y deja reposar tapado antes de servir.', 20],
  ]),
  receta('pisto', 'Pisto con huevo', 60, [
    ['Calabacín', '2', 'fibra'], ['Berenjena', '1', null], ['Pimiento rojo', '1', null], ['Cebolla', '2', null],
    ['Tomate triturado', '400 g', 'grasas'], ['Huevos', '6', 'proteína'],
    ['Aceite de oliva', '5 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Corta en dados {2 calabacines|calabacin}, {1 berenjena|berenjena}, {1 pimiento rojo|pimiento} y {2 cebollas|cebolla}.'],
    ['Pocha la cebolla y el pimiento en {5 cucharadas de aceite|aceite}.', 15],
    ['Añade la berenjena y el calabacín y cocina a fuego medio.', 15],
    ['Incorpora {400 g de tomate triturado|tomate}, sala con {sal|sal} y deja que espese.', 15],
    ['Cuaja {6 huevos|huevos} encima del pisto, tapado, justo antes de comer.', 5],
  ]),
  receta('curry', 'Pollo al curry con arroz', 45, [
    ['Pechugas de pollo', '2', 'proteína'], ['Arroz basmati', '400 g', 'hidratos'], ['Cebolla', '1', null],
    ['Ajo', '2 dientes', null], ['Jengibre', '1 trozo', null], ['Curry en polvo', '2 cucharadas', null],
    ['Leche de coco', '400 ml', null], ['Aceite de oliva', '2 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Corta {2 pechugas|pollo} en dados y pica {1 cebolla|cebolla}, {2 dientes de ajo|ajo} y {un trozo de jengibre|jengibre}.'],
    ['Sofríe la cebolla, el ajo y el jengibre en {2 cucharadas de aceite|aceite}.', 6],
    ['Dora el pollo y espolvorea {2 cucharadas de curry|curry}.', 5],
    ['Vierte {400 ml de leche de coco|coco}, sala con {sal|sal} y cuece a fuego suave.', 15],
    ['Mientras, cuece {400 g de arroz basmati|arroz} en agua con sal.', 12],
  ]),
  receta('crema', 'Crema de calabacín y tortilla', 40, [
    ['Calabacín', '3', 'fibra'], ['Puerro', '1', null], ['Patata', '1', null], ['Quesitos', '4', 'grasas'],
    ['Huevos', '8', 'proteína'], ['Aceite de oliva', '4 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Trocea {3 calabacines|calabacin}, {1 puerro|puerro} y {1 patata|patata}.'],
    ['Rehoga la verdura en {2 cucharadas de aceite|aceite} y cúbrela de agua.', 20],
    ['Tritura con {4 quesitos|quesitos} y ajusta de {sal|sal}.'],
    ['Bate {8 huevos|huevos} y cuaja la tortilla en una sartén con {2 cucharadas de aceite|aceite}.', 8],
  ]),
  receta('garbanzos', 'Garbanzos con espinacas', 30, [
    ['Garbanzos cocidos', '800 g', 'proteína'], ['Espinacas', '300 g', 'fibra'], ['Ajo', '3 dientes', null],
    ['Pan duro', '2 rebanadas', 'hidratos'], ['Pimentón dulce', '1 cucharadita', null], ['Comino molido', '1 pizca', null],
    ['Vinagre', '1 chorrito', null], ['Aceite de oliva', '4 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Fríe {3 dientes de ajo|ajo} y {2 rebanadas de pan|pan} en {4 cucharadas de aceite|aceite}.', 4],
    ['Machaca el ajo y el pan con {1 cucharadita de pimentón|pimenton}, {una pizca de comino|comino} y {un chorrito de vinagre|vinagre}.'],
    ['Saltea {300 g de espinacas|espinacas} en la misma sartén.', 3],
    ['Añade {800 g de garbanzos|garbanzos} escurridos, el majado y un poco de agua. Sala con {sal|sal}.', 10],
  ]),
  receta('salmon', 'Salmón al horno con patatas', 50, [
    ['Lomos de salmón', '6', 'proteína'], ['Patatas', '1 kg', 'hidratos'], ['Cebolla', '1', null], ['Limón', '1', null],
    ['Eneldo', '1 cucharadita', 'grasas'], ['Aceite de oliva', '4 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Precalienta el horno a 200 °C.'],
    ['Corta {1 kg de patatas|patatas} y {1 cebolla|cebolla} en láminas y alíñalas con {3 cucharadas de aceite|aceite}.'],
    ['Hornea las patatas.', 25],
    ['Coloca encima {6 lomos de salmón|salmon} con {el zumo de 1 limón|limon}, {1 cucharadita de eneldo|eneldo}, {1 cucharada de aceite|aceite} y {sal|sal}.'],
    ['Hornea hasta que el salmón esté hecho.', 12],
  ]),
  receta('macarrones', 'Macarrones con tomate y atún', 25, [
    ['Macarrones', '500 g', 'hidratos'], ['Tomate frito', '400 g', null], ['Atún en aceite', '3 latas', 'proteína'],
    ['Cebolla', '1', null], ['Queso rallado', '100 g', null], ['Sal', 'al gusto', null],
  ], [
    ['Cuece {500 g de macarrones|macarrones} en agua con {sal|sal}.', 11],
    ['Pocha {1 cebolla|cebolla} picada y añade {400 g de tomate frito|tomate}.', 8],
    ['Mezcla con la pasta escurrida y {3 latas de atún|atun}.'],
    ['Sirve con {100 g de queso rallado|queso} por encima.'],
  ]),
  receta('albondigas', 'Albóndigas en salsa', 75, [
    ['Carne picada mixta', '750 g', 'proteína'], ['Huevo', '1', 'grasas'], ['Pan rallado', '4 cucharadas', null],
    ['Ajo', '2 dientes', null], ['Harina', '3 cucharadas', null], ['Cebolla', '1', null], ['Zanahoria', '1', null],
    ['Tomate triturado', '200 g', null], ['Aceite de oliva', '4 cucharadas', null], ['Sal', 'al gusto', null],
  ], [
    ['Mezcla {750 g de carne picada|carne} con {1 huevo|huevo}, {4 cucharadas de pan rallado|pan}, {2 dientes de ajo|ajo} picados y {sal|sal}.'],
    ['Forma las albóndigas, pásalas por {harina|harina} y dóralas en {4 cucharadas de aceite|aceite}.', 10],
    ['En el mismo aceite pocha {1 cebolla|cebolla} y {1 zanahoria|zanahoria}.', 10],
    ['Añade {200 g de tomate triturado|tomate}, tritura la salsa y cuece las albóndigas en ella.', 25],
  ]),
];

// Guarda las diez recetas; repetirlo las sobrescribe con los mismos ids, sin duplicar.
export async function cargarSemilla(): Promise<number> {
  for (const r of RECETAS_DE_EJEMPLO) await guardarReceta(r);
  return RECETAS_DE_EJEMPLO.length;
}

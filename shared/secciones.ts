// Secciones del súper, en el orden del recorrido (el de SECCIONES en prototipo/lista.html),
// y a qué sección pertenece cada producto conocido.

export const SECCIONES = [
  'Frutería y verdura',
  'Panadería',
  'Carnicería',
  'Pescadería',
  'Despensa',
  'Lácteos y huevos',
  'Congelados',
  'Limpieza y hogar',
  'Otros',
] as const;

export type Seccion = (typeof SECCIONES)[number];

export const esSeccion = (valor: unknown): valor is Seccion => (SECCIONES as readonly unknown[]).includes(valor);

// Minúsculas, sin tildes y sin espacios sobrantes: la clave para comparar nombres.
export const normalizar = (nombre: string): string =>
  nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');

const F: Seccion = 'Frutería y verdura';
const P: Seccion = 'Panadería';
const C: Seccion = 'Carnicería';
const E: Seccion = 'Pescadería';
const D: Seccion = 'Despensa';
const L: Seccion = 'Lácteos y huevos';
const G: Seccion = 'Congelados';
const H: Seccion = 'Limpieza y hogar';

// CONOCIDOS de prototipo/lista.html más los ingredientes de las recetas del prototipo/recetas.html.
const CONOCIDOS: Record<string, Seccion> = {
  'cafe': D, 'yogures': L, 'pan de molde': P, 'pan': P, 'bolsas de basura': H,
  'tomates': F, 'manzanas': F, 'arroz': D, 'aceite de oliva': D, 'queso': L,
  'pollo': C, 'guisantes congelados': G, 'detergente': H, 'servilletas': H,
  'lentejas pardinas': D, 'cebolla': F, 'pimiento verde': F, 'pimiento rojo': F, 'zanahorias': F, 'zanahoria': F,
  'ajo': F, 'chorizo': C, 'pimenton dulce': D, 'laurel': D, 'agua': D, 'sal': D,
  'merluza en rodajas': E, 'almejas': E, 'patatas': F, 'patata': F, 'perejil': F, 'vino blanco': D, 'harina': D,
  'muslos de pollo': C, 'pechugas de pollo': C, 'tomate triturado': D, 'tomate frito': D, 'caldo de pollo': D,
  'calabacin': F, 'berenjena': F, 'huevos': L, 'huevo': L, 'arroz basmati': D, 'jengibre': F,
  'curry en polvo': D, 'leche de coco': D, 'puerro': F, 'quesitos': L, 'garbanzos cocidos': D,
  'espinacas': F, 'pan duro': P, 'comino molido': D, 'vinagre': D, 'lomos de salmon': E, 'limon': F,
  'eneldo': D, 'macarrones': D, 'atun en aceite': D, 'queso rallado': L, 'carne picada mixta': C, 'pan rallado': D,
};

export const seccionDe = (nombre: string): Seccion => CONOCIDOS[normalizar(nombre)] ?? 'Otros';

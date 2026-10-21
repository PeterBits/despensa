// De las recetas de la semana a las líneas de la lista de la compra, agrupadas por sección.

import { formatearCantidades, leerCantidad, sumarCantidades } from './cantidad';
import { normalizar, SECCIONES, type Seccion } from './secciones';

export type IngredienteParaLista = { nombre: string; cantidad: string; compra: string | null; aLaLista: boolean; seccion: Seccion };
export type RecetaParaLista = { corto: string; ingredientes: IngredienteParaLista[] };
export type LineaLista = { nombre: string; cantidad: string; seccion: Seccion; origen: string[] };

type Aparicion = { ingrediente: IngredienteParaLista; corto: string };

const conInicialMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function listaDesdeRecetas(recetas: RecetaParaLista[]): LineaLista[] {
  // Map conserva el orden de primera aparición.
  const grupos = new Map<string, Aparicion[]>();
  for (const { corto, ingredientes } of recetas) {
    for (const ingrediente of ingredientes) {
      if (!ingrediente.aLaLista) continue;
      const clave = normalizar(ingrediente.nombre);
      const grupo = grupos.get(clave);
      if (grupo) grupo.push({ ingrediente, corto });
      else grupos.set(clave, [{ ingrediente, corto }]);
    }
  }

  const lineas = [...grupos.values()].map((apariciones): LineaLista => {
    const primera = apariciones[0]!.ingrediente;
    const compra = apariciones.find((a) => a.ingrediente.compra)?.ingrediente.compra;
    // Con compra se muestra esa, una vez, en vez de sumar.
    const cantidad =
      compra ?? formatearCantidades(sumarCantidades(apariciones.map((a) => leerCantidad(a.ingrediente.cantidad))));
    return {
      nombre: conInicialMayuscula(primera.nombre.trim()),
      cantidad,
      seccion: primera.seccion,
      origen: [...new Set(apariciones.map((a) => a.corto))],
    };
  });

  // sort es estable: dentro de cada sección queda el orden de primera aparición.
  return lineas.sort((a, b) => SECCIONES.indexOf(a.seccion) - SECCIONES.indexOf(b.seccion));
}

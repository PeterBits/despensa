// Aplicar operaciones del cliente de forma idempotente y servir lo cambiado desde una versión.
// Los nombres de tabla y columna salen siempre de TABLAS_SYNC; los valores, siempre como parámetros.

import { columnasDe, MAX_OPS, NOMBRES_TABLAS, normalizarOp, type Fila, type Op, type TablaSync } from '../../shared/esquema';

const VERSION_DEL_HOGAR = '(SELECT version FROM hogar WHERE id = ?)';
const marcas = (n: number) => Array<string>(n).fill('?').join(', ');

async function versionActual(db: D1Database, hogarId: string): Promise<number> {
  const hogar = await db.prepare('SELECT version FROM hogar WHERE id = ?').bind(hogarId).first<{ version: number }>();
  if (!hogar) throw new Error('El hogar no existe.');
  return hogar.version;
}

function sentenciaDe(db: D1Database, hogarId: string, miembroId: string, op: Op): D1PreparedStatement {
  const { tabla, fila } = op;
  // En nota, escribir o borrar exige ser quien la puso: la valoración de la pareja no se toca.
  const esNota = tabla === 'nota';
  if (op.borrar) {
    return db.prepare(
      `UPDATE ${tabla} SET borrado = 1, version = ${VERSION_DEL_HOGAR} WHERE id = ? AND hogar_id = ?${esNota ? ' AND miembro_id = ?' : ''}`,
    ).bind(hogarId, fila.id, hogarId, ...(esNota ? [miembroId] : []));
  }
  const propias = columnasDe(tabla).filter((c) => c !== 'id');
  const valores = propias.map((c) => (esNota && c === 'miembro_id' ? miembroId : (fila[c] ?? null)));
  return db.prepare(
    `INSERT INTO ${tabla} (id, hogar_id, version, borrado, ${propias.join(', ')})
     VALUES (?, ?, ${VERSION_DEL_HOGAR}, 0, ${marcas(propias.length)})
     ON CONFLICT(id) DO UPDATE SET ${[...propias.map((c) => `${c} = excluded.${c}`), 'version = excluded.version', 'borrado = 0'].join(', ')}
     WHERE ${tabla}.hogar_id = excluded.hogar_id${esNota ? ' AND nota.miembro_id = excluded.miembro_id' : ''}`,
  ).bind(fila.id, hogarId, hogarId, ...valores);
}

// Un solo lote: sube la versión del hogar, aplica cada operación nueva y las marca como vistas.
// La versión devuelta es la del primer paso del lote, no una leída después.
export async function aplicarOps(
  db: D1Database,
  hogarId: string,
  miembroId: string,
  ops: Op[],
): Promise<{ version: number; aplicadas: number }> {
  if (ops.length > MAX_OPS) throw new Error(`Como mucho ${MAX_OPS} operaciones por lote.`);
  const porId = new Map(ops.map((op) => [op.id, normalizarOp(op)]));
  const ids = [...porId.keys()];
  const vistas = ids.length === 0 ? [] : (
    await db.prepare(`SELECT id FROM op_vista WHERE id IN (${marcas(ids.length)})`).bind(...ids).all<{ id: string }>()
  ).results.map((f) => f.id);
  const nuevas = ids.filter((id) => !vistas.includes(id)).map((id) => porId.get(id) as Op);
  if (nuevas.length === 0) return { version: await versionActual(db, hogarId), aplicadas: 0 };

  const resultados = await db.batch([
    db.prepare('UPDATE hogar SET version = version + 1 WHERE id = ? RETURNING version').bind(hogarId),
    ...nuevas.map((op) => sentenciaDe(db, hogarId, miembroId, op)),
    db.prepare(`INSERT OR IGNORE INTO op_vista (id, hogar_id) VALUES ${nuevas.map(() => '(?, ?)').join(', ')}`)
      .bind(...nuevas.flatMap((op) => [op.id, hogarId])),
  ]);
  const version = (resultados[0]?.results[0] as { version: number } | undefined)?.version;
  if (version === undefined) throw new Error('El hogar no existe.');
  return { version, aplicadas: nuevas.length };
}

// Lo cambiado con desde < version <= v, donde v es la versión del hogar leída en el mismo lote.
export async function cambiosDesde(
  db: D1Database,
  hogarId: string,
  desde: number,
): Promise<{ version: number; filas: Partial<Record<TablaSync, Fila[]>> }> {
  const resultados = await db.batch([
    db.prepare('SELECT version FROM hogar WHERE id = ?').bind(hogarId),
    ...NOMBRES_TABLAS.map((tabla) =>
      db.prepare(
        `SELECT ${columnasDe(tabla).join(', ')}, version, borrado FROM ${tabla}
         WHERE hogar_id = ? AND version > ? AND version <= ${VERSION_DEL_HOGAR} ORDER BY version, id`,
      ).bind(hogarId, desde, hogarId)),
  ]);
  const version = (resultados[0]?.results[0] as { version: number } | undefined)?.version;
  if (version === undefined) throw new Error('El hogar no existe.');
  const filas: Partial<Record<TablaSync, Fila[]>> = {};
  NOMBRES_TABLAS.forEach((tabla, i) => {
    const encontradas = resultados[i + 1]?.results as Fila[] | undefined;
    if (encontradas && encontradas.length > 0) filas[tabla] = encontradas;
  });
  return { version, filas };
}

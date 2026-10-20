import { env } from 'cloudflare:test';

const TABLAS_SINCRONIZABLES = [
  'receta', 'ingrediente', 'paso', 'semana', 'semana_dia',
  'semana_plato', 'comida', 'nota', 'producto', 'frecuente',
];

describe('esquema de D1', () => {
  it('crea las tablas y rechaza una nota fuera de rango', async () => {
    const tablas = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const nombres = tablas.results.map((t) => t.name);
    for (const t of ['hogar', 'miembro', 'credencial', 'sesion', 'invitacion', 'reto', 'op_vista', ...TABLAS_SINCRONIZABLES])
      expect(nombres).toContain(t);
    await expect(
      env.DB.prepare("INSERT INTO nota (id,hogar_id,version,comida_id,miembro_id,valor) VALUES ('n','h',1,'c','m',11)").run(),
    ).rejects.toThrow();
  });

  it('acepta una nota válida y rechaza un estado de producto desconocido', async () => {
    await env.DB.prepare("INSERT INTO nota (id,hogar_id,version,comida_id,miembro_id,valor) VALUES ('n-ok','h',1,'c','m',7)").run();
    await expect(
      env.DB.prepare("INSERT INTO producto (id,hogar_id,version,nombre,estado) VALUES ('p-mal','h',1,'leche','roto')").run(),
    ).rejects.toThrow();
    await env.DB.prepare("INSERT INTO producto (id,hogar_id,version,nombre) VALUES ('p-ok','h',1,'leche')").run();
    const p = await env.DB.prepare("SELECT estado, borrado FROM producto WHERE id='p-ok'").first();
    expect(p).toEqual({ estado: 'pendiente', borrado: 0 });
  });

  it('indexa (hogar_id, version) en cada tabla sincronizable', async () => {
    for (const t of TABLAS_SINCRONIZABLES) {
      const idx = await env.DB.prepare(`PRAGMA index_list(${t})`).all();
      const hay = [];
      for (const i of idx.results) {
        const cols = await env.DB.prepare(`PRAGMA index_info(${i.name})`).all();
        hay.push(cols.results.map((c) => c.name).join(','));
      }
      expect(hay, t).toContain('hogar_id,version');
    }
  });
});

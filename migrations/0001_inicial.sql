-- Esquema inicial de Despensa (spec, apartado 5).
-- Booleanos: INTEGER 0/1. Fechas: TEXT ISO (timestamps completos; lunes y fecha como YYYY-MM-DD).

-- Autenticación y hogar (con claves foráneas) ---------------------------------

CREATE TABLE hogar (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE miembro (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL REFERENCES hogar(id),
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE credencial (
  id TEXT PRIMARY KEY,
  miembro_id TEXT NOT NULL REFERENCES miembro(id),
  clave_publica BLOB NOT NULL,
  contador INTEGER NOT NULL DEFAULT 0,
  transportes TEXT
);
CREATE INDEX credencial_miembro ON credencial (miembro_id);

-- sesion.id guarda el SHA-256 hex del token, nunca el token.
CREATE TABLE sesion (
  id TEXT PRIMARY KEY,
  miembro_id TEXT NOT NULL REFERENCES miembro(id),
  caduca TEXT NOT NULL
);
CREATE INDEX sesion_miembro ON sesion (miembro_id);

CREATE TABLE invitacion (
  token_hash TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL REFERENCES hogar(id),
  caduca TEXT NOT NULL,
  usada INTEGER NOT NULL DEFAULT 0
);

-- Retos de passkeys de un solo uso; sin hogar.
CREATE TABLE reto (
  id TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  caduca TEXT NOT NULL
);

-- Operaciones ya aplicadas, para no repetirlas.
CREATE TABLE op_vista (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  creada TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Contenido sincronizable (sin claves foráneas: llegan sin orden y se borra en lógico) ----

CREATE TABLE receta (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL,
  corto TEXT,
  raciones INTEGER,
  minutos INTEGER,
  tipos TEXT, -- array JSON
  foto_key TEXT,
  notas TEXT
);
CREATE INDEX receta_hogar_version ON receta (hogar_id, version);

CREATE TABLE ingrediente (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  receta_id TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL,
  cantidad REAL,
  unidad TEXT,
  compra TEXT,
  a_la_lista INTEGER NOT NULL DEFAULT 1,
  tipo TEXT,
  seccion TEXT
);
CREATE INDEX ingrediente_hogar_version ON ingrediente (hogar_id, version);

CREATE TABLE paso (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  receta_id TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  texto TEXT NOT NULL,
  minutos INTEGER
);
CREATE INDEX paso_hogar_version ON paso (hogar_id, version);

CREATE TABLE semana (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  lunes TEXT NOT NULL, -- YYYY-MM-DD
  propuesta_aceptada INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX semana_hogar_version ON semana (hogar_id, version);

CREATE TABLE semana_dia (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  semana_id TEXT NOT NULL,
  dia INTEGER NOT NULL CHECK (dia BETWEEN 0 AND 6),
  activo INTEGER NOT NULL DEFAULT 1,
  fuera INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX semana_dia_hogar_version ON semana_dia (hogar_id, version);

CREATE TABLE semana_plato (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  semana_id TEXT NOT NULL,
  hueco TEXT NOT NULL,
  receta_id TEXT,
  sustituye_a TEXT
);
CREATE INDEX semana_plato_hogar_version ON semana_plato (hogar_id, version);

CREATE TABLE comida (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL, -- YYYY-MM-DD
  receta_id TEXT,
  texto TEXT,
  fuera INTEGER NOT NULL DEFAULT 0,
  planificada_receta_id TEXT
);
CREATE INDEX comida_hogar_version ON comida (hogar_id, version);

CREATE TABLE nota (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  comida_id TEXT NOT NULL,
  miembro_id TEXT NOT NULL,
  valor INTEGER NOT NULL CHECK (valor BETWEEN 1 AND 10)
);
CREATE INDEX nota_hogar_version ON nota (hogar_id, version);

CREATE TABLE producto (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL,
  cantidad TEXT,
  seccion TEXT,
  origen TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','carro','casa')),
  cogido_por TEXT
);
CREATE INDEX producto_hogar_version ON producto (hogar_id, version);

CREATE TABLE frecuente (
  id TEXT PRIMARY KEY,
  hogar_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  nombre TEXT NOT NULL,
  seccion TEXT,
  cantidad_habitual TEXT,
  veces INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX frecuente_hogar_version ON frecuente (hogar_id, version);

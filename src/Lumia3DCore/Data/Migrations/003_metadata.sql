-- Migration 003: metadados de modelo (tamanho, triangulos, dimensoes)
-- Permite filtros e exibicao de stats sem precisar reler o arquivo do disco.
-- Backfill: novos imports populam; objetos existentes ficam com defaults
-- (sera regenerado em background na proxima implementacao se necessario).

ALTER TABLE Object3D ADD COLUMN FileSize       INTEGER NOT NULL DEFAULT 0;

-- split

ALTER TABLE Object3D ADD COLUMN TriangleCount  INTEGER NOT NULL DEFAULT 0;

-- split

ALTER TABLE Object3D ADD COLUMN Width          REAL    NOT NULL DEFAULT 0;

-- split

ALTER TABLE Object3D ADD COLUMN Height         REAL    NOT NULL DEFAULT 0;

-- split

ALTER TABLE Object3D ADD COLUMN Depth          REAL    NOT NULL DEFAULT 0;

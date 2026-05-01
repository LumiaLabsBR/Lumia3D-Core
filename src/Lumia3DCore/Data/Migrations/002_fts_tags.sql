-- Migration 002: FTS com suporte a tags
-- Recria Object3D_FTS sem content table (auto-gerenciada) para suportar a
-- coluna Tags sem exigir que ela exista em Object3D.
-- Adiciona triggers em ObjectTag para manter o índice atualizado.

-- 1. Remove triggers antigos
DROP TRIGGER IF EXISTS Object3D_ai;
DROP TRIGGER IF EXISTS Object3D_ad;
DROP TRIGGER IF EXISTS Object3D_au;

-- split

-- 2. Remove tabela FTS antiga (recriada sem content=)
DROP TABLE IF EXISTS Object3D_FTS;

-- split

-- 3. Nova FTS5 com coluna Tags
CREATE VIRTUAL TABLE Object3D_FTS USING fts5(
    Name,
    Description,
    Filename,
    Tags,
    tokenize = 'unicode61'
);

-- split

-- 4. Trigger AFTER INSERT em Object3D
CREATE TRIGGER Object3D_ai AFTER INSERT ON Object3D BEGIN
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, Tags)
    VALUES (
        new.Id,
        new.Name,
        COALESCE(new.Description, ''),
        new.MainFilePath,
        COALESCE((
            SELECT GROUP_CONCAT(t.Name, ' ')
            FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
            WHERE ot.ObjectId = new.Id
        ), '')
    );
END;

-- split

-- 5. Trigger AFTER DELETE em Object3D
--    Tags já foram cascade-deletadas quando este trigger dispara,
--    então provemos string vazia — entradas órfãs são inofensivas
--    (JOIN com Object3D nunca as devolve ao frontend).
CREATE TRIGGER Object3D_ad AFTER DELETE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, Tags)
    VALUES('delete', old.Id, old.Name, COALESCE(old.Description, ''), old.MainFilePath, '');
END;

-- split

-- 6. Trigger AFTER UPDATE em Object3D
CREATE TRIGGER Object3D_au AFTER UPDATE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, Tags)
    VALUES('delete', old.Id, old.Name, COALESCE(old.Description, ''), old.MainFilePath, '');
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, Tags)
    VALUES (
        new.Id,
        new.Name,
        COALESCE(new.Description, ''),
        new.MainFilePath,
        COALESCE((
            SELECT GROUP_CONCAT(t.Name, ' ')
            FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
            WHERE ot.ObjectId = new.Id
        ), '')
    );
END;

-- split

-- 7. Trigger AFTER INSERT em ObjectTag — atualiza FTS do objeto
--    WHEN EXISTS protege contra disparo em cascade-delete de Object3D
CREATE TRIGGER ObjectTag_ai AFTER INSERT ON ObjectTag
WHEN EXISTS (SELECT 1 FROM Object3D WHERE Id = new.ObjectId)
BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, Tags)
    VALUES('delete', new.ObjectId,
        (SELECT Name        FROM Object3D WHERE Id = new.ObjectId),
        COALESCE((SELECT Description FROM Object3D WHERE Id = new.ObjectId), ''),
        (SELECT MainFilePath FROM Object3D WHERE Id = new.ObjectId),
        ''
    );
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, Tags)
    VALUES(
        new.ObjectId,
        (SELECT Name        FROM Object3D WHERE Id = new.ObjectId),
        COALESCE((SELECT Description FROM Object3D WHERE Id = new.ObjectId), ''),
        (SELECT MainFilePath FROM Object3D WHERE Id = new.ObjectId),
        COALESCE((
            SELECT GROUP_CONCAT(t.Name, ' ')
            FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
            WHERE ot.ObjectId = new.ObjectId
        ), '')
    );
END;

-- split

-- 8. Trigger AFTER DELETE em ObjectTag — atualiza FTS do objeto
CREATE TRIGGER ObjectTag_ad AFTER DELETE ON ObjectTag
WHEN EXISTS (SELECT 1 FROM Object3D WHERE Id = old.ObjectId)
BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, Tags)
    VALUES('delete', old.ObjectId,
        (SELECT Name        FROM Object3D WHERE Id = old.ObjectId),
        COALESCE((SELECT Description FROM Object3D WHERE Id = old.ObjectId), ''),
        (SELECT MainFilePath FROM Object3D WHERE Id = old.ObjectId),
        ''
    );
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, Tags)
    VALUES(
        old.ObjectId,
        (SELECT Name        FROM Object3D WHERE Id = old.ObjectId),
        COALESCE((SELECT Description FROM Object3D WHERE Id = old.ObjectId), ''),
        (SELECT MainFilePath FROM Object3D WHERE Id = old.ObjectId),
        COALESCE((
            SELECT GROUP_CONCAT(t.Name, ' ')
            FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
            WHERE ot.ObjectId = old.ObjectId
        ), '')
    );
END;

-- split

-- 9. Rebuild: popula FTS com todos os dados existentes (inclui tags)
INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, Tags)
SELECT
    o.Id,
    o.Name,
    COALESCE(o.Description, ''),
    o.MainFilePath,
    COALESCE(GROUP_CONCAT(t.Name, ' '), '')
FROM Object3D o
LEFT JOIN ObjectTag ot ON o.Id = ot.ObjectId
LEFT JOIN Tag t ON ot.TagId = t.Id
GROUP BY o.Id, o.Name, o.Description, o.MainFilePath;

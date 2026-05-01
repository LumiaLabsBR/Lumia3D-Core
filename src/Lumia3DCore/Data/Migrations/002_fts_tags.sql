-- Migration 002: FTS com suporte a tags
-- Adiciona coluna FtsTags (cache de tags em texto) em Object3D.
-- Recria os triggers de FTS para incluir FtsTags.
-- Adiciona triggers em ObjectTag que atualizam Object3D.FtsTags, o que
-- dispara Object3D_au e mantém o índice FTS correto.
-- Usa content='Object3D' (migration 001) — não requer contentless_delete.

-- 1. Remove triggers antigos
DROP TRIGGER IF EXISTS Object3D_ai;
DROP TRIGGER IF EXISTS Object3D_ad;
DROP TRIGGER IF EXISTS Object3D_au;
DROP TRIGGER IF EXISTS ObjectTag_ai;
DROP TRIGGER IF EXISTS ObjectTag_ad;

-- split

-- 2. Remove FTS antiga e adiciona coluna FtsTags em Object3D
DROP TABLE IF EXISTS Object3D_FTS;

-- split

ALTER TABLE Object3D ADD COLUMN FtsTags TEXT NOT NULL DEFAULT '';

-- split

-- 3. Recria FTS com content='Object3D' incluindo FtsTags
CREATE VIRTUAL TABLE Object3D_FTS USING fts5(
    Name,
    Description,
    Filename,
    FtsTags,
    content='Object3D',
    content_rowid='Id',
    tokenize = 'unicode61'
);

-- split

-- 4. Trigger AFTER INSERT em Object3D
CREATE TRIGGER Object3D_ai AFTER INSERT ON Object3D BEGIN
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, FtsTags)
    VALUES (new.Id, new.Name, COALESCE(new.Description, ''), new.MainFilePath, new.FtsTags);
END;

-- split

-- 5. Trigger AFTER DELETE em Object3D
--    old.FtsTags é sempre o valor que está no FTS (mantido pelos triggers abaixo)
CREATE TRIGGER Object3D_ad AFTER DELETE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, FtsTags)
    VALUES('delete', old.Id, old.Name, COALESCE(old.Description, ''), old.MainFilePath, old.FtsTags);
END;

-- split

-- 6. Trigger AFTER UPDATE em Object3D (inclui atualizações de FtsTags)
CREATE TRIGGER Object3D_au AFTER UPDATE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename, FtsTags)
    VALUES('delete', old.Id, old.Name, COALESCE(old.Description, ''), old.MainFilePath, old.FtsTags);
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, FtsTags)
    VALUES (new.Id, new.Name, COALESCE(new.Description, ''), new.MainFilePath, new.FtsTags);
END;

-- split

-- 7. Trigger AFTER INSERT em ObjectTag
--    Atualiza Object3D.FtsTags → dispara Object3D_au → FTS atualizado.
--    WHEN EXISTS protege contra disparo em cascade-delete de Object3D.
CREATE TRIGGER ObjectTag_ai AFTER INSERT ON ObjectTag
WHEN EXISTS (SELECT 1 FROM Object3D WHERE Id = new.ObjectId)
BEGIN
    UPDATE Object3D
    SET FtsTags = COALESCE((
        SELECT GROUP_CONCAT(t.Name, ' ')
        FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
        WHERE ot.ObjectId = new.ObjectId
    ), '')
    WHERE Id = new.ObjectId;
END;

-- split

-- 8. Trigger AFTER DELETE em ObjectTag
--    Atualiza Object3D.FtsTags → dispara Object3D_au → FTS atualizado.
--    O delete explícito de ObjectTag antes de Object3D garante que, quando
--    Object3D_ad disparar, old.FtsTags = '' (todas as tags já foram removidas).
CREATE TRIGGER ObjectTag_ad AFTER DELETE ON ObjectTag
WHEN EXISTS (SELECT 1 FROM Object3D WHERE Id = old.ObjectId)
BEGIN
    UPDATE Object3D
    SET FtsTags = COALESCE((
        SELECT GROUP_CONCAT(t.Name, ' ')
        FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
        WHERE ot.ObjectId = old.ObjectId
    ), '')
    WHERE Id = old.ObjectId;
END;

-- split

-- 9. Popula FtsTags com dados existentes antes de reconstruir FTS
UPDATE Object3D SET FtsTags = COALESCE((
    SELECT GROUP_CONCAT(t.Name, ' ')
    FROM Tag t JOIN ObjectTag ot ON t.Id = ot.TagId
    WHERE ot.ObjectId = Object3D.Id
), '');

-- split

-- 10. Rebuild: popula FTS com todos os dados existentes (inclui FtsTags)
INSERT INTO Object3D_FTS(rowid, Name, Description, Filename, FtsTags)
SELECT Id, Name, COALESCE(Description, ''), MainFilePath, FtsTags
FROM Object3D;

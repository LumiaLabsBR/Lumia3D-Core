-- Migration 001: schema inicial completo
-- Aplica o schema base do Lumia3D Core (tabelas, FTS5, triggers).
-- Não use IF NOT EXISTS aqui — o runner garante execução única.

CREATE TABLE Category (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Name            TEXT    NOT NULL,
    ParentCategoryId INTEGER,
    SortOrder       INTEGER DEFAULT 0,
    FOREIGN KEY(ParentCategoryId) REFERENCES Category(Id)
);

-- split

CREATE TABLE Object3D (
    Id            INTEGER PRIMARY KEY AUTOINCREMENT,
    Name          TEXT    NOT NULL,
    Description   TEXT,
    MainFilePath  TEXT    NOT NULL,
    FileType      TEXT    NOT NULL,
    ThumbnailPath TEXT,
    Hash          TEXT    NOT NULL,
    CategoryId    INTEGER,
    CreatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(CategoryId) REFERENCES Category(Id)
);

-- split

-- FTS5: indexa Nome, Descrição e Filename para busca de texto completo.
CREATE VIRTUAL TABLE Object3D_FTS USING fts5(
    Name,
    Description,
    Filename,
    content='Object3D',
    content_rowid='Id'
);

-- split

CREATE TRIGGER Object3D_ai AFTER INSERT ON Object3D BEGIN
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename)
    VALUES (new.Id, new.Name, new.Description, new.MainFilePath);
END;

-- split

CREATE TRIGGER Object3D_ad AFTER DELETE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename)
    VALUES('delete', old.Id, old.Name, old.Description, old.MainFilePath);
END;

-- split

CREATE TRIGGER Object3D_au AFTER UPDATE ON Object3D BEGIN
    INSERT INTO Object3D_FTS(Object3D_FTS, rowid, Name, Description, Filename)
    VALUES('delete', old.Id, old.Name, old.Description, old.MainFilePath);
    INSERT INTO Object3D_FTS(rowid, Name, Description, Filename)
    VALUES (new.Id, new.Name, new.Description, new.MainFilePath);
END;

-- split

CREATE TABLE Tag (
    Id    INTEGER PRIMARY KEY AUTOINCREMENT,
    Name  TEXT    NOT NULL UNIQUE,
    Color TEXT
);

-- split

CREATE TABLE ObjectTag (
    ObjectId INTEGER NOT NULL,
    TagId    INTEGER NOT NULL,
    PRIMARY KEY (ObjectId, TagId),
    FOREIGN KEY(ObjectId) REFERENCES Object3D(Id) ON DELETE CASCADE,
    FOREIGN KEY(TagId)    REFERENCES Tag(Id)       ON DELETE CASCADE
);

-- split

CREATE TABLE Attachment (
    Id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjectId INTEGER NOT NULL,
    FilePath TEXT    NOT NULL,
    Type     TEXT    NOT NULL,
    FOREIGN KEY(ObjectId) REFERENCES Object3D(Id) ON DELETE CASCADE
);

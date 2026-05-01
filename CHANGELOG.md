# Changelog

Todas as mudanças notáveis do Lumia3D Core são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/).

---

## [v0.1.0-alpha.1] — 2026-05-01

Primeira versão pública do Lumia3D Core — biblioteca local de modelos 3D.

### Adicionado

- **Importação de modelos**: `.stl` (ASCII e binário), `.obj`, `.3mf`, com detecção de duplicatas por hash SHA-256
- **Importação de pastas** com criação automática de categorias e importação de anexos
- **Thumbnails assíncronos** via `ThumbnailQueue` (Channel-based, não bloqueia a UI)
  - STL: renderização isométrica com shading Lambertiano
  - OBJ: mesmo pipeline, com suporte a quads e índices negativos
  - 3MF: extração do preview embutido no ZIP
- **Busca full-text** (FTS5) por nome, descrição, arquivo e tags; prefixo com `*`
- **Tags**: criar, colorir, atribuir/remover; busca por tags no FTS
- **Categorias** hierárquicas com arrastar para reorganizar
- **Anexos**: PDFs, imagens ou qualquer arquivo vinculado a um modelo
- **Sistema de updates opt-in**: verificação manual ou automática (24 h) via GitHub Releases API; download + instalação
- **StatusBar** com contagem de modelos e versão clicável → modal About
- **Modal About** com versão, data de build, commit SHA e link do repositório
- **Hardening de segurança**:
  - Path traversal em `.3mf` bloqueado
  - Zip bomb limitado a 50 MB
  - Triangle count validado contra tamanho do arquivo
- **Migrations de schema** (MigrationRunner): `001_initial`, `002_fts_tags`
- **Suite de testes xUnit**: 46 testes cobrindo ObjectRepository, LibraryManager, ThumbnailGenerator, VersionInfo

### Stack

- .NET 8 LTS + Photino.NET 2.5.2 (shell nativo Windows)
- Vite + React 18 (frontend)
- SQLite + Dapper + FTS5
- SixLabors.ImageSharp 3.x (thumbnails)

### Notas

- Requer Windows 10+ com WebView2 (incluso no Windows 11)
- App 100% local — zero telemetria, zero cloud, zero conta

[v0.1.0-alpha.1]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.1

---

---

## [Não publicado]

### Adicionado
- Estrutura inicial: arquitetura Photino.NET + React (fork do stlhub)
- Backend C# portado: modelos, repositório, serviços, inicializador do banco
- IPC bridge JSON entre frontend React e backend C#
- FTS5 expandido para indexar Filename além de Nome e Descrição
- Campo `Color` na tabela `Tag` para tags coloridas
- `UserSettings` com campos de tema, densidade, modo de exibição, updates opt-in
- Thumbnails em 512×512 (era 256×256 no stlhub)
- Frontend Vite + React 18 + Three.js

---

## [0.1.0-alpha.1] — em andamento

Fase 0 — Rebrand e estrutura base (fork stlhub → Lumia3D Core).

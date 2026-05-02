# Changelog

Todas as mudanças notáveis do Lumia3D Core são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/).

---

## [v0.1.0] — 2026-05-01

Primeira versão estável. Encerra o ciclo das alphas (0.1.0-alpha.1 a 0.1.0-alpha.9) com polish final, code-splitting, atalhos de teclado, tema light/contrast funcional e documentação completa.

### Adicionado (sobre o último alpha)

- **Atalhos de teclado globais**: `Ctrl+O` importar arquivos, `Ctrl+Shift+O` importar pasta, `/` focar busca, `Esc` fechar modais
- **Empty state** com drag CTA quando a biblioteca está vazia
- **Botões viewer 3D funcionais** no Detail: rotação automática, mostrar/ocultar grade, ajuste de iluminação
- **Tema light/contrast** com CSS aplicado a todos os componentes
- **Code-splitting** dos modais via `React.lazy` — bundle inicial **794 KB → 216 KB** (gzip 215 → 66 KB); Detail/three.js carregado sob demanda
- **CLAUDE.md** na raiz com convenções, comandos e padrões para futuras sessões
- **README.md** atualizado com instalação, atalhos, build e privacidade

### Stack final

- .NET 8 LTS + Photino.NET 2.5.2 (shell + WebView2)
- Vite 5 + React 18 + Three.js 0.160 (frontend)
- SQLite + Dapper + FTS5 (banco)
- SixLabors.ImageSharp 3.1 (thumbnails)
- xUnit + FluentAssertions (testes — 55 passando)
- Inno Setup 6 (instalador)

[v0.1.0]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0

---

## [v0.1.0-alpha.9] — 2026-05-01

Pacote P1 — fecha o que estava pendente funcionalmente.

### Adicionado
- **Sistema de update funcional end-to-end**: `UpdateModal` com release notes + botão "Baixar e instalar" + barra de progresso ao vivo via push event `downloadProgress`
- **Detail editável**: nome inline, tag picker popover (criar/adicionar/remover), botão excluir com confirmação inline
- **Importar pasta** (Menu Arquivo `Ctrl+Shift+O`) via `pickFolder` + `importFolder`
- **TweaksPanel → Atualizações**: toggles `autoCheckUpdates` e `includePreReleases` persistidos via `ipc.saveSettings`
- Push event listeners completos: `updateAvailable/NotAvailable/CheckError/downloadProgress/Complete/Error/Canceled`
- Toast genérico (`updateMessage`) para mensagens transitórias

[v0.1.0-alpha.9]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.9

---

## [v0.1.0-alpha.8] — 2026-05-01

Tags + metadata reais por modelo.

### Adicionado
- **Migration 003**: novas colunas em Object3D — `FileSize`, `TriangleCount`, `Width`, `Height`, `Depth`
- **`MetadataExtractor`** (novo serviço): parsers para STL bin/ASCII (lê 84-byte header + bbox), OBJ (fan triangulation), 3MF (XML simples). Tolerante a falhas.
- `LibraryManager.ImportFile` chama o extractor + lê file size, popula no Object3D antes de salvar
- `ObjectRepository.PopulateTags(IEnumerable)`: query batch única que faz JOIN ObjectTag+Tag (sem N+1)
- `GetAllCategories/Tags` retornam `count` agregado via subquery (Sidebar mostra contadores reais)
- Frontend adapter: `model.sizeKB`, `model.polys`, `model.dims` (formatado `Wmm × Hmm × Dmm`), `model.tags` populados
- +7 testes (total 55)

[v0.1.0-alpha.8]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.8

---

## [v0.1.0-alpha.7] — 2026-05-01

### Corrigido
- **Importar via diálogo Win32 nativo** — WebView2 esconde `File.path` por segurança, fazendo o `<input type="file">` retornar apenas nomes sem caminho. Backend retornava "Arquivo não encontrado". Solução: `<UseWindowsForms>true</UseWindowsForms>` + `OpenFileDialog`/`FolderBrowserDialog`. Frontend detecta `IS_PHOTINO` e usa `pickFiles`/`pickFolder`.

[v0.1.0-alpha.7]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.7

---

## [v0.1.0-alpha.6] — 2026-05-01

Window controls + menus + import button + sidebar real + ícone alinhado.

### Adicionado
- **WindowChrome menus funcionais** com componente Menu reutilizável: Arquivo (Importar/Recarregar/Sair), Editar (Limpar filtros/Resetar tweaks), Visualizar (Galeria/Lista/Tweaks), Biblioteca, Ajuda (Sobre/Verificar atualizações/GitHub/Issues)
- **Window controls** min/max/close conectados ao Photino via novos handlers IPC `windowMinimize/Maximize/Close`
- `api.openExternal(url)` para links externos (apenas http/https)
- **Sidebar refatorado**: removido `LUMIA_DATA` mock, recebe `categories`/`tags`/`stats` via props (count real)
- **Botão "Importar modelos"** na Sidebar agora dispara file picker

### Corrigido
- **Ícone redesenhado**: fundo laranja cheio + cubo isométrico branco em 3 facetas. Alto contraste em 16/32/256 px.
- Footer Sidebar mostra stats reais (não mais "274 obj · 1.84 GB" hardcoded)

[v0.1.0-alpha.6]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.6

---

## [v0.1.0-alpha.5] — 2026-05-01

Integração real frontend ↔ backend via IPC (Fase 10C).

### Adicionado
- `ObjectRepository.GetStats()` + handler IPC `getStats` (count + sizeMB)
- `library.js` detecta `IS_PHOTINO` em runtime → IPC real OU mock dev
- Adapter mapeia `Object3D` (camelCase do backend) → modelo da UI; `mainFilePath → file + url (file://)`; `thumbnailPath → thumbnailUrl`
- `ModelThumbnail`: aceita `thumbnailUrl` → mostra `<img>` PNG real do `ThumbnailQueue`; senão SVG procedural
- Push event listeners: `thumbnailReady` (re-query), `importProgress/Counts/Complete` (atualiza Toast e refresha lista)

[v0.1.0-alpha.5]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.5

---

## [v0.1.0-alpha.4] — 2026-05-01

Refactor App.jsx — async API, hooks, collections, favoritos (Fase 10B).

### Adicionado
- `src/api/library.js` (novo): interface async (`listModels`, `listCategories`, `listTags`, `stats`, `importFiles`) — mock async hoje, IPC real amanhã, sem tocar nos componentes
- `App.jsx` refatorado com `useLocalStorage` (filters/tweaks/view persistem) + `useCollections` (favoritos + collections)
- `WindowChrome` com stats reais (count + sizeMB)
- Toast com stages reais do import (`hash → metadata → thumbnail → index`)
- `Sidebar.jsx`: seção Coleções com Favoritos built-in, criar inline (Enter), excluir via X
- `Library.jsx`: FavStar em cada card, virtualização automática (>60 itens) via `useVirtualGrid`

[v0.1.0-alpha.4]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.4

---

## [v0.1.0-alpha.3] — 2026-05-01

Viewer 3D real (STL/OBJ/GLB) + hooks + Reset no Tweaks (Fase 10A).

### Adicionado
- `src/hooks/`: `useLocalStorage`, `useCollections`, `useVirtualGrid`
- `src/three/loaders.js`: `STLLoader`/`OBJLoader`/`GLTFLoader` com auto-fit
- `src/three/procedural.js`: fallback de geometrias quando `model.url` ausente
- `Detail.jsx`: ThreeViewer carrega URL real; badge "carregando malha…" durante load assíncrono
- `TweaksPanel`: botão **Resetar** + nova opção "Visualização padrão" (galeria/lista)

[v0.1.0-alpha.3]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.3

---

## [v0.1.0-alpha.2] — 2026-05-01

### Corrigido
- **Tela em branco no Release**: `vite.config.js` ganhou `base: './'` para gerar paths relativos. Sem isso, WebView2 tentava resolver `/assets/index-xxx.js` para `file:///C:/assets/...`.
- **Ícone alinhado ao Logo.jsx**: `generate-icon.ps1` reescrito para reproduzir o cubo isométrico em 3 facetas (em vez do círculo simples anterior).
- Cores `#fff` hardcoded em `App.jsx`/`Thumbnails.jsx` substituídas por `#E6E8EC`.

[v0.1.0-alpha.2]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.2

---

## [v0.1.0-alpha.1] — 2026-05-01

Primeira versão pública.

### Adicionado

- **Importação de modelos**: `.stl` (ASCII e binário), `.obj`, `.3mf`, com detecção de duplicatas por hash SHA-256
- **Importação de pastas** com criação automática de categorias e importação de anexos
- **Thumbnails assíncronos** via `ThumbnailQueue` (Channel-based, não bloqueia a UI)
- **Busca full-text** (FTS5) por nome, descrição, arquivo e tags
- **Tags** com cor personalizável
- **Categorias** hierárquicas
- **Anexos** por modelo
- **Sistema de updates opt-in** via GitHub Releases API
- **StatusBar** com contagem de modelos e versão clicável → modal About
- **Modal About** com versão, data de build, commit SHA e link do repositório
- **Hardening de segurança**: path traversal em `.3mf`, zip bomb 50 MB, triangle count validado
- **Migrations de schema** (MigrationRunner): `001_initial`, `002_fts_tags`
- **Suite de testes xUnit**: 46 testes

### Stack
- .NET 8 LTS + Photino.NET 2.5.2
- Vite + React 18
- SQLite + Dapper + FTS5
- SixLabors.ImageSharp 3.x

### Notas
- Requer Windows 10+ com WebView2 (incluso no Windows 11)
- App 100% local — zero telemetria, zero cloud, zero conta

[v0.1.0-alpha.1]: https://github.com/LumiaLabsBR/Lumia3D-Core/releases/tag/v0.1.0-alpha.1

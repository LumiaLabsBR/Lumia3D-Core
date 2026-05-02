# CLAUDE.md

Guia de convenções e comandos para futuras sessões trabalhando no Lumia3D Core.

## Visão geral

Lumia3D Core é uma **biblioteca local de modelos 3D** (`.stl`, `.obj`, `.3mf`) — 100 % offline, sem telemetria, sem cloud. Frontend React + Vite dentro de uma janela Photino.NET (WebView2 no Windows). Backend C# / .NET 8 com SQLite + FTS5.

## Stack

| Camada | Tecnologia |
|---|---|
| Shell desktop | Photino.NET 2.5.2 (WebView2 no Windows) |
| Backend | .NET 8 LTS, C# 13 |
| Banco | SQLite + FTS5 + Dapper |
| Frontend | React 18, Vite 5 |
| 3D viewer | three.js 0.160 (STL/OBJ/GLB loaders) |
| Imagens | SixLabors.ImageSharp 3.1 |
| Testes | xUnit + FluentAssertions |
| Installer | Inno Setup 6 |
| CI | GitHub Actions |

## Layout do repositório

```
src/
  Lumia3DCore/           # backend C# (Photino + IPC + SQLite)
    Data/                # ObjectRepository, MigrationRunner, migrations *.sql
    Ipc/                 # IpcBridge: roteia ações JSON do React → handlers
    Models/              # Object3D, Tag, Category, Attachment
    Services/            # LibraryManager, ThumbnailQueue, MetadataExtractor,
                         # ThumbnailGenerator, UpdateChecker, AppLogger,
                         # UserSettings, VersionInfo
    Assets/              # icon.ico
    Program.cs           # entry point: Photino window + wire-up dos serviços

  Lumia3DCore.Web/       # frontend Vite + React
    src/
      api/
        client.js        # IPC bridge: postMessage ↔ Photino
        library.js       # interface async (listModels, stats, etc.) com
                         # adapter Photino-ou-mock-em-dev
      components/        # Sidebar, Library, Detail, TweaksPanel, AboutModal,
                         # UpdateModal, StatusBar, LoadingSplash, …
      hooks/             # useLocalStorage, useCollections, useVirtualGrid
      three/             # loaders.js (STL/OBJ/GLB), procedural.js (fallback)
      App.jsx            # state central + push event listeners + atalhos
      data.js            # mock LUMIA_DATA usado em dev sem Photino

  Lumia3DCore.Tests/     # 55+ testes xUnit do backend

installer/Lumia3DCore.iss  # script Inno Setup
tools/generate-icon.ps1     # gera Assets/icon.ico (4 sizes)
.github/workflows/release.yml  # CI: build + test + publish + Inno + GitHub Release
```

## Comandos comuns

### Backend
```bash
dotnet build src/Lumia3DCore/Lumia3DCore.csproj -c Release -warnaserror
dotnet test  src/Lumia3DCore.Tests/Lumia3DCore.Tests.csproj -c Release
dotnet publish src/Lumia3DCore/Lumia3DCore.csproj -c Release -r win-x64 \
  --self-contained -p:PublishSingleFile=true -o publish/Lumia3DCore-win-x64
```

### Frontend
```bash
cd src/Lumia3DCore.Web
npm install
npm run dev     # Vite dev server :5173 (Photino aponta pra cá em Debug)
npm run build   # gera src/Lumia3DCore/wwwroot/ (copiado pro publish)
```

### Ferramentas
```bash
powershell -ExecutionPolicy Bypass -File tools\generate-icon.ps1
```

### Release
Tag em `v*` dispara o workflow:
```bash
git tag -a v0.X.Y -m "message"
git push origin main && git push origin v0.X.Y
```

## Convenções

### Idioma
- **Strings da UI: PT-BR** (sempre).
- **Comentários e docstrings: PT-BR**, exceto identificadores técnicos.
- **Mensagens de commit: PT-BR**, formato `tipo: descrição`.
- Nomes de classes/métodos C# em inglês (convenção do .NET).

### Backend (C#)
- C# moderno: nullable reference types, pattern matching, records, expression-bodied members.
- `using` em `IDisposable` sempre.
- `async`/`await` corretos: nada de `.Result`/`.Wait()`. Cancelar via `CancellationToken`.
- Conexão SQLite: connection string já tem `Foreign Keys=True` — nunca cria conexão sem isso.
- Erros não-fatais: `AppLogger.Warn`/`Error`, nunca `catch {}` silencioso.

### Frontend (React)
- Funcionais + hooks. Nada de classes.
- Estilos inline via `style={...}` (sem CSS framework, paleta documentada abaixo).
- Estado global mínimo: `useState` no `App.jsx`, persistência via `useLocalStorage`.
- `library.js` é a única source-of-truth de dados — componentes nunca importam `LUMIA_DATA` direto.
- Modais grandes via `React.lazy` + `Suspense` (já configurado).

### Paleta
- Background: `#0a0b0e` (root), `#0f1115` (chrome), `#16181c` (sidebar/painéis), `#1a1c20` (cards/modal).
- Texto: `#E6E8EC` (primary), `#9097A0` (secondary), `#7A8290`/`#5A626C`/`#3A4048` (muted).
- Accent laranja: `#FF7A1A` / `#FFA85F` (gradientes `#FF8A2E → #E66A0F`).
- Borders: `rgba(255,255,255,0.04 a 0.08)`.
- Verde indicador: `#5BD68D`. Vermelho close: `#E81123`. Amarelo aviso: `#F5C04A`.

### Fonts
- `"Space Grotesk"` — marca/Lumia3DLogo.
- `"Inter"` — UI geral (default no body).
- `"JetBrains Mono"` — versões, IDs, dados técnicos, contadores.

### IPC
- **Request**: `{ action: string, payload?: object }`.
- **Response**: `{ success: bool, data?: any, error?: string }`.
- **Push event** (C# → frontend, sem request correspondente): `{ event: string, ...campos }`.
- Cada novo handler IPC requer:
  1. case no switch de `IpcBridge.Handle`
  2. método `private IpcResponse Handle...(IpcRequest req)`
  3. método em `client.js` (`api.foo`)
  4. opcionalmente, mapeamento em `library.js` se for dado de biblioteca

### Migrations SQL
- Arquivos em `src/Lumia3DCore/Data/Migrations/NNN_descricao.sql`.
- Statements separados por `-- split` (linha sozinha).
- `MigrationRunner` aplica em ordem, registra em `SchemaVersion`.
- Nunca alterar uma migration já aplicada — sempre uma nova.

### Testes
- xUnit + FluentAssertions.
- Use `TempLibrary` (em `Helpers/`) que cria env isolado por teste com migrations aplicadas.
- Use `TestFiles` para STL/OBJ/3MF mínimos válidos.
- Cobertura prioritária: ObjectRepository, LibraryManager, MetadataExtractor, ThumbnailGenerator.

## Decisões já tomadas (não revisitar sem motivo)

- **SQLite + FTS5** com `content='Object3D'` e coluna `FtsTags` (cache de tags por objeto). Evita o limite de `contentless_delete=1` em SQLite < 3.43.
- **Photino + React** ao invés de Avalonia/MVVM (decisão de Fase 0). Mantém o stack web no frontend e C# robusto no backend.
- **Self-contained publish** + Inno Setup. Sem dependência de .NET pré-instalado.
- **Updates opt-in via GitHub Releases**. Verificação manual ou auto-check de 24h. Único network call do app.
- **Foreign Keys=True** no connection string — não confiar no default do SQLite.

## Itens explicitamente fora de escopo (até v1.0)

- ❌ Cloud sync próprio
- ❌ Telemetria / analytics
- ❌ Conta de usuário / login
- ❌ Auto-update silencioso (sempre exigir confirmação do usuário)
- ❌ Integração Printables/Thingiverse (requer network)

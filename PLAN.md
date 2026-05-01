# Lumia3D Core — Plano consolidado

**Data:** 2026-05-01
**Versão alvo do MVP:** v1.0.0
**Base:** fork de [jalf/stlhub](https://github.com/jalf/stlhub) (auditado e aprovado em 2026-05-01)
**Stack:** C# 13 / .NET 10, Avalonia UI 12, SQLite + FTS5, Dapper, CommunityToolkit.Mvvm, SixLabors.ImageSharp
**Distribuição:** desktop self-contained (Win/Linux/macOS), Inno Setup no Windows

---

## Princípios de produto

1. **100% local por padrão.** Nenhum dado do usuário sai da máquina. Nenhuma telemetria. Sem analytics. Sem cloud sync no MVP.
2. **Updates são opt-in e transparentes.** A única chamada de rede da app é a verificação de versão no GitHub Releases — disparada SOMENTE por clique explícito do usuário ou checagem agendada que ele habilitou conscientemente. Default: **desligado**.
3. **Versão sempre visível** na UI (status bar / About).
4. **Reaproveitar tudo que está bom no stlhub** — não reescrever por capricho.
5. **Migrations desde o dia 1** — antes de QUALQUER alteração no schema do banco.

---

## Decisões arquiteturais (precisam de confirmação antes de codar)

| # | Decisão | Recomendação | Status |
|---|---|---|---|
| D1 | Manter Avalonia + .NET 10 ou trocar stack | **Manter** — base sólida, cross-platform, code reuse máximo | ⏳ |
| D2 | Bifurcar `src/STLHub/` em `src/Lumia3DCore/` ou renomear in-place | **Renomear in-place** — projeto novo, sem necessidade de coexistência | ⏳ |
| D3 | Mecanismo de update | **Manual opt-in via GitHub Releases API** (detalhado em §6) | ⏳ |
| D4 | Assinatura digital do instalador Windows | Adiar para pós-MVP (caro, exige certificado EV) | ⏳ |
| D5 | Schema de versionamento | **SemVer** (MAJOR.MINOR.PATCH) | ⏳ |
| D6 | Nome do banco / pasta AppData | `%APPDATA%/Lumia3DCore/library.db` | ⏳ |

---

## Fases do projeto

### FASE 0 — Fork & Rebrand (1–2 dias)

Objetivo: ter o stlhub rodando como "Lumia3D Core" sem mudar comportamento.

- [ ] Copiar `stlhub-reference/` para nova pasta `app/` na raiz do projeto
- [ ] Renomear solução: `STLHub.slnx` → `Lumia3DCore.slnx`
- [ ] Renomear projeto: `STLHub.csproj` → `Lumia3DCore.csproj`
- [ ] Renomear namespace `STLHub` → `Lumia3DCore` em todos os `.cs` e `.axaml`
- [ ] Renomear pasta de settings: `%APPDATA%/STLHub` → `%APPDATA%/Lumia3DCore` (em [UserSettings.cs:38](stlhub-reference/src/STLHub/Services/UserSettings.cs#L38))
- [ ] Trocar título da janela, ícone e splash (`Assets/avalonia-logo.ico` → ícone Lumia3D)
- [ ] Atualizar `installer/STLHub.iss`:
  - Novo `AppId` GUID (gerar novo)
  - `AppName = Lumia3D Core`
  - `OutputFile = Lumia3DCore-Setup-{#AppVersion}.exe`
  - Diretório de instalação `{autopf}\Lumia3D Core`
- [ ] Atualizar `AboutDialog` com nome, versão, link do novo repo
- [ ] Reescrever `README.md`, `docs/PRD.md`, `docs/USAGE.md` em PT-BR e com a marca Lumia3D
- [ ] Substituir `CLAUDE.md` da app pelo nosso (estilo, padrões)
- [ ] Smoke test: `dotnet run` abre, importa um STL, gera thumbnail, busca, fecha

**Critério de pronto:** app inicia, importa, busca, exibe — só com nome trocado.

---

### FASE 1 — Versionamento & visibilidade (0.5 dia)

- [ ] Definir versão única em `Lumia3DCore.csproj`:
  ```xml
  <Version>1.0.0</Version>
  <AssemblyVersion>1.0.0.0</AssemblyVersion>
  <FileVersion>1.0.0.0</FileVersion>
  <InformationalVersion>1.0.0</InformationalVersion>
  ```
- [ ] Inno Setup lê a versão via `#define AppVersion GetVersionNumbersString("..\publish\Lumia3DCore-win-x64\Lumia3DCore.exe")` (eliminar duplicação)
- [ ] Adicionar **status bar** na MainWindow exibindo `v{version}` no canto inferior direito
- [ ] AboutDialog mostra: versão, data de build, commit SHA (opcional via `SourceRevisionId`)
- [ ] Helper `VersionInfo` estático: `Current` (SemVer), `BuildDate`, `Commit`

**Critério de pronto:** abrir a app mostra `v1.0.0` na status bar e no About.

---

### FASE 2 — Migrations de schema (1 dia) ⚠️ BLOQUEANTE

Sem isso, qualquer mudança futura no banco é arriscada.

- [ ] Criar tabela `SchemaVersion (Id INTEGER PRIMARY KEY, Version INTEGER NOT NULL, AppliedAt DATETIME DEFAULT CURRENT_TIMESTAMP)`
- [ ] Criar pasta `Data/Migrations/` com convenção `001_initial.sql`, `002_xxx.sql`, etc.
- [ ] `Migration001_Initial.sql` = todo o schema atual do `DatabaseInitializer` (extraído as-is)
- [ ] Reescrever `DatabaseInitializer.Initialize()`:
  - Lê versão atual de `SchemaVersion`
  - Aplica em ordem todas as migrations não aplicadas, dentro de transação
  - Registra cada uma após sucesso
- [ ] Para banco existente sem `SchemaVersion`: detectar tabelas atuais, marcar como versão 1, prosseguir
- [ ] Logar todas as migrations aplicadas

**Critério de pronto:** deletar `library.db`, app recria do zero via migrations; rodar 2x não duplica.

---

### FASE 3 — Hardening de segurança (1 dia)

Findings da auditoria de 2026-05-01.

- [ ] **Path traversal em `.3mf`** — validar `ZipArchiveEntry.FullName` rejeitando `..` e paths absolutos antes de processar ([ThumbnailGenerator.cs:68-125](stlhub-reference/src/STLHub/Services/ThumbnailGenerator.cs#L68-L125))
- [ ] **Zip bomb** — cap de 50 MB no `MemoryStream` durante extração `.3mf` ([ThumbnailGenerator.cs:108-114](stlhub-reference/src/STLHub/Services/ThumbnailGenerator.cs#L108-L114))
- [ ] **Triangle count overflow** — em STL binário, validar `count` contra tamanho do arquivo: `if (count > 5_000_000 || (long)count * 50 > fileLength - 84) return false;` ([ThumbnailGenerator.cs:478-479](stlhub-reference/src/STLHub/Services/ThumbnailGenerator.cs#L478-L479))
- [ ] **Logging real** — substituir catches silenciosos por `ILogger` (Microsoft.Extensions.Logging com sink em arquivo rotativo em `%APPDATA%/Lumia3DCore/logs/`)
- [ ] **Transação no import** — envolver hash → copy → thumb → INSERT em `BEGIN/COMMIT` com cleanup do arquivo copiado em caso de rollback ([LibraryManager.cs:34-50](stlhub-reference/src/STLHub/Services/LibraryManager.cs#L34-L50))

**Critério de pronto:** importar `.3mf` malicioso de teste (criar fixture com `../../evil.png`) não escreve fora do diretório de thumbs.

---

### FASE 4 — Pipeline assíncrono de thumbnails (2 dias)

Bug crítico atual: import bloqueia UI.

- [ ] Criar `ThumbnailQueue` baseado em `Channel<ThumbnailJob>` com worker pool (3–4 threads, configurável)
- [ ] `LibraryManager.ImportFile()` enfileira o job em vez de gerar inline; retorna o objeto sem thumbnail (placeholder transitório)
- [ ] Worker consome a fila, gera thumbnail, atualiza DB, dispara evento `ThumbnailReady(objectId)`
- [ ] ViewModel escuta o evento e atualiza só o item afetado (sem reload da grid inteira)
- [ ] Indicador de progresso global na status bar: "Gerando 23/156 thumbnails…"
- [ ] Persistir fila em disco para retomar após crash (tabela `PendingThumbnail (ObjectId)`)
- [ ] Job falho → registrar em `FailedThumbnail`, mostrar ícone de aviso, permitir retry manual

**Critério de pronto:** drag-and-drop de pasta com 500 STLs — UI continua responsiva, thumbnails aparecem progressivamente.

---

### FASE 5 — Suporte a `.obj` (2–3 dias)

Gap declarado no escopo do produto.

- [ ] Implementar `ObjParser` (vértices `v x y z` + faces `f a b c [d]`)
- [ ] Triangular faces quadrangulares (split em 2 triângulos)
- [ ] Reusar pipeline isométrico do `RenderStlThumbnail` ([ThumbnailGenerator.cs:130-221](stlhub-reference/src/STLHub/Services/ThumbnailGenerator.cs#L130-L221)) — extrair em método comum `RenderTriangleMesh(List<Triangle>)`
- [ ] Adicionar `.obj` ao switch de `GenerateThumbnail` ([ThumbnailGenerator.cs:44](stlhub-reference/src/STLHub/Services/ThumbnailGenerator.cs#L44))
- [ ] Limites de segurança: max vértices, max faces, validação de índices
- [ ] Suportar OBJ ASCII (binário/proprietário fora do escopo)

**Critério de pronto:** importar `.obj` de teste real (Stanford bunny) gera thumbnail visível e correto.

---

### FASE 6 — Melhorias de busca (0.5 dia)

- [ ] Adicionar `MainFilePath` (filename) ao índice FTS5 ([DatabaseInitializer.cs:48-53](stlhub-reference/src/STLHub/Data/DatabaseInitializer.cs#L48-L53))
- [ ] Adicionar nomes de Tags ao índice (denormalizado, atualizado por trigger ou via worker)
- [ ] Migration nova para reconstruir o índice em bancos existentes
- [ ] Remover coluna morta `Category.Path` (também via migration)

**Critério de pronto:** buscar por trecho do filename original retorna resultado.

---

### FASE 7 — Sistema de updates (3 dias)

**Modelo:** opt-in, manual, transparente.

#### Mecânica

1. App expõe menu **Ajuda → Verificar atualizações**.
2. Settings têm opção **"Verificar atualizações automaticamente ao iniciar"** — **DESLIGADA por padrão**.
3. Ao verificar (manual ou auto), faz UMA requisição: `GET https://api.github.com/repos/<owner>/lumia3d-core/releases/latest`.
4. Compara `tag_name` (ex: `v1.0.1`) com `VersionInfo.Current`.
5. Se houver versão maior:
   - Mostra dialog: "Lumia3D Core v1.0.1 disponível. Ver notas e baixar?"
   - Botão **Notas** → abre o release no navegador
   - Botão **Baixar e instalar** → baixa o `Lumia3DCore-Setup-{ver}.exe` para `%TEMP%`, dispara o instalador (`Process.Start`), fecha a app
   - Botão **Mais tarde** → fecha
6. Sem versão maior: dialog "Você está na versão mais recente."

#### Implementação

- [ ] Adicionar `Microsoft.Extensions.Http` (não puxa Avalonia.Web, evitar pacotes maiores)
- [ ] Criar `Services/UpdateChecker`:
  - `Task<UpdateInfo?> CheckAsync(CancellationToken)`
  - User-Agent identificável: `Lumia3DCore/{version}` (educado com a API do GitHub)
  - Timeout 10s
  - Catches retornam `null` (sem update visível) e logam o erro
- [ ] Criar `Views/UpdateDialog.axaml`
- [ ] Settings:
  - `AutoCheckUpdates` (bool, default false)
  - `LastUpdateCheck` (DateTime, para rate-limit de 24h)
- [ ] Verificar **assinatura/hash** do .exe baixado contra valor publicado no release (proteção contra MITM/tampering) — usar campo `body` do release para colocar SHA256 esperado
- [ ] Linux/macOS: por enquanto apenas notificar e abrir página do release (sem auto-install — distribuído como tar.gz)
- [ ] **Documentar claramente no About:** "Esta app só faz uma chamada de rede: a verificação de versão. Você pode desabilitar."

#### Pipeline de release (GitHub Actions)

- [ ] Workflow `release.yml` dispara em tag `v*`
- [ ] Build self-contained Win/Linux/macOS
- [ ] Empacota Inno Setup no Windows
- [ ] Publica artefatos no GitHub Release
- [ ] Gera checksums SHA256 e cola no body do release
- [ ] Build provenance attestation (já presente no upstream — manter)

**Critério de pronto:** publicar `v1.0.1` de teste, app v1.0.0 detecta, baixa, instala, abre como v1.0.1.

---

### FASE 8 — Testes (2 dias, paralelo às outras fases)

Hoje não existe nenhum teste. Não dá para entrar em produção assim.

- [ ] Criar projeto `Lumia3DCore.Tests` (xUnit + FluentAssertions)
- [ ] Cobertura mínima:
  - `ObjectRepository` — CRUD, busca FTS, filtros combinados
  - `LibraryManager` — import, dedup por hash, transação, rollback
  - `ThumbnailGenerator` — STL ASCII/binário, 3MF, OBJ, fixtures malformadas e maliciosas
  - `Migration runner` — apply, idempotência, ordem
  - `UpdateChecker` — mock HTTP, parsing, comparação SemVer
- [ ] CI roda testes em todo PR

**Critério de pronto:** `dotnet test` verde com >60% de cobertura nos services.

---

### FASE 9 — Polimento de release (1 dia)

- [ ] Ícone próprio Lumia3D (.ico multi-resolução, .png para Linux/macOS)
- [ ] Splash / janela inicial branded
- [ ] Tradução PT-BR completa (ResourceDictionary com strings localizadas)
- [ ] EULA / licença visível no instalador
- [ ] Página de release v1.0.0 no GitHub com changelog, screenshots, instruções
- [ ] Smoke test em VM Windows limpa (sem .NET instalado)

---

## Cronograma estimado

| Fase | Esforço | Dependências |
|---|---|---|
| 0 — Fork & rebrand | 1–2 dias | — |
| 1 — Versionamento | 0.5 dia | 0 |
| 2 — Migrations ⚠️ | 1 dia | 0 |
| 3 — Hardening | 1 dia | 0 |
| 4 — Async thumbnails | 2 dias | 2 |
| 5 — `.obj` | 2–3 dias | 4 |
| 6 — Busca | 0.5 dia | 2 |
| 7 — Updates | 3 dias | 1 |
| 8 — Testes | 2 dias | paralelo |
| 9 — Polimento | 1 dia | tudo |
| **Total** | **~14–16 dias úteis** | |

## Ordem sugerida de execução

```
0 → 1 → 2 → (3 ‖ 6) → 4 → 5 → 7 → 9
              testes (8) escrevendo em paralelo desde a fase 2
```

---

## Itens fora do MVP (backlog v1.x+)

- Auto-tagging com IA local (Ollama/llama.cpp)
- Sync entre máquinas (folder-based, ex: pasta no Dropbox/OneDrive — sem servidor próprio)
- Versionamento de modelos (revisões)
- Integração com slicers (abrir direto no Cura/PrusaSlicer/Bambu)
- Plugin system
- Export de coleções para outras ferramentas

## Itens explicitamente REJEITADOS no MVP

- ❌ Cloud sync próprio
- ❌ Telemetria / analytics
- ❌ Conta de usuário / login
- ❌ Auto-update silencioso (sempre exigir confirmação)
- ❌ Integração Printables/Thingiverse (network)
- ❌ Qualquer chamada de rede além da verificação opt-in de updates

---

## Riscos abertos

| Risco | Mitigação |
|---|---|
| Renderer próprio de STL/OBJ pode ter casos quebrados em meshes complexos | Try-catch + placeholder; backlog para trocar por OpenGL/Vulkan se incomodar |
| Auto-update no Windows pode pedir UAC dependendo da pasta | Instalador roda em `{autopf}` sem privilege elevation; testar |
| GitHub API rate limit (60/h sem auth) | Cache de 24h em `LastUpdateCheck`; suficiente para uso pessoal |
| Banco SQLite corrompido por crash durante import | Transação na fase 3 + WAL mode + backup em `library.db.backup` antes de migrations |
| Assinatura do .exe (Windows SmartScreen vai reclamar) | Aceitar friction inicial; certificado EV é decisão de produto futura |

---

## Próximo passo imediato

Após aprovação deste plano:
1. Confirmar decisões D1–D6 acima
2. Criar `app/` e iniciar Fase 0 (rebrand)

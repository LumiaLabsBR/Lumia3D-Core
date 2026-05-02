# Lumia3D Core

**Sua biblioteca 3D, organizada e ao seu alcance.**

Gerenciador local de modelos 3D (.stl, .3mf, .obj) com busca de texto completo, categorias hierárquicas, tags coloridas, thumbnails automáticos e visualizador 3D integrado. 100% offline — nenhum dado sai da sua máquina.

Desenvolvido por **[LumiaLabs](https://github.com/LumiaLabsBR)** · Fork de [jalf/stlhub](https://github.com/jalf/stlhub) (MIT)

---

## Instalação

Baixe o instalador `.exe` mais recente em **[Releases](https://github.com/LumiaLabsBR/Lumia3D-Core/releases)** → execute → siga o wizard. Sem necessidade de admin.

Requer Windows 10+ com [WebView2](https://go.microsoft.com/fwlink/p/?LinkId=2124703) (já incluso no Windows 11).

## Funcionalidades

### Biblioteca
- **Importação** drag-and-drop ou via menu Arquivo (`Ctrl+O` arquivos, `Ctrl+Shift+O` pasta)
- **Detecção de duplicatas** automática via SHA-256
- **Thumbnails** assíncronos (Channel-based, não bloqueia UI):
  - STL: renderização isométrica com shading Lambertiano
  - OBJ: mesmo pipeline + suporte a quads e índices negativos
  - 3MF: extrai preview embutido no ZIP
- **Categorias hierárquicas** criadas automaticamente ao importar pastas
- **Tags** com cor personalizável e contador de uso
- **Coleções** (estilo playlists) + Favoritos, persistidos localmente
- **Busca FTS5** por nome, descrição, arquivo e tags (prefixo automático)

### Visualização
- **Viewer 3D** interativo com three.js (STL/OBJ/GLB reais ou fallback procedural)
- Toggle de auto-rotação, grid e iluminação
- Mode galeria virtualizada (>60 itens) e modo lista
- Tema dark, light e alto contraste

### Modelos
- **Editar nome** inline
- **Adicionar/remover tags** via popover
- **Excluir** com confirmação (apaga arquivo do disco)

### Distribuição
- **Updates opt-in** via GitHub Releases — verificação manual ou auto-check de 24h (desligada por default)
- Validação **SHA-256** do instalador antes de executar
- Instalação automatizada no diretório do usuário

## Atalhos

| Atalho | Ação |
|---|---|
| `Ctrl+O` | Importar arquivos |
| `Ctrl+Shift+O` | Importar pasta |
| `/` | Focar busca |
| `Esc` | Fechar modal/painel |

## Tecnologia

| Camada | Tecnologia |
|--------|------------|
| Shell  | [Photino.NET](https://www.tryphotino.io/) 2.5 + WebView2 |
| Backend | .NET 8 LTS (C# 13) · Dapper · SQLite + FTS5 |
| Frontend | Vite 5 + React 18 + Three.js 0.160 |
| Thumbnails | SixLabors.ImageSharp 3.1 |
| Testes | xUnit + FluentAssertions |
| Installer | Inno Setup 6 |

## Privacidade

100 % local. Único acesso de rede é a verificação opcional de updates no GitHub Releases (opt-in via Tweaks → Atualizações). Nenhuma telemetria, analytics ou cloud sync.

## Desenvolvimento

### Pré-requisitos

- .NET 8 SDK
- Node.js 20+
- Windows 10+ (Photino requer WebView2)

### Rodar em modo dev

```bash
# Terminal 1 — frontend (Vite dev server)
cd src/Lumia3DCore.Web
npm install
npm run dev

# Terminal 2 — backend (em Debug, aponta pro http://localhost:5173)
cd src/Lumia3DCore
dotnet run
```

### Build de produção (self-contained)

```bash
cd src/Lumia3DCore.Web && npm run build
cd ..
dotnet publish src/Lumia3DCore/Lumia3DCore.csproj -c Release -r win-x64 \
  --self-contained -p:PublishSingleFile=true \
  -o publish/Lumia3DCore-win-x64
```

### Rodar testes

```bash
dotnet test src/Lumia3DCore.Tests/Lumia3DCore.Tests.csproj -c Release
```

### Gerar instalador

Requer [Inno Setup 6](https://jrsoftware.org/isinfo.php):

```bash
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" /DAppVersion=0.1.0 \
  installer\Lumia3DCore.iss
```

Output: `installer-output/Lumia3DCore-Setup-0.1.0.exe`.

Convenções, paleta, padrões de IPC e arquitetura: ver [`CLAUDE.md`](CLAUDE.md).

## Licença

MIT — veja [LICENSE](LICENSE).  
Baseado em [stlhub](https://github.com/jalf/stlhub) por [@jalf](https://github.com/jalf), MIT License.

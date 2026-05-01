# Lumia3D Core

**Sua biblioteca 3D, organizada e ao seu alcance.**

Gerenciador local de modelos 3D (.stl, .3mf, .obj) com busca de texto completo, categorias hierárquicas, tags coloridas, thumbnails automáticos e visualizador 3D integrado. 100% offline — nenhum dado sai da sua máquina.

Desenvolvido por **[LumiaLabs](https://github.com/LumiaLabsBR)** · Fork de [jalf/stlhub](https://github.com/jalf/stlhub) (MIT)

---

## Funcionalidades

- Importação por drag-and-drop de arquivos e pastas
- Detecção de duplicatas via SHA-256
- Thumbnails automáticos (.stl renderização isométrica, .3mf extrai preview embutido)
- Busca full-text (FTS5) por nome, descrição e nome do arquivo
- Categorias hierárquicas com criação automática por pastas
- Tags com cores personalizáveis
- Anexos por modelo (PDF, G-code, imagens, etc.)
- Viewer 3D interativo (Three.js)
- Verificação de atualizações opt-in (desligada por padrão)

## Tecnologia

| Camada | Tecnologia |
|--------|------------|
| Shell  | [Photino.NET](https://www.tryphotino.io/) + WebView2 |
| Backend | .NET 8 LTS (C#) · Dapper · SQLite FTS5 |
| Frontend | Vite + React 18 + Three.js |
| Thumbnails | SixLabors.ImageSharp |

## Desenvolvimento

### Pré-requisitos

- .NET 8 SDK
- Node.js 20+

### Rodar em modo dev

```bash
# Terminal 1 — frontend
cd src/Lumia3DCore.Web
npm install
npm run dev

# Terminal 2 — backend (carrega http://localhost:5173 automaticamente em Debug)
cd src/Lumia3DCore
dotnet run
```

### Build de produção

```bash
cd src/Lumia3DCore.Web
npm run build          # output → src/Lumia3DCore/wwwroot/

cd ../Lumia3DCore
dotnet publish -c Release
```

## Licença

MIT — veja [LICENSE](LICENSE).  
Baseado em [stlhub](https://github.com/jalf/stlhub) por [@jalf](https://github.com/jalf), MIT License.

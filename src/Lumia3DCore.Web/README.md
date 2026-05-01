# Lumia3D Core

Biblioteca local de modelos 3D — frontend React + Vite.

## Stack

- **React 18** com Hooks
- **Vite 5** (build/dev server)
- **Three.js 0.160** (viewer 3D no modal de detalhe)
- ES Modules — sem Babel runtime, sem CDNs

## Pré-requisitos

- Node.js **18+** (recomendado 20 LTS)
- npm 9+

## Como rodar

```bash
cd vite-app
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build      # gera dist/
npm run preview    # serve dist/ localmente para testar
```

## Estrutura

```
vite-app/
├── index.html              # entry HTML (Google Fonts + #root)
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx            # bootstrap React → #root
    ├── App.jsx             # estado global, layout, drag-drop
    ├── styles.css          # reset + estilos globais
    ├── data.js             # mock data (modelos, categorias, tags)
    └── components/
        ├── Logo.jsx        # Lumia3DLogo + LumiaLabsSignature
        ├── Icons.jsx       # Icon, FormatBadge, Tag
        ├── Thumbnails.jsx  # ModelThumbnail (SVG clay-render)
        ├── Sidebar.jsx     # árvore de categorias + tags
        ├── Header.jsx      # busca FTS, view toggle, sort
        ├── Library.jsx     # grid (galeria) + lista
        ├── Detail.jsx      # modal + ThreeViewer (Three.js real)
        └── TweaksPanel.jsx # tema + densidade
```

## Funcionalidades

- Busca textual em nome, arquivo e etiquetas
- Filtros combinados (categoria + múltiplas etiquetas + query)
- Ordenação cíclica (data / nome / tamanho)
- Galeria ↔ Lista
- Drag-and-drop de arquivos com toast de progresso simulado
- Modal de detalhe com viewer 3D real (rotação automática + drag para girar)
- Detecção de duplicados por hash (badge no card + alerta no modal)
- Tweaks (tema + densidade)

## Próximos passos sugeridos

- Substituir `src/data.js` por chamadas a uma API/SQLite local (FTS5)
- Trocar `ModelThumbnail` (SVG) por renders reais salvos em disco
- Implementar carregadores `.stl` / `.obj` / `.glb` no `ThreeViewer` via `three/examples/jsm/loaders/*`
- Persistir `tweaks` em `localStorage`

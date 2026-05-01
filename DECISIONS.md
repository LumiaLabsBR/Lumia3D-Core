# Lumia3D Core — Discovery & decisões para execução autônoma

**Objetivo deste documento:** fechar TODAS as decisões que eu (Claude) preciso pra construir o Lumia3D Core sem te interromper no meio do caminho. Para cada item há minha recomendação default — você responde só com **OK** (aceita o default), uma alternativa, ou peça pra adiar. Onde eu marquei 🚨 a decisão é crítica e não tem default seguro.

**Como responder:** copia este arquivo, marca cada item, devolve. Ou responde inline no chat referenciando o número.

---

## 1. Branding & identidade visual

### 1.1 Nome de exibição do produto
- Default: **Lumia3D Core**
- Tagline curta para AboutDialog / instalador: **"Sua biblioteca 3D, organizada e ao seu alcance."**
- ☐ OK / Outra: ____

### 1.2 Atribuição da desenvolvedora
- Onde a marca **LumiaLabs** aparece: AboutDialog ("Feito por LumiaLabs"), instalador ("Publisher: LumiaLabs"), splash screen, footer.
- Logo SVG da LumiaLabs vira PNG embutido (a SVG usa Google Fonts via CDN — incompatível com 100% local; vou rasterizar para PNG em 3 tamanhos).
- ☐ OK / Outra: ____

### 1.3 Cores oficiais do produto (extraídas do seu design React)
- **Acento primário:** `#FF7A1A` (laranja Lumia)
- **Acento secundário:** `#FFA85F` (laranja claro, usado em hovers/glows)
- **Background dark:** `#0a0b0e` → `#1a1c20` (escala em 5 tons)
- **Background light:** `#F4F5F7` → `#FFFFFF`
- **Texto:** `#E6E8EC` (dark) / `#1a1c20` (light)
- **Erro/destrutivo:** `#E81123` (já no design, botão close)
- **Tags com cores próprias** (do data.js): azul `#7AC7FF`, roxo `#9F7CFF`, verde `#5BD68D`, amarelo `#F5C04A`, rosa `#FF6585`
- ☐ OK paleta / Adicionar cor: ____

### 1.4 Tipografia
- **Inter** — UI (corpo, botões, labels)
- **Space Grotesk** — display (títulos grandes, headers)
- **JetBrains Mono** — números, hashes, código, paths
- **Embutidas no app** (~3.5 MB) — zero dependência de internet
- ☐ OK / Trocar alguma: ____

### 1.5 Ícone do produto (.ico / .png)
- Default: o glifo geométrico de cubo isométrico do `WindowChrome` no design ([app.jsx:290-294](frontend-design/app.jsx#L290-L294)) — 3 polígonos formando um cubo
- Vou gerar `.ico` multi-resolução (16, 32, 48, 64, 128, 256) e `.png` para Linux/macOS
- ☐ OK / Você fornece um ícone próprio: ____

### 1.6 Glifo no chrome da janela
- Mesmo glifo do ícone do produto, em monocromático claro
- ☐ OK

### 1.7 Tema padrão
- Default: **escuro** (como no design)
- Usuário pode trocar para claro / contraste alto via Tweaks
- ☐ OK

---

## 2. Repositório & GitHub 🚨

### 2.1 GitHub é o destino do código?
- Default: sim, GitHub público ou privado
- Alternativa: GitLab, Bitbucket, ou repo só local sem remote
- ☐ GitHub / Outro: ____

### 2.2 Owner da conta GitHub 🚨
- **Preciso saber o usuário/org GitHub** para apontar o `UpdateChecker` e o repo de releases.
- Default impossível — preciso do nome.
- → Resposta: ____

### 2.3 Nome do repositório
- Default: **lumia3d-core**
- ☐ OK / Outro: ____

### 2.4 Visibilidade
- Default: **público** (permite distribuir releases via GitHub gratuitamente; releases privados consomem cota Actions)
- ☐ Público / Privado

### 2.5 Licença
- Default: **MIT** (igual ao stlhub original — compatível com fork)
- Alternativas: Apache 2.0, GPL-3.0, proprietária
- Importante: stlhub é MIT, qualquer fork pode escolher MIT, Apache 2.0 ou licença mais permissiva. Se quiser proprietária, ainda preciso manter o aviso de copyright do MIT do stlhub no NOTICE.
- ☐ MIT / Outra: ____

### 2.6 Quem cria o repo no GitHub?
- Opção A: você cria o repo vazio e me passa a URL; eu faço o primeiro push
- Opção B: eu uso `gh repo create` (se o GitHub CLI estiver autenticado na sua máquina)
- Default: **Opção A** (mais seguro)
- ☐ A / B

### 2.7 Eu posso fazer commits e push sem perguntar a cada vez?
- Default: **sim, ao final de cada fase do PLAN.md** (não a cada arquivo). Mensagens de commit em PT-BR no formato Conventional Commits adaptado: `fase 0: rebrand stlhub → lumia3d core`.
- Vou abrir branches por fase: `fase-0-rebrand`, `fase-1-versioning`, etc., e merge pra `main` ao fim.
- Push: ao fim de cada fase, sim. Tag de release: só você ou eu confirmando contigo antes.
- ☐ OK / Outra cadência: ____

---

## 3. Versionamento & releases

### 3.1 Esquema
- **SemVer** (MAJOR.MINOR.PATCH)
- MAJOR = quebra de compatibilidade do banco/API/comportamento
- MINOR = feature nova compatível
- PATCH = bugfix
- ☐ OK

### 3.2 Versão inicial
- Default: **1.0.0** quando todas as fases concluírem
- Pré-releases durante o desenvolvimento: `0.x.0-alpha.N`? Ou só pula direto pro 1.0?
- Recomendo: `0.1.0` ao fim da Fase 0 (rebrand funcional), e bump por fase, fechando 1.0.0 ao fim da Fase 9.
- ☐ OK / Pular pre-releases e ir direto pra 1.0.0

### 3.3 Formato da tag git
- Default: `v1.0.0`
- ☐ OK

### 3.4 CHANGELOG
- Arquivo `CHANGELOG.md` na raiz, formato [Keep a Changelog](https://keepachangelog.com/), em PT-BR
- ☐ OK

### 3.5 Idioma das release notes
- Default: **PT-BR** (público do produto é Brasil)
- ☐ Só PT / PT + EN

---

## 4. Sistema de updates 🚨

### 4.1 Default da verificação automática
- Default: **DESLIGADA** ao instalar. Primeira vez que o usuário abrir Configurações de updates, mostra um banner explicando "ao habilitar, a app fará UMA requisição ao GitHub para verificar versão. Nada mais é enviado."
- ☐ OK / Habilitar por default (com banner de aviso na 1ª execução)

### 4.2 Pre-releases
- Verificar pre-releases?
- Default: **não** — só versões estáveis. Há checkbox "Incluir pre-releases" para early adopters.
- ☐ OK

### 4.3 Comportamento ao detectar update
- Mostra dialog **dentro da app** com: nova versão, data, changelog (puxado do `body` do release no GitHub), botões [Notas] [Baixar e instalar] [Mais tarde].
- "Baixar e instalar" baixa o `.exe` para `%TEMP%`, valida SHA256 contra o publicado, executa o instalador, fecha a app.
- ☐ OK

### 4.4 Rate limit
- Não verificar mais que 1× por dia (cache `LastUpdateCheck` em settings).
- ☐ OK

### 4.5 Linux/macOS
- Sem auto-install — só notifica e abre a página do release no navegador para baixar manualmente.
- ☐ OK

---

## 5. Banco de dados & dados do usuário

### 5.1 Local do banco
- Default: `%APPDATA%/Lumia3DCore/library.db`
- ☐ OK

### 5.2 Múltiplas bibliotecas
- O stlhub original permite ter mais de uma biblioteca (cada uma com seu `.db` e pasta). Manter?
- Default: **manter** — útil para separar projetos pessoais/cliente. Última biblioteca aberta é restaurada.
- ☐ Manter / Simplificar pra biblioteca única no MVP

### 5.3 Local dos arquivos importados
- O stlhub **copia** o arquivo .stl/.3mf/.obj para dentro da pasta da biblioteca (`<biblioteca>/files/`). Mais seguro: o arquivo nunca some se você mover o original.
- Alternativa: só referenciar o caminho original (mais leve em disco, mas quebra se mover).
- Default: **copiar** (mantém comportamento atual)
- ☐ Copiar / Referenciar / Híbrido (usuário escolhe ao importar)

### 5.4 Backup automático antes de migrations
- Default: **sim** — copia `library.db` → `library.db.backup-{timestamp}` antes de aplicar migrations. Mantém os 3 backups mais recentes.
- ☐ OK

### 5.5 Comando "exportar biblioteca"
- Default: **fora do MVP** (deixar pra v1.1+). Você consegue copiar a pasta manualmente.
- ☐ OK / Incluir export pra ZIP no MVP

---

## 6. Importação

### 6.1 Formatos aceitos no MVP
- Default: **.stl, .3mf, .obj** (o que você listou)
- O stlhub também aceita .step/.stp. Manter ou remover?
- Recomendo: **manter**, baixo custo, é bônus
- ☐ Manter step/stp / Remover (só os 3 do escopo)

### 6.2 Tamanho máximo aceito por arquivo
- Default: **500 MB** por arquivo 3D (alguns OBJ de scan são gigantes)
- Acima disso, dialog "Arquivo muito grande, importar mesmo assim?" com aviso de performance
- ☐ OK / Outro limite: ____

### 6.3 Anexos — tipos aceitos
- Default: **qualquer tipo** (PDF, imagem, gcode, txt, zip, doc, ...) — usuário decide o que faz sentido para ele.
- Limite por anexo: **100 MB**
- ☐ OK

### 6.4 Import de pasta — auto-categorização
- Cria categorias seguindo a estrutura de pastas (já no stlhub)
- ☐ OK

### 6.5 Comportamento em caso de duplicado (mesmo hash)
- Default: **ignora silenciosamente** o segundo, mostra contagem no relatório final ("23 importados, 4 já existiam"). Mantém comportamento do stlhub.
- ☐ OK

---

## 7. Thumbnails

### 7.1 Resolução
- Default: **512×512** (espaço razoável em disco, qualidade boa em telas Retina)
- Stlhub atual: 256×256 — vou subir para 512.
- ☐ OK / 256 / 1024

### 7.2 Background do thumb
- Default: **transparente** (PNG com alpha) — combina com qualquer tema do app
- ☐ OK / Cor sólida: ____

### 7.3 Comando "regenerar thumbnails"
- Default: incluir botão no menu de cada modelo + comando "regenerar todos" no menu Biblioteca
- ☐ OK

---

## 8. Categorias & tags

### 8.1 Profundidade máxima da árvore de categorias
- Default: **sem limite duro** (mas UI aviza se passar de 6 níveis: "essa hierarquia tá ficando profunda")
- ☐ OK

### 8.2 Drag-and-drop entre categorias
- Já existe no stlhub. Manter.
- ☐ OK

### 8.3 Tags coloridas
- Cores no design React vêm hardcoded. Vou implementar como **opcional** — usuário pode dar cor a qualquer tag (color picker), default é cinza.
- ☐ OK

### 8.4 Limite de tags por modelo
- Default: **sem limite** (UI mostra +N quando passa de 6 visíveis)
- ☐ OK

---

## 9. Busca

### 9.1 Campos indexados (FTS5)
- Default: **Nome, Descrição, Filename original, Nomes das tags**
- ☐ OK

### 9.2 Busca dentro de anexos (PDFs, .txt)
- Default: **fora do MVP**
- ☐ OK

### 9.3 Busca avançada (filtros tipo "size > 100mm")
- Default: **fora do MVP**
- ☐ OK

---

## 10. Viewer 3D interativo (Detail modal) 🚨

### 10.1 Vai ter viewer 3D interativo no detail?
- O design React mostra um viewer 3D (Three.js) ao abrir um modelo. O stlhub atual SÓ tem thumbnail estático.
- Default: **sim, no MVP** — é parte central da experiência prometida pelo design
- ☐ Sim no MVP / Adiar para v1.1 (só thumbnail no detail) / Visualização web no detail (abrir em browser)

### 10.2 Biblioteca para 3D
- Recomendação: **OpenTK** (binding OpenGL para .NET, MIT, maduro, leve, cross-platform)
- Alternativa: Ab3d.PowerToys (comercial, $$), HelixToolkit (WPF only — não roda em Avalonia direto)
- ☐ OpenTK / Outra: ____

### 10.3 Operações suportadas no MVP
- Rotação (mouse drag), Zoom (scroll), Pan (shift+drag)
- Reset view (botão)
- Toggle wireframe / sólido
- ☐ OK

### 10.4 Limites
- Carregar até **2 milhões de polígonos** com fluidez
- Acima disso: mostra warning "modelo muito complexo, viewer pode travar"
- ☐ OK

### 10.5 Recursos avançados (medir, anotar, secção, multi-modelo)
- Default: **fora do MVP**, backlog v1.x
- ☐ OK

---

## 11. Plataformas & runtime

### 11.1 Windows é prioridade?
- Default: **sim, Windows x64 é o alvo principal do MVP**
- ☐ OK

### 11.2 Linux e macOS no MVP?
- Stlhub já compila para Linux/macOS via dotnet publish. Custo extra mínimo: incluir nos releases.
- Default: **incluir builds Linux x64 e macOS arm64 nos releases**, mas Windows é o testado a fundo
- ☐ OK / Só Windows no MVP

### 11.3 Versão mínima do Windows
- Default: **Windows 10 (1809)** — alinha com .NET 10 e Avalonia
- ☐ OK

### 11.4 Self-contained (sem .NET runtime no host)?
- Default: **sim** — mais fácil para o usuário; binário ~80 MB
- ☐ OK

---

## 12. Internacionalização

### 12.1 Idiomas no MVP
- Default: **PT-BR apenas**, mas o código já usa `ResourceDictionary` para facilitar EN no futuro.
- ☐ OK / Já incluir EN no MVP

---

## 13. Configurações & UX

### 13.1 Configurações no painel "Tweaks"
- Do design: tema (dark/light/contrast), view (galeria/lista)
- Adicionar: idioma (se EN entrar), pasta da biblioteca atual, verificar updates auto, número de threads de thumbnail, nível de log
- ☐ OK

### 13.2 Atalhos de teclado
- Default mínimo:
  - `Ctrl+O` abrir biblioteca
  - `Ctrl+I` importar arquivo
  - `Ctrl+Shift+I` importar pasta
  - `Ctrl+F` focar busca
  - `Ctrl+,` configurações
  - `Esc` fechar dialog/detail
  - `Delete` deletar modelo selecionado (com confirm)
  - `F2` renomear modelo
  - `F5` regenerar thumbnail do modelo selecionado
- ☐ OK / Adicionar/remover: ____

### 13.3 Comportamento ao deletar modelo
- Default: **arquivo físico vai pra Lixeira do sistema** (não apaga permanentemente). Stlhub atual apaga de vez — vou trocar por lixeira.
- Anexos do modelo: junto.
- ☐ OK

---

## 14. Logs & privacidade

### 14.1 Telemetria
- Confirmação: **zero telemetria, zero analytics, zero crash reporting automático**. Crash dump local apenas, em `%APPDATA%/Lumia3DCore/logs/`.
- ☐ Confirmado

### 14.2 Logs locais
- Arquivo rotativo (10 MB cada, máx 5 arquivos = 50 MB) em `%APPDATA%/Lumia3DCore/logs/`
- Níveis: Info (default), Debug (configurável)
- Botão "abrir pasta de logs" no About
- ☐ OK

### 14.3 Anonimização em logs
- Não logar paths completos de arquivos importados (só nome) por boas práticas
- ☐ OK / Logar tudo (só usuário lê mesmo)

---

## 15. Performance & limites

### 15.1 Escala alvo
- Default: app deve aguentar bem com **até 50.000 modelos** na biblioteca
- ☐ OK

### 15.2 Workers de thumbnail
- Default: **número de cores físicos do CPU - 1**, mínimo 2, máximo 8
- ☐ OK

### 15.3 Grid principal
- **Virtual scroll** habilitado (renderiza só o visível). Sem paginação.
- ☐ OK

---

## 16. Testes & CI

### 16.1 Cobertura mínima
- Default: **>60% nos services** (LibraryManager, ThumbnailGenerator, ObjectRepository, UpdateChecker, MigrationRunner). UI sem teste automatizado no MVP.
- ☐ OK

### 16.2 Framework
- xUnit + FluentAssertions
- ☐ OK

### 16.3 CI
- GitHub Actions: roda `dotnet test` em todo PR contra `main`
- Build de release: dispara em tag `v*`, gera artefatos pra Win/Linux/macOS
- ☐ OK

---

## 17. Workflow comigo (modo autônomo) 🚨

### 17.1 Preciso te perguntar antes de:
- Criar novos arquivos: ☐ Não (autorizado) / ☐ Sim
- Editar arquivos existentes: ☐ Não / ☐ Sim
- Adicionar dependências NuGet: ☐ Sim, sempre / ☐ Só se >5 MB ou licença não-permissiva
- Rodar `dotnet build` / `dotnet test` / `dotnet restore`: ☐ Não / ☐ Sim
- Rodar `dotnet publish` (build de release pesado): ☐ Sim
- Fazer commits: ☐ Não (autorizado por fase) / ☐ Sim
- Fazer push: ☐ Não (autorizado por fase) / ☐ Sim
- Criar tag de release: ☐ Sim, sempre
- Criar branch: ☐ Não / ☐ Sim
- Abrir PR: ☐ Sim
- Fazer merge na main: ☐ Sim, sempre

**Recomendação:** te interrompo apenas para (a) tag de release, (b) merge final, (c) decisões realmente novas que não estão neste doc.

### 17.2 Cadência de relatório
- Default: **relatório curto ao fim de cada fase** com: o que fiz, o que ficou pendente, próxima fase. Não interrompo durante.
- ☐ OK / Mais frequente / Menos frequente

### 17.3 Se eu travar em uma decisão técnica não coberta aqui
- Default: **paro e te pergunto** (não sigo no escuro nem invento)
- Alternativa: tomo a decisão que parece mais alinhada e deixo TODO/issue
- ☐ Parar e perguntar / Decidir e marcar TODO

### 17.4 Se eu introduzir um bug que não consigo resolver em 3 tentativas
- Default: **paro, reverto a última mudança, te aviso** com diagnóstico do que falhou
- ☐ OK

### 17.5 Salvar progresso na memória (auto memory)
- Default: **sim** — vou salvar decisões deste doc na minha memória de projeto, e atualizar conforme avançamos
- ☐ OK

### 17.6 Posso pausar/retomar?
- Sim, sempre. Cada fase fechada = checkpoint. Você pode pedir "para por aqui" e retomar depois sem perda.

---

## 18. Tratamento de erros do usuário final

### 18.1 App crasha → o que acontece?
- Default: dump em `%APPDATA%/Lumia3DCore/logs/crash-{timestamp}.log` + dialog na próxima abertura: "A app fechou inesperadamente. Abrir log? Reportar?"
- "Reportar" abre o GitHub Issues do repo no navegador, pré-preenchido com versão e trecho do log (cole-e-pole, não envia automático).
- ☐ OK

### 18.2 Banco corrompido
- Default: detecta na inicialização (PRAGMA integrity_check), oferece restaurar do último backup
- ☐ OK

---

## 19. Onboarding (primeira execução)

### 19.1 Wizard de boas-vindas?
- Default: **sim, mínimo** — 3 telas:
  1. "Bem-vindo ao Lumia3D Core" + escolher onde criar a primeira biblioteca (default: `Documentos/Lumia3D Libraries/Minha Biblioteca/`)
  2. "Importar agora?" — drag-drop ou skip
  3. "Pronto" — opção de habilitar verificação de updates
- ☐ OK / Sem wizard, abre direto na biblioteca vazia

### 19.2 Modelos de exemplo
- Default: **incluir 3 modelos de exemplo** (cubo de calibração, parafuso M6, vaso simples) na primeira biblioteca, com botão "remover exemplos" no Tweaks
- ☐ OK / Sem exemplos / Apenas link para baixar

---

## 20. Acessibilidade

### 20.1 Nível alvo
- Default: **WCAG 2.1 AA básico** (contraste, navegação por teclado, focus rings visíveis). Tema "contraste alto" já no design ajuda.
- ☐ OK

### 20.2 Screen reader
- Default: **suporte básico** via Avalonia AutomationProperties (não testado a fundo no MVP)
- ☐ OK

---

## 21. Cortes & priorização

Se durante a execução algo estourar prazo, em qual ordem cortar?

**Minha proposta de ordem de corte (do primeiro a sair):**

1. Modelos de exemplo no onboarding (19.2)
2. Wizard de onboarding completo (19.1)
3. Tradução de strings em ResourceDictionary (12.1)
4. Linux/macOS builds nos releases (11.2)
5. Tema "contraste alto" (1.7)
6. Viewer 3D interativo → vira só thumbnail estático (10.1) ⚠️ corta visual chave
7. Sistema de updates → vira só "verificar manual abre browser" (Fase 7)

**O que NÃO PODE cortar (essencial pro v1.0):**
- Rebrand stlhub → Lumia3D Core
- Versão visível na UI
- Migrations
- Async thumbnails
- `.obj` rendering
- Hardening de segurança
- Hardening de UX (drag-drop laranja, design system aplicado)
- Detecção de duplicados
- FTS5 funcionando

☐ Concordo com essa ordem de corte / Mudar: ____

---

## 22. Itens deixados explicitamente fora (backlog v1.x+)

Para você confirmar que eu NÃO devo entrar nesses no MVP:

- [ ] Auto-tagging por IA local (LLM/Ollama)
- [ ] Sync entre máquinas
- [ ] Versionamento de modelos (revisões)
- [ ] Integração com slicers (Cura, Bambu, Prusa)
- [ ] Plugin system
- [ ] Marketplace / loja
- [ ] Export para Printables / Thingiverse
- [ ] Conta de usuário
- [ ] Cloud anything
- [ ] Conversão entre formatos (.obj → .stl etc)
- [ ] Edição básica de mesh (decimar, suavizar)

☐ Confirmo, todos fora do MVP / Quero algum no MVP: ____

---

## 23. Coisas que VOCÊ vai me entregar

Para destrancar minha execução:

- [ ] **Frontend convertido** (você falou que vai converter o design React → ?). Em qual formato?
  - Avalonia XAML pronto?
  - Especificação visual mais completa?
  - Outra stack?
- [ ] **Owner do GitHub** (item 2.2)
- [ ] **Repo criado** (se opção A no item 2.6)
- [ ] **Decisões deste documento respondidas**

---

## 24. Coisas que EU vou produzir antes da Fase 0

Para confirmar contigo logo no início (antes de começar a codar):

- [ ] Atualizar `PLAN.md` com as fases adaptadas ao seu frontend convertido + viewer 3D
- [ ] Salvar todas as decisões em memória de projeto
- [ ] Esqueleto de pastas finais + nomes de namespace + AppId GUID novo gerado
- [ ] Lista de pacotes NuGet com versões pinadas e licenças confirmadas
- [ ] Checkpoint pra você bater olho: "tá tudo certo? bora?"

---

## Como responder

Você pode:

1. **Responder em batch:** copiar este arquivo, marcar tudo, devolver
2. **Responder em texto:** "1.1 OK, 2.2 lucasalves-dev, 2.5 MIT, 4.1 OK, ..." — só os números/IDs
3. **Marcar só as divergências:** "tudo OK exceto 5.3 (referenciar, não copiar) e 11.2 (só Windows no MVP)"

Quanto mais detalhado agora, mais autônomo eu opero depois.

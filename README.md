# Agências Bancárias de Betim · Site do projeto

Website de página única (single page) do trabalho acadêmico da disciplina de
Power BI: **distribuição geográfica das agências bancárias da cidade de
Betim (MG)**.

Feito apenas com **HTML5, CSS3 e JavaScript puro** — sem frameworks e sem
etapa de build. Pronto para ser publicado na Vercel como site estático.

## Como rodar localmente

Basta abrir o arquivo `index.html` no navegador:

```
C:\Users\marco\Documents\projetos\website-bi\index.html
```

Ou, se preferir, servir a pasta com um servidor local:

```powershell
npx serve .
```

## Como publicar na Vercel

Não é preciso configurar nada em nenhum dos fluxos: a Vercel detecta
automaticamente o site estático (raiz do repositório/pasta, sem build).
Por isso **não há `vercel.json`** — não é necessário para site estático.

### Via GitHub

1. Suba a pasta para um repositório (GitHub/GitLab/Bitbucket).
2. Na Vercel, clique em **Add New Project** e importe o repositório.
3. Aceite as configurações padrão e clique em **Deploy**.

### Via CLI

```powershell
npm i -g vercel
vercel          # primeira vez: vincula o projeto e gera um preview (Enter aceita os padrões)
vercel --prod   # publica a versão de produção
```

## Onde editar

### Links

| O quê | Onde |
|---|---|
| Link do mapa no ArcGIS | `index.html` — busque por `arcgis.com` (aparece em 2 lugares: hero e card) |
| Link do painel Power BI | `js/main.js` — constante `POWERBI_URL` no topo. Enquanto vazia, o site mostra "Em breve". |

### Textos e nomes

Tudo está no `index.html`:

- Texto da seção **Sobre o trabalho** (2 parágrafos)
- Nomes da equipe (cards da seção final) e linha com disciplina, professor(a) e instituição
- Título, meta description e tags Open Graph no `<head>`

### Cores

Toda a paleta está em `css/style.css`, nas variáveis dentro de `:root`
(fundo, cor de destaque `--accent`, textos, glassmorphism). Troque os
valores lá para mudar o visual sem tocar no resto do CSS.

## Efeitos visuais do Hero

O Hero tem três efeitos, todos em HTML/CSS/JS puro (sem bibliotecas):

### Mapa de pontos (canvas)
Pontos brilhantes que representam agências no mapa, ligados por linhas
quando próximos, com movimento lento e parallax sutil seguindo o mouse/toque.

| O quê | Onde |
|---|---|
| Quantidade de pontos | `js/main.js` — constantes `MIN_PONTOS` / `MAX_PONTOS` (no mobile, usa cerca da metade) |
| Cor dos pontos | Segue automaticamente `--accent` em `css/style.css` |
| Intensidade do brilho | `css/style.css` — variável `--dot-glow` |
| Velocidade do movimento | `css/style.css` — variável `--dot-speed` |
| Distância máxima das linhas | `js/main.js` — constante `LIMITE_LINHA` |

### Aurora (manchas de cor)
Três manchas desfocadas (índigo, ciano e verde-água) com movimento lento
via CSS `@keyframes` (20–30s).

| O quê | Onde |
|---|---|
| Cores | `css/style.css` — `--aurora-1`, `--aurora-2`, `--aurora-3` |
| Intensidade | `css/style.css` — `--aurora-opacity` |
| Velocidade/duração | `css/style.css` — `animation: ... 26s/22s/30s` em `.aurora--1/2/3` |

### Spotlight nos cards
Brilho radial suave que acompanha o mouse nos cards (apenas em dispositivos
com hover).

| O quê | Onde |
|---|---|
| Intensidade do brilho | `css/style.css` — `--spotlight-opacity` |

**Acessibilidade e desempenho:** todos os efeitos respeitam
`prefers-reduced-motion: reduce` (aurora fica estática e o canvas desenha
apenas um quadro). A animação do canvas é pausada quando o Hero não está
visível ou a aba está oculta, e usa metade dos pontos no mobile. Se o
canvas não carregar, o Hero exibe o degradê normal, sem quebrar.

### Chuva de moedas e cédulas 3D (Three.js)
Moedas douradas e cédulas estilizadas (verde-água e ciano) caindo
devagar no fundo do Hero, com rotação nos 3 eixos, profundidade variada
(pedas distantes menores e mais escuras) e parallax sutil seguindo o
mouse/toque. O efeito é desenhado em `<canvas id="money-canvas">`, acima
do mapa de pontos e abaixo do overlay de legibilidade.

**Biblioteca:** Three.js **r160** baixado localmente em
`assets/vendor/three.module.js` (origem: jsDelivr,
`three@0.160.0`). A escolha do arquivo local evita depender de CDN em
runtime — o site continua 100% estático e funciona offline. O módulo
`js/money3d.js` o importa com `import * as THREE from
"../assets/vendor/three.module.js"`.

> **Nota:** `js/money3d.js` é um módulo ES (`<script type="module">`),
> e navegadores como o Chrome **não executam módulos via `file://`**
> (política de CORS). Para testar localmente, sirva a pasta com um
> servidor HTTP simples, por exemplo: `npx serve` (ou use o Live Server
> do VS Code). O restante do site (mapa de pontos, aurora, spotlight)
> funciona normalmente até abrindo o `index.html` direto.

| O quê | Onde |
|---|---|
| Quantidade de peças (desktop / mobile) | `js/money3d.js` — `QTD_DESKTOP` / `QTD_MOBILE` |
| Proporção moedas × cédulas | `js/money3d.js` — `PROPORCAO_MOEDAS` |
| Velocidade da queda | `js/money3d.js` — `VELOCIDADE_QUEDA` |
| Velocidade da rotação | `js/money3d.js` — `VELOCIDADE_ROTACAO` |
| Cores (ouro, cédulas, luzes) | `js/money3d.js` — objeto `CORES` |
| Opacidade das peças | `js/money3d.js` — `OPACIDADE` |
| Brilho (emissive das peças) | `js/money3d.js` — `emissiveIntensity` nos materiais |
| Brilho (halo ao redor das peças) | `js/money3d.js` — `HALO_MOEDA` / `HALO_CEDULA` + `opacity` do `materialHalo` |
| Posição do halo (atrás da peça) | `js/money3d.js` — `RAIO_MOEDA` / `RAIO_CEDULA` / `MARGEM_HALO` |
| Iluminação uniforme (ambiente/IBL) | `js/money3d.js` — `texAmbiente` (`scene.environment`) + `envMapIntensity` nos materiais |
| Profundidade mínima/máxima | `js/money3d.js` — `Z_MIN` / `Z_MAX` |
| Intensidade do overlay de legibilidade | `css/style.css` — `.hero__overlay` |

**Desempenho e acessibilidade:** o `pixelRatio` é limitado a 2, a
renderização pausa quando o Hero sai da tela ou a aba fica oculta, e com
`prefers-reduced-motion: reduce` é renderizado apenas um quadro
estático. Se o navegador não suportar WebGL, o efeito é ignorado e o
Hero mantém o fundo atual. Para **desativar** o efeito, basta remover a
linha `<script type="module" src="js/money3d.js"></script>` do
`index.html`.

## Estrutura

```
/
├── index.html                   # Página única
├── css/style.css                # Tema escuro, glassmorphism, responsivo
├── js/main.js                   # Ano no footer, POWERBI_URL, fade-in ao rolar
├── js/money3d.js                # Chuva de moedas/cédulas 3D (Three.js)
├── assets/
│   ├── favicon.svg              # Ícone do site
│   └── vendor/three.module.js   # Three.js r160 (local, sem CDN)
└── README.md
```

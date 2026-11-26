# Agências Bancárias de Betim

Trabalho acadêmico da disciplina de **Business Intelligence** (PUC Betim,
prof. Clóvis Tavares) sobre a **distribuição geográfica das agências
bancárias da cidade de Betim (MG)**, combinando um mapa elaborado no
ArcGIS com um painel de indicadores construído no Power BI.

Site publicado: <https://agencias-website.vercel.app/>

## O que o trabalho apresenta

O site é de página única e acompanha o desenvolvimento do projeto:

- **O problema** — contexto e motivação da análise: identificar regiões
  com maior ou menor concentração de unidades bancárias em Betim.
- **Números do trabalho** — 20 agências, 7 instituições e 4 regiões.
- **Estrutura técnica** — como o trabalho foi construído, do mapa no
  ArcGIS ao painel no Power BI.
- **Prévia interativa do painel** — recriação navegável no navegador da
  página de visão geral do relatório do Power BI, com os mesmos filtros,
  indicadores e gráficos:
  - filtros por instituição, região e tipo de instituição;
  - quatro indicadores: total de agências, ativo médio, reclamações
    médias e distância média até o centro;
  - mapa com as 20 agências (tooltip, zoom, arraste e destaque por
    instituição);
  - barras por instituição, rosca por região e colunas 100% empilhadas
    por região e tipo;
  - interação no estilo Power BI: clicar em uma barra, fatia, coluna ou
    ponto do mapa aplica o "foco" e filtra o restante do painel;
  - tabela de dados recolhível com as mesmas informações do relatório.
- **Análise das instituições** — recriação navegável da segunda página do
  relatório, com os mesmos filtros por instituição, região e tipo:
  - ativo total por instituição (R$ bi), com linha de referência da média;
  - índice de reclamações por instituição;
  - dispersão entre distância média ao centro e índice de reclamações;
  - tabela de dados recolhível com as medidas por instituição.
- **Equipe** — Marcos Pena, Vladimir, Arthur Henry, Rafael Kin e
  Patrick Patricio.

## Links do trabalho

| Recurso | Link |
|---|---|
| Site do trabalho | <https://agencias-website.vercel.app/> |
| Mapa no ArcGIS | [Ver mapa](https://www.arcgis.com/apps/instant/atlas/index.html?appid=6dce4b5af67345db8f74dda30ad1986d&webmap=09a2a8202f6d4326a457160ee86d04bc) |
| Relatório no Power BI | [Abrir relatório](https://app.powerbi.com/links/LiICFG6Hgd?ctid=5e2a8164-87b6-430b-ac6b-08d6229e7059&pbi_source=linkShare) (exige login institucional) |

A prévia interativa é pública e não depende de acesso ao workspace
privado do Power BI.

## Sobre os dados

Os dados são os mesmos do arquivo `.pbix` do relatório: **20 agências,
7 instituições e 4 regiões**. O basemap do mapa é uma imagem local do
Esri World Dark Gray recortada para Betim — não há chamada de mapa em
runtime.

> **Nota:** os indicadores de ativo e reclamações são índices nacionais
> por instituição, não específicos de Betim.

## Tecnologias

- **HTML5, CSS3 e JavaScript puro** — sem frameworks e sem etapa de
  build; site 100% estático.
- **Three.js** (r160, incluído localmente) para o efeito 3D do Hero.

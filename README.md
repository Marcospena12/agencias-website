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
- **Equipe** — Marcos Pena, Vladimir, Arthur Henry, Rafael Kin e
  Patrick Patricio.

## Links do trabalho

| Recurso | Link |
|---|---|
| Site do trabalho | <https://agencias-website.vercel.app/> |
| Mapa no ArcGIS | [Ver mapa](https://www.arcgis.com/apps/instant/atlas/index.html?appid=6dce4b5af67345db8f74dda30ad1986d&webmap=09a2a8202f6d4326a457160ee86d04bc) |
| Relatório no Power BI | [Abrir relatório](https://app.powerbi.com/groups/me/reports/fb79c1c2-ac3f-4af9-aeef-3217d504fb85/ReportSection?experience=power-bi) (exige login institucional) |

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

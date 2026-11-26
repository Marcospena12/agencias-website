(function () {
  "use strict";

  /* =========================================================
     Página 2 — Análise das instituições.

     Usa o MESMO conjunto de dados da prévia da página 1:
     window.BI_DATA (assets/data/agencias.js).
     - ativo e reclamações: medidas nacionais por instituição;
     - distância média: derivada das agências de cada instituição em Betim.
     Para alterar qualquer valor, edite assets/data/agencias.js.
     ========================================================= */
  const data = window.BI_DATA;
  if (
    !data ||
    !Array.isArray(data.instituicoes) ||
    !Array.isArray(data.regioes) ||
    !Array.isArray(data.agencias)
  ) {
    return;
  }

  /* Mesmas paletas e ordem de js/bi.js (página 1). */
  const INST_COLORS = [
    "#4cc2ac",
    "#f2b84b",
    "#5b9cf0",
    "#e4735c",
    "#9c86e0",
    "#4fc3d9",
    "#b5bb5a",
  ];
  const REGION_COLORS = ["#4cc2ac", "#f2b84b", "#5b9cf0", "#e4735c"];
  const TYPE_COLORS = {
    "Público": "#4cc2ac",
    "Privado": "#5b9cf0",
    "Cooperativa": "#f2b84b",
  };
  const TYPE_ORDER = ["Público", "Privado", "Cooperativa"];

  /* Destaque semântico no gráfico de reclamações. */
  const CORES_RECLAMACOES = {
    "Banco do Brasil": "#4cc2ac",
    "Caixa": "#4cc2ac",
    "Mercantil do Brasil": "#e4735c",
  };
  const COR_NEUTRA = "#5b7186";
  const corReclamacao = (nome) => CORES_RECLAMACOES[nome] || COR_NEUTRA;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const byId = (id) => document.getElementById(id);

  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        if (attrs[key] != null) el.setAttribute(key, String(attrs[key]));
      });
    }
    return el;
  };
  const rotuloCurto = (nome) =>
    ({
      "Banco do Brasil": "BB",
      "Mercantil do Brasil": "Mercantil",
      "Sicoob Crediesmeraldas": "Sicoob",
    }[nome] || nome);

  const fmtInt = (value) => (value == null ? "n/d" : nf0.format(value));
  const fmt2 = (value) => {
    if (value == null || Number.isNaN(value)) return "n/d";
    return nf2.format(Math.round((value + 1e-9) * 100) / 100);
  };
  const media = (values) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

  /* ----------------------- dados derivados ----------------------- */
  const instituicoes = data.instituicoes.map((item, index) => {
    const distancias = data.agencias
      .filter((a) => a.instituicaoId === item.id && a.distancia != null)
      .map((a) => a.distancia);
    return {
      ...item,
      cor: INST_COLORS[index % INST_COLORS.length],
      distancia: media(distancias),
    };
  });
  const regioes = data.regioes.map((item, index) => ({
    ...item,
    cor: REGION_COLORS[index % REGION_COLORS.length],
  }));
  const instById = new Map(instituicoes.map((item) => [item.id, item]));
  const regiaoById = new Map(regioes.map((item) => [item.id, item]));
  const agencias = data.agencias
    .map((item) => ({
      ...item,
      instituicao: instById.get(item.instituicaoId),
      regiao: regiaoById.get(item.regiaoId),
    }))
    .filter((item) => item.instituicao && item.regiao);

  const mediaAtivo = media(
    instituicoes.map((item) => item.ativo).filter((value) => value != null)
  );

  const state = {
    filters: {
      instituicao: new Set(),
      regiao: new Set(),
      tipo: new Set(),
    },
    focus: null,
  };

  function passesHardFilters(agency) {
    const filters = state.filters;
    if (
      filters.instituicao.size &&
      !filters.instituicao.has(String(agency.instituicaoId))
    ) {
      return false;
    }
    if (filters.regiao.size && !filters.regiao.has(String(agency.regiaoId))) {
      return false;
    }
    if (filters.tipo.size && !filters.tipo.has(agency.instituicao.tipo)) {
      return false;
    }
    return true;
  }

  function matchesFocus(agency) {
    return Boolean(
      state.focus && String(agency.instituicaoId) === state.focus
    );
  }

  function getAgencias() {
    return agencias.filter(
      (agency) =>
        passesHardFilters(agency) && (!state.focus || matchesFocus(agency))
    );
  }

  /* --------------------------- filtros --------------------------- */
  const facetConfig = [
    {
      facet: "instituicao",
      container: byId("analise-filter-instituicao"),
      items: instituicoes.map((item) => ({
        value: String(item.id),
        label: item.nome,
        count: agencias.filter((a) => a.instituicaoId === item.id).length,
        color: item.cor,
      })),
    },
    {
      facet: "regiao",
      container: byId("analise-filter-regiao"),
      items: regioes.map((item) => ({
        value: String(item.id),
        label: item.apelido || item.nome,
        count: agencias.filter((a) => a.regiaoId === item.id).length,
        color: item.cor,
      })),
    },
    {
      facet: "tipo",
      container: byId("analise-filter-tipo"),
      items: TYPE_ORDER.map((tipo) => ({
        value: tipo,
        label: tipo,
        count: agencias.filter((a) => a.instituicao.tipo === tipo).length,
        color: TYPE_COLORS[tipo],
      })),
    },
  ];

  function buildFilters() {
    facetConfig.forEach(({ container }) => {
      if (container) container.replaceChildren();
    });

    facetConfig.forEach(({ facet, container, items }) => {
      if (!container) return;
      items.forEach((item) => {
        const button = create("button", "bi-option");
        button.type = "button";
        button.dataset.filterFacet = facet;
        button.dataset.filterValue = item.value;
        button.setAttribute("aria-pressed", "false");
        button.title = item.label;

        const box = create("span", "bi-option__box");
        const check = svgEl("svg", {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "3",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": "true",
        });
        check.append(svgEl("path", { d: "m4 12 5 5L20 6" }));
        box.append(check);

        const dot = create("span", "bi-option__dot");
        dot.style.background = item.color;
        const name = create("span", "bi-option__name", item.label);
        const count = create("span", "bi-option__count", fmtInt(item.count));
        button.append(box, dot, name, count);
        container.append(button);
      });
    });
  }

  function renderFilters() {
    facetConfig.forEach(({ facet, container, items }) => {
      if (!container) return;
      container.querySelectorAll(".bi-option").forEach((button) => {
        const active = state.filters[facet].has(button.dataset.filterValue);
        button.setAttribute("aria-pressed", String(active));
      });
      const count = document.querySelector(
        `#analise [data-count-for="${facet}"]`
      );
      if (count) {
        count.textContent = state.filters[facet].size
          ? `${state.filters[facet].size}/${items.length}`
          : String(items.length);
      }
    });
    byId("analise-reset").disabled = !hasActiveSelection();
  }

  /* --------------------------- gráficos -------------------------- */
  function svgRoot() {
    return svgEl("svg", {
      viewBox: "0 0 420 300",
      class: "analise__svg",
      role: "presentation",
      "aria-hidden": "true",
    });
  }

  function comTooltip(node, texto) {
    const title = svgEl("title");
    title.textContent = texto;
    node.appendChild(title);
  }

  function rotuloEixo(texto, attrs) {
    const txt = svgEl("text", attrs);
    txt.textContent = texto;
    return txt;
  }

  function desenharAtivo(visiveis) {
    const alvo = byId("analise-chart-ativo");
    if (!alvo) return;
    alvo.replaceChildren();

    const W = 420, H = 300;
    const margem = { top: 26, right: 12, bottom: 46, left: 56 };
    const areaW = W - margem.left - margem.right;
    const areaH = H - margem.top - margem.bottom;

    const itens = instituicoes
      .filter((item) => visiveis.has(item.id))
      .sort((a, b) => {
        const av = a.ativo == null ? -1 : a.ativo;
        const bv = b.ativo == null ? -1 : b.ativo;
        return bv - av;
      });
    if (!itens.length) return;

    const eixoMax = Math.ceil(Math.max(...itens.map((i) => i.ativo || 0)) / 500) * 500;
    const svg = svgRoot();
    const x = (i) => margem.left + (areaW / itens.length) * i;
    const faixa = areaW / itens.length;
    const larguraBarra = faixa * 0.62;
    const y = (v) => margem.top + areaH - (v / eixoMax) * areaH;
    const yBase = margem.top + areaH;

    for (let p = 0; p <= 5; p++) {
      const v = (eixoMax / 5) * p;
      const yy = y(v);
      svg.append(
        svgEl("line", {
          x1: margem.left, y1: yy, x2: W - margem.right, y2: yy,
          class: "analise__gridline",
        })
      );
      svg.append(
        rotuloEixo(fmtInt(v), {
          x: margem.left - 8, y: yy + 3, "text-anchor": "end", class: "analise__axis",
        })
      );
    }

    itens.forEach((item, i) => {
      const cx = x(i) + faixa / 2;
      [rotuloCurto(item.nome)].forEach((linha, li) => {
        svg.append(
          rotuloEixo(linha, {
            x: cx, y: yBase + 16 + li * 12, "text-anchor": "middle", class: "analise__axis",
          })
        );
      });
    });

    itens.forEach((item, i) => {
      const cx = x(i) + faixa / 2;
      if (item.ativo == null) {
        svg.append(
          rotuloEixo("n/d", {
            x: cx, y: yBase - 8, "text-anchor": "middle", class: "analise__nd",
          })
        );
        return;
      }
      const by = y(item.ativo);
      const barra = svgEl("rect", {
        x: cx - larguraBarra / 2,
        y: by,
        width: larguraBarra,
        height: yBase - by,
        rx: 4,
        class: "analise__bar",
        fill: item.cor,
        "data-focus-value": String(item.id),
      });
      comTooltip(barra, `${item.nome}: ${fmt2(item.ativo)} bi`);
      svg.append(barra);
      svg.append(
        rotuloEixo(fmt2(item.ativo), {
          x: cx, y: by - 6, "text-anchor": "middle", class: "analise__bar-value",
        })
      );
    });

    const yMedia = y(mediaAtivo);
    svg.append(
      svgEl("line", {
        x1: margem.left, y1: yMedia, x2: W - margem.right, y2: yMedia,
        class: "analise__ref",
      })
    );
    svg.append(
      rotuloEixo(`média ${fmt2(mediaAtivo)}`, {
        x: W - margem.right, y: yMedia - 5, "text-anchor": "end",
        class: "analise__ref-label",
      })
    );
    alvo.append(svg);
  }

  function desenharReclamacoes(visiveis) {
    const alvo = byId("analise-chart-reclamacoes");
    if (!alvo) return;
    alvo.replaceChildren();

    const W = 420, H = 300;
    const margem = { top: 12, right: 56, bottom: 24, left: 118 };
    const areaW = W - margem.left - margem.right;
    const areaH = H - margem.top - margem.bottom;

    const itens = instituicoes
      .filter((item) => visiveis.has(item.id))
      .sort((a, b) => {
        const av = a.reclamacoes == null ? Infinity : a.reclamacoes;
        const bv = b.reclamacoes == null ? Infinity : b.reclamacoes;
        return av - bv;
      });
    if (!itens.length) return;

    const eixoMax = Math.ceil(Math.max(...itens.map((i) => i.reclamacoes || 0)) / 40) * 40;
    const svg = svgRoot();
    const faixa = areaH / itens.length;
    const alturaBarra = faixa * 0.58;

    for (let p = 0; p <= 5; p++) {
      const v = (eixoMax / 5) * p;
      const xx = margem.left + (v / eixoMax) * areaW;
      svg.append(
        svgEl("line", {
          x1: xx, y1: margem.top, x2: xx, y2: margem.top + areaH,
          class: "analise__gridline",
        })
      );
      svg.append(
        rotuloEixo(fmtInt(v), {
          x: xx, y: margem.top + areaH + 16, "text-anchor": "middle",
          class: "analise__axis",
        })
      );
    }

    itens.forEach((item, i) => {
      const cy = margem.top + faixa * i + faixa / 2;
      svg.append(
        rotuloEixo(rotuloCurto(item.nome), {
          x: margem.left - 10, y: cy + 3, "text-anchor": "end", class: "analise__axis",
        })
      );
      if (item.reclamacoes == null) {
        svg.append(
          rotuloEixo("n/d", {
            x: margem.left + 8, y: cy + 3, class: "analise__nd",
          })
        );
        return;
      }
      const bx2 = margem.left + (item.reclamacoes / eixoMax) * areaW;
      const barra = svgEl("rect", {
        x: margem.left,
        y: cy - alturaBarra / 2,
        width: Math.max(bx2 - margem.left, 2),
        height: alturaBarra,
        rx: 4,
        class: "analise__bar",
        fill: corReclamacao(item.nome),
        "data-focus-value": String(item.id),
      });
      comTooltip(barra, `${item.nome}: ${fmt2(item.reclamacoes)}`);
      svg.append(barra);
      svg.append(
        rotuloEixo(fmt2(item.reclamacoes), {
          x: bx2 + 8, y: cy + 3, class: "analise__bar-value",
        })
      );
    });
    alvo.append(svg);
  }

  function desenharScatter(visiveis) {
    const alvo = byId("analise-chart-scatter");
    if (!alvo) return;
    alvo.replaceChildren();

    const W = 420, H = 300;
    const margem = { top: 16, right: 24, bottom: 40, left: 48 };
    const areaW = W - margem.left - margem.right;
    const areaH = H - margem.top - margem.bottom;

    /* Só instituições com as duas medidas: Sicoob fica de fora. */
    const itens = instituicoes.filter(
      (item) =>
        visiveis.has(item.id) &&
        item.reclamacoes != null &&
        item.distancia != null
    );
    if (!itens.length) return;

    const maxDist = Math.max(1, Math.ceil(Math.max(...itens.map((i) => i.distancia))));
    const maxRec = Math.ceil(Math.max(...itens.map((i) => i.reclamacoes)) / 40) * 40;
    const svg = svgRoot();
    const px = (d) => margem.left + (d / maxDist) * areaW;
    const py = (r) => margem.top + areaH - (r / maxRec) * areaH;

    for (let p = 0; p <= maxDist; p++) {
      const xx = px(p);
      svg.append(
        svgEl("line", {
          x1: xx, y1: margem.top, x2: xx, y2: margem.top + areaH,
          class: "analise__gridline",
        })
      );
      svg.append(
        rotuloEixo(String(p), {
          x: xx, y: margem.top + areaH + 16, "text-anchor": "middle",
          class: "analise__axis",
        })
      );
    }
    for (let p = 0; p <= 4; p++) {
      const v = (maxRec / 4) * p;
      const yy = py(v);
      svg.append(
        svgEl("line", {
          x1: margem.left, y1: yy, x2: W - margem.right, y2: yy,
          class: "analise__gridline",
        })
      );
      svg.append(
        rotuloEixo(fmtInt(v), {
          x: margem.left - 8, y: yy + 3, "text-anchor": "end",
          class: "analise__axis",
        })
      );
    }

    svg.append(
      rotuloEixo("Distância média ao centro (km)", {
        x: margem.left + areaW / 2, y: H - 6, "text-anchor": "middle",
        class: "analise__axis-title",
      })
    );
    svg.append(
      rotuloEixo("Índice de reclamações", {
        x: 12,
        y: margem.top + areaH / 2,
        "text-anchor": "middle",
        transform: `rotate(-90 12 ${margem.top + areaH / 2})`,
        class: "analise__axis-title",
      })
    );

    const rotulos = [];
    itens.forEach((item) => {
      const bx = px(item.distancia);
      const by = py(item.reclamacoes);
      const bolha = svgEl("circle", {
        cx: bx,
        cy: by,
        r: 9,
        class: "analise__dot",
        fill: item.cor,
        "data-focus-value": String(item.id),
      });
      comTooltip(
        bolha,
        `${item.nome}: ${fmt2(item.distancia)} km · ${fmt2(item.reclamacoes)}`
      );
      svg.append(bolha);

      /* Nome ao lado da bolha, com desvio vertical quando há sobreposição. */
      const largura = item.nome.length * 6.2;
      const aDireita = bx <= W - margem.right - largura - 16;
      const xTexto = aDireita ? bx + 14 : bx - 14;
      const caixaX = aDireita ? xTexto : xTexto - largura;
      const baseY = by + 3;
      let yTexto = baseY;
      for (const desvio of [0, -14, 14, -28, 28, -42, 42]) {
        yTexto = baseY + desvio;
        const colide = rotulos.some(
          (r) =>
            Math.abs(r.y - yTexto) < 13 &&
            caixaX < r.x + r.largura &&
            caixaX + largura > r.x
        );
        if (!colide) break;
      }
      rotulos.push({ x: caixaX, largura, y: yTexto });

      svg.append(
        rotuloEixo(item.nome, {
          x: xTexto,
          y: yTexto,
          "text-anchor": aDireita ? "start" : "end",
          class: "analise__dot-label",
        })
      );
    });
    alvo.append(svg);
  }

  /* --------------------------- status ---------------------------- */
  function renderStatus(list) {
    const total = list.length;
    const all = agencias.length;
    const summary = byId("analise-status-summary");
    if (summary) {
      if (total === all) {
        summary.textContent = `Mostrando todas as ${all} agências`;
      } else if (total === 0) {
        summary.textContent = "Nenhuma agência com os filtros atuais";
      } else {
        summary.textContent = `Mostrando ${total} de ${all} agências`;
      }
    }

    const chips = byId("analise-status-chips");
    if (!chips) return;
    chips.replaceChildren();

    facetConfig.forEach(({ facet }) => {
      state.filters[facet].forEach((value) => {
        let label = value;
        let color = null;
        if (facet === "instituicao") {
          const inst = instById.get(Number(value));
          if (inst) {
            label = inst.nome;
            color = inst.cor;
          }
        } else if (facet === "regiao") {
          const regiao = regiaoById.get(Number(value));
          if (regiao) {
            label = regiao.apelido || regiao.nome;
            color = regiao.cor;
          }
        } else {
          color = TYPE_COLORS[value] || null;
        }
        const chip = create("button", "bi-status-chip");
        chip.type = "button";
        chip.dataset.filterFacet = facet;
        chip.dataset.filterValue = value;
        chip.title = "Remover filtro";
        if (color) {
          const dot = create("i");
          dot.style.background = color;
          chip.append(dot);
        }
        chip.append(document.createTextNode(label), create("span", null, "×"));
        chips.append(chip);
      });
    });

    if (state.focus) {
      const inst = instById.get(Number(state.focus));
      const chip = create("button", "bi-status-chip bi-status-chip--focus");
      chip.type = "button";
      chip.dataset.clearFocus = "true";
      chip.title = "Remover destaque";
      chip.append(
        document.createTextNode(`Foco: ${inst ? inst.nome : state.focus}`),
        create("span", null, "×")
      );
      chips.append(chip);
    }

    if (!chips.childElementCount) {
      chips.append(
        create(
          "span",
          "bi-status__hint",
          "Clique nos gráficos ou nos filtros para explorar"
        )
      );
    }
  }

  function renderTable(visiveis) {
    const body = byId("analise-table-body");
    if (!body) return;
    body.replaceChildren();

    const itens = instituicoes
      .filter((item) => visiveis.has(item.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    if (!itens.length) {
      const row = create("tr");
      const cell = create("td", null, "Nenhuma instituição com os filtros atuais.");
      cell.colSpan = 4;
      row.append(cell);
      body.append(row);
    } else {
      itens.forEach((item) => {
        const row = create("tr");
        const instCell = create("td");
        const wrap = create("span", "bi-table-inst");
        const dot = create("i");
        dot.style.background = item.cor;
        wrap.append(dot, document.createTextNode(item.nome));
        instCell.append(wrap);
        row.append(
          instCell,
          create("td", null, fmt2(item.ativo)),
          create("td", null, fmt2(item.reclamacoes)),
          create("td", null, `${fmt2(item.distancia)} km`)
        );
        body.append(row);
      });
    }

    const count = byId("analise-table-count");
    if (count) {
      const n = itens.length;
      count.textContent = `${n} ${n === 1 ? "instituição" : "instituições"}`;
    }
  }

  function renderAll() {
    const list = getAgencias();
    const visiveis = new Set(list.map((agency) => agency.instituicaoId));
    renderFilters();
    desenharAtivo(visiveis);
    desenharReclamacoes(visiveis);
    desenharScatter(visiveis);
    renderStatus(list);
    renderTable(visiveis);
  }

  function toggleFilter(facet, value) {
    const set = state.filters[facet];
    if (!set) return;
    if (set.has(value)) set.delete(value);
    else set.add(value);
    state.focus = null;
    renderAll();
  }

  function toggleFocus(value) {
    if (value == null) return;
    state.focus = state.focus === value ? null : value;
    renderAll();
  }

  function resetAll() {
    Object.keys(state.filters).forEach((facet) => state.filters[facet].clear());
    state.focus = null;
    renderAll();
  }

  function hasActiveSelection() {
    return Boolean(
      state.focus ||
        state.filters.instituicao.size ||
        state.filters.regiao.size ||
        state.filters.tipo.size
    );
  }

  const dashboard = byId("analise-dashboard");
  if (dashboard) {
    dashboard.addEventListener("click", (event) => {
      const focusTarget = event.target.closest("[data-focus-value]");
      if (focusTarget) {
        event.preventDefault();
        toggleFocus(focusTarget.getAttribute("data-focus-value"));
        return;
      }
      const clearFocus = event.target.closest("[data-clear-focus]");
      if (clearFocus) {
        event.preventDefault();
        state.focus = null;
        renderAll();
        return;
      }
      const filterTarget = event.target.closest("[data-filter-facet]");
      if (filterTarget && !filterTarget.disabled) {
        event.preventDefault();
        toggleFilter(filterTarget.dataset.filterFacet, filterTarget.dataset.filterValue);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.focus) {
        state.focus = null;
        renderAll();
      }
    });

    const reset = byId("analise-reset");
    if (reset) reset.addEventListener("click", resetAll);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildFilters();
    renderAll();
  });
})();

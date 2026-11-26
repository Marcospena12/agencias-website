(function () {
  const data = window.BI_DATA;
  if (
    !data ||
    !Array.isArray(data.instituicoes) ||
    !Array.isArray(data.regioes) ||
    !Array.isArray(data.agencias)
  ) {
    return;
  }

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
  const MAP = {
    west: -44.215,
    south: -19.985,
    east: -44.1,
    north: -19.934,
    width: 1200,
    height: 532,
  };
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
  const fmtInt = (value) => (value == null ? "—" : nf0.format(value));
  const fmt2 = (value) => {
    if (value == null || Number.isNaN(value)) return "—";
    return nf2.format(Math.round((value + 1e-9) * 100) / 100);
  };

  const instituicoes = data.instituicoes.map((item, index) => ({
    ...item,
    cor: INST_COLORS[index % INST_COLORS.length],
  }));
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

  const state = {
    filters: {
      instituicao: new Set(),
      regiao: new Set(),
      tipo: new Set(),
    },
    focus: null,
  };

  const facetConfig = [
    {
      facet: "instituicao",
      container: byId("bi-filter-instituicao"),
      items: instituicoes.map((item) => ({
        value: String(item.id),
        label: item.nome,
        count: agencias.filter((a) => a.instituicaoId === item.id).length,
        color: item.cor,
      })),
    },
    {
      facet: "regiao",
      container: byId("bi-filter-regiao"),
      items: regioes.map((item) => ({
        value: String(item.id),
        label: item.nome,
        count: agencias.filter((a) => a.regiaoId === item.id).length,
        color: item.cor,
      })),
    },
    {
      facet: "tipo",
      container: byId("bi-filter-tipo"),
      items: TYPE_ORDER.map((tipo) => ({
        value: tipo,
        label: tipo,
        count: agencias.filter((a) => a.instituicao.tipo === tipo).length,
        color: TYPE_COLORS[tipo],
      })),
    },
  ];

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
    if (!state.focus) return false;
    const { facet, value } = state.focus;
    if (facet === "instituicao") {
      return String(agency.instituicaoId) === value;
    }
    if (facet === "regiao") {
      return String(agency.regiaoId) === value;
    }
    if (facet === "tipo") {
      return agency.instituicao.tipo === value;
    }
    return false;
  }

  function getData(ignoreFacet) {
    return agencias.filter((agency) => {
      if (!passesHardFilters(agency)) return false;
      if (
        state.focus &&
        state.focus.facet !== ignoreFacet &&
        !matchesFocus(agency)
      ) {
        return false;
      }
      return true;
    });
  }

  function focusMatches(facet, value) {
    return Boolean(
      state.focus &&
        state.focus.facet === facet &&
        state.focus.value === value
    );
  }

  function computeMetrics(list) {
    const ids = new Set(list.map((agency) => agency.instituicaoId));
    const ativos = [];
    const reclamacoes = [];
    ids.forEach((id) => {
      const inst = instById.get(id);
      if (inst.ativo != null) ativos.push(inst.ativo);
      if (inst.reclamacoes != null) reclamacoes.push(inst.reclamacoes);
    });
    const distancias = list
      .map((agency) => agency.distancia)
      .filter((value) => value != null);
    return {
      total: list.length,
      ativo: ativos.length
        ? ativos.reduce((sum, value) => sum + value, 0) / ativos.length
        : null,
      reclamacoes: reclamacoes.length
        ? reclamacoes.reduce((sum, value) => sum + value, 0) /
          reclamacoes.length
        : null,
      distancia: distancias.length
        ? distancias.reduce((sum, value) => sum + value, 0) / distancias.length
        : null,
    };
  }

  function buildFilters() {
    facetConfig.forEach(({ container }) => {
      container.replaceChildren();
    });

    facetConfig.forEach(({ facet, container, items }) => {
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

  function project(agency) {
    return {
      x: ((agency.lng - MAP.west) / (MAP.east - MAP.west)) * MAP.width,
      y: ((MAP.north - agency.lat) / (MAP.north - MAP.south)) * MAP.height,
    };
  }

  function layoutAgencies() {
    const spacing = 26;
    const margin = 16;
    const placed = [];
    const clamp = (value, max) =>
      Math.min(max - margin, Math.max(margin, value));

    return agencias.map((agency) => {
      const base = project(agency);
      let position = { x: clamp(base.x, MAP.width), y: clamp(base.y, MAP.height) };
      let found = false;

      for (let ring = 0; ring < 8 && !found; ring += 1) {
        const radius = ring * spacing;
        const steps =
          ring === 0
            ? 1
            : Math.max(6, Math.floor((Math.PI * 2 * radius) / spacing));
        for (let step = 0; step < steps; step += 1) {
          const angle =
            (step / steps) * Math.PI * 2 + ring * 0.7 + (ring % 2 ? 0.4 : 0);
          const x = clamp(base.x + Math.cos(angle) * radius, MAP.width);
          const y = clamp(base.y + Math.sin(angle) * radius, MAP.height);
          const free = placed.every(
            (point) => Math.hypot(point.x - x, point.y - y) >= spacing
          );
          if (free) {
            position = { x, y };
            found = true;
            break;
          }
        }
      }

      placed.push(position);
      return { agency, base, position };
    });
  }

  const mapEl = byId("bi-map");
  const mapStage = byId("bi-map-stage");
  const mapSvg = byId("bi-map-svg");
  const mapTooltip = byId("bi-map-tooltip");
  const mapEmpty = byId("bi-map-empty");
  const mapLegend = byId("bi-map-legend");
  const mapPoints = new Map();
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let didDrag = false;

  function buildMap() {
    mapSvg.replaceChildren();
    const leaders = svgEl("g");
    const points = svgEl("g");
    mapSvg.append(leaders, points);

    layoutAgencies().forEach(({ agency, base, position }) => {
      const distance = Math.hypot(
        position.x - base.x,
        position.y - base.y
      );
      let leader = null;
      if (distance > 1) {
        leader = svgEl("line", {
          x1: base.x,
          y1: base.y,
          x2: position.x,
          y2: position.y,
          stroke: agency.instituicao.cor,
          class: "bi-map__leader",
        });
        leaders.append(leader);
      }

      const group = svgEl("g", {
        class: "bi-map__point",
        tabindex: "0",
        role: "button",
        "aria-pressed": "false",
        "data-focus-facet": "instituicao",
        "data-focus-value": String(agency.instituicaoId),
        "aria-label": `${agency.instituicao.nome}, agência ${agency.nome}, ${agency.endereco}, ${agency.regiao.nome}. Clique para destacar a instituição.`,
      });
      const hit = svgEl("circle", {
        cx: position.x,
        cy: position.y,
        r: 20,
        fill: "transparent",
      });
      const halo = svgEl("circle", {
        cx: position.x,
        cy: position.y,
        r: 16,
        fill: agency.instituicao.cor,
        class: "bi-map__halo",
      });
      const dot = svgEl("circle", {
        cx: position.x,
        cy: position.y,
        r: 11,
        fill: agency.instituicao.cor,
        class: "bi-map__dot",
      });
      group.append(hit, halo, dot);
      points.append(group);

      group.addEventListener("pointerenter", () => showTooltip(agency, group));
      group.addEventListener("pointerleave", hideTooltip);
      group.addEventListener("focus", () => showTooltip(agency, group));
      group.addEventListener("blur", hideTooltip);

      mapPoints.set(agency.id, { group, leader, agency });
    });

    const credit = document.querySelector(".bi-map__credit");
    if (credit) {
      credit.title =
        "Basemap: Esri, HERE, Garmin, © OpenStreetMap contributors";
    }
  }

  function showTooltip(agency, group) {
    const mapRect = mapEl.getBoundingClientRect();
    const pointRect = group.getBoundingClientRect();
    const x = pointRect.left + pointRect.width / 2 - mapRect.left;
    const y = pointRect.top - mapRect.top;
    const inst = agency.instituicao;

    mapTooltip.replaceChildren();
    const instLine = create("span", "bi-map__tooltip-inst");
    const instDot = create("i");
    instDot.style.background = inst.cor;
    instLine.append(instDot, document.createTextNode(inst.nome));
    const name = create("strong", null, agency.nome);
    const address = create(
      "span",
      "bi-map__tooltip-address",
      agency.endereco
    );
    const meta = create(
      "span",
      "bi-map__tooltip-meta",
      `${agency.regiao.nome} · ${fmt2(agency.distancia)} km do centro`
    );
    mapTooltip.append(instLine, name, address, meta);

    if (inst.reclamacoes != null) {
      mapTooltip.append(
        create(
          "span",
          "bi-map__tooltip-meta",
          `Índice Bacen de reclamações: ${fmt2(inst.reclamacoes)}`
        )
      );
    }

    const half = Math.min(118, mapRect.width / 2 - 4);
    const left = Math.max(half, Math.min(mapRect.width - half, x));
    const below = y < 92;
    mapTooltip.style.left = `${left}px`;
    mapTooltip.style.top = below
      ? `${Math.max(4, y + 14)}px`
      : `${Math.max(6, y - 10)}px`;
    mapTooltip.classList.toggle("is-below", below);
    mapTooltip.classList.add("is-visible");
    mapTooltip.setAttribute("aria-hidden", "false");
  }

  function hideTooltip() {
    mapTooltip.classList.remove("is-visible");
    mapTooltip.setAttribute("aria-hidden", "true");
  }

  function applyMapTransform() {
    mapStage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    mapEl.classList.toggle("is-zoomed", scale > 1);
    byId("bi-zoom-reset").disabled = scale === 1;
  }

  function clampPan() {
    const width = mapEl.clientWidth;
    const height = mapEl.clientHeight;
    if (scale === 1) {
      panX = 0;
      panY = 0;
      return;
    }
    panX = Math.min(0, Math.max(width * (1 - scale), panX));
    panY = Math.min(0, Math.max(height * (1 - scale), panY));
  }

  function zoomAt(nextScale, clientX, clientY) {
    const rect = mapEl.getBoundingClientRect();
    const cx = clientX == null ? rect.width / 2 : clientX - rect.left;
    const cy = clientY == null ? rect.height / 2 : clientY - rect.top;
    const worldX = (cx - panX) / scale;
    const worldY = (cy - panY) / scale;
    scale = Math.min(4, Math.max(1, nextScale));
    panX = cx - worldX * scale;
    panY = cy - worldY * scale;
    clampPan();
    applyMapTransform();
  }

  function renderMap() {
    const list = getData("instituicao");
    const visible = new Set(list.map((agency) => agency.id));
    const sourceFocus = state.focus && state.focus.facet === "instituicao";

    mapPoints.forEach(({ group, leader, agency }) => {
      const isVisible = visible.has(agency.id);
      const isFocused = sourceFocus && matchesFocus(agency);
      group.classList.toggle("is-hidden", !isVisible);
      if (leader) leader.classList.toggle("is-hidden", !isVisible);
      group.classList.toggle("is-focused", isFocused);
      group.classList.toggle("is-dimmed", Boolean(sourceFocus) && !isFocused);
      group.setAttribute("tabindex", isVisible ? "0" : "-1");
      group.setAttribute("aria-pressed", String(isFocused));
      group.setAttribute(
        "aria-label",
        `${agency.instituicao.nome}, agência ${agency.nome}, ${agency.endereco}, ${agency.regiao.nome}. ${isFocused ? "Em destaque. Clique para remover o destaque." : "Clique para destacar a instituição."}`
      );
    });

    const highlighted = sourceFocus
      ? list.filter((agency) => matchesFocus(agency)).length
      : 0;
    mapSvg.setAttribute(
      "aria-label",
      `Mapa com ${list.length} ${list.length === 1 ? "agência" : "agências"} bancárias de Betim${sourceFocus ? `, ${highlighted} em destaque` : ""}`
    );
    mapEmpty.hidden = list.length > 0;

    mapLegend.replaceChildren();
    instituicoes.forEach((inst) => {
      const count = list.filter(
        (agency) => agency.instituicaoId === inst.id
      ).length;
      const button = create("button", "bi-legend-item");
      button.type = "button";
      button.dataset.focusFacet = "instituicao";
      button.dataset.focusValue = String(inst.id);
      button.disabled = count === 0;
      button.title = `${inst.nome}: ${count} ${count === 1 ? "agência" : "agências"}`;
      button.setAttribute(
        "aria-pressed",
        String(focusMatches("instituicao", String(inst.id)))
      );
      const dot = create("i");
      dot.style.background = inst.cor;
      const label = create("span", null, inst.nome);
      button.append(dot, label);
      mapLegend.append(button);
    });
  }

  function renderFilters() {
    facetConfig.forEach(({ facet, container, items }) => {
      container.querySelectorAll(".bi-option").forEach((button) => {
        const active = state.filters[facet].has(button.dataset.filterValue);
        button.setAttribute("aria-pressed", String(active));
      });
      const count = document.querySelector(`[data-count-for="${facet}"]`);
      if (count) {
        count.textContent = state.filters[facet].size
          ? `${state.filters[facet].size}/${items.length}`
          : String(items.length);
      }
    });
    byId("bi-reset").disabled = !hasActiveSelection();
  }

  function renderKpis(metrics) {
    byId("bi-kpi-total").textContent = fmtInt(metrics.total);
    byId("bi-kpi-ativo").textContent = fmt2(metrics.ativo);
    byId("bi-kpi-reclamacoes").textContent = fmt2(metrics.reclamacoes);
    byId("bi-kpi-distancia").textContent = fmt2(metrics.distancia);
  }

  function renderBars() {
    const container = byId("bi-bars");
    container.replaceChildren();
    const list = getData("instituicao");
    const items = instituicoes
      .map((inst) => ({
        ...inst,
        count: list.filter((agency) => agency.instituicaoId === inst.id).length,
      }))
      .filter((item) => item.count > 0)
      .sort(
        (a, b) => b.count - a.count || a.nome.localeCompare(b.nome, "pt-BR")
      );

    if (!items.length) {
      container.append(
        create("p", "bi-empty", "Nenhuma agência com os filtros atuais.")
      );
      return;
    }

    const max = Math.max(1, ...items.map((item) => item.count));
    const sourceFocus = state.focus && state.focus.facet === "instituicao";

    items.forEach((inst) => {
      const focused = focusMatches("instituicao", String(inst.id));
      const button = create("button", "bi-bar");
      button.type = "button";
      button.dataset.focusFacet = "instituicao";
      button.dataset.focusValue = String(inst.id);
      button.disabled = inst.count === 0;
      button.title = `${inst.nome}: ${inst.count} ${inst.count === 1 ? "agência" : "agências"}`;
      button.classList.toggle("is-focused", focused);
      button.classList.toggle(
        "is-dimmed",
        Boolean(sourceFocus) && !focused
      );
      button.classList.toggle("is-zero", inst.count === 0);
      button.setAttribute("aria-pressed", String(focused));
      button.setAttribute(
        "aria-label",
        `${inst.nome}: ${inst.count} ${inst.count === 1 ? "agência" : "agências"}. ${focused ? "Em destaque." : "Clique para destacar."}`
      );

      const label = create("span", "bi-bar__label");
      const dot = create("i");
      dot.style.background = inst.cor;
      const name = create("span", "bi-bar__name", inst.nome);
      label.append(dot, name);

      const track = create("span", "bi-bar__track");
      const fill = create("span", "bi-bar__fill");
      fill.style.width = `${(inst.count / max) * 100}%`;
      track.append(fill);

      const value = create("span", "bi-bar__value", fmtInt(inst.count));
      button.append(label, track, value);
      container.append(button);
    });
  }

  function renderDonut() {
    const list = getData("regiao");
    const items = regioes
      .map((regiao) => ({
        ...regiao,
        count: list.filter((agency) => agency.regiaoId === regiao.id).length,
      }))
      .filter((item) => item.count > 0);
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const svg = byId("bi-donut-svg");
    const legend = byId("bi-donut-legend");
    const center = byId("bi-donut-total");
    const sourceFocus = state.focus && state.focus.facet === "regiao";
    const cx = 100;
    const cy = 100;
    const radius = 72;
    const stroke = 14;
    const circumference = 2 * Math.PI * radius;

    svg.replaceChildren();
    svg.append(
      svgEl("circle", {
        cx,
        cy,
        r: radius,
        fill: "none",
        stroke: "rgba(143,169,188,0.12)",
        "stroke-width": stroke,
      })
    );

    const group = svgEl("g", { transform: "rotate(-90 100 100)" });
    let offset = 0;
    items.forEach((item) => {
      if (item.count === 0 || total === 0) return;
      const length = (item.count / total) * circumference;
      const focused = focusMatches("regiao", String(item.id));
      const segment = svgEl("circle", {
        cx,
        cy,
        r: radius,
        fill: "none",
        stroke: item.cor,
        "stroke-width": stroke,
        "stroke-dasharray": `${Math.max(0.6, length - 2.5)} ${circumference}`,
        "stroke-dashoffset": -offset,
        class: `bi-donut__seg${focused ? " is-focused" : ""}${sourceFocus && !focused ? " is-dimmed" : ""}`,
        "data-focus-facet": "regiao",
        "data-focus-value": String(item.id),
        tabindex: "-1",
      });
      const title = svgEl("title");
      title.textContent = `${item.nome}: ${item.count} ${item.count === 1 ? "agência" : "agências"}`;
      segment.append(title);
      group.append(segment);
      offset += length;
    });
    svg.append(group);
    svg.setAttribute(
      "aria-label",
      `Distribuição de ${total} ${total === 1 ? "agência" : "agências"} por região`
    );
    center.textContent = fmtInt(total);

    legend.replaceChildren();
    if (!items.length) {
      legend.append(
        create("p", "bi-empty", "Nenhuma agência com os filtros atuais.")
      );
    } else {
      items.forEach((item) => {
        const percent = total ? Math.round((item.count / total) * 100) : 0;
        const focused = focusMatches("regiao", String(item.id));
        const button = create("button", "bi-donut-legend__item");
        button.type = "button";
        button.dataset.focusFacet = "regiao";
        button.dataset.focusValue = String(item.id);
        button.disabled = item.count === 0;
        button.title = item.nome;
        button.setAttribute("aria-pressed", String(focused));
        const dot = create("i");
        dot.style.background = item.cor;
        const label = create("span", null, item.apelido || item.nome);
        const value = create(
          "b",
          null,
          `${fmtInt(item.count)} · ${percent}%`
        );
        button.append(dot, label, value);
        legend.append(button);
      });
    }
  }

  function renderStacked() {
    const container = byId("bi-stacked");
    const typeLegend = byId("bi-type-legend");
    const list = getData("tipo");
    const sourceFocus = state.focus && state.focus.facet === "tipo";
    const columns = regioes
      .map((regiao) => {
        const regionAgencies = list.filter(
          (agency) => agency.regiaoId === regiao.id
        );
        return {
          ...regiao,
          agencies: regionAgencies,
          total: regionAgencies.length,
        };
      })
      .filter((item) => item.total > 0);

    typeLegend.replaceChildren();
    TYPE_ORDER.forEach((tipo) => {
      const count = list.filter(
        (agency) => agency.instituicao.tipo === tipo
      ).length;
      const focused = focusMatches("tipo", tipo);
      const button = create("button");
      button.type = "button";
      button.dataset.focusFacet = "tipo";
      button.dataset.focusValue = tipo;
      button.disabled = count === 0;
      button.setAttribute("aria-pressed", String(focused));
      button.title = `${tipo}: ${count} ${count === 1 ? "agência" : "agências"}`;
      const dot = create("i");
      dot.style.background = TYPE_COLORS[tipo];
      button.append(dot, document.createTextNode(tipo));
      typeLegend.append(button);
    });

    container.replaceChildren();
    if (!columns.length) {
      container.style.gridTemplateColumns = "1fr";
      container.append(
        create("p", "bi-empty", "Nenhuma agência com os filtros atuais.")
      );
      return;
    }

    container.style.gridTemplateColumns = `repeat(${columns.length}, minmax(0, 1fr))`;

    columns.forEach((regiao) => {
      const regionAgencies = regiao.agencies;
      const total = regiao.total;
      const column = create("div", "bi-stack");
      const bar = create("div", "bi-stack__bar");

      TYPE_ORDER.forEach((tipo) => {
        const count = regionAgencies.filter(
          (agency) => agency.instituicao.tipo === tipo
        ).length;
        if (count === 0) return;
        const percent = (count / total) * 100;
        const focused = focusMatches("tipo", tipo);
        const segment = create("button", "bi-stack__seg");
        segment.type = "button";
        segment.style.height = `${percent}%`;
        segment.style.background = TYPE_COLORS[tipo];
        segment.dataset.focusFacet = "tipo";
        segment.dataset.focusValue = tipo;
        segment.classList.toggle("is-focused", focused);
        segment.classList.toggle(
          "is-dimmed",
          Boolean(sourceFocus) && !focused
        );
        segment.setAttribute("aria-pressed", String(focused));
        segment.setAttribute(
          "aria-label",
          `${regiao.apelido || regiao.nome}, ${tipo}: ${count} ${count === 1 ? "agência" : "agências"}, ${Math.round(percent)}%. ${focused ? "Em destaque." : "Clique para destacar."}`
        );
        if (percent >= 16) {
          segment.append(create("span", null, `${Math.round(percent)}%`));
        }
        bar.append(segment);
      });

      const label = create("span", "bi-stack__label", regiao.apelido || regiao.nome);
      label.title = regiao.nome;
      column.append(bar, label);
      container.append(column);
    });
  }

  function renderStatus(metrics) {
    const total = metrics.total;
    const all = agencias.length;
    const summary = byId("bi-status-summary");
    if (total === all) {
      summary.textContent = `Mostrando todas as ${all} agências`;
    } else if (total === 0) {
      summary.textContent = "Nenhuma agência com os filtros atuais";
    } else {
      summary.textContent = `Mostrando ${total} de ${all} agências`;
    }

    const chips = byId("bi-status-chips");
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
        chip.append(
          document.createTextNode(label),
          create("span", null, "×")
        );
        chips.append(chip);
      });
    });

    if (state.focus) {
      const chip = create("button", "bi-status-chip bi-status-chip--focus");
      chip.type = "button";
      chip.dataset.clearFocus = "true";
      chip.title = "Remover destaque";
      chip.append(
        document.createTextNode(`Foco: ${focusLabel()}`),
        create("span", null, "×")
      );
      chips.append(chip);
    }

    if (!chips.childElementCount) {
      chips.append(
        create(
          "span",
          "bi-status__hint",
          "Clique nos gráficos ou no mapa para destacar"
        )
      );
    }
  }

  function focusLabel() {
    if (!state.focus) return "";
    const { facet, value } = state.focus;
    if (facet === "instituicao") {
      const inst = instById.get(Number(value));
      return inst ? inst.nome : value;
    }
    if (facet === "regiao") {
      const regiao = regiaoById.get(Number(value));
      return regiao ? regiao.apelido || regiao.nome : value;
    }
    return value;
  }

  function renderTable() {
    const body = byId("bi-table-body");
    const list = getData(null)
      .slice()
      .sort(
        (a, b) =>
          a.instituicao.nome.localeCompare(b.instituicao.nome, "pt-BR") ||
          a.nome.localeCompare(b.nome, "pt-BR")
      );
    body.replaceChildren();

    if (!list.length) {
      const row = create("tr");
      const cell = create("td", null, "Nenhuma agência com os filtros atuais.");
      cell.colSpan = 6;
      row.append(cell);
      body.append(row);
    } else {
      list.forEach((agency) => {
        const row = create("tr");

        const instCell = create("td");
        const instWrap = create("span", "bi-table-inst");
        const dot = create("i");
        dot.style.background = agency.instituicao.cor;
        instWrap.append(dot, document.createTextNode(agency.instituicao.nome));
        instCell.append(instWrap);

        const agencyCell = create("td");
        agencyCell.append(create("strong", null, agency.nome));
        const addressCell = create("td", null, agency.endereco);
        const regionCell = create("td", null, agency.regiao.nome);
        const distanceCell = create("td", null, `${fmt2(agency.distancia)} km`);
        const complaintsCell = create(
          "td",
          null,
          agency.instituicao.reclamacoes != null
            ? fmt2(agency.instituicao.reclamacoes)
            : "—"
        );

        row.append(
          instCell,
          agencyCell,
          addressCell,
          regionCell,
          distanceCell,
          complaintsCell
        );
        body.append(row);
      });
    }

    byId("bi-table-count").textContent = `${list.length} ${
      list.length === 1 ? "agência" : "agências"
    }`;
  }

  function hasActiveSelection() {
    return Boolean(
      state.focus ||
        state.filters.instituicao.size ||
        state.filters.regiao.size ||
        state.filters.tipo.size
    );
  }

  function renderAll() {
    const metrics = computeMetrics(getData(null));
    renderFilters();
    renderKpis(metrics);
    renderMap();
    renderBars();
    renderDonut();
    renderStacked();
    renderStatus(metrics);
    renderTable();
  }

  function toggleFilter(facet, value) {
    const set = state.filters[facet];
    if (!set) return;
    if (set.has(value)) set.delete(value);
    else set.add(value);
    state.focus = null;
    hideTooltip();
    renderAll();
  }

  function toggleFocus(facet, value) {
    if (!facet || value == null) return;
    if (
      state.focus &&
      state.focus.facet === facet &&
      state.focus.value === value
    ) {
      state.focus = null;
    } else {
      state.focus = { facet, value };
    }
    hideTooltip();
    renderAll();
  }

  function resetAll() {
    state.filters.instituicao.clear();
    state.filters.regiao.clear();
    state.filters.tipo.clear();
    state.focus = null;
    hideTooltip();
    renderAll();
  }

  const dashboard = byId("bi-dashboard");

  dashboard.addEventListener("click", (event) => {
    const focusTarget = event.target.closest("[data-focus-facet]");
    if (focusTarget && !focusTarget.disabled) {
      event.preventDefault();
      toggleFocus(
        focusTarget.dataset.focusFacet,
        focusTarget.dataset.focusValue
      );
      return;
    }

    const clearFocus = event.target.closest("[data-clear-focus]");
    if (clearFocus) {
      event.preventDefault();
      state.focus = null;
      hideTooltip();
      renderAll();
      return;
    }

    const filterTarget = event.target.closest("[data-filter-facet]");
    if (filterTarget && !filterTarget.disabled) {
      event.preventDefault();
      toggleFilter(
        filterTarget.dataset.filterFacet,
        filterTarget.dataset.filterValue
      );
    }
  });

  dashboard.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const point = event.target.closest(".bi-map__point");
    if (!point) return;
    event.preventDefault();
    toggleFocus("instituicao", point.dataset.focusValue);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.focus) {
      state.focus = null;
      hideTooltip();
      renderAll();
    }
  });

  byId("bi-reset").addEventListener("click", resetAll);

  byId("bi-zoom-in").addEventListener("click", () => zoomAt(scale * 1.5));
  byId("bi-zoom-out").addEventListener("click", () => zoomAt(scale / 1.5));
  byId("bi-zoom-reset").addEventListener("click", () => {
    scale = 1;
    panX = 0;
    panY = 0;
    applyMapTransform();
  });

  mapEl.addEventListener(
    "click",
    (event) => {
      if (didDrag) {
        event.stopPropagation();
        didDrag = false;
      }
    },
    true
  );

  mapEl.addEventListener("dblclick", (event) => {
    if (event.target.closest(".bi-map__point")) return;
    zoomAt(scale < 2 ? 2 : 1, event.clientX, event.clientY);
  });

  let drag = null;

  mapEl.addEventListener("pointerdown", (event) => {
    if (
      scale <= 1 ||
      event.button !== 0 ||
      event.target.closest(".bi-map__point")
    ) {
      return;
    }
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX,
      panY,
    };
    didDrag = false;
    mapEl.classList.add("is-dragging");
    mapEl.setPointerCapture(event.pointerId);
  });

  mapEl.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) didDrag = true;
    panX = drag.panX + dx;
    panY = drag.panY + dy;
    clampPan();
    applyMapTransform();
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    mapEl.classList.remove("is-dragging");
  }

  mapEl.addEventListener("pointerup", endDrag);
  mapEl.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", () => {
    clampPan();
    applyMapTransform();
  });

  buildFilters();
  buildMap();
  applyMapTransform();
  renderAll();
})();

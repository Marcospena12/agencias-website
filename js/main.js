const POWERBI_URL =
  "https://app.powerbi.com/groups/me/reports/fb79c1c2-ac3f-4af9-aeef-3217d504fb85/ReportSection?experience=power-bi";

const ano = document.getElementById("ano");
if (ano) {
  ano.textContent = new Date().getFullYear();
}

document.querySelectorAll("[data-powerbi-link]").forEach((link) => {
  if (POWERBI_URL) link.href = POWERBI_URL;
});

(function mapaDePontos() {
  const canvas = document.getElementById("hero-canvas");
  const hero = document.querySelector(".hero");

  if (!canvas || !hero || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const MIN_PONTOS = 40;
  const MAX_PONTOS = 70;

  const raiz = getComputedStyle(document.documentElement);
  const GLOW = parseFloat(raiz.getPropertyValue("--dot-glow")) || 0.9;
  const VELOCIDADE = parseFloat(raiz.getPropertyValue("--dot-speed")) || 0.4;
  const COR_DESTAQUE = raiz.getPropertyValue("--accent").trim() || "#35e0c4";

  function corRGB(cor) {
    const m = cor.match(/\d+/g);
    return m ? m.map(Number) : [53, 224, 196];
  }
  const [R, G, B] = corRGB(COR_DESTAQUE);

  let pontos = [];
  let largura = 0;
  let altura = 0;

  const parallax = { alvoX: 0, alvoY: 0, x: 0, y: 0 };

  function criarPonto() {
    return {
      x: Math.random() * largura,
      y: Math.random() * altura,
      vx: (Math.random() - 0.5) * 0.15 * VELOCIDADE,
      vy: (Math.random() - 0.5) * 0.15 * VELOCIDADE,
      raio: 1.2 + Math.random() * 1.8,
      fase: Math.random() * Math.PI * 2,
      pulso: 0.008 + Math.random() * 0.012,
    };
  }

  function dimensionar() {
    const dpr = window.devicePixelRatio || 1;
    largura = hero.clientWidth;
    altura = hero.clientHeight;
    canvas.width = largura * dpr;
    canvas.height = altura * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const qtdMin = largura < 640 ? Math.round(MIN_PONTOS / 2) : MIN_PONTOS;
    const qtdMax = largura < 640 ? Math.round(MAX_PONTOS / 2) : MAX_PONTOS;
    const qtd = qtdMin + Math.floor(Math.random() * (qtdMax - qtdMin + 1));

    pontos = Array.from({ length: qtd }, criarPonto);

    if (prefersReducedMotion) {
      desenhar(0);
    }
  }

  function desenhar(t) {
    ctx.clearRect(0, 0, largura, altura);

    parallax.x += (parallax.alvoX - parallax.x) * 0.05;
    parallax.y += (parallax.alvoY - parallax.y) * 0.05;

    const LIMITE_LINHA = 120;

    for (let i = 0; i < pontos.length; i++) {
      for (let j = i + 1; j < pontos.length; j++) {
        const a = pontos[i];
        const b = pontos[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LIMITE_LINHA) {
          const opacidade = (1 - dist / LIMITE_LINHA) * 0.25 * GLOW;
          ctx.strokeStyle = `rgba(${R}, ${G}, ${B}, ${opacidade})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x + parallax.x, a.y + parallax.y);
          ctx.lineTo(b.x + parallax.x, b.y + parallax.y);
          ctx.stroke();
        }
      }
    }

    for (const p of pontos) {
      const pulso = prefersReducedMotion
        ? 0.6
        : 0.5 + 0.5 * Math.sin(t * p.pulso + p.fase);
      const raio = p.raio * (1 + 0.4 * pulso);
      const x = p.x + parallax.x;
      const y = p.y + parallax.y;

      const halo = ctx.createRadialGradient(x, y, 0, x, y, raio * 4);
      halo.addColorStop(0, `rgba(${R}, ${G}, ${B}, ${0.35 * GLOW * pulso})`);
      halo.addColorStop(1, `rgba(${R}, ${G}, ${B}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, raio * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${0.55 + 0.45 * pulso * GLOW})`;
      ctx.beginPath();
      ctx.arc(x, y, raio, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function mover() {
    for (const p of pontos) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = largura + 10;
      if (p.x > largura + 10) p.x = -10;
      if (p.y < -10) p.y = altura + 10;
      if (p.y > altura + 10) p.y = -10;
    }
  }

  let rafId = null;
  function loop(t) {
    mover();
    desenhar(t);
    rafId = requestAnimationFrame(loop);
  }
  function iniciar() {
    if (rafId === null && !prefersReducedMotion) {
      rafId = requestAnimationFrame(loop);
    }
  }
  function pausar() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    parallax.alvoX = (e.clientX - r.left - r.width / 2) * 0.02;
    parallax.alvoY = (e.clientY - r.top - r.height / 2) * 0.02;
  });

  hero.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const r = hero.getBoundingClientRect();
      const t = e.touches[0];
      parallax.alvoX = (t.clientX - r.left - r.width / 2) * 0.02;
      parallax.alvoY = (t.clientY - r.top - r.height / 2) * 0.02;
    }
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!document.hidden) iniciar();
          } else {
            pausar();
          }
        });
      },
      { threshold: 0 }
    ).observe(hero);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausar();
    else iniciar();
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      dimensionar();
      pausar();
      iniciar();
    }, 150);
  });

  dimensionar();
  iniciar();
})();

(function spotlight() {
  const suportaHover = window.matchMedia("(hover: hover) and (pointer: fine)")
    .matches;
  if (!suportaHover) return;

  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
})();

function revelarElementos() {
  const elementos = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observer.observe(el));
}
revelarElementos();

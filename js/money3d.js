import * as THREE from "../assets/vendor/three.module.js";

(function iniciarEfeito() {
  const QTD_DESKTOP = 30;
  const QTD_MOBILE = 13;
  const VELOCIDADE_QUEDA = 0.35;
  const VELOCIDADE_ROTACAO = 0.8;
  const CORES = {
    ouro: 0xd9a441,
    cedula1: 0x2ec9a3,
    cedula2: 0x1f9bb8,
    luz: 0xffd98a,
    ambiente: 0x8899bb,
  };
  const PROPORCAO_MOEDAS = 0.6;
  const OPACIDADE = 0.85;
  const Z_MIN = 2;
  const Z_MAX = 10;

  const canvas = document.getElementById("money-canvas");
  const hero = document.querySelector(".hero");

  if (!canvas || !hero) return;

  function webglSuportado() {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  }
  if (!webglSuportado()) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = window.innerWidth < 640;
  const qtdTotal = isMobile ? QTD_MOBILE : QTD_DESKTOP;
  const qtdMoedas = Math.round(qtdTotal * PROPORCAO_MOEDAS);
  const qtdCedulas = qtdTotal - qtdMoedas;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const cena = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  cena.add(new THREE.AmbientLight(CORES.ambiente, 0.5));
  const luzDirecional = new THREE.DirectionalLight(CORES.luz, 1.1);
  luzDirecional.position.set(3, 5, 4);
  cena.add(luzDirecional);

  function texturaMoeda() {
    const t = document.createElement("canvas");
    t.width = t.height = 256;
    const ctx = t.getContext("2d");

    ctx.fillStyle = "#d9a441";
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a97b26";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#7a5518";
    ctx.font = "bold 110px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R$", 128, 132);

    const tex = new THREE.CanvasTexture(t);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function texturaCedula(corHex) {
    const t = document.createElement("canvas");
    t.width = 512;
    t.height = 256;
    const ctx = t.getContext("2d");

    ctx.fillStyle = corHex;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, 476, 220);

    ctx.beginPath();
    ctx.arc(256, 128, 74, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 84px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R$", 256, 132);

    const tex = new THREE.CanvasTexture(t);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function texturaHalo() {
    const t = document.createElement("canvas");
    t.width = t.height = 128;
    const ctx = t.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    g.addColorStop(0.35, "rgba(255, 255, 255, 0.35)");
    g.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(t);
  }

  function texturaAmbiente() {
    const t = document.createElement("canvas");
    t.width = 256;
    t.height = 128;
    const ctx = t.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#fff6e8");
    g.addColorStop(0.5, "#f7eedd");
    g.addColorStop(1, "#e8ddc9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    const tex = new THREE.CanvasTexture(t);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const texMoeda = texturaMoeda();
  const texCedula = texturaCedula("#2ec9a3");
  const texHalo = texturaHalo();
  const texAmbiente = texturaAmbiente();
  cena.environment = texAmbiente;

  const geometriaMoeda = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 28);
  const materialLado = new THREE.MeshPhysicalMaterial({
    color: CORES.ouro,
    metalness: 0.75,
    roughness: 0.35,
    emissive: CORES.ouro,
    emissiveIntensity: 0.3,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 380],
    envMapIntensity: 1.0,
    transparent: true,
    opacity: OPACIDADE,
  });
  const materialFace = new THREE.MeshPhysicalMaterial({
    map: texMoeda,
    metalness: 0.65,
    roughness: 0.4,
    emissive: CORES.ouro,
    emissiveIntensity: 0.25,
    iridescence: 0.2,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 380],
    envMapIntensity: 1.0,
    transparent: true,
    opacity: OPACIDADE,
  });
  const meshMoedas = new THREE.InstancedMesh(
    geometriaMoeda,
    [materialLado, materialFace, materialFace],
    qtdMoedas
  );

  const geometriaCedula = new THREE.BoxGeometry(1.5, 0.75, 0.02);
  const materialCedulaFace = new THREE.MeshStandardMaterial({
    map: texCedula,
    metalness: 0.1,
    roughness: 0.7,
    emissive: CORES.cedula1,
    emissiveIntensity: 0.22,
    envMapIntensity: 0.5,
    transparent: true,
    opacity: OPACIDADE,
  });
  const materialCedulaLado = new THREE.MeshStandardMaterial({
    color: CORES.cedula1,
    metalness: 0.1,
    roughness: 0.7,
    emissive: CORES.cedula1,
    emissiveIntensity: 0.22,
    envMapIntensity: 0.5,
    transparent: true,
    opacity: OPACIDADE,
  });
  const meshCedulas = new THREE.InstancedMesh(
    geometriaCedula,
    [
      materialCedulaLado,
      materialCedulaLado,
      materialCedulaLado,
      materialCedulaLado,
      materialCedulaFace,
      materialCedulaFace,
    ],
    qtdCedulas
  );

  const geometriaHalo = new THREE.PlaneGeometry(1, 1);
  const materialHalo = new THREE.MeshBasicMaterial({
    map: texHalo,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const HALO_MOEDA = 1.8;
  const HALO_CEDULA = 2.2;
  const RAIO_MOEDA = Math.hypot(0.5, 0.06);
  const RAIO_CEDULA = Math.hypot(0.75, 0.375, 0.01);
  const MARGEM_HALO = 0.05;
  const haloMoedas = new THREE.InstancedMesh(geometriaHalo, materialHalo, qtdMoedas);
  const haloCedulas = new THREE.InstancedMesh(geometriaHalo, materialHalo, qtdCedulas);
  haloMoedas.renderOrder = 1;
  haloCedulas.renderOrder = 1;

  cena.add(meshMoedas, meshCedulas, haloMoedas, haloCedulas);

  function criarPeca() {
    const z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
    const profundidade = (z - Z_MIN) / (Z_MAX - Z_MIN);
    const escala = 1 - profundidade * 0.65;
    return {
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 12,
        z
      ),
      queda: VELOCIDADE_QUEDA * (0.6 + Math.random() * 0.8),
      rot: new THREE.Vector3(
        (Math.random() - 0.5) * VELOCIDADE_ROTACAO,
        (Math.random() - 0.5) * VELOCIDADE_ROTACAO,
        (Math.random() - 0.5) * VELOCIDADE_ROTACAO
      ),
      angulo: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      escala,
      cor:
        Math.random() < 0.5
          ? new THREE.Color(CORES.cedula1)
          : new THREE.Color(CORES.cedula2),
    };
  }

  const pecasMoedas = Array.from({ length: qtdMoedas }, criarPeca);
  const pecasCedulas = Array.from({ length: qtdCedulas }, criarPeca);

  const corBase = new THREE.Color();
  const corOuro = new THREE.Color(CORES.ouro);

  const parallax = { alvoX: 0, alvoY: 0, x: 0, y: 0 };

  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    parallax.alvoX = (e.clientX - r.left - r.width / 2) / r.width;
    parallax.alvoY = (e.clientY - r.top - r.height / 2) / r.height;
  });

  hero.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 1) {
        const r = hero.getBoundingClientRect();
        const t = e.touches[0];
        parallax.alvoX = (t.clientX - r.left - r.width / 2) / r.width;
        parallax.alvoY = (t.clientY - r.top - r.height / 2) / r.height;
      }
    },
    { passive: true }
  );

  const matriz = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const escalaVetor = new THREE.Vector3();
  const dirCamera = new THREE.Vector3();
  const vetorAux = new THREE.Vector3();
  const posHalo = new THREE.Vector3();

  function atualizarMesh(mesh, halo, pecas, corDourada, escalaHalo, raioPeca) {
    camera.getWorldDirection(dirCamera);
    pecas.forEach((p, i) => {
      quat.setFromEuler(p.angulo);
      escalaVetor.setScalar(p.escala);
      matriz.compose(p.pos, quat, escalaVetor);
      mesh.setMatrixAt(i, matriz);
      const profundidade = (p.pos.z - Z_MIN) / (Z_MAX - Z_MIN);
      corBase
        .copy(corDourada ? corOuro : p.cor)
        .multiplyScalar(1 - profundidade * 0.55);
      mesh.setColorAt(i, corBase);

      vetorAux.copy(p.pos).sub(camera.position);
      const distancia = vetorAux.length();
      const distEixoReal = vetorAux.dot(dirCamera);
      const cosseno = Math.max(distEixoReal / distancia, 0.35);
      const distEixo = Math.max(distEixoReal, 0.5);
      vetorAux.multiplyScalar(1 / distancia);

      const folga = raioPeca * p.escala + MARGEM_HALO;
      posHalo.copy(p.pos).addScaledVector(vetorAux, folga / cosseno);

      quat.copy(camera.quaternion);
      escalaVetor.setScalar(p.escala * escalaHalo * (1 + folga / distEixo));
      matriz.compose(posHalo, quat, escalaVetor);
      halo.setMatrixAt(i, matriz);
      corBase
        .copy(corDourada ? corOuro : p.cor)
        .multiplyScalar(1 - profundidade * 0.8);
      halo.setColorAt(i, corBase);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
  }

  function desenhar() {
    parallax.x += (parallax.alvoX - parallax.x) * 0.04;
    parallax.y += (parallax.alvoY - parallax.y) * 0.04;
    camera.position.x = parallax.x * 0.8;
    camera.position.y = -parallax.y * 0.8;
    camera.lookAt(0, 0, 0);

    renderer.render(cena, camera);
  }

  function mover(dt) {
    const limiteY = 7;
    for (const lista of [pecasMoedas, pecasCedulas]) {
      for (const p of lista) {
        p.pos.y -= p.queda * dt;
        p.angulo.x += p.rot.x * dt;
        p.angulo.y += p.rot.y * dt;
        p.angulo.z += p.rot.z * dt;
        if (p.pos.y < -limiteY) {
          p.pos.y = limiteY;
          p.pos.x = (Math.random() - 0.5) * 14;
        }
      }
    }
    atualizarMesh(meshMoedas, haloMoedas, pecasMoedas, true, HALO_MOEDA, RAIO_MOEDA);
    atualizarMesh(meshCedulas, haloCedulas, pecasCedulas, false, HALO_CEDULA, RAIO_CEDULA);
  }

  let rafId = null;
  let ultimoTempo = 0;

  function loop(t) {
    const dt = Math.min((t - ultimoTempo) / 1000, 0.05);
    ultimoTempo = t;
    mover(dt);
    desenhar();
    rafId = requestAnimationFrame(loop);
  }

  function iniciar() {
    if (rafId === null && !prefersReducedMotion) {
      ultimoTempo = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function pausar() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function dimensionar() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (prefersReducedMotion) {
      atualizarMesh(meshMoedas, haloMoedas, pecasMoedas, true, HALO_MOEDA, RAIO_MOEDA);
      atualizarMesh(meshCedulas, haloCedulas, pecasCedulas, false, HALO_CEDULA, RAIO_CEDULA);
      desenhar();
    }
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      dimensionar();
      pausar();
      iniciar();
    }, 150);
  });

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

  function dispose() {
    pausar();
    geometriaMoeda.dispose();
    geometriaCedula.dispose();
    geometriaHalo.dispose();
    [
      materialLado,
      materialFace,
      materialCedulaLado,
      materialCedulaFace,
      materialHalo,
    ].forEach((m) => m.dispose());
    texMoeda.dispose();
    texCedula.dispose();
    texHalo.dispose();
    texAmbiente.dispose();
    renderer.dispose();
  }
  window.money3dDispose = dispose;

  atualizarMesh(meshMoedas, haloMoedas, pecasMoedas, true, HALO_MOEDA, RAIO_MOEDA);
  atualizarMesh(meshCedulas, haloCedulas, pecasCedulas, false, HALO_CEDULA, RAIO_CEDULA);
  dimensionar();
  iniciar();
})();

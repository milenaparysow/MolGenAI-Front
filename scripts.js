// Animaciones: solo agregar, no modificar contenido ni estilos existentes
window.addEventListener("load", () => {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  const ease = "power3.out";

  // HERO: logo, botón y texto "Scrolleá" entran suave
  gsap.from(".hero-logo",   { y: 16, scale: 0.985, opacity: 0, duration: 0.7, ease });
  gsap.from(".comenzar",    { y: 18,               opacity: 0, duration: 0.7, ease, delay: 0.08 });
  gsap.from(".scroll-hint", { y: 14,               opacity: 0, duration: 0.6, ease, delay: 0.16 });

  // Scroll a “¿Qué es?” al click en la flecha (si existe)
  document.querySelector(".arrow")?.addEventListener("click", () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ===== REVEALS POR SECCIÓN (sin necesidad de clases nuevas) =====

  // Qué es MolGenAI?
  gsap.from("#about .card", {
    y: 24, opacity: 0, duration: 0.9, ease,
    scrollTrigger: { trigger: "#about .card", start: "top 80%", toggleActions: "play none none reverse" }
  });

  // Equipo (título + miembros con stagger)
  gsap.from(".team h2", {
    y: 20, opacity: 0, duration: 0.7, ease,
    scrollTrigger: { trigger: ".team h2", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.from(".team .member", {
    y: 22, opacity: 0, duration: 0.6, ease, stagger: 0.08,
    scrollTrigger: { trigger: ".team .team-grid", start: "top 80%", toggleActions: "play none none reverse" }
  });

  // Impacto (card + features con stagger)
  gsap.from(".impact .card", {
    y: 24, opacity: 0, duration: 0.9, ease,
    scrollTrigger: { trigger: ".impact .card", start: "top 80%", toggleActions: "play none none reverse" }
  });
  gsap.from(".impact .feature", {
    y: 20, opacity: 0, duration: 0.6, ease, stagger: 0.08,
    scrollTrigger: { trigger: ".impact .grid", start: "top 80%", toggleActions: "play none none reverse" }
  });

  // Contacto (card y campos suavemente)
  gsap.from(".contact .card", {
    y: 24, opacity: 0, duration: 0.9, ease,
    scrollTrigger: { trigger: ".contact .card", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.from(".contact input, .contact textarea, .contact .send", {
    y: 14, opacity: 0, duration: 0.5, ease, stagger: 0.06,
    scrollTrigger: { trigger: ".contact form", start: "top 85%", toggleActions: "play none none reverse" }
  });
});

(() => {
  const BASE_URL = "https://proyecto-25.vercel.app/all";
  const moleculasInput = document.getElementById("moleculas-input");
  const botonGenerar = document.getElementById("generar");

  if (botonGenerar && moleculasInput) {
    botonGenerar.addEventListener("click", async () => {
      const userMoleculas = moleculasInput.value;
      try {
        const response = await fetch(`${BASE_URL}/cambiar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userMoleculas),
        });
        if (!response.ok) throw new Error("Error obteniendo las moléculas nuevas");
        const data = await response.json();
        console.log("Moleculas nuevas:", data);
      } catch (err) {
        console.error(err);
        alert("No se pudieron generar nuevas moléculas.");
      }
    });
  }
})();
// === Cursor "burbujitas" que siguen al mouse ===
(() => {
  const STYLE_ID = "cursor-bubbles-style";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #cursor-bubbles-root{
        position:fixed; inset:0; pointer-events:none; z-index:2147483647;
      }
      .cursor-bubble{
        position:absolute; left:0; top:0;
        width:10px; height:10px; border-radius:50%;
        transform: translate(-50%, -50%) scale(1);
        background:
          radial-gradient(circle at 50% 50%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.6) 35%, rgba(255,255,255,0) 60%),
          radial-gradient(circle at 50% 50%, rgba(1,221,255,.65) 0%, rgba(1,221,255,0) 70%);
        filter: drop-shadow(0 0 8px rgba(1,221,255,.55));
        will-change: transform, opacity, filter;
        animation: cb-move .9s ease-out forwards;
      }
      @keyframes cb-move{
        0%   { transform: translate(-50%, -50%) scale(1);   opacity:1;   }
        100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.6); opacity:0; }
      }
      @media (prefers-reduced-motion: reduce){
        .cursor-bubble{ animation-duration: .6s; }
      }
    `;
    document.head.appendChild(style);
  }

  // Overlay donde van las burbujas 
  let root = document.getElementById("cursor-bubbles-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "cursor-bubbles-root";
    document.body.appendChild(root);
  }

  const reduces = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const MIN_INTERVAL = reduces ? 28 : 14;  // throttle
  const EXTRA_CHANCE = reduces ? 0.15 : 0.35;

  let last = 0;
  let rafId = null;
  let px = 0, py = 0;

  function spawn(x, y) {
    const b = document.createElement("span");
    b.className = "cursor-bubble";

    const dx = (Math.random() - 0.5) * (reduces ? 18 : 28);
    const dy = (Math.random() - 0.5) * (reduces ? 18 : 28);
    const size = 20 + Math.random() * 20; 

    b.style.setProperty("--dx", dx + "px");
    b.style.setProperty("--dy", dy + "px");
    b.style.left = x + "px";
    b.style.top  = y + "px";
    b.style.width = size + "px";
    b.style.height = size + "px";

    root.appendChild(b);
    b.addEventListener("animationend", () => b.remove(), { once: true });
  }

  function schedule() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      spawn(px, py);
      if (Math.random() < EXTRA_CHANCE) {
        spawn(px + (Math.random() - 0.5) * 10, py + (Math.random() - 0.5) * 10);
      }
      rafId = null;
    });
  }

  function onPointerMove(e) {
    const now = performance.now();
    if (now - last < MIN_INTERVAL) return;
    last = now;

    if (e.touches && e.touches.length) {
      px = e.touches[0].clientX;
      py = e.touches[0].clientY;
    } else {
      px = e.clientX;
      py = e.clientY;
    }
    schedule();
  }

  // Desktop + touch
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onPointerMove, { passive: true });
})();
// ===== Contacto: hotfix de visibilidad + animaciones robustas (no reemplaza nada) =====
(() => {
  // 1) Fail-safe: asegurá que el botón "Enviar" nunca quede oculto
  const STYLE_ID = "contact-hotfix-style";
  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = `
      .contact .send{
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(st);
  }

  // 2) Animaciones de la sección Contacto (independientes del resto)
  function runContactAnimations() {
    if (!window.gsap) return; // si GSAP no está, no rompemos nada
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const ease = "power3.out";

    // Card principal
    gsap.from(".contact .card", {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease,
      immediateRender: false, // <- evita que se oculte antes de disparar
      scrollTrigger: window.ScrollTrigger ? {
        trigger: ".contact .card",
        start: "top 90%",
        toggleActions: "play none none reverse",
        invalidateOnRefresh: true
      } : undefined
    });

    // Campos + botón (stagger)
    const inputs = document.querySelectorAll(".contact input, .contact textarea, .contact .send");
    inputs.forEach((el, i) => {
      gsap.from(el, {
        y: 14,
        opacity: 0,
        duration: 0.5,
        ease,
        delay: i * 0.06,
        immediateRender: false,
        scrollTrigger: window.ScrollTrigger ? {
          trigger: ".contact form",
          start: "top 92%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true
        } : undefined
      });
    });
  }

  // Ejecutar cuando la página está lista
  if (document.readyState === "complete") {
    runContactAnimations();
  } else {
    window.addEventListener("load", runContactAnimations);
  }
})();
// === Early reveal del formulario (sin remover GSAP) ===
(() => {
  const targets = document.querySelectorAll(
    ".contact .card, .contact input, .contact textarea, .contact .send"
  );
  if (!targets.length) return;

  // Muestra los elementos ~180px antes de entrar al viewport
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("no-delay");
        // una vez revelado, ya no observamos más (mejor perf)
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "180px 0px", threshold: 0.01 });

  targets.forEach((el) => io.observe(el));
})();
// ===== Animación robusta del formulario =====
(() => {
  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  document
    .querySelectorAll(".contact .no-delay")
    .forEach((el) => el.classList.remove("no-delay"));

  const section = document.querySelector("#contact");
  if (!section) return;

  // 2) Elementos a animar
  const card   = section.querySelector(".card");
  const fields = section.querySelectorAll("input, textarea, .send");
  if (!card || !fields.length) return;

  // 3) Timeline por sección (enter suave, reverse al subir)
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "power3.out" },
    scrollTrigger: {
      trigger: section,          // toda la sección contacto
      start: "top 90%",          // arranca un toque antes
      end: "bottom 60%",
      toggleActions: "play none none reverse",
      once: false,
      invalidateOnRefresh: true
      // markers: true, // <- descomentar si querés ver el trigger
    }
  });

  // Estado inicial solo cuando entra 
  tl.from(card, { y: 24, opacity: 0, duration: 0.8 }, 0);
  tl.from(fields, { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, "-=0.4");

  // 4) Por si el layout cambió
  if (window.ScrollTrigger) {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
})();





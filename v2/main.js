/* NODE LEGION v2 — interactions & FX */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- WebP support check (fallback to jpg hero) ---------- */
  const webpProbe = new Image();
  webpProbe.onerror = () => document.documentElement.classList.add("no-webp");
  webpProbe.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";

  /* ---------- Sticky nav ---------- */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    nav.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      nav.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Headline decode (character scramble) ---------- */
  const GLYPHS = "!<>-_\\/[]{}—=+*^?#01";
  const decodeEl = (el, delay) => {
    const text = el.dataset.text;
    let frame = 0;
    const totalFrames = text.length * 3 + 14;
    const tick = () => {
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const revealAt = i * 3 + 10;
        if (frame >= revealAt) out += text[i];
        else if (frame >= revealAt - 8 && text[i] !== " ") {
          out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        } else out += text[i] === " " ? " " : " ";
      }
      el.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(tick);
      else el.textContent = text;
    };
    setTimeout(() => requestAnimationFrame(tick), delay);
  };
  if (!prefersReducedMotion) {
    document.querySelectorAll(".decode").forEach((el, i) => decodeEl(el, 300 + i * 450));
  }

  /* ---------- Scroll reveal ---------- */
  const revealables = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll(".count");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (prefersReducedMotion) { el.textContent = target + suffix; return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); counterIO.unobserve(entry.target); }
      }),
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIO.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Hero parallax (scroll + mouse) ---------- */
  const hero = document.getElementById("hero");
  const layers = hero.querySelectorAll("[data-depth]");
  let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;
  let parallaxRAF = null;

  const applyParallax = () => {
    parallaxRAF = null;
    const scrollY = Math.min(window.scrollY, hero.offsetHeight);
    // ease mouse toward target for a floaty feel
    mouseX += (targetMX - mouseX) * 0.06;
    mouseY += (targetMY - mouseY) * 0.06;
    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth);
      const y = scrollY * depth * -0.35;
      const mx = mouseX * depth * 22;
      const my = mouseY * depth * 14;
      layer.style.transform = `translate3d(${mx}px, ${y + my}px, 0)`;
    });
    if (Math.abs(targetMX - mouseX) > 0.001 || Math.abs(targetMY - mouseY) > 0.001) {
      parallaxRAF = requestAnimationFrame(applyParallax);
    }
  };
  const queueParallax = () => { if (!parallaxRAF) parallaxRAF = requestAnimationFrame(applyParallax); };

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", queueParallax, { passive: true });
    window.addEventListener("mousemove", (e) => {
      targetMX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMY = (e.clientY / window.innerHeight) * 2 - 1;
      queueParallax();
    }, { passive: true });
  }

  /* ---------- Hero canvas: glowing node network ---------- */
  const canvas = document.getElementById("netCanvas");
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, nodes = [], canvasRAF = null, canvasVisible = true;
  const LINK_DIST = 150;
  const COLORS = ["79, 241, 255", "255, 62, 200", "167, 139, 250"];

  const nodeCount = () => Math.min(70, Math.floor((width * height) / 22000));
  const makeNode = () => ({
    x: Math.random() * width,
    // keep particles mostly in the sky area, above the grid horizon
    y: Math.random() * height * 0.72,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.18,
    r: Math.random() * 1.8 + 0.8,
    c: COLORS[(Math.random() * COLORS.length) | 0],
    tw: Math.random() * Math.PI * 2, // twinkle phase
  });

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes = Array.from({ length: nodeCount() }, makeNode);
  };

  const stepCanvas = (now) => {
    canvasRAF = null;
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -10) n.x = width + 10;
      if (n.x > width + 10) n.x = -10;
      if (n.y < -10) n.y = height * 0.72;
      if (n.y > height * 0.72) n.y = -10;
    }

    // links
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.16;
          ctx.strokeStyle = `rgba(${nodes[i].c}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // glowing dots with twinkle
    for (const n of nodes) {
      const tw = 0.55 + 0.45 * Math.sin(now / 900 + n.tw);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${n.c}, ${0.85 * tw})`;
      ctx.shadowColor = `rgba(${n.c}, 0.9)`;
      ctx.shadowBlur = 8 * tw;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (canvasVisible) canvasRAF = requestAnimationFrame(stepCanvas);
  };
  const startCanvas = () => { if (!canvasRAF && canvasVisible) canvasRAF = requestAnimationFrame(stepCanvas); };

  if (!prefersReducedMotion) {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    // pause when hero scrolls offscreen
    new IntersectionObserver((entries) => {
      canvasVisible = entries[0].isIntersecting;
      if (canvasVisible) startCanvas();
    }).observe(hero);
    startCanvas();
  }

  /* ---------- Timeline progress line ---------- */
  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timelineProgress");
  const updateTimeline = () => {
    const rect = timeline.getBoundingClientRect();
    const viewH = window.innerHeight;
    // 0 when timeline top hits 80% of viewport, 1 when bottom passes 45%
    const progress = (viewH * 0.8 - rect.top) / (rect.height + viewH * 0.35);
    timelineProgress.style.transform = `scaleY(${Math.max(0, Math.min(1, progress))})`;
  };
  if (!prefersReducedMotion) {
    window.addEventListener("scroll", updateTimeline, { passive: true });
    updateTimeline();
  }

  /* ---------- Terminal typing ---------- */
  const termBody = document.getElementById("termBody");
  const termLines = [...termBody.querySelectorAll(".term__line")];
  const typeLines = () => {
    if (prefersReducedMotion) {
      termLines.forEach((l) => (l.textContent = l.dataset.type));
      return;
    }
    let li = 0;
    const typeLine = () => {
      if (li >= termLines.length) return;
      const el = termLines[li];
      const text = el.dataset.type;
      let ci = 0;
      const typeChar = () => {
        el.textContent = text.slice(0, ++ci);
        if (ci < text.length) setTimeout(typeChar, 14 + Math.random() * 22);
        else { li++; setTimeout(typeLine, 240); }
      };
      typeChar();
    };
    typeLine();
  };
  if ("IntersectionObserver" in window) {
    const termIO = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { typeLines(); termIO.disconnect(); }
    }, { threshold: 0.35 });
    termIO.observe(termBody);
  } else {
    typeLines();
  }

  /* ---------- 3D tilt on cards ---------- */
  if (!prefersReducedMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${px * 7}deg) rotateX(${py * -7}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();

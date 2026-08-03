/* ==========================================================================
   Home — opening + sticky horizontal features
   ========================================================================== */

(() => {
  const esc = Site.esc;
  const FEATURED_SLUGS = ["guilty", "rujum", "nahum-tevet-portfolio"];

  /* Optional featured media overrides (home preview only). */
  const FEATURE_MEDIA = {
    "nahum-tevet-portfolio": {
      kind: "video",
      src: "nahum tevet/sofi-copy-hq.mp4?v=1",
      focus: "left",
    },
  };

  function featured() {
    return FEATURED_SLUGS.map((slug) => PROJECTS.find((project) => project.slug === slug)).filter(
      Boolean
    );
  }

  function featureMediaHtml(project, index) {
    const media = FEATURE_MEDIA[project.slug];
    if (media?.kind === "video") {
      const focusClass = media.focus === "left" ? " feature__media--zoom-left" : "";
      const primaryType = /\.webm(\?|$)/i.test(media.src) ? "video/webm" : "video/mp4";
      const fallback = media.fallback
        ? `<source src="${esc(media.fallback)}" type="video/mp4">`
        : "";
      return `
          <div class="feature__media${focusClass}">
            <video muted loop playsinline preload="metadata" draggable="false">
              <source src="${esc(media.src)}" type="${primaryType}">
              ${fallback}
            </video>
          </div>`;
    }

    /* Panels are sized by CSS, so every cover past the first can wait until the
       track scrolls it towards view. The first stays eager so reaching the
       section never shows an empty panel. */
    const load = index === 0 ? "" : ' loading="lazy"';
    return `
          <div class="feature__media">
            <img src="${esc(project.cover)}" alt="" draggable="false"${load} decoding="async">
          </div>`;
  }

  function renderFeature() {
    const items = featured();
    const track = document.querySelector("[data-track]");
    const section = document.querySelector("[data-feature]");

    section.style.setProperty("--feature-count", String(items.length));

    track.innerHTML = items
      .map(
        (project, i) => `
        <a class="feature__panel${project.slug === "nahum-tevet-portfolio" ? " feature__panel--nahum" : ""}" href="${Site.projectUrl(project.slug)}" data-panel="${i}">
          ${featureMediaHtml(project, i)}
          <div class="feature__shade" aria-hidden="true"></div>
          ${
            project.slug === "nahum-tevet-portfolio"
              ? `<div class="feature__glass" aria-hidden="true"></div>`
              : ""
          }
          <div class="feature__body">
            <p class="label feature__meta">
              <span>${Site.pad(i + 1)}</span>
              <span>${esc(project.discipline)}</span>
              <span>${esc(project.year)}</span>
            </p>
            <p class="feature__summary">${esc(project.teaser || project.summary)}</p>
            <span class="feature__cta">View project</span>
          </div>
        </a>`
      )
      .join("");
  }

  /* Vertical scroll through the tall .feature section drives translateX. */
  function initFeatureScroll() {
    const section = document.querySelector("[data-feature]");
    const track = document.querySelector("[data-track]");
    const fill = document.querySelector("[data-feature-fill]");
    const count = document.querySelector("[data-feature-count]");
    const panels = [...track.querySelectorAll(".feature__panel")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || panels.length < 2) {
      panels[0]?.classList.add("is-active");
      panels[0]?.querySelectorAll("video").forEach((video) => {
        video.play().catch(() => {});
      });
      return;
    }

    let frame = null;
    let travel = 0;
    let maxX = 0;
    let lastIndex = -1;

    /* offsetHeight and scrollWidth force layout, so they are read on resize
       rather than on every scroll frame. */
    const measure = () => {
      travel = section.offsetHeight - innerHeight;
      maxX = track.scrollWidth - innerWidth;
    };

    const paint = () => {
      frame = null;
      if (travel <= 0) return;

      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const x = progress * maxX;

      track.style.transform = `translate3d(${-x}px, 0, 0)`;
      fill.style.width = `${(progress * 100).toFixed(2)}%`;

      const index = Math.min(panels.length - 1, Math.round(progress * (panels.length - 1)));
      if (index === lastIndex) return;
      lastIndex = index;

      count.textContent = `${Site.pad(index + 1)} / ${Site.pad(panels.length)}`;
      panels.forEach((panel, i) => {
        const active = i === index;
        panel.classList.toggle("is-active", active);
        panel.querySelectorAll("video").forEach((video) => {
          if (active) video.play().catch(() => {});
          else video.pause();
        });
      });
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const remeasure = () => {
      measure();
      request();
    };

    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", remeasure);
    addEventListener("load", remeasure);

    measure();
    paint();
  }

  /* Spline object name → project + hover subject (shown on the credits button). */
  const SPLINE_LINKS = [
    { match: /chair/i, slug: "nahum-tevet-portfolio", subject: ["web", "design"] },
    { match: /box/i, slug: "coming-soon", subject: ["coming", "soon"] },
    { match: /rock/i, slug: "rujum", subject: ["game", "design"] },
    { match: /cube/i, slug: "lens", subject: ["creative", "coding"] },
    { match: /coin/i, slug: "coming-soon", subject: ["coming", "soon"] },
    { match: /bottle|winebottle/i, slug: "herzl-16", subject: ["brand", "collateral"] },
    { match: /scarf/i, slug: "guilty", subject: ["art", "direction"] },
    { match: /torus/i, slug: "torus", subject: ["PERSONAL", "ID"] },
  ];

  const CREDITS_DEFAULT = "credits";

  function meshLabel(mesh) {
    const parts = [];
    let node = mesh;
    let depth = 0;
    while (node && depth < 8) {
      if (node.name) parts.push(node.name);
      node = node.parent;
      depth += 1;
    }
    return parts.join(" ");
  }

  function linkForLabel(label) {
    if (!label) return null;
    for (const route of SPLINE_LINKS) {
      if (route.match.test(label)) return route;
    }
    return null;
  }

  function linkFromObject(object, linkByUuid) {
    let node = object;
    let depth = 0;
    while (node && depth < 8) {
      if (linkByUuid.has(node.uuid)) return linkByUuid.get(node.uuid);
      const link = linkForLabel(node.name || "");
      if (link) return link;
      node = node.parent;
      depth += 1;
    }
    return linkForLabel(meshLabel(object));
  }

  function goToProject(slug) {
    if (!slug || document.body.classList.contains("is-leaving")) return;
    Site.leaveTo(Site.projectUrl(slug));
  }

  /* Object interaction events make Spline raycast on every pointer move,
     which freezes a heavy scene. We handle hover/click ourselves instead. */
  function silenceSplineObjectEvents(app) {
    const EVENT_KEYS = [
      "mouseDown",
      "MouseDown",
      "mouseUp",
      "MouseUp",
      "mouseHover",
      "MouseHover",
      "mouseMove",
      "MouseMove",
    ];

    const clearMap = (map) => {
      if (!map || typeof map !== "object") return;
      EVENT_KEYS.forEach((key) => {
        if (!(key in map)) return;
        try {
          map[key] = Array.isArray(map[key]) ? [] : {};
        } catch {
          /* ignore */
        }
      });
    };

    try {
      (app.getAllObjects?.() || []).forEach((obj) => {
        clearMap(obj?.events);
        clearMap(obj?._events);
        clearMap(obj?.event);
        EVENT_KEYS.forEach((key) => {
          try {
            if (typeof obj.removeEvent === "function") obj.removeEvent(key);
          } catch {
            /* ignore */
          }
        });
      });
    } catch {
      /* ignore */
    }

    const em = app.eventManager;
    if (!em || typeof em !== "object") return;
    clearMap(em.events);
    clearMap(em.handlers);
    clearMap(em._events);
    clearMap(em.eventMap);

    ["interactiveObjects", "objects", "_objects", "targets"].forEach((key) => {
      try {
        if (Array.isArray(em[key])) em[key].length = 0;
      } catch {
        /* ignore */
      }
    });
  }

  function initSplineScene() {
    const sceneHost = document.querySelector(".hero__scene");
    const viewer = sceneHost?.querySelector("spline-viewer");
    if (!sceneHost || !viewer) return;

    const creditsBtn = document.querySelector("[data-nav-credits]");
    const creditsLabel = document.querySelector("[data-credits-label]");

    let bound = false;
    let bindTries = 0;

    const bind = () => {
      if (bound) return;
      const app = viewer._spline;
      const ctx = app?.eventManager?.eventContext;
      const canvas = app?.canvas;
      const scene = app?._scene;
      /* Wait until the scene has actually finished loading — `_spline` can
         exist while meshes are still empty on a large publish. */
      if (!app || !canvas || !scene || !viewer._loaded) {
        if (bindTries < 120) {
          bindTries += 1;
          requestAnimationFrame(bind);
        }
        return;
      }

      const linkByUuid = new Map();
      const meshLinks = new Map();
      const hitMeshes = [];

      const remember = (uuid, link) => {
        if (uuid && link) linkByUuid.set(uuid, link);
      };

      const collectMeshes = () => {
        linkByUuid.clear();
        meshLinks.clear();
        hitMeshes.length = 0;

        (app.getAllObjects?.() || []).forEach((obj) => {
          remember(obj.uuid, linkForLabel(obj.name || ""));
          remember(obj.id, linkForLabel(obj.name || ""));
        });

        const collect = (object) => {
          if (!object) return;
          const isMesh = object.type === "Mesh" || object.isMesh;
          if (!isMesh || !object.geometry || object.visible === false) return;
          const link = linkFromObject(object, linkByUuid) || linkForLabel(meshLabel(object));
          if (!link) return;
          remember(object.uuid, link);
          meshLinks.set(object.uuid, link);
          hitMeshes.push(object);
        };

        if (typeof scene.traverseEntity === "function") scene.traverseEntity(collect);
        else if (typeof scene.traverse === "function") scene.traverse(collect);
        else if (scene.children) {
          const walk = (node) => {
            collect(node);
            node.children?.forEach(walk);
          };
          scene.children.forEach(walk);
        }
      };

      collectMeshes();
      if (!hitMeshes.length) {
        if (bindTries < 120) {
          bindTries += 1;
          requestAnimationFrame(bind);
        }
        return;
      }

      bound = true;

      try {
        silenceSplineObjectEvents(app);
      } catch {
        /* ignore */
      }

      const camera = app._camera || app.camera || ctx?.camera || null;
      let raycaster = null;
      try {
        const Ctor = ctx?.raycaster?.constructor;
        if (Ctor && camera) {
          raycaster = new Ctor();
          if (raycaster.layers?.enableAll) raycaster.layers.enableAll();
          else if (raycaster.layers?.enable) {
            for (let i = 0; i < 32; i++) raycaster.layers.enable(i);
          }
        }
      } catch {
        raycaster = null;
      }

      let active = false;
      let inside = false;
      let pointerDown = false;
      let didDrag = false;
      let pointerX = 0;
      let pointerY = 0;
      let downX = 0;
      let downY = 0;
      let downLink = null;
      let hoverLink = null;
      let pressHot = false;
      let shownKey = null;
      let hoverRaf = 0;
      let canvasRect = canvas.getBoundingClientRect();
      const ndc = { x: 0, y: 0 };
      const DRAG_PX = 10;

      const measure = () => {
        canvasRect = canvas.getBoundingClientRect();
      };
      measure();

      let measureFrame = 0;
      addEventListener(
        "resize",
        () => {
          if (measureFrame) return;
          measureFrame = requestAnimationFrame(() => {
            measureFrame = 0;
            measure();
          });
        },
        { passive: true }
      );

      const hitLink = (clientX, clientY) => {
        if (!raycaster || !camera || !hitMeshes.length) return null;
        const w = canvasRect.width || 1;
        const h = canvasRect.height || 1;
        ndc.x = ((clientX - canvasRect.left) / w) * 2 - 1;
        ndc.y = -((clientY - canvasRect.top) / h) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(hitMeshes, false)[0];
        return hit ? meshLinks.get(hit.object.uuid) || null : null;
      };

      const PINK_CURSOR = 'url("assets/cursor.svg?v=9") 25 25, auto';
      const GREEN_CURSOR = 'url("assets/cursor-spline.svg?v=9") 25 25, pointer';

      const paintCursor = (mode) => {
        const value = mode === "green" ? GREEN_CURSOR : mode === "pink" ? PINK_CURSOR : "";
        try {
          if (value) canvas.style.setProperty("cursor", value, "important");
          else canvas.style.removeProperty("cursor");
        } catch {
          /* ignore */
        }
      };

      const setCreditsSubject = (lines) => {
        if (!creditsBtn || !creditsLabel) return;
        if (document.body.classList.contains("nav-credits")) {
          shownKey = "__credits-open__";
          return;
        }
        const key = lines ? lines.join(" ") : "";
        if (key === shownKey) return;
        shownKey = key;

        if (!lines) {
          creditsBtn.classList.remove("is-subject");
          creditsLabel.textContent = CREDITS_DEFAULT;
          return;
        }

        creditsBtn.classList.add("is-subject");
        creditsLabel.textContent = lines.join(" ");
      };

      const setHover = (link) => {
        hoverLink = link || null;
        const next = Boolean(link);
        if (active !== next) {
          active = next;
          sceneHost.classList.toggle("is-hot", active);
        }
        if (inside) paintCursor(active ? "green" : "pink");
        setCreditsSubject(link?.subject || null);
      };

      const probeHover = () => {
        if (!inside || pointerDown) return;
        try {
          setHover(hitLink(pointerX, pointerY));
        } catch {
          setHover(null);
        }
      };

      /* One raycast per frame while moving — responsive cursor without
         hammering the heavy scene on every pointer event. */
      const onMove = (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (event.buttons !== 0) {
          if (pointerDown) {
            didDrag = true;
            downLink = null;
            if (pressHot) paintCursor("green");
          }
          if (hoverRaf) {
            cancelAnimationFrame(hoverRaf);
            hoverRaf = 0;
          }
          return;
        }

        if (!inside) {
          inside = true;
          sceneHost.classList.add("is-cursor-ready");
          if (!active) paintCursor("pink");
        }

        if (!hoverRaf) {
          hoverRaf = requestAnimationFrame(() => {
            hoverRaf = 0;
            probeHover();
          });
        }
      };

      const pointerInCanvas = (clientX, clientY) => {
        measure();
        return (
          clientX >= canvasRect.left &&
          clientX <= canvasRect.right &&
          clientY >= canvasRect.top &&
          clientY <= canvasRect.bottom
        );
      };

      const onLeave = (event) => {
        const x = event.clientX;
        const y = event.clientY;
        if (Number.isFinite(x) && Number.isFinite(y) && pointerInCanvas(x, y)) return;

        if (hoverRaf) {
          cancelAnimationFrame(hoverRaf);
          hoverRaf = 0;
        }
        pointerDown = false;
        didDrag = false;
        inside = false;
        pressHot = false;
        sceneHost.classList.remove("is-cursor-ready", "is-hot");
        paintCursor("");
        setHover(null);
        downLink = null;
      };

      const onDown = (event) => {
        if (event.button !== 0) return;
        pointerDown = true;
        didDrag = false;
        downX = event.clientX;
        downY = event.clientY;
        measure();
        let link = null;
        try {
          link = hitLink(event.clientX, event.clientY) || hoverLink;
        } catch {
          link = hoverLink;
        }
        downLink = link;
        pressHot = Boolean(link);
        if (hoverRaf) {
          cancelAnimationFrame(hoverRaf);
          hoverRaf = 0;
        }
        /* Keep the green cursor on press when over a linked object. */
        if (link) {
          inside = true;
          hoverLink = link;
          active = true;
          sceneHost.classList.add("is-cursor-ready", "is-hot");
          setCreditsSubject(link.subject || null);
          paintCursor("green");
          /* Spline may set a grab cursor after us — re-assert next frame. */
          requestAnimationFrame(() => {
            if (pointerDown && pressHot) paintCursor("green");
          });
        } else {
          paintCursor("pink");
        }
      };

      const onUp = (event) => {
        if (event.button !== 0) return;
        if (!pointerDown) return;
        const wasDrag =
          didDrag || Math.hypot(event.clientX - downX, event.clientY - downY) > DRAG_PX;
        const link = downLink;
        pointerDown = false;
        didDrag = false;
        downLink = null;
        pressHot = false;

        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!wasDrag) {
          let chosen = link;
          if (!chosen) {
            try {
              measure();
              chosen = hitLink(event.clientX, event.clientY);
            } catch {
              chosen = null;
            }
          }
          if (chosen?.slug) goToProject(chosen.slug);
          else if (pointerInCanvas(pointerX, pointerY)) {
            inside = true;
            sceneHost.classList.add("is-cursor-ready");
            probeHover();
          }
        } else if (pointerInCanvas(pointerX, pointerY)) {
          inside = true;
          sceneHost.classList.add("is-cursor-ready");
          probeHover();
        }
      };

      /* Single listener path — duplicate canvas+viewer handlers were
         flipping leave/enter and making the cursor flicker. */
      const opts = { passive: true };
      canvas.addEventListener("pointermove", onMove, opts);
      canvas.addEventListener("pointerdown", onDown, opts);
      canvas.addEventListener("pointerup", onUp, opts);
      canvas.addEventListener("pointercancel", onLeave, opts);
      viewer.addEventListener("pointerleave", onLeave, opts);
      window.addEventListener("pointerup", onUp, opts);
    };

    const startBind = () => {
      bindTries = 0;
      bind();
    };

    viewer.addEventListener("load-complete", startBind);
    if (viewer._loaded) startBind();
  }

  function boot() {
    renderFeature();
    Site.init();
    initFeatureScroll();
    initSplineScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

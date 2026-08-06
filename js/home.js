/* ==========================================================================
   Home — opening + featured project previews (horizontal desktop / vertical phone)
   ========================================================================== */

(() => {
  const esc = Site.esc;

  /* Home preview order (Coming Soon is never listed). */
  const FEATURED_SLUGS = [
    "guilty",
    "rujum",
    "nahum-tevet-portfolio",
    "lens",
    "torus",
    "herzl-16",
  ];

  /* Optional featured media overrides (home preview only). When absent, cover is used. */
  const FEATURE_MEDIA = {
    "nahum-tevet-portfolio": {
      kind: "video",
      src: "nahum tevet/sofi-copy-hq.mp4?v=1",
    },
    lens: {
      kind: "video",
      src: "lens/lens-flat.mp4?v=alpha",
    },
    torus: {
      /* Auto-cycling card pile (project page carousel) — desktop + phone layouts. */
      kind: "pile",
      pile: [
        "Personal ID/Carousel/carousel-01.mp4?v=2",
        "Personal ID/Carousel/carousel-02.mp4?v=2",
        "Personal ID/Carousel/carousel-03.mp4?v=2",
        "Personal ID/Carousel/carousel-04.mp4?v=2",
        "Personal ID/Carousel/carousel-05.mp4?v=2",
        "Personal ID/Carousel/carousel-06.mp4?v=2",
        "Personal ID/Carousel/carousel-07.mp4?v=2",
        "Personal ID/Carousel/carousel-08.mp4?v=2",
      ],
    },
    "herzl-16": {
      kind: "image",
      /* Full-res concrete-wall mockup (desk + phone). */
      src: "Herzl16/herzl-home-preview.png?v=1",
      mobileSrc: "Herzl16/herzl-home-preview.png?v=1",
    },
  };

  const VIDEO_MIME = {
    webm: "video/webm",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };

  function videoMime(url) {
    const ext = String(url).split("?")[0].split(".").pop().toLowerCase();
    return VIDEO_MIME[ext] || "video/mp4";
  }

  function featured() {
    return FEATURED_SLUGS.map((slug) => PROJECTS.find((project) => project.slug === slug)).filter(
      (project) => project && !project.comingSoon
    );
  }

  function featureVideoSources(src, fallback, mobileSrc) {
    const isPhone = matchMedia("(max-width: 700px)").matches;
    const primary = isPhone && mobileSrc ? mobileSrc : src;
    const sources = [`<source src="${esc(primary)}" type="${videoMime(primary)}">`];
    if (isPhone && mobileSrc && src && mobileSrc !== src) {
      sources.push(`<source src="${esc(src)}" type="${videoMime(src)}">`);
    }
    if (fallback && fallback !== primary && fallback !== src) {
      sources.push(`<source src="${esc(fallback)}" type="${videoMime(fallback)}">`);
    }
    return sources.join("\n              ");
  }

  function featureMediaHtml(project, index) {
    const media = FEATURE_MEDIA[project.slug];

    if (media?.kind === "pile" && media.pile?.length) {
      const cards = media.pile
        .map(
          (src, j) => `
            <figure class="feature-pile__card" data-feature-pile-index="${j}">
              <div class="feature-pile__frame">
                <video muted loop playsinline preload="${j < 3 ? "metadata" : "none"}" draggable="false">
                  <source src="${esc(src)}" type="${videoMime(src)}">
                </video>
              </div>
            </figure>`
        )
        .join("");
      return `
          <div class="feature__media feature__media--pile" aria-hidden="true">
            <div class="feature-pile" data-feature-pile>
              <div class="feature-pile__stack">${cards}
              </div>
            </div>
          </div>`;
    }

    if (media?.kind === "video") {
      const focusClass = media.focus === "left" ? " feature__media--zoom-left" : "";
      return `
          <div class="feature__media${focusClass}">
            <video muted loop playsinline preload="metadata" draggable="false">
              ${featureVideoSources(media.src, media.fallback, media.mobileSrc)}
            </video>
          </div>`;
    }

    /* Image covers (optional phone-only crop via mobileSrc). */
    const load = index === 0 ? "" : ' loading="lazy"';
    const isPhone = matchMedia("(max-width: 700px)").matches;
    const cover =
      media?.kind === "image"
        ? isPhone && media.mobileSrc
          ? media.mobileSrc
          : media.src || project.cover
        : isPhone && media?.mobileSrc && !media?.kind
          ? media.mobileSrc
          : project.cover;
    return `
          <div class="feature__media">
            <img src="${esc(cover)}" alt="" draggable="false"${load} decoding="async">
          </div>`;
  }

  function panelClass(project) {
    if (project.slug === "nahum-tevet-portfolio") return " feature__panel--nahum";
    if (project.slug === "herzl-16") return " feature__panel--herzl";
    if (project.slug === "lens") return " feature__panel--lens";
    if (project.slug === "torus") return " feature__panel--torus";
    return "";
  }

  function renderFeature() {
    const items = featured();
    const track = document.querySelector("[data-track]");
    const section = document.querySelector("[data-feature]");

    section.style.setProperty("--feature-count", String(items.length));

    track.innerHTML = items
      .map(
        (project, i) => `
        <a class="feature__panel${panelClass(project)}" href="${Site.projectUrl(project.slug)}" data-panel="${i}">
          ${featureMediaHtml(project, i)}
          <div class="feature__shade" aria-hidden="true"></div>
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

  /* Personal ID card pile: desktop spread + phone (tighter, centered) layout.
     Auto-cycles while the panel is active. */
  function initFeaturePiles() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phoneMq = matchMedia("(max-width: 700px)");
    const MESS = [
      { x: -0.62, y: -0.42, r: -14, s: 0.96 },
      { x: 0.42, y: -0.52, r: 11, s: 0.9 },
      { x: -0.14, y: -0.22, r: 5, s: 1 },
      { x: 0.58, y: 0.06, r: -17, s: 0.92 },
      { x: -0.68, y: 0.26, r: 15, s: 0.88 },
      { x: 0.14, y: 0.4, r: -7, s: 0.97 },
      { x: -0.44, y: 0.56, r: 19, s: 0.91 },
      { x: 0.54, y: 0.48, r: -12, s: 0.89 },
    ];
    /* Match project page mobile pile — tight cluster, viewport-centered. */
    const MESS_MOBILE = [
      { x: -0.22, y: -0.34, r: -11, s: 0.96 },
      { x: 0.24, y: -0.38, r: 9, s: 0.9 },
      { x: -0.08, y: -0.12, r: 4, s: 1 },
      { x: 0.28, y: 0.02, r: -13, s: 0.92 },
      { x: -0.3, y: 0.16, r: 12, s: 0.88 },
      { x: 0.1, y: 0.28, r: -6, s: 0.97 },
      { x: -0.2, y: 0.4, r: 14, s: 0.91 },
      { x: 0.26, y: 0.36, r: -10, s: 0.89 },
    ];
    const CYCLE_MS = 2400;

    return [...document.querySelectorAll("[data-feature-pile]")].map((root) => {
      const panel = root.closest(".feature__panel");
      const stack = root.querySelector(".feature-pile__stack");
      const cards = [...root.querySelectorAll(".feature-pile__card")];
      if (!panel || !stack || cards.length < 2) return null;

      const n = cards.length;
      let top = 0;
      let live = false;
      let cycleId = null;

      const depthOf = (i) => (i - top + n) % n;

      const paint = () => {
        const phone = phoneMq.matches;
        const messList = phone ? MESS_MOBILE : MESS;
        const spread = phone ? 0.72 : 0.48;
        const w = stack.clientWidth || panel.clientWidth;
        const h = stack.clientHeight || panel.clientHeight;

        cards.forEach((card, i) => {
          const depth = depthOf(i);
          const mess = messList[i % messList.length];
          const isTop = depth === 0;
          const x = mess.x * w * spread;
          const y = mess.y * h * spread;
          const r = mess.r;
          const scale = mess.s * (isTop ? 1.05 : 1) * (reduced ? 0.95 : 1);

          card.classList.toggle("is-active", isTop);
          card.style.zIndex = String(n - depth);
          card.style.opacity = "1";
          card.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r}deg) scale(${scale.toFixed(4)})`;
        });
      };

      const syncVideos = () => {
        cards.forEach((card) => {
          const video = card.querySelector("video");
          if (!video) return;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          if (live && !reduced) {
            if (video.paused) video.play().catch(() => {});
          } else if (!video.paused) {
            video.pause();
          }
        });
      };

      const step = () => {
        top = (top + 1) % n;
        paint();
        syncVideos();
      };

      const stopCycle = () => {
        if (cycleId) {
          clearInterval(cycleId);
          cycleId = null;
        }
      };

      const startCycle = () => {
        stopCycle();
        if (reduced || !live) return;
        cycleId = setInterval(step, CYCLE_MS);
      };

      const setLive = (next) => {
        live = next;
        if (live) {
          paint();
          syncVideos();
          startCycle();
        } else {
          stopCycle();
          syncVideos();
        }
      };

      paint();
      addEventListener("resize", () => {
        paint();
        if (live) startCycle();
      });

      return { panel, setLive };
    }).filter(Boolean);
  }

  /* Desktop: vertical page scroll pans panels horizontally (sticky pin).
     Mobile: stacked vertical panels — activate whichever is closest mid-screen. */
  function initFeatureScroll(pileControllers = []) {
    const section = document.querySelector("[data-feature]");
    const track = document.querySelector("[data-track]");
    const fill = document.querySelector("[data-feature-fill]");
    const count = document.querySelector("[data-feature-count]");
    const panels = [...track.querySelectorAll(".feature__panel")];
    if (!section || !panels.length) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Keep in sync with home.css @media (max-width: 700px). */
    const phoneMq = matchMedia("(max-width: 700px)");
    let frame = null;
    let travel = 0;
    let maxX = 0;
    let lastIndex = -1;

    const setActive = (index) => {
      if (index === lastIndex || index < 0) return;
      lastIndex = index;

      if (count) {
        count.textContent = `${Site.pad(index + 1)} / ${Site.pad(panels.length)}`;
      }

      panels.forEach((panel, i) => {
        const active = i === index;
        panel.classList.toggle("is-active", active);
        if (reduced) return;
        /* Pile videos are owned by the pile controller. Skip them here. */
        panel.querySelectorAll(".feature__media:not(.feature__media--pile) video").forEach((video) => {
          if (active) video.play().catch(() => {});
          else video.pause();
        });
      });

      pileControllers.forEach((ctrl) => {
        ctrl.setLive(ctrl.panel.classList.contains("is-active"));
      });
    };

    const measure = () => {
      travel = Math.max(0, section.offsetHeight - innerHeight);
      maxX = Math.max(0, track.scrollWidth - innerWidth);
    };

    const paintHorizontal = () => {
      const rect = section.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < innerHeight;
      section.classList.toggle("is-in-view", inView);

      if (travel <= 0) {
        track.style.transform = "translate3d(0, 0, 0)";
        if (fill) fill.style.width = "0%";
        setActive(0);
        return;
      }

      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const x = progress * maxX;
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
      if (fill) fill.style.width = `${(progress * 100).toFixed(2)}%`;

      const index = Math.min(
        panels.length - 1,
        Math.round(progress * Math.max(1, panels.length - 1))
      );
      setActive(index);
    };

    const paintVertical = () => {
      track.style.transform = "";
      const rect = section.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < innerHeight;
      section.classList.toggle("is-in-view", inView);

      const mid = innerHeight * 0.5;
      let bestIdx = 0;
      let bestDist = Infinity;

      panels.forEach((panel, i) => {
        const r = panel.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight) return;
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      setActive(bestIdx);

      if (fill) {
        const vTravel = Math.max(1, section.offsetHeight - innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / vTravel));
        fill.style.width = `${(progress * 100).toFixed(2)}%`;
      }
    };

    const paint = () => {
      frame = null;
      if (phoneMq.matches) paintVertical();
      else paintHorizontal();
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const remeasure = () => {
      lastIndex = -1;
      if (!phoneMq.matches) measure();
      request();
    };

    if (reduced) {
      panels.forEach((panel) => panel.classList.add("is-active"));
      panels.forEach((panel) => {
        panel.querySelectorAll("video").forEach((video) => {
          video.play().catch(() => {});
        });
      });
      pileControllers.forEach((ctrl) => ctrl.setLive(true));
      return;
    }

    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", remeasure);
    addEventListener("load", remeasure);
    if (phoneMq.addEventListener) phoneMq.addEventListener("change", remeasure);
    else phoneMq.addListener(remeasure);

    remeasure();
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
    { match: /torus/i, slug: "torus", subject: ["AI", "MOTION"] },
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

  /* Mobile only: pull the Spline camera to its widest framing (true camera
     distance / orthographic zoom — never CSS scale). Desktop stays at the
     published baseline. Match project page phone breakpoint (700px). */
  const PHONE_MQ = "(max-width: 700px)";
  /* Distance multiplier from the published camera: higher = more zoomed out. */
  const MOBILE_ZOOM_OUT = 3.1;

  function applyMobileSplineZoomOut(app, camera) {
    if (!app || !camera) return;

    const baseline = applyMobileSplineZoomOut._baseline || (applyMobileSplineZoomOut._baseline = {
      saved: false,
      applied: false,
      pos: null,
      fov: null,
      zoom: null,
      controlDist: null,
    });

    const controls =
      app._controls ||
      app.controls ||
      app._orbitControls ||
      app.orbitControls ||
      app.eventManager?.eventContext?.controls ||
      null;

    const readPos = () => {
      const p = camera.position;
      if (!p) return null;
      if (typeof p.clone === "function") return p.clone();
      return { x: p.x, y: p.y, z: p.z };
    };

    const writePos = (pos) => {
      if (!pos || !camera.position) return;
      camera.position.x = pos.x;
      camera.position.y = pos.y;
      camera.position.z = pos.z;
    };

    const saveBaseline = () => {
      if (baseline.saved) return;
      baseline.pos = readPos();
      if (typeof camera.fov === "number") baseline.fov = camera.fov;
      if (typeof camera.zoom === "number") baseline.zoom = camera.zoom;
      if (controls && typeof controls.getDistance === "function") {
        try {
          baseline.controlDist = controls.getDistance();
        } catch {
          baseline.controlDist = null;
        }
      }
      baseline.saved = true;
    };

    const restoreBaseline = () => {
      if (!baseline.saved || !baseline.applied) return;
      writePos(baseline.pos);
      if (baseline.fov != null && "fov" in camera) camera.fov = baseline.fov;
      if (baseline.zoom != null && "zoom" in camera) camera.zoom = baseline.zoom;
      camera.updateProjectionMatrix?.();
      controls?.update?.();
      baseline.applied = false;
    };

    if (!matchMedia(PHONE_MQ).matches) {
      restoreBaseline();
      return;
    }

    saveBaseline();
    if (!baseline.saved || !baseline.pos) return;

    /* Always rebuild from baseline so orientation/resizes don't stack. */
    writePos(baseline.pos);
    if (baseline.fov != null && "fov" in camera) camera.fov = baseline.fov;
    if (baseline.zoom != null && "zoom" in camera) camera.zoom = baseline.zoom;

    let zoomed = false;

    try {
      /* 1) Orbit controls: go to maxDistance (most zoomed out). */
      if (controls) {
        const target = controls.target;
        let maxDist =
          typeof controls.maxDistance === "number" && isFinite(controls.maxDistance)
            ? controls.maxDistance
            : null;
        /* Infinite / huge maxDistance: use a strong pull-back from baseline. */
        if (maxDist == null || maxDist > 1e6) maxDist = null;

        if (target && camera.position) {
          const ox = baseline.pos.x - target.x;
          const oy = baseline.pos.y - target.y;
          const oz = baseline.pos.z - target.z;
          const baseLen = Math.hypot(ox, oy, oz) || 1;
          const want = maxDist != null ? Math.max(maxDist, baseLen * MOBILE_ZOOM_OUT) : baseLen * MOBILE_ZOOM_OUT;
          const scale = want / baseLen;
          camera.position.x = target.x + ox * scale;
          camera.position.y = target.y + oy * scale;
          camera.position.z = target.z + oz * scale;
          try {
            if (typeof controls.maxDistance === "number" && controls.maxDistance < want) {
              controls.maxDistance = want;
            }
          } catch {
            /* ignore */
          }
          controls.update?.();
          zoomed = true;
        } else if (typeof controls.dollyOut === "function") {
          controls.dollyOut(MOBILE_ZOOM_OUT);
          controls.update?.();
          zoomed = true;
        }
      }

      /* 2) Orthographic camera: lower zoom = zoom out. */
      if (!zoomed && camera.isOrthographicCamera && typeof camera.zoom === "number") {
        camera.zoom = Math.max(0.08, (baseline.zoom ?? camera.zoom) / MOBILE_ZOOM_OUT);
        camera.updateProjectionMatrix?.();
        zoomed = true;
      }

      /* 3) Perspective without orbit: pull back from scene origin. */
      if (!zoomed && camera.position && baseline.pos) {
        camera.position.x = baseline.pos.x * MOBILE_ZOOM_OUT;
        camera.position.y = baseline.pos.y * MOBILE_ZOOM_OUT;
        camera.position.z = baseline.pos.z * MOBILE_ZOOM_OUT;
        if (typeof camera.fov === "number") {
          camera.fov = Math.min(88, (baseline.fov ?? camera.fov) * 1.35);
        }
        camera.updateProjectionMatrix?.();
        zoomed = true;
      }

      /* Extra FOV open on phones when we already pulled position (feels roomier). */
      if (zoomed && typeof camera.fov === "number" && !camera.isOrthographicCamera) {
        const baseFov = baseline.fov ?? camera.fov;
        camera.fov = Math.min(88, Math.max(camera.fov, baseFov * 1.28));
        camera.updateProjectionMatrix?.();
      }
    } catch {
      /* ignore runtime differences between Spline builds */
    }

    if (zoomed) {
      baseline.applied = true;
      camera.updateMatrixWorld?.(true);
    }
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

      /* Phone: widest camera framing. No-op on desktop; restores if resized.
         Re-apply after Spline settles — scenes often rewrite the camera once. */
      applyMobileSplineZoomOut(app, camera);
      const phoneMq = matchMedia(PHONE_MQ);
      const onPhoneZoom = () => applyMobileSplineZoomOut(app, camera);
      if (phoneMq.addEventListener) phoneMq.addEventListener("change", onPhoneZoom);
      else phoneMq.addListener(onPhoneZoom);
      addEventListener("orientationchange", () => {
        requestAnimationFrame(onPhoneZoom);
      });
      [120, 400, 900, 1600].forEach((ms) => setTimeout(onPhoneZoom, ms));

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

      const PINK_CURSOR = 'url("assets/cursor.svg?v=10") 30 30, auto';
      const GREEN_CURSOR = 'url("assets/cursor-spline.svg?v=10") 30 30, pointer';

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
    const piles = initFeaturePiles();
    initFeatureScroll(piles);
    initSplineScene();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* ==========================================================================
   Spline scenes — deferred viewer module, mobile-safe touch, loading state

   The viewer bundle is large, so it is fetched only once a scene host is near
   the viewport and the browser has gone idle. Keeping it out of <head> means
   fonts, CSS and the first paint are never queued behind it.
   ========================================================================== */

(() => {
  const VIEWER_SRC = "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";

  /* Start fetching slightly before a scene scrolls into view. */
  const ROOT_MARGIN = "200px";

  /* Stop showing the loading state after this long so a blocked CDN or a WebGL
     failure leaves the fallback background rather than a scene pulsing forever. */
  const LOAD_TIMEOUT_MS = 20000;

  /* Vertical panning and pinch-zoom stay with the page; the scene keeps taps
     and horizontal drags. Without this the canvas swallows touch-scrolling. */
  const TOUCH_ACTION = "pan-y pinch-zoom";

  let viewerModule = null;

  /* One module fetch per page however many scenes ask for it. */
  function loadViewerModule() {
    if (viewerModule) return viewerModule;

    viewerModule = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${VIEWER_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.type = "module";
      script.src = VIEWER_SRC;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });

    return viewerModule;
  }

  function whenIdle(run) {
    if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 150);
  }

  /* The <canvas> lives in the viewer's shadow root, where page CSS cannot reach
     it. An ancestor touch-action already constrains it, but setting it directly
     covers engines that let the canvas opt back in. */
  function relaxCanvasTouch(viewer) {
    const canvas = viewer.shadowRoot?.querySelector("canvas") || viewer._spline?.canvas;
    if (canvas) canvas.style.touchAction = TOUCH_ACTION;
  }

  const LOADER_SRC = "assets/loader/goniis-portfolio.mp4?v=1";

  function startLoaderVideo(host) {
    const el = host.querySelector(".scene__loader");
    if (!el) return () => {};

    let video = el.querySelector("video.scene__loader-video");
    if (!video) {
      video = document.createElement("video");
      video.className = "scene__loader-video";
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("loop", "");
      video.setAttribute("preload", "auto");
      video.setAttribute("aria-hidden", "true");
      video.disablePictureInPicture = true;
      const source = document.createElement("source");
      source.src = LOADER_SRC;
      source.type = "video/mp4";
      video.appendChild(source);
      el.appendChild(video);
    }

    video.loop = true;
    video.muted = true;
    video.currentTime = 0;

    const play = () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.pause();
        return;
      }
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) play();
    else video.addEventListener("loadeddata", play, { once: true });

    return () => {
      video.pause();
    };
  }

  function watch(host) {
    const viewer = host.querySelector("spline-viewer");
    if (!viewer) return;

    host.classList.add("is-scene-loading");
    const stopLoader = startLoaderVideo(host);

    let timer = 0;

    const settle = (state) => {
      clearTimeout(timer);
      stopLoader();
      host.classList.remove("is-scene-loading");
      host.classList.add(state);
    };

    viewer.addEventListener(
      "load-complete",
      () => {
        settle("is-scene-ready");
        relaxCanvasTouch(viewer);
      },
      { once: true }
    );

    viewer.addEventListener("error", () => settle("is-scene-failed"), { once: true });

    const start = () => {
      timer = setTimeout(() => settle("is-scene-failed"), LOAD_TIMEOUT_MS);
      loadViewerModule().catch(() => settle("is-scene-failed"));
    };

    if (!("IntersectionObserver" in window)) {
      whenIdle(start);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        whenIdle(start);
      },
      { rootMargin: ROOT_MARGIN }
    );

    observer.observe(host);
  }

  function init() {
    document.querySelectorAll("[data-spline-host]").forEach(watch);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ==========================================================================
   Shared behaviour: chrome injection, menu, page transitions, reveals
   ========================================================================== */

const Site = (() => {
  const pad = (n) => String(n).padStart(2, "0");

  /* Proportional layout unit — the JS mirror of the --u token in css/base.css.
     Art-directed offsets were composed at REF_WIDTH, so this returns 1 there.
     Below MOBILE_MAX the floor is dropped so phones scale in true proportion,
     matching the media query on that token. Keep the two in step: if they
     disagree, JS-driven offsets drift away from the CSS ones. */
  const REF_WIDTH = 1512;
  const MOBILE_MAX = 768;
  const unit = () => {
    const raw = innerWidth / REF_WIDTH;
    if (innerWidth < MOBILE_MAX) return raw;
    return Math.min(1.25, Math.max(0.7, raw));
  };

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);

  const projectUrl = (slug) =>
    slug === "coming-soon"
      ? "coming-soon.html"
      : `project.html?p=${encodeURIComponent(slug)}`;

  const currentFile = () => location.pathname.split("/").pop() || "index.html";

  /* --- Chrome ------------------------------------------------------------ */

  function buildChrome() {
    const file = currentFile();
    const onHome = file === "index.html" || file === "";
    const onProjectPage = file === "project.html";
    const onProject = onProjectPage || file === "coming-soon.html";

    if (onHome) document.body.classList.add("home");
    document.body.classList.add("has-corners");

    /* Titles live on project pages only — nav lists by discipline (overrides below).
       Shorter labels sit at the top; each button sizes to its own text. */
    const artworkItems = PROJECTS.filter((project) => !project.comingSoon)
      .map((project) => {
        let label = project.discipline;
        if (project.slug === "rujum") label = project.title;
        if (project.slug === "guilty") label = "Guilty";
        if (project.slug === "nahum-tevet-portfolio") label = "Artist Portfolio";
        if (project.slug === "herzl-16") label = "Herzl 16 Collateral";
        if (project.slug === "lens") label = "Lens";
        if (project.slug === "torus") label = "Personal ID";
        return { label, href: projectUrl(project.slug) };
      })
      .sort((a, b) => a.label.length - b.label.length || a.label.localeCompare(b.label));

    const lensIdx = artworkItems.findIndex((item) => item.label === "Lens");
    const guiltyIdx = artworkItems.findIndex((item) => item.label === "Guilty");
    if (lensIdx >= 0 && guiltyIdx >= 0) {
      [artworkItems[lensIdx], artworkItems[guiltyIdx]] = [
        artworkItems[guiltyIdx],
        artworkItems[lensIdx],
      ];
    }

    const lensIdx2 = artworkItems.findIndex((item) => item.label === "Lens");
    const rujumIdx = artworkItems.findIndex((item) => item.label === "Rujum");
    if (lensIdx2 >= 0 && rujumIdx >= 0) {
      [artworkItems[lensIdx2], artworkItems[rujumIdx]] = [
        artworkItems[rujumIdx],
        artworkItems[lensIdx2],
      ];
    }

    const artworks = artworkItems
      .map(
        ({ label, href }) =>
          `<li><a class="nav__artwork" href="${href}">${esc(label)}</a></li>`
      )
      .join("");

    const credits = (SITE.credits || [])
      .map(
        (item) =>
          `<div class="nav__credit"><span>${esc(item.role)}</span><span>${esc(item.name)}</span></div>`
      )
      .join("");

    const visuals = SITE.visuals;
    const visualsParagraphs = (visuals?.paragraphs || [])
      .map((p) => `<p class="nav__credits-note">${esc(p)}</p>`)
      .join("");
    const projectNotes = (visuals?.notes || []).length
      ? `<section class="nav__credits-block">
          <p class="nav__panel-title">Project notes</p>
          <div class="nav__visuals-notes">
            ${visuals.notes
              .map(
                (n) =>
                  `<p class="nav__visuals-note"><span class="nav__visuals-project">${esc(n.project)}</span> — ${esc(n.text)}</p>`
              )
              .join("")}
          </div>
        </section>`
      : "";
    const visualsHtml = visuals
      ? `${
          visualsParagraphs
            ? `<section class="nav__credits-block">
                <p class="nav__panel-title">Visuals</p>
                ${visualsParagraphs}
              </section>`
            : ""
        }
        ${projectNotes}`
      : "";

    /* Works is available on every page, including project case studies. */
    const worksCorner = `<button class="nav__corner nav__corner--tr" type="button" data-nav-works>
            <span class="nav__corner-label" data-works-label>works</span>
          </button>`;

    const worksPanel = `<div class="nav__panel nav__panel--works" data-works-panel hidden>
          <p class="nav__panel-title">Artworks</p>
          <ul class="nav__artworks">${artworks}</ul>
          <button class="nav__back" type="button" data-nav-back>Back</button>
        </div>`;

    const homeHref = onHome ? "#top" : "index.html";

    /* About is an overlay on the home page (homepage stays visible behind). */
    const aboutCorner = onHome
      ? `<button class="nav__corner nav__corner--bl" type="button" data-nav-about>about</button>`
      : `<a class="nav__corner nav__corner--bl" href="index.html#about">about</a>`;

    const aboutPanel = onHome
      ? `<div class="nav__panel nav__panel--about" data-about-panel hidden>
          <div class="about-glass">
            <div class="about-glass__row">
              <div class="about-glass__main">
                <div class="about-glass__copy" data-about-copy></div>
                <figure class="about-glass__photo">
                  <img
                    src="assets/about-portrait.jpg?v=1"
                    alt="Goni Israeli"
                    width="768"
                    height="1024"
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </div>
              <div class="about-resume-slot">
                <span class="about-resume__credit-align" aria-hidden="true">credits</span>
                <div class="about-resume-mask">
                  <aside class="about-resume" data-about-resume aria-label="Experience, education, and links"></aside>
                  <span class="about-resume__works-crop" aria-hidden="true">works</span>
                </div>
              </div>
            </div>
          </div>
        </div>`
      : "";

    /* Full corner set in the markup; project pages hide about/credits (see nav.css). */
    const corners = `<a class="nav__corner nav__corner--tl" href="${homeHref}" data-nav-home>goni</a>
          ${worksCorner}
          ${aboutCorner}
          <button class="nav__corner nav__corner--br" type="button" data-nav-credits>
            <span class="nav__corner-label" data-credits-label>credits</span>
          </button>`;

    const creditsPanel = `<div class="nav__panel nav__panel--credits" data-credits-panel hidden>
          <div class="nav__credits-scroll">
            <div class="nav__credits">${credits}</div>
            ${
              SITE.creditsNote
                ? `<section class="nav__credits-block">
                    <p class="nav__panel-title">Disclaimer</p>
                    <p class="nav__credits-note">${esc(SITE.creditsNote)}</p>
                  </section>`
                : ""
            }
            ${visualsHtml}
          </div>
          <button class="nav__back" type="button" data-nav-back>Back</button>
        </div>`;

    const cornerNav = `
      <nav class="nav" id="nav" aria-label="Main">
        <div class="nav__corners">
          ${corners}
        </div>

        <div class="nav__scrim" data-nav-scrim aria-hidden="true"></div>

        ${worksPanel}
        ${aboutPanel}
        ${creditsPanel}
      </nav>`;

    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="veil" aria-hidden="true"></div>${cornerNav}`
    );
    initCornerNav({ onHome, onProjectPage });
  }

  /* --- Corner nav -------------------------------------------------------- */

  function initCornerNav({ onHome }) {
    const nav = document.getElementById("nav");
    const worksBtn = nav.querySelector("[data-nav-works]");
    const worksLabel = nav.querySelector("[data-works-label]");
    const aboutBtn = nav.querySelector("[data-nav-about]");
    const creditsBtn = nav.querySelector("[data-nav-credits]");
    const creditsLabel = nav.querySelector("[data-credits-label]");
    const worksPanel = nav.querySelector("[data-works-panel]");
    const aboutPanel = nav.querySelector("[data-about-panel]");
    const creditsPanel = nav.querySelector("[data-credits-panel]");
    const scrim = nav.querySelector("[data-nav-scrim]");
    const homeBtn = nav.querySelector("[data-nav-home]");
    const CREDITS_LABEL = "credits";
    const CREDITS_OPEN = "_______";
    const WORKS_LABEL = "works";
    const WORKS_OPEN = "______";

    const aboutCopy = aboutPanel?.querySelector("[data-about-copy]");
    const aboutResume = aboutPanel?.querySelector("[data-about-resume]");

    /* Hand-broken phone rows (line 1 = “Hi, I’m Goni.” only). */
    const MOBILE_ABOUT_LINES = SITE.about.copyMobileLines || [
      "Hi, I’m Goni.",
      "Visual Communication",
      "student based in Kibbutz",
      "Magal. I design across",
      "UX/UI, branding, and visual",
      "storytelling with a focus",
      "on clarity, intention, and",
      "just enough personality.",
      "Minimal when I can, bold",
      "when I should — always",
      "with inking hands and a",
      "messy sketchbook.",
    ];
    const DESK_ABOUT_LINES = String(SITE.about.copy || "").split("\n");

    const linesToHtml = (lines) =>
      lines
        .map((line) => `<span class="about-glass__copy-line">${esc(line)}</span>`)
        .join("");

    /*
      Always inject BOTH copies. CSS shows phone rows below 1200px (covers real
      phones + Safari “desktop site” ~980px). Coarse-pointer devices always get
      phone rows even on wider tablets. Desktop pointer + wide viewport keeps desk.
    */
    const renderAboutCopy = () => {
      if (!aboutCopy) return;
      aboutCopy.innerHTML =
        `<p class="about-glass__copy-desk">${linesToHtml(DESK_ABOUT_LINES)}</p>` +
        `<p class="about-glass__copy-phone">${linesToHtml(MOBILE_ABOUT_LINES)}</p>`;
    };

    const syncAboutMode = () => {
      const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
      const narrow = matchMedia("(max-width: 1200px)").matches;
      const uaPhone = /iPhone|iPod|Android.+Mobile|Mobile.+Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ""
      );
      document.body.classList.toggle("about-phone-copy", coarse || narrow || uaPhone);
      renderAboutCopy();
    };

    syncAboutMode();
    window.addEventListener("resize", syncAboutMode);
    window.addEventListener("orientationchange", syncAboutMode);
    matchMedia("(max-width: 1200px)").addEventListener("change", syncAboutMode);
    matchMedia("(hover: none) and (pointer: coarse)").addEventListener("change", syncAboutMode);
    if (aboutResume) {
      const entryHtml = (entry) => {
        const lines = (entry.lines || []).map((line) => `<span>${esc(line)}</span>`).join("");
        const org = Array.isArray(entry.org)
          ? entry.org.map((line) => `<span>${esc(line)}</span>`).join("")
          : `<span>${esc(entry.org)}</span>`;
        return `<div class="about-resume__entry">
          <p class="about-resume__dates">${esc(entry.dates)}</p>
          <p class="about-resume__role">${lines}</p>
          <p class="about-resume__org">${org}</p>
        </div>`;
      };

      const block = (title, items) => {
        if (!items?.length) return "";
        return `<section class="about-resume__block">
          <h2 class="about-resume__title">${esc(title)}</h2>
          ${items.map(entryHtml).join("")}
        </section>`;
      };

      const links = SITE.about.links || [];
      const linksBlock = links.length
        ? `<section class="about-resume__block">
            <h2 class="about-resume__title">Get in touch</h2>
            <div class="about-resume__links">
              ${links
                .map((link) => {
                  const external = /^https?:/i.test(link.href);
                  let attrs = "";
                  if (external) {
                    attrs = ` target="_blank" rel="noopener noreferrer"`;
                  } else if (link.label.toLowerCase() === "cv" || /\.pdf$/i.test(link.href)) {
                    attrs = ` data-cv-open`;
                  }
                  return `<a class="about-resume__link" href="${esc(link.href)}"${attrs}>${esc(link.label)}</a>`;
                })
                .join("")}
            </div>
          </section>`
        : "";

      aboutResume.innerHTML =
        block("Experience", SITE.about.experience) +
        block("Education", SITE.about.education) +
        linksBlock;
    }

    const clearPanels = () => {
      document.body.classList.remove("nav-works", "nav-credits", "nav-about");
      if (worksPanel) worksPanel.hidden = true;
      if (aboutPanel) aboutPanel.hidden = true;
      if (creditsPanel) creditsPanel.hidden = true;
      if (worksLabel) worksLabel.textContent = WORKS_LABEL;
      if (aboutBtn) aboutBtn.textContent = "about";
      if (creditsLabel) {
        creditsBtn?.classList.remove("is-subject");
        creditsLabel.textContent = CREDITS_LABEL;
      }
    };

    const showWorks = () => {
      if (!worksPanel) return;
      clearPanels();
      worksPanel.hidden = false;
      document.body.classList.add("nav-works");
      if (worksLabel) worksLabel.textContent = WORKS_OPEN;
      worksBtn?.focus({ preventScroll: true });
    };

    const showCredits = () => {
      if (!creditsPanel) return;
      clearPanels();
      creditsPanel.hidden = false;
      document.body.classList.add("nav-credits");
      if (creditsLabel) {
        creditsBtn?.classList.remove("is-subject");
        creditsLabel.textContent = CREDITS_OPEN;
      }
      creditsBtn?.focus({ preventScroll: true });
    };

    const showAbout = () => {
      if (!aboutPanel) return;
      clearPanels();
      window.scrollTo({ top: 0, behavior: "auto" });
      syncAboutMode();
      aboutPanel.hidden = false;
      document.body.classList.add("nav-about");
      if (aboutBtn) aboutBtn.textContent = "______";
    };

    const toggleAbout = () => {
      if (document.body.classList.contains("nav-about")) clearPanels();
      else showAbout();
    };

    const toggleCredits = () => {
      if (document.body.classList.contains("nav-credits")) clearPanels();
      else showCredits();
    };

    const toggleWorks = () => {
      if (document.body.classList.contains("nav-works")) clearPanels();
      else showWorks();
    };

    homeBtn?.addEventListener("click", (event) => {
      if (!onHome) return;
      event.preventDefault();
      clearPanels();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    worksBtn?.addEventListener("click", toggleWorks);
    aboutBtn?.addEventListener("click", toggleAbout);
    creditsBtn?.addEventListener("click", toggleCredits);
    scrim?.addEventListener("click", clearPanels);

    /* Desktop only: click the frosted panel background (not copy/links) to close. */
    const phoneMq = matchMedia("(max-width: 700px)");
    const aboutBgClose = (event) => {
      if (phoneMq.matches) return;
      if (
        event.target.matches(
          "[data-about-panel], .about-glass, .about-glass__row, .about-glass__main, .about-resume-slot, .about-resume-mask"
        )
      ) {
        clearPanels();
      }
    };
    const creditsBgClose = (event) => {
      if (phoneMq.matches) return;
      /* Close only when the click lands on the panel chrome, not the credit list. */
      if (event.target === creditsPanel) clearPanels();
    };
    aboutPanel?.addEventListener("click", aboutBgClose);
    creditsPanel?.addEventListener("click", creditsBgClose);

    nav.querySelectorAll("[data-nav-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        clearPanels();
        (worksBtn || creditsBtn)?.focus({ preventScroll: true });
      });
    });

    initCvOverlay(nav);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (document.body.classList.contains("nav-cv")) {
        closeCvOverlay();
        return;
      }
      if (
        document.body.classList.contains("nav-works") ||
        document.body.classList.contains("nav-credits") ||
        document.body.classList.contains("nav-about")
      ) {
        clearPanels();
      }
    });

    if (onHome && location.hash === "#about") {
      showAbout();
      history.replaceState(null, "", "index.html");
    }
  }

  /* --- CV overlay -------------------------------------------------------- */

  function closeCvOverlay() {
    const overlay = document.querySelector("[data-cv-overlay]");
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("nav-cv");
    const frame = overlay.querySelector("[data-cv-frame]");
    if (frame) frame.removeAttribute("src");
  }

  function openCvOverlay(href) {
    const overlay = document.querySelector("[data-cv-overlay]");
    if (!overlay || !href) return;
    const frame = overlay.querySelector("[data-cv-frame]");
    if (frame) frame.src = href;
    overlay.hidden = false;
    document.body.classList.add("nav-cv");
    overlay.querySelector("[data-cv-close]")?.focus({ preventScroll: true });
  }

  function initCvOverlay(nav) {
    if (document.querySelector("[data-cv-overlay]")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="cv-overlay" data-cv-overlay hidden>
        <button class="cv-overlay__close" type="button" data-cv-close>Close</button>
        <div class="cv-overlay__stage">
          <iframe class="cv-overlay__frame" title="Curriculum vitae" data-cv-frame></iframe>
        </div>
      </div>`
    );

    const overlay = document.querySelector("[data-cv-overlay]");

    nav.addEventListener("click", (event) => {
      const link = event.target.closest("[data-cv-open]");
      if (!link) return;
      event.preventDefault();
      event.stopPropagation();
      openCvOverlay(link.getAttribute("href"));
    });

    overlay.querySelector("[data-cv-close]")?.addEventListener("click", closeCvOverlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeCvOverlay();
    });
  }

  /* --- Page transitions (lateral + veil) --------------------------------- */

  const NAV_DIR_KEY = "portfolio-nav-dir";
  const PAGE_MS = 580;
  const TEXT_HOLD_MS = 1000;

  function fileFromPath(pathname) {
    return pathname.split("/").pop() || "index.html";
  }

  function isHomeFile(file) {
    return file === "index.html" || file === "";
  }

  function directionFor(url) {
    const toHome = isHomeFile(fileFromPath(url.pathname));
    const fromHome = isHomeFile(currentFile());
    if (!fromHome && toHome) return "back";
    return "forward";
  }

  function applyNavDirection(dir) {
    document.body.classList.toggle("nav-back", dir === "back");
  }

  function leaveTo(href) {
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.search === location.search) return;

    const dir = directionFor(url);
    try {
      sessionStorage.setItem(NAV_DIR_KEY, dir);
    } catch {
      /* private mode */
    }
    applyNavDirection(dir);
    document.body.classList.add("is-leaving");
    setTimeout(() => {
      location.href = url.href;
    }, PAGE_MS);
  }

  function markTextReady() {
    if (document.body.classList.contains("is-text-ready")) return;
    document.body.classList.add("is-text-ready");
    document.dispatchEvent(new CustomEvent("site:text-ready"));
  }

  /* Panels are measured in pixels, so the veil is held until images have
     their real dimensions — capped so a slow file can never trap the page. */
  function initTransitions(waitFor) {
    try {
      const stored = sessionStorage.getItem(NAV_DIR_KEY);
      if (stored) {
        applyNavDirection(stored);
        sessionStorage.removeItem(NAV_DIR_KEY);
      }
    } catch {
      /* private mode */
    }

    // Two frames, so the opening animations start from their initial state
    // rather than being skipped in the frame the markup was created.
    const show = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.body.classList.remove("is-loading");
          document.dispatchEvent(new CustomEvent("site:ready"));
          /* Hold copy for a beat so the user sees text arrive after the page. */
          const hold = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TEXT_HOLD_MS;
          setTimeout(markTextReady, hold);
        })
      );

    if (waitFor) {
      const cap = new Promise((resolve) => setTimeout(resolve, 2500));
      Promise.race([waitFor, cap]).then(show);
    } else {
      show();
    }

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (link.hasAttribute("data-cv-open") || /\.pdf$/i.test(href)) return;
      if (link.target === "_blank" || link.host !== location.host) return;

      const url = new URL(href, location.href);
      if (url.pathname === location.pathname && url.search === location.search) return;

      event.preventDefault();
      leaveTo(url.href);
    });

    // Restore from the back/forward cache without a stuck veil.
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        document.body.classList.remove("is-leaving", "is-loading");
        document.dispatchEvent(new CustomEvent("site:ready"));
        const hold = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TEXT_HOLD_MS;
        setTimeout(markTextReady, hold);
      }
    });
  }

  /* --- External links ---------------------------------------------------- */

  /* Every off-site link opens in its own tab and is denied access to this page
     through window.opener. Applied to the whole document after the panels are
     rendered, so content coming out of data.js is covered too. */
  function hardenExternalLinks(root = document) {
    root.querySelectorAll('a[href^="http"]').forEach((link) => {
      if (link.host === location.host) return;
      link.target = "_blank";
      const rel = new Set((link.rel || "").split(/\s+/).filter(Boolean));
      rel.add("noopener");
      rel.add("noreferrer");
      link.rel = [...rel].join(" ");
    });
  }

  /* --- Reveal on scroll -------------------------------------------------- */

  function observeReveals(root = document) {
    const items = root.querySelectorAll(".reveal:not(.is-in)");
    if (!items.length) return;

    const stagger = (el, index) => {
      el.style.transitionDelay = `${index * 70}ms`;
      el.classList.add("is-in");
    };

    if (!("IntersectionObserver" in window)) {
      items.forEach((item, i) => stagger(item, i));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = el.parentElement
            ? [...el.parentElement.querySelectorAll(":scope > .reveal:not(.is-in)")]
            : [el];
          const index = Math.max(0, siblings.indexOf(el));
          stagger(el, index);
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* --- Footer ------------------------------------------------------------ */

  function footer() {
    const socials = SITE.socials
      .map((social) => {
        /* Placeholder hrefs stay in-page; opening "#" in a new tab would just
           duplicate the site in a blank one. */
        const offsite = /^https?:/i.test(social.href);
        const attrs = offsite ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a class="link" href="${esc(social.href)}"${attrs}>${esc(social.label)}</a>`;
      })
      .join("");

    return `
      <footer class="footer">
        <div class="footer__intro">
          <p class="label muted">Get in touch</p>
          <a class="footer__email" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>
        </div>
        <div class="footer__row footer__row--meta">
          <div class="footer__socials">${socials}</div>
          <p class="label muted">${esc(SITE.location)} <span data-clock>--:--</span></p>
          <p class="label muted">&copy; ${new Date().getFullYear()} ${esc(SITE.name)}</p>
        </div>
      </footer>`;
  }

  function initClock() {
    const nodes = document.querySelectorAll("[data-clock]");
    if (!nodes.length) return;

    const tick = () => {
      const now = new Date();
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      nodes.forEach((node) => (node.textContent = time));
    };

    tick();
    setInterval(tick, 20000);
  }

  /* Resolves once every image/video in `root` has loaded (or failed) and webfonts
     are ready, so measurements taken afterwards are final. */
  function whenSettled(root) {
    /* Lazy images only resolve once they scroll into view, so waiting on them
       would hold the opening veil until the timeout. The panels they sit in are
       sized by CSS, so measurements taken without them are still final. */
    const images = [...root.querySelectorAll('img:not([loading="lazy"])')].map(
      (img) =>
        img.complete ||
        new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        })
    );

    const videos = [...root.querySelectorAll("video")].map(
      (video) =>
        video.readyState >= 1 ||
        new Promise((resolve) => {
          video.addEventListener("loadedmetadata", resolve, { once: true });
          video.addEventListener("error", resolve, { once: true });
        })
    );

    return Promise.all([...images, ...videos, document.fonts?.ready]);
  }

  function init(options = {}) {
    buildChrome();
    initTransitions(options.waitFor);
    initClock();
    observeReveals();
    hardenExternalLinks();
  }

  return {
    init,
    esc,
    pad,
    unit,
    projectUrl,
    observeReveals,
    hardenExternalLinks,
    footer,
    initClock,
    whenSettled,
    leaveTo,
  };
})();

/* ==========================================================================
   Project page — builds the panels, then drives left-to-right scrolling
   ========================================================================== */

(() => {
  const esc = Site.esc;

  const HEIGHTS = {
    std: ["50svh", "42svh"],
    wide: ["60svh", "48svh"],
    tall: ["68svh", "58svh"],
  };

  const project = (() => {
    const slug = new URLSearchParams(location.search).get("p");
    return PROJECTS.find((item) => item.slug === slug) || null;
  })();

  if (!project) {
    location.replace("index.html");
    return;
  }

  if (project.comingSoon) {
    location.replace("coming-soon.html");
    return;
  }

  const index = PROJECTS.indexOf(project);
  const next = (() => {
    for (let i = 1; i <= PROJECTS.length; i += 1) {
      const candidate = PROJECTS[(index + i) % PROJECTS.length];
      if (!candidate.comingSoon) return candidate;
    }
    return PROJECTS[(index + 1) % PROJECTS.length];
  })();

  /* --- Panel builders ----------------------------------------------------- */

  const MIME = { webm: "video/webm", mp4: "video/mp4", mov: "video/quicktime" };

  /* A fallback source lets the alpha WebM lead while older engines still get
     the opaque MP4, so the mockups can never end up with nothing to play. */
  function videoTag(src, fallback, caption, rateAttr = "") {
    const attrs = `muted playsinline loop autoplay disablepictureinpicture controlslist="nodownload noplaybackrate" draggable="false" aria-label="${esc(caption || project.title)}"${rateAttr}`;
    if (!fallback) return `<video src="${esc(src)}" ${attrs}></video>`;
    const source = (url) => {
      const ext = url.split("?")[0].split(".").pop().toLowerCase();
      const type = MIME[ext];
      return `<source src="${esc(url)}"${type ? ` type="${type}"` : ""}>`;
    };
    return `<video ${attrs}>${source(src)}${source(fallback)}</video>`;
  }

  /* Deliberately not lazy: this frame is only given a height, so its width comes
     from the image's own proportions. A deferred image has no proportions yet,
     which would collapse the panel to nothing and shove every panel to its right
     once it finally arrived. Panels whose width is set in CSS are lazy instead. */
  function frame(src, caption, size = "std", media = "image", rateAttr = "", fallback = "") {
    const [h, hSm] = HEIGHTS[size] || HEIGHTS.std;
    const mediaHtml =
      media === "video"
        ? videoTag(src, fallback, caption, rateAttr)
        : `<img src="${esc(src)}" alt="${esc(caption || project.title)}" draggable="false" decoding="async">`;
    return `
      <div class="slide__frame" style="--h:${h};--h-sm:${hSm}">
        ${mediaHtml}
      </div>`;
  }

  function caption(text, label) {
    if (!text) return "";
    return `<figcaption class="slide__cap label"><b>${esc(label)}</b><span>${esc(text)}</span></figcaption>`;
  }

  function slideHtml(slide, i) {
    const n = Site.pad(i + 1);

    switch (slide.kind) {
      case "video": {
        const rateAttr =
          slide.rate != null ? ` data-rate="${esc(String(slide.rate))}"` : "";
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        if (slide.size === "full") {
          const containClass = slide.fit === "contain" ? " slide--contain" : "";
          const blurb =
            slide.heading != null
              ? `<figcaption class="slide__blurb">
                  <p class="slide__blurb-title reveal reveal--text">${esc(slide.heading).replace(/\n/g, "<br>")}</p>
                  ${
                    slide.subheading
                      ? `<p class="slide__blurb-sub reveal reveal--text">${esc(slide.subheading).replace(/\n/g, "<br>")}</p>`
                      : ""
                  }
                  ${
                    slide.body
                      ? `<p class="slide__blurb-body reveal reveal--text">${esc(slide.body).replace(/\n/g, "<br>")}</p>`
                      : ""
                  }
                </figcaption>`
              : caption(slide.caption, n);
          return `<figure class="slide slide--image slide--full slide--video${containClass}${extraClass}">
              <div class="slide__frame">${videoTag(slide.src, slide.fallback, slide.caption || slide.heading || project.title, rateAttr)}</div>
              ${blurb}
            </figure>`;
        }
        return `<figure class="slide slide--image slide--video${extraClass}">
            <div class="reveal">${frame(slide.src, slide.caption, slide.size, "video", rateAttr, slide.fallback)}</div>
            ${caption(slide.caption, n)}
          </figure>`;
      }

      case "image":
        if (slide.size === "full") {
          const containClass = slide.fit === "contain" ? " slide--contain" : "";
          const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
          /* Full-bleed frames are also sized by the image itself — see frame(). */
          return `<figure class="slide slide--image slide--full${containClass}${extraClass}">
              <div class="slide__frame"><img src="${esc(slide.src)}" alt="${esc(slide.caption || project.title)}" draggable="false" decoding="async"></div>
              ${caption(slide.caption, n)}
            </figure>`;
        }
        return `<figure class="slide slide--image">
            <div class="reveal">${frame(slide.src, slide.caption, slide.size)}</div>
            ${caption(slide.caption, n)}
          </figure>`;

      case "stack":
        return `<div class="slide slide--stack">
            ${slide.items
              .map(
                (item, j) => `<figure class="reveal">
                  ${frame(item.src, item.caption, "std")}
                  ${caption(item.caption, `${n}.${j + 1}`)}
                </figure>`
              )
              .join("")}
          </div>`;

      case "pair": {
        const defaultMedia = slide.media === "video" ? "video" : "image";
        const hasVideo = (slide.items || []).some(
          (item) => (item.media || defaultMedia) === "video"
        );
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        const rateAttr =
          slide.rate != null ? ` data-rate="${esc(String(slide.rate))}"` : "";
        return `<div class="slide slide--pair${hasVideo ? " slide--video-pair" : ""}${extraClass}">
            ${slide.items
              .map((item, j) => {
                const media = item.media || defaultMedia;
                const itemRate =
                  item.rate != null
                    ? ` data-rate="${esc(String(item.rate))}"`
                    : rateAttr;
                /* Pair frames get their width from CSS, so deferring is safe. */
                const mediaHtml =
                  media === "video"
                    ? videoTag(item.src, item.fallback, item.caption || project.title, itemRate)
                    : `<img src="${esc(item.src)}" alt="${esc(item.caption || project.title)}" draggable="false" loading="lazy" decoding="async">`;
                return `<figure class="reveal">
                  <div class="slide__frame slide__frame--pair">
                    ${mediaHtml}
                  </div>
                  ${caption(item.caption, `${n}.${j + 1}`)}
                </figure>`;
              })
              .join("")}
          </div>`;
      }

      case "cycle": {
        const interval = Number(slide.interval) || 3000;
        const sources = (slide.items || []).map((item) => item.src).filter(Boolean);
        if (sources.length < 2) return "";
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        const isVideo = slide.media === "video";
        const mediaClass = isVideo ? " slide--video-cycle" : "";
        const rateAttr =
          slide.rate != null ? ` data-rate="${esc(String(slide.rate))}"` : "";
        const stack = (offset) =>
          sources
            .map((src, j) => {
              const isActive = j === offset % sources.length;
              const active = isActive ? ' class="is-active"' : "";
              if (isVideo) {
                return `<video src="${esc(src)}" muted playsinline loop preload="metadata" disablepictureinpicture controlslist="nodownload noplaybackrate" draggable="false" aria-label="${esc(project.title)}"${rateAttr}${active}></video>`;
              }
              /* All frames stack inside one CSS-sized box, so only the one on
                 show is fetched up front and the rest follow it into view. */
              const load = isActive ? "" : ' loading="lazy"';
              return `<img src="${esc(src)}" alt="${esc(project.title)}" draggable="false"${load} decoding="async"${active}>`;
            })
            .join("");
        if (slide.layout === "solo") {
          return `<div class="slide slide--solo slide--cycle${mediaClass}${extraClass}" data-cycle data-cycle-interval="${interval}">
              <figure class="reveal">
                <div class="slide__frame slide__frame--pair slide__cycle" data-cycle-offset="0">${stack(0)}</div>
              </figure>
            </div>`;
        }
        return `<div class="slide slide--pair slide--cycle${mediaClass}${extraClass}" data-cycle data-cycle-interval="${interval}">
            <figure class="reveal">
              <div class="slide__frame slide__frame--pair slide__cycle" data-cycle-offset="0">${stack(0)}</div>
            </figure>
            <figure class="reveal">
              <div class="slide__frame slide__frame--pair slide__cycle" data-cycle-offset="1">${stack(1)}</div>
            </figure>
          </div>`;
      }

      case "strip": {
        const items = (slide.items || []).filter((item) => item && item.src);
        if (!items.length) return "";
        const isVideo = slide.media === "video";
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        const mediaClass = isVideo ? " slide--video-strip" : "";
        const rateAttr =
          slide.rate != null ? ` data-rate="${esc(String(slide.rate))}"` : "";
        return `<div class="slide slide--strip${mediaClass}${extraClass}" data-strip>
            ${items
              .map((item) => {
                const mediaHtml = isVideo
                  ? `<video src="${esc(item.src)}" muted playsinline loop preload="metadata" disablepictureinpicture controlslist="nodownload noplaybackrate" draggable="false" aria-label="${esc(item.caption || project.title)}"${rateAttr}></video>`
                  : `<img src="${esc(item.src)}" alt="${esc(item.caption || project.title)}" draggable="false" loading="lazy" decoding="async">`;
                return `<figure>
                  <div class="slide__frame slide__frame--strip">${mediaHtml}</div>
                </figure>`;
              })
              .join("")}
          </div>`;
      }

      case "pile": {
        const items = (slide.items || []).filter((item) => item && item.src);
        if (!items.length) return "";
        const isVideo = slide.media === "video";
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        const mediaClass = isVideo ? " slide--video-pile" : "";
        const rateAttr =
          slide.rate != null ? ` data-rate="${esc(String(slide.rate))}"` : "";
        return `<div class="slide slide--pile${mediaClass}${extraClass}" data-pile data-pile-count="${items.length}">
            <div class="pile" aria-roledescription="carousel">
              <div class="pile__stack">
                ${items
                  .map((item, j) => {
                    const mediaHtml = isVideo
                      ? videoTag(
                          item.src,
                          item.fallback,
                          item.caption || project.title,
                          `${rateAttr} preload="${j < 3 ? "auto" : "metadata"}"`
                        )
                      : `<img src="${esc(item.src)}" alt="${esc(item.caption || project.title)}" draggable="false"${j === 0 ? "" : ' loading="lazy"'} decoding="async">`;
                    return `<figure class="pile__card" data-pile-index="${j}">
                      <div class="slide__frame slide__frame--pile">${mediaHtml}</div>
                    </figure>`;
                  })
                  .join("")}
              </div>
              <p class="pile__cue label" aria-hidden="true">Scroll</p>
            </div>
          </div>`;
      }

      case "solo":
        return `<figure class="slide slide--solo">
            <div class="reveal">${frame(slide.src, slide.caption, slide.size || "tall")}</div>
            ${caption(slide.caption, n)}
          </figure>`;

      case "text": {
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        const isLensBridge = /\bslide--lens-bridge\b/.test(slide.className || "");
        const heading = slide.heading
          ? isLensBridge
            ? `<p class="slide__blurb-title reveal reveal--text">${esc(slide.heading).replace(/\n/g, "<br>")}</p>`
            : `<h2 class="heading reveal reveal--text">${esc(slide.heading).replace(/\n/g, "<br>")}</h2>`
          : "";
        const paragraphs = Array.isArray(slide.body)
          ? slide.body
          : slide.body
            ? [slide.body]
            : [];
        return `<section class="slide slide--text${extraClass}">
            ${heading}
            <div class="slide__body">${paragraphs
              .map((p) => `<p class="reveal reveal--text">${esc(p).replace(/\n/g, "<br>")}</p>`)
              .join("")}</div>
          </section>`;
      }

      case "quote":
        return `<section class="slide slide--quote">
            <blockquote class="reveal reveal--text">${esc(slide.text)}</blockquote>
            ${slide.source ? `<p class="label muted reveal reveal--text">${esc(slide.source)}</p>` : ""}
          </section>`;

      case "slot": {
        const extraClass = slide.className ? ` ${esc(slide.className)}` : "";
        return `<figure class="slide slide--full slide--contain slide--slot${extraClass}" aria-hidden="true">
            <div class="slide__frame"></div>
          </figure>`;
      }

      default:
        return "";
    }
  }

  function openHtml() {
    const courseNote = project.courseNote
      ? `<span class="open__meta-note">${esc(project.courseNote).replace(/\n/g, "<br>")}</span>`
      : "";

    const siteButton = project.siteUrl
      ? `<a class="open__site" href="${esc(project.siteUrl)}" target="_blank" rel="noopener noreferrer">[ visit website ]</a>`
      : "";

    const soundCue =
      project.slug === "lens"
        ? `<p class="open__sound reveal reveal--text" aria-hidden="true">
            <svg class="open__sound-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
              <path d="M2.5 6.2h2.1L7.8 3.8v8.4L4.6 9.8H2.5V6.2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              <path d="M10 6.1c.7.6.7 3.2 0 3.8M12.1 4.6c1.4 1.2 1.4 5.6 0 6.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <span>{ SOUND ON }</span>
          </p>`
        : "";

    const schoolBlock = `<span class="open__meta-school">
                  <span>Bezalel Academy</span>
                  <span>of Arts &amp; Design</span>
                </span>`;

    const collabText = project.collaboration
      ? esc(project.collaboration).replace(/\n/g, "<br>")
      : "";

    /* Rujum: collab sits under Course; Bezalel sits in the lower slot. */
    const swapSchoolCollab = project.slug === "rujum" && project.collaboration;
    const underCourse = swapSchoolCollab
      ? `<span class="open__meta-under-course">${collabText}</span>`
      : schoolBlock;
    const belowMeta = swapSchoolCollab
      ? `<div class="open__meta-collab"><dd>${schoolBlock}</dd></div>`
      : project.collaboration
        ? `<div class="open__meta-collab"><dd>${collabText}</dd></div>`
        : "";

    return `
      <header class="slide slide--open">
        <p class="open__eyebrow reveal reveal--text"><img class="open__icon" src="assets/open-icon.png?v=logo-2" alt="" width="14" height="14" decoding="async" /><span aria-hidden="true">—</span> ${esc(project.discipline)}</p>
        <h1 class="open__title reveal reveal--text">${esc(project.title).replace(/\n/g, "<br>")}</h1>
        <div class="open__copy">
          ${(() => {
            const toSummaryHtml = (text) => {
              let html = esc(text || "");
              if (project.slug === "lens") {
                html = html
                  .replace(/\bobjective\b/g, '<span class="open__summary-accent">objective</span>')
                  .replace(/\bsubjective\b/g, '<span class="open__summary-accent">subjective</span>');
              } else if (project.slug === "herzl-16") {
                html = html.replace(
                  /As one of three winners/g,
                  '<span class="open__summary-accent">As one of three winners</span>'
                );
              } else if (project.slug === "torus") {
                html = html.replace(
                  /\bmy personality\b/g,
                  '<span class="open__summary-accent">my personality</span>'
                );
              } else if (project.slug === "guilty") {
                html = html.replace(
                  /modern\nconsumer/g,
                  '<span class="open__summary-accent">modern</span>\n<span class="open__summary-accent">consumer</span>'
                );
              } else if (project.slug === "nahum-tevet-portfolio") {
                html = html
                  .replace(/\border\b/g, '<span class="open__summary-accent">order</span>')
                  .replace(/\bchaos\b/g, '<span class="open__summary-accent">chaos</span>');
              } else if (project.slug === "rujum") {
                html = html.replace(
                  /strategic board game/g,
                  '<span class="open__summary-accent">strategic board game</span>'
                );
              }
              return html
                .split("\n")
                .map((line) => `<span class="open__summary-line">${line}</span>`)
                .join("");
            };
            const desktop = toSummaryHtml(project.summary);
            if (!project.summaryMobile) {
              return `<p class="open__summary reveal reveal--text">${desktop}</p>`;
            }
            const mobile = toSummaryHtml(project.summaryMobile);
            return (
              `<p class="open__summary open__summary--desk reveal reveal--text">${desktop}</p>` +
              `<p class="open__summary open__summary--phone reveal reveal--text">${mobile}</p>`
            );
          })()}
          <dl class="open__meta reveal reveal--text">
            <div class="open__meta-primary">
              <dt>Course</dt>
              <dd>
                ${esc(project.course || "")}${courseNote}
                ${underCourse}
              </dd>
            </div>
            <div class="open__meta-year">
              <dt>Year</dt>
              <dd>${esc(project.year)}</dd>
            </div>
            ${belowMeta}
          </dl>
        </div>
        ${soundCue}
        ${siteButton ? siteButton.replace('class="open__site"', 'class="open__site reveal reveal--text"') : ""}
      </header>`;
  }

  function closeHtml() {
    const academyCredit = { role: "Project type", name: "Educational, Bezalel Academy" };
    const creditList = (project.credits || []).filter(
      (c) => !(c.role === academyCredit.role && c.name === academyCredit.name)
    );
    creditList.push(academyCredit);

    const creditRows = creditList
      .map((c) => {
        const extra = c.className ? ` ${esc(c.className)}` : "";
        return `<div class="close__credit${extra}"><span class="reveal reveal--text">${esc(c.role)}</span><span class="reveal reveal--text">${esc(c.name).replace(/\n/g, "<br>")}</span></div>`;
      })
      .join("");
    const creditNotes = (project.creditsNotes || [])
      .map((note) => `<p class="close__note reveal reveal--text">${esc(note).replace(/\n/g, "<br>")}</p>`)
      .join("");
    const credits = `<div class="close__credits">
            <p class="close__credits-title reveal reveal--text">Credits</p>
            ${creditRows}
            ${creditNotes}
          </div>`;

    /* Rujum / Guilty / Nahum / Herzl / Personal ID / Lens end on credits only; other projects keep next + back. */
    if (
      project.slug === "rujum" ||
      project.slug === "guilty" ||
      project.slug === "nahum-tevet-portfolio" ||
      project.slug === "herzl-16" ||
      project.slug === "torus" ||
      project.slug === "lens"
    ) {
      return `
        <section class="slide slide--close">
          ${credits}
        </section>`;
    }

    return `
      <section class="slide slide--close">
        <p class="close__eyebrow reveal reveal--text">Next project</p>
        <a class="close__next reveal reveal--text" href="${Site.projectUrl(next.slug)}">
          ${esc(next.title)} <span class="close__arrow" aria-hidden="true">&rarr;</span>
        </a>
        ${credits}
        <a class="close__back reveal reveal--text" href="index.html">Back to all work</a>
      </section>`;
  }

  /* Crawlers and link unfurlers read the <head>, never the rendered panels, so
     the project chosen by ?p=<slug> has to be written back into the meta tags. */
  function applyMeta() {
    const flat = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const title = `${flat(project.title)} — ${SITE.name}`;
    const summary = flat(project.summary);
    const description = summary
      ? `${flat(project.discipline)}${project.discipline ? ". " : ""}${
          summary.length > 200 ? `${summary.slice(0, 197).trimEnd()}…` : summary
        }`
      : `A ${flat(project.discipline)} project by ${SITE.name}.`;

    document.title = title;

    const canonical = document.querySelector("[data-meta-canonical]");
    const base = (canonical?.getAttribute("href") || "").split("?")[0];
    const url = base ? `${base}?p=${encodeURIComponent(project.slug)}` : "";
    if (canonical && url) canonical.setAttribute("href", url);

    const set = (selector, value) => {
      if (!value) return;
      document.querySelector(selector)?.setAttribute("content", value);
    };

    set("[data-meta-description]", description);
    set("[data-meta-og-title]", title);
    set("[data-meta-og-description]", description);
    set("[data-meta-og-url]", url);
    set("[data-meta-twitter-title]", title);
    set("[data-meta-twitter-description]", description);
  }

  function render() {
    applyMeta();

    if (project.slug === "rujum") {
      document.documentElement.classList.add("project--rujum");
      document.body.classList.add("project--rujum");
    }

    if (project.slug === "guilty") {
      document.documentElement.classList.add("project--guilty");
      document.body.classList.add("project--guilty");
    }

    if (project.slug === "nahum-tevet-portfolio") {
      document.documentElement.classList.add("project--nahum-tevet-portfolio");
      document.body.classList.add("project--nahum-tevet-portfolio");
    }

    if (project.slug === "herzl-16") {
      document.documentElement.classList.add("project--herzl-16");
      document.body.classList.add("project--herzl-16");
    }

    if (project.slug === "torus") {
      document.documentElement.classList.add("project--torus");
      document.body.classList.add("project--torus");
    }

    if (project.slug === "lens") {
      document.documentElement.classList.add("project--lens");
      document.body.classList.add("project--lens");
    }

    const stage = document.querySelector("[data-stage]");
    stage.innerHTML = openHtml() + project.slides.map(slideHtml).join("") + closeHtml();

    /* Keep project videos silent and looping; pause if reduced motion.
       Cycle / strip videos only play when active or in view. */
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage.querySelectorAll("video").forEach((video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.setAttribute("muted", "");
      const rate = Number(video.dataset.rate);
      video.playbackRate = Number.isFinite(rate) && rate > 0 ? rate : 1.25;
      const inCycle = video.closest("[data-cycle]");
      const inStrip = video.closest("[data-strip]");
      const inPile = video.closest("[data-pile]");
      const cycleActive = !inCycle || video.classList.contains("is-active");
      if (reducedMotion || !cycleActive || inStrip || inPile) {
        video.removeAttribute("autoplay");
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    });

    /* Nahum / Personal ID paper matches the studio grey (#ededed). */
    if (project.slug === "nahum-tevet-portfolio" || project.slug === "torus") {
      const color = "#ededed";
      document.documentElement.style.setProperty("--paper", color);
      document.documentElement.style.setProperty("--wash", color);
      document.documentElement.style.background = color;
      document.body.style.background = color;
      const stageEl = document.querySelector(".stage");
      if (stageEl) stageEl.style.background = color;
    }

    return stage;
  }

  /* --- Stage scrolling: horizontal desktop, vertical on phones ----------- */

  function initScroll(stage) {
    const hint = document.querySelector("[data-hint]");
    const slides = [...stage.querySelectorAll(".slide")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Keep in sync with project.css @media (max-width: 700px). */
    const phoneMq = matchMedia("(max-width: 700px)");
    const isVertical = () => phoneMq.matches;

    let target = 0;
    let current = 0;
    let frameId = null;
    let touched = false;

    const scrollPos = () => (isVertical() ? stage.scrollTop : stage.scrollLeft);
    const setScrollPos = (value) => {
      if (isVertical()) stage.scrollTop = value;
      else stage.scrollLeft = value;
    };
    const clientSize = () => (isVertical() ? stage.clientHeight : stage.clientWidth);
    const scrollSize = () => (isVertical() ? stage.scrollHeight : stage.scrollWidth);
    const slideStart = (slide) => (isVertical() ? slide.offsetTop : slide.offsetLeft);
    const slideSize = (slide) => (isVertical() ? slide.offsetHeight : slide.offsetWidth);

    const nativeMax = () => Math.max(0, scrollSize() - clientSize());

    /* Desktop: stop 200px past credits (art-directed scroll width).
       Phones: natural vertical extent — no artificial end pad. */
    const max = () => {
      const hard = nativeMax();
      if (isVertical()) return hard;
      const credits = stage.querySelector(".close__credits");
      if (!credits) return hard;
      const s0 = stage.scrollLeft;
      const cRight = credits.getBoundingClientRect().right;
      const stageLeft = stage.getBoundingClientRect().left;
      const desired = s0 + cRight - stageLeft - stage.clientWidth + 200 * Site.unit();
      return Math.max(0, Math.min(hard, desired));
    };
    const clamp = (v) => Math.min(Math.max(v, 0), max());

    /* Media enters as panels approach. Text waits until the panel is focused,
       then holds 1s so the reader sees it arrive while exploring. */
    const TEXT_HOLD_MS = 1000;
    const textTimers = new Map();

    function showSlideText(slide) {
      if (slide.dataset.textSeen) return;
      slide.dataset.textSeen = "1";
      textTimers.delete(slide);

      const text = [...slide.querySelectorAll(".reveal--text")];
      text.forEach((el, i) => {
        el.classList.remove("is-in");
        el.style.transitionDelay = `${i * 70}ms`;
        void el.offsetWidth;
        el.classList.add("is-in");
      });
    }

    function armSlideText(slide) {
      if (slide.dataset.textSeen || textTimers.has(slide)) return;

      const delay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TEXT_HOLD_MS;
      const id = setTimeout(() => {
        textTimers.delete(slide);
        /* Still the panel the reader is on? */
        if (!slide.classList.contains("is-focus") && !slide.classList.contains("slide--open")) return;
        showSlideText(slide);
      }, delay);
      textTimers.set(slide, id);
    }

    function clearArmedText(slide) {
      const id = textTimers.get(slide);
      if (!id) return;
      clearTimeout(id);
      textTimers.delete(slide);
    }

    function reveal() {
      if (document.body.classList.contains("is-loading")) return;

      const textReady = document.body.classList.contains("is-text-ready");
      const viewL = scrollPos();
      const vw = clientSize();
      const mediaEdge = viewL + vw * 0.9;

      slides.forEach((slide) => {
        const start = slideStart(slide);
        const isOpen = slide.classList.contains("slide--open");
        const focused = slide.classList.contains("is-focus");

        if (!slide.dataset.mediaSeen && start <= mediaEdge) {
          slide.dataset.mediaSeen = "1";
          const media = [
            ...(slide.classList.contains("reveal") && !slide.classList.contains("reveal--text")
              ? [slide]
              : []),
            ...slide.querySelectorAll(".reveal:not(.reveal--text)"),
          ];
          media.forEach((el, i) => {
            el.style.transitionDelay = `${60 + i * 70}ms`;
            el.classList.add("is-in");
          });
        }

        if (slide.dataset.textSeen) return;

        if (isOpen) {
          if (textReady) showSlideText(slide);
          return;
        }

        /* Arm a 1s hold once this panel is the one in focus; cancel if you leave. */
        if (focused) armSlideText(slide);
        else clearArmedText(slide);
      });
    }

    function syncFocus() {
      const mid = scrollPos() + clientSize() * 0.5;
      let best = null;
      let bestDist = Infinity;
      slides.forEach((slide) => {
        const center = slideStart(slide) + slideSize(slide) * 0.5;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = slide;
        }
      });
      slides.forEach((slide) => slide.classList.toggle("is-focus", slide === best));
      stage.classList.add("has-focus");
    }

    function paint() {
      syncFocus();
      reveal();

      if (project.slug === "rujum") {
        const extent = max();
        const progress = extent > 0 ? Math.min(1, Math.max(0, scrollPos() / extent)) : 0;
        /* Ease-out so the shift toward white feels gradual early, settles late. */
        const eased = 1 - Math.pow(1 - progress, 1.65);
        document.documentElement.style.setProperty("--rujum-scroll", eased.toFixed(4));

        const atEnd = extent <= 0 || scrollPos() >= extent - 48;
        document.body.classList.toggle("project-at-end", atEnd);
      }
    }

    function loop() {
      current += (target - current) * 0.11;

      if (Math.abs(target - current) < 0.4) {
        current = target;
        frameId = null;
      } else {
        frameId = requestAnimationFrame(loop);
      }

      setScrollPos(current);
      paint();
    }

    function glide(to) {
      target = clamp(to);
      if (reduced) {
        current = target;
        setScrollPos(target);
        paint();
        return;
      }
      if (!frameId) frameId = requestAnimationFrame(loop);
    }

    function sync() {
      target = current = scrollPos();
    }

    function dismissHint() {
      if (touched) return;
      touched = true;
      if (hint) hint.classList.add("is-off");
    }

    // Desktop only: map wheel/trackpad onto horizontal scroll.
    // Phones keep native vertical scrolling.
    stage.addEventListener(
      "wheel",
      (event) => {
        if (isVertical() || event.ctrlKey) return;
        const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
        if (!delta) return;
        event.preventDefault();
        dismissHint();
        glide(target + delta * (event.deltaMode === 1 ? 24 : 1));
      },
      { passive: false }
    );

    // Native scrolling (touch, vertical phones, scrollbar) — adopt its position.
    stage.addEventListener("scroll", () => {
      if (!frameId) {
        const pos = scrollPos();
        const capped = clamp(pos);
        if (capped !== pos) {
          setScrollPos(capped);
          current = target = capped;
        } else {
          sync();
        }
        paint();
      }
      dismissHint();
    }, { passive: true });

    stage.addEventListener("touchstart", () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      sync();
      dismissHint();
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (document.body.classList.contains("nav-open")) return;
      if (event.key === " " && event.target.closest("a, button")) return;
      const step = clientSize() * 0.8;
      const vertical = isVertical();
      const moves = {
        ArrowRight: () => !vertical && glide(target + step * 0.45),
        ArrowLeft: () => !vertical && glide(target - step * 0.45),
        ArrowDown: () => vertical && glide(target + step * 0.45),
        ArrowUp: () => vertical && glide(target - step * 0.45),
        PageDown: () => glide(target + step),
        PageUp: () => glide(target - step),
        Home: () => glide(0),
        End: () => glide(max()),
        " ": () => glide(target + step),
      };
      const move = moves[event.key];
      if (!move) return;
      const ran = move();
      if (ran === false) return;
      event.preventDefault();
      dismissHint();
    });

    // Click-and-drag on desktop (horizontal only).
    let dragging = false;
    let startX = 0;
    let startLeft = 0;

    stage.addEventListener("pointerdown", (event) => {
      if (isVertical() || event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startLeft = stage.scrollLeft;
      sync();
    });

    stage.addEventListener("pointermove", (event) => {
      if (!dragging || isVertical()) return;
      const shift = event.clientX - startX;
      if (Math.abs(shift) > 4) {
        stage.classList.add("is-dragging");
        dismissHint();
      }
      current = target = clamp(startLeft - shift);
      setScrollPos(current);
      paint();
    });

    const endDrag = () => {
      dragging = false;
      stage.classList.remove("is-dragging");
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", endDrag);

    const onAxisChange = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      setScrollPos(0);
      target = current = 0;
      paint();
    };
    if (phoneMq.addEventListener) phoneMq.addEventListener("change", onAxisChange);
    else phoneMq.addListener(onAxisChange);

    addEventListener("resize", () => {
      sync();
      paint();
    });

    // Panel widths come from the images, so re-measure as they arrive.
    stage.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", paint, { once: true });
    });

    document.fonts?.ready.then(paint);

    paint();
    document.addEventListener("site:ready", paint);
    document.addEventListener("site:text-ready", paint);
    setTimeout(dismissHint, 6000);
  }

  /* --- Rujum: soft 3D tilt on smaller (solo / pair) images only ----------- */

  function initImageTilt(stage) {
    if (project.slug !== "rujum") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* Phones: keep solo/pair frames flat like every other image. */
    if (matchMedia("(max-width: 700px)").matches) return;

    const frames = [...stage.querySelectorAll(
      ".slide--solo .slide__frame, .slide--pair .slide__frame"
    )];
    if (!frames.length) return;

    const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const MAX = 10;
    const IDLE = 10;
    const targets = new WeakMap();
    const currents = new WeakMap();

    frames.forEach((frame) => {
      frame.classList.add("is-tilt");
      targets.set(frame, { y: 0 });
      currents.set(frame, { y: 0 });

      if (!canHover) return;

      frame.addEventListener("pointerenter", () => {
        frame.dataset.tilting = "1";
      });

      frame.addEventListener("pointermove", (event) => {
        const rect = frame.getBoundingClientRect();
        if (!rect.width) return;
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        targets.set(frame, {
          y: Math.max(-1, Math.min(1, nx)) * MAX,
        });
      });

      frame.addEventListener("pointerleave", () => {
        frame.dataset.tilting = "";
      });
    });

    let raf = 0;
    const tick = (now) => {
      /* If the viewport becomes phone-width mid-session, stop and flatten. */
      if (matchMedia("(max-width: 700px)").matches) {
        frames.forEach((frame) => {
          frame.classList.remove("is-tilt");
          frame.style.transform = "";
          frame.dataset.tilting = "";
        });
        return;
      }

      const t = now * 0.001;
      frames.forEach((frame, i) => {
        const cur = currents.get(frame);
        const target = targets.get(frame);
        let ty = target.y;

        if (!frame.dataset.tilting) {
          const phase = t * 0.9 + i * 1.2;
          ty = Math.sin(phase) * IDLE;
          target.y = ty;
        }

        cur.y += (ty - cur.y) * 0.14;
        const clamped = Math.max(-MAX, Math.min(MAX, cur.y));
        /* perspective() on the same transform keeps size stable as parents reveal. */
        frame.style.transform =
          `perspective(420px) rotateY(${clamped.toFixed(3)}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    addEventListener("pagehide", () => cancelAnimationFrame(raf), { once: true });
  }

  /* Pair/solo slideshow: frames advance through the shared image/video list. */
  function initImageCycle(stage) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    stage.querySelectorAll("[data-cycle]").forEach((root) => {
      const frames = [...root.querySelectorAll(".slide__cycle")];
      if (!frames.length) return;

      const mediaSel = "img, video";
      const total = frames[0].querySelectorAll(mediaSel).length;
      if (total < 2) return;

      /* Keep dual frames on opposite sides of the list so they never share an
         image — including mid-crossfade when both opacities overlap. */
      const gap = frames.length > 1 ? Math.max(1, Math.floor(total / 2)) : 0;
      const interval = Math.max(Number(root.dataset.cycleInterval) || 4000, 2800);
      let index = 0;

      const paint = () => {
        const picks = frames.map((_, slot) => (index + slot * gap) % total);
        frames.forEach((frame, slot) => {
          const active = picks[slot] ?? picks[0];
          frame.querySelectorAll(mediaSel).forEach((el, i) => {
            const on = i === active;
            el.classList.toggle("is-active", on);
            if (el.tagName === "VIDEO") {
              if (on) el.play().catch(() => {});
              else el.pause();
            }
          });
        });
      };

      paint();
      const timer = setInterval(() => {
        index = (index + 1) % total;
        paint();
      }, interval);

      addEventListener("pagehide", () => clearInterval(timer), { once: true });
    });
  }

  /* Strip carousel: play clips that are on screen, pause the rest. */
  function initStripVideos(stage) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const videos = [...stage.querySelectorAll("[data-strip] video")];
    if (!videos.length) return;

    const sync = () => {
      const viewLeft = 0;
      const viewRight = stage.clientWidth;
      videos.forEach((video) => {
        const rect = video.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const left = rect.left - stageRect.left;
        const right = rect.right - stageRect.left;
        const visible = right > viewLeft + 40 && left < viewRight - 40;
        if (visible) {
          if (video.paused) video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    };

    const io = new IntersectionObserver(() => sync(), {
      root: stage,
      threshold: [0, 0.25, 0.5, 0.75],
    });
    videos.forEach((video) => io.observe(video));
    stage.addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync);
    sync();
    addEventListener(
      "pagehide",
      () => {
        io.disconnect();
        stage.removeEventListener("scroll", sync);
        removeEventListener("resize", sync);
      },
      { once: true }
    );
  }

  /* Messy cards scattered across the viewport. Wheel over a card cycles;
     empty gaps scroll the page. Each card eases out only while hovered. */
  function initPile(stage) {
    const roots = [...stage.querySelectorAll("[data-pile]")];
    if (!roots.length) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phoneMq = matchMedia("(max-width: 700px)");
    const WHEEL_PER_CARD = 95;
    /* Aesthetic mess — more open spacing, still a balanced cluster. */
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
    /* Phone: tighter cluster centered in the vertical stage (no desktop nudge). */
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
    /* Whole-pile nudge (Personal ID, desktop only). */
    const PILE_NUDGE_X = -850;
    const PILE_NUDGE_Y = -30;

    roots.forEach((root) => {
      const cards = [...root.querySelectorAll(".pile__card")];
      const rim = root.querySelector(".pile");
      const stack = root.querySelector(".pile__stack");
      const cue = root.querySelector(".pile__cue");
      if (cards.length < 2 || !rim || !stack) return;
      const n = cards.length;
      const isPersonal = root.classList.contains("slide--personal-carousel");
      let top = 0;
      let wheelAcc = 0;
      let live = false;
      let cued = false;
      let hovered = -1;
      let motionId = null;
      /* Per-card spring state — JS owns motion (no CSS transition fight). */
      const motion = cards.map(() => ({
        hover: 0,
        tiltX: 0,
        tiltY: 0,
        targetTiltX: 0,
        targetTiltY: 0,
        baseCX: 0,
        baseCY: 0,
        baseW: 1,
        baseH: 1,
      }));

      const dismissCue = () => {
        if (cued || !cue) return;
        cued = true;
        cue.classList.add("is-off");
      };

      const depthOf = (i) => (i - top + n) % n;
      const lerp = (a, b, t) => a + (b - a) * t;
      const smooth = (t) => t * t * (3 - 2 * t);

      const syncVideos = () => {
        cards.forEach((card) => {
          const video = card.querySelector("video");
          if (!video) return;
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          if (live && !reduced) {
            if (video.paused) {
              const play = video.play();
              if (play && typeof play.catch === "function") play.catch(() => {});
            }
          } else if (!video.paused) {
            video.pause();
          }
        });
      };

      const paint = () => {
        const w = stack.clientWidth || root.clientWidth;
        const h = stack.clientHeight || root.clientHeight;
        const phone = phoneMq.matches;
        /* Scale the whole-pile nudge with the shared proportional unit so the
           cluster keeps its place in the composition at any viewport. */
        const u = Site.unit();
        const messList = phone ? MESS_MOBILE : MESS;
        /* Desktop art direction only — phones center the pile in the stage. */
        const nudgeX = isPersonal && !phone ? PILE_NUDGE_X : 0;
        const nudgeY = isPersonal && !phone ? PILE_NUDGE_Y : 0;
        /* On phones, pull offsets toward center so cards stay on-screen. */
        const spread = phone ? 0.72 : 0.5;

        cards.forEach((card, i) => {
          const depth = depthOf(i);
          const mess = messList[i % messList.length];
          const isTop = depth === 0;
          const m = motion[i];
          const ease = reduced ? 0 : smooth(m.hover);
          /* Gentle outward drift + float, eased by hover spring. */
          const lift = 1 + ease * (phone ? 0.08 : 0.14);
          const x = mess.x * w * spread * lift + nudgeX * u + m.tiltX;
          const y = mess.y * h * spread * lift + nudgeY * u + m.tiltY - 20 * ease;
          const r = mess.r + mess.r * 0.1 * ease + m.tiltX * 0.05;
          const scale =
            mess.s * (isTop ? 1.04 : 1) * (1 + 0.05 * ease) * (reduced ? 0.95 : 1);

          card.classList.toggle("is-active", isTop);
          card.classList.toggle("is-hover", m.hover > 0.04);
          card.style.zIndex = String(m.hover > 0.2 ? n + 2 : n - depth);
          card.style.opacity = "1";
          card.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
        });
        root.dataset.pileActive = String(top);
      };

      const tickMotion = () => {
        motionId = null;
        if (reduced) {
          motion.forEach((m, i) => {
            m.hover = hovered === i ? 1 : 0;
            m.tiltX = 0;
            m.tiltY = 0;
            m.targetTiltX = 0;
            m.targetTiltY = 0;
          });
          paint();
          return;
        }

        let busy = false;
        motion.forEach((m, i) => {
          const targetHover = hovered === i ? 1 : 0;
          /* Soft attack, slower release. */
          const hoverK = targetHover > m.hover ? 0.11 : 0.07;
          const nextHover = lerp(m.hover, targetHover, hoverK);
          if (Math.abs(nextHover - m.hover) > 0.0015) busy = true;
          m.hover = nextHover;

          const wantTiltX = hovered === i ? m.targetTiltX : 0;
          const wantTiltY = hovered === i ? m.targetTiltY : 0;
          const tiltK = hovered === i ? 0.1 : 0.08;
          const nextTiltX = lerp(m.tiltX, wantTiltX, tiltK);
          const nextTiltY = lerp(m.tiltY, wantTiltY, tiltK);
          if (
            Math.abs(nextTiltX - m.tiltX) > 0.05 ||
            Math.abs(nextTiltY - m.tiltY) > 0.05
          ) {
            busy = true;
          }
          m.tiltX = nextTiltX;
          m.tiltY = nextTiltY;
          if (m.hover > 0.002 || targetHover > 0) busy = true;
        });

        paint();
        if (busy) motionId = requestAnimationFrame(tickMotion);
      };

      const ensureMotion = () => {
        if (reduced) {
          paint();
          return;
        }
        if (!motionId) motionId = requestAnimationFrame(tickMotion);
      };

      const step = (dir) => {
        top = (top + dir + n) % n;
        wheelAcc = 0;
        dismissCue();
        paint();
        syncVideos();
      };

      const onWheel = (event) => {
        if (event.ctrlKey || reduced) return;
        if (!event.target.closest(".pile__card")) return;
        const delta =
          Math.abs(event.deltaY) > Math.abs(event.deltaX)
            ? event.deltaY
            : event.deltaX;
        if (!delta) return;

        const goingNext = delta > 0;
        if ((top <= 0 && !goingNext) || (top >= n - 1 && goingNext)) return;

        event.preventDefault();
        event.stopPropagation();

        wheelAcc += delta;
        while (wheelAcc >= WHEEL_PER_CARD && top < n - 1) {
          wheelAcc -= WHEEL_PER_CARD;
          step(1);
        }
        while (wheelAcc <= -WHEEL_PER_CARD && top > 0) {
          wheelAcc += WHEEL_PER_CARD;
          step(-1);
        }
        if (top <= 0 && wheelAcc < 0) wheelAcc = 0;
        if (top >= n - 1 && wheelAcc > 0) wheelAcc = 0;
      };

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            live = entry.isIntersecting;
            syncVideos();
            paint();
          });
        },
        { root: stage, threshold: 0.2 }
      );
      io.observe(root);

      cards.forEach((card, i) => {
        card.addEventListener("pointerenter", () => {
          hovered = i;
          /* Freeze hit geometry so tilt doesn’t chase the moving card. */
          const rect = card.getBoundingClientRect();
          motion[i].baseCX = rect.left + rect.width / 2;
          motion[i].baseCY = rect.top + rect.height / 2;
          motion[i].baseW = Math.max(1, rect.width);
          motion[i].baseH = Math.max(1, rect.height);
          ensureMotion();
        });
        card.addEventListener("pointermove", (event) => {
          if (reduced || hovered !== i) return;
          const m = motion[i];
          const px = (event.clientX - m.baseCX) / m.baseW;
          const py = (event.clientY - m.baseCY) / m.baseH;
          const clamp = (v) => Math.max(-0.55, Math.min(0.55, v));
          /* Soft pointer follow — targets only; spring lerps in the raf. */
          m.targetTiltX = clamp(px) * 16;
          m.targetTiltY = clamp(py) * 12;
          ensureMotion();
        });
        card.addEventListener("pointerleave", () => {
          if (hovered === i) hovered = -1;
          motion[i].targetTiltX = 0;
          motion[i].targetTiltY = 0;
          ensureMotion();
        });
        card.addEventListener("click", () => {
          if (depthOf(i) === 0) {
            step(1);
          } else {
            top = i;
            dismissCue();
            paint();
            syncVideos();
          }
        });
      });

      /* Capture on root so only card hits steal wheel; gaps scroll the stage. */
      root.addEventListener("wheel", onWheel, { passive: false, capture: true });
      const onResize = () => {
        paint();
        ensureMotion();
      };
      addEventListener("resize", onResize);
      if (phoneMq.addEventListener) phoneMq.addEventListener("change", onResize);
      else phoneMq.addListener(onResize);

      paint();
      syncVideos();
      addEventListener(
        "pagehide",
        () => {
          io.disconnect();
          if (motionId) cancelAnimationFrame(motionId);
          removeEventListener("resize", onResize);
          root.removeEventListener("wheel", onWheel, { capture: true });
          root.querySelectorAll("video").forEach((v) => v.pause());
        },
        { once: true }
      );
    });
  }

  /* Lens: mockups + color clips — muted until hover, audio fades in/out.
     One video owns audio at a time; hit-test so transforms don't desync. */
  function initLensHoverAudio(stage) {
    if (project.slug !== "lens") return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const FADE_MS = 320;
    const videos = [
      ...stage.querySelectorAll(
        ".slide--lens-mockup video, .slide--lens-slot video"
      ),
    ];
    if (!videos.length) return;
    const audible = new Set(videos);

    let unlocked = false;
    let inside = false;
    let pointer = { x: -1e6, y: -1e6 };
    let owner = null;
    let dirty = true;
    let frameId = null;
    const fades = new WeakMap();
    const levels = new WeakMap();

    function levelOf(video) {
      return levels.has(video) ? levels.get(video) : video.volume;
    }

    function hardMute(video) {
      const id = fades.get(video);
      if (id) cancelAnimationFrame(id);
      fades.delete(video);
      levels.set(video, 0);
      video.defaultMuted = true;
      video.setAttribute("muted", "");
      video.muted = true;
      video.volume = 0;
    }

    function fadeVolume(video, to) {
      const prev = fades.get(video);
      if (prev) cancelAnimationFrame(prev);
      fades.delete(video);

      const from = levelOf(video);

      if (to > 0) {
        video.defaultMuted = false;
        video.removeAttribute("muted");
        video.muted = false;
        if (video.paused) video.play().catch(() => {});
      }

      if (Math.abs(from - to) < 0.01) {
        levels.set(video, to);
        video.volume = to;
        if (to <= 0) {
          video.defaultMuted = true;
          video.setAttribute("muted", "");
          video.muted = true;
          video.volume = 0;
        }
        return;
      }

      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        const eased = t * t * (3 - 2 * t);
        const val = from + (to - from) * eased;
        levels.set(video, val);
        video.volume = Math.max(0, Math.min(1, val));
        if (t < 1) {
          fades.set(video, requestAnimationFrame(step));
          return;
        }
        levels.set(video, to);
        video.volume = to;
        if (to <= 0) {
          video.defaultMuted = true;
          video.setAttribute("muted", "");
          video.muted = true;
          video.volume = 0;
        }
        fades.delete(video);
      };
      fades.set(video, requestAnimationFrame(step));
    }

    videos.forEach(hardMute);

    function hoveredVideo() {
      if (!inside || !unlocked) return null;
      const stack = document.elementsFromPoint(pointer.x, pointer.y);
      for (let i = 0; i < stack.length; i += 1) {
        const el = stack[i];
        /* Color clips: only the <video> itself — never the column/text. */
        if (audible.has(el)) return el;
        /* Mockups: video is transformed; allow the mockup frame/slide. */
        const mockup = el.closest?.(".slide--lens-mockup");
        if (mockup) {
          const video = mockup.querySelector("video");
          if (video && audible.has(video)) return video;
        }
      }
      return null;
    }

    function apply() {
      const next = hoveredVideo();
      if (next !== owner) {
        if (owner) fadeVolume(owner, 0);
        owner = next;
        if (owner) fadeVolume(owner, 1);
      }
      videos.forEach((video) => {
        if (video !== owner && levelOf(video) > 0.01 && !fades.has(video)) {
          fadeVolume(video, 0);
        }
      });
    }

    function fading() {
      return videos.some((video) => fades.has(video));
    }

    function tick() {
      frameId = null;
      if (!dirty) return;
      dirty = false;
      apply();
      if (owner || fading()) schedule();
    }

    function schedule() {
      dirty = true;
      if (frameId !== null) return;
      frameId = requestAnimationFrame(tick);
    }

    function silenceAll() {
      owner = null;
      videos.forEach(hardMute);
    }

    document.addEventListener(
      "pointerdown",
      (event) => {
        unlocked = true;
        inside = true;
        pointer = { x: event.clientX, y: event.clientY };
        schedule();
      },
      { passive: true }
    );

    document.addEventListener(
      "mousemove",
      (event) => {
        inside = true;
        pointer = { x: event.clientX, y: event.clientY };
        if (navigator.userActivation?.hasBeenActive) unlocked = true;
        schedule();
      },
      { passive: true }
    );

    stage.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    document.addEventListener("mouseleave", () => {
      inside = false;
      if (owner) fadeVolume(owner, 0);
      owner = null;
    });

    window.addEventListener("blur", silenceAll);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) silenceAll();
    });
  }

  function boot() {
    document.body.classList.add("project");
    const stage = render();
    Site.init({ waitFor: Site.whenSettled(stage) });
    initScroll(stage);
    initImageTilt(stage);
    initImageCycle(stage);
    initStripVideos(stage);
    initPile(stage);
    initLensHoverAudio(stage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

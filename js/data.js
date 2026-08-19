/* ==========================================================================
   Site content — this is the only file you need to edit to update the site.

   SITE      : name, contact details, about copy.
   PROJECTS  : one object per project, in the order they appear on the home page.

   Each project's `slides` array becomes the horizontal panels of its page.
   Slide kinds:
     { kind: "image", src, caption, size }   size: "std" | "wide" | "tall" | "full"
     { kind: "video", src, caption, size }   muted looping video; same sizes as image
     { kind: "text",  heading, body: [ "paragraph", "paragraph" ] }
     { kind: "quote", text, source }
     { kind: "stack", items: [ { src, caption }, { src, caption } ] }
     { kind: "pair", items: [ { src, caption }, { src, caption } ], media? }  — two images (or videos if media: "video"), centered
     { kind: "cycle", items: [ { src }, … ], interval?, layout?, media? }  — pair layout (default); layout: "solo" = one centered switching frame; media: "video" for muted looping clips
     { kind: "strip", items: [ { src }, … ], media? }  — horizontal row of all items; scroll/drag to browse; media: "video"
     { kind: "pile", items: [ { src }, … ], media? }  — messy overlapping card pile; scroll/click to cycle; media: "video"
     { kind: "solo", src, caption, size }  — one image, centered; size: "std" | "wide" | "tall"
     { kind: "slot", className? }  — empty full-viewport panel (reserve space for a video later)

   Titles appear on project pages only. Set `comingSoon: true` for an empty
   placeholder page (box). Optional `teaser` is the short home-preview blurb.
   ========================================================================== */

const SITE = {
  name: "Goni Israeli",
  role: "Multidisciplinary designer",
  location: "Kibbutz Magal",
  email: "goniisraeli4@gmail.com",
  phone: "+972 00 000 0000",
  // Home page opening statement.
  statement:
    "A graphic design practice working across identity, editorial and type. Quiet systems, deliberate details, work built to last.",
  about: {
    copy: "Hi, I’m Goni. Multidisciplinary\ndesigner Based in Kibbutz Magal.\nI design across UX/UI, branding,\nand visual storytelling with\na focus on clarity, intention,\nand just enough personality.\nMinimal when I can, bold when\nI should — Always with inking\nhands and a\u00A0messy\u00A0sketchbook.",
    /* Phone-only rows (desktop keeps `copy`). Rendered uppercase via CSS. */
    copyMobileLines: [
      "Hi, I’m Goni.",
      "Multidisciplinary",
      "designer based in Kibbutz",
      "Magal. I design across",
      "UX/UI, branding, and visual",
      "storytelling with a focus",
      "on clarity, intention, and",
      "just enough personality.",
      "Minimal when I can, bold",
      "when I should — always",
      "with inking hands and a",
      "messy sketchbook.",
    ],
    experience: [
      {
        dates: "2025 | 2026",
        lines: ["Graphic Designer", "Student position"],
        org: "Studio Avidani",
      },
    ],
    education: [
      {
        dates: "2022 | 2026",
        lines: [
          "Graduate, Bachelor's Degree",
          "in Visual Communication",
        ],
        org: ["Bezalel Academy of", "Arts & Design"],
      },
    ],
    links: [
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/goni-israeli-80a655222",
      },
      { label: "CV", href: "assets/Goni-Israeli-CV.pdf" },
      { label: "Mail", href: "mailto:goniisraeli4@gmail.com" },
    ],
  },
  socials: [
    { label: "Instagram", href: "#" },
    { label: "Behance", href: "#" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/goni-israeli-80a655222" },
  ],
  credits: [
    { role: "Design and Develop", name: "Goni Israeli" },
    { role: "Design tools", name: "Cursor, Spline" },
    { role: "Type", name: "Overpass Mono, Overpass" },
    { role: "Year", name: "2026" },
  ],
  creditsNote:
    "All projects here were made for educational purposes as part of my studies at Bezalel Academy of Arts and Design. Brand references are academic exercises only — no affiliation or endorsement implied, unless noted below.",
  visuals: {
    paragraphs: [
      "Unless noted otherwise below, all images are original, sourced from royalty-free platforms (e.g. Pexels) under valid licenses, or personal screenshots. 3D assets were created with Spline, using built-in templates and default shapes, customized\u00a0with modified textures and\u00a0materials.",
    ],
    notes: [
      {
        project: "Herzl 16",
        text: 'The Poster\'s background includes visual content from “Graffiti City Door” by User: MarkBTomlinson, licensed under CC BY-SA 4.0, via Wikimedia Commons. [Modified]. Typeface: Font #37 [provided by the brand].',
      },
      {
        project: "Nahum Tevet Portfolio",
        text: "Images sourced from Kristof De Clercq Gallery, Hezi Cohen Gallery, MAAB Gallery, and Gallery Viewer. Not affiliated with the artist.",
      },
      {
        project: "Lens",
        text: "Inspired by Pantone® Color of the Year. Tools: Spline & Cursor. Compiled and edited from Pexels stock videos. Not affiliated with Pantone.",
      },
      {
        project: "Rujum",
        text: "Typeface: Ezer Actual (Oded Ezer).",
      },
      {
        project: "Portfolio site",
        text: "Base 3D shape via Spline Community (hafizakiran),\u00a0customized.",
      },
    ],
  },
};

const PROJECTS = [
  {
    slug: "guilty",
    title: "GUILTY.",
    course: "Final Project",
    courseNote: "guided by Dani Bacon\nand Shimrit Elkanati.",
    year: "2026",
    discipline: "Art Direction",
    summary:
      "A conceptual fashion brand pointing an\naccusing finger directly at the modern\nconsumer. Built on a comprehensive\nvisual language — encompassing brand\nidentity, illustration, photography,\nproduction, and digital design, the\nproject creates a striking dissonance:\nan interactive e-commerce website and\nvibrant scarves that mask a painful reality.",
    teaser: "a conceptual fashion brand",
    cover: "guilty/1-IMG_0574-2.jpg",
    siteUrl: "https://goniisraeli4-debug.github.io/Guilty/index.html",
    credits: [
      { role: "Typeface", name: "IBM Plex Mono & Inter" },
      { role: "Tools", name: "Cursor, Figma, Spline" },
      { role: "Special thanks", name: "Gal Burshtein, Noa Katz" },
    ],
    slides: [
      { kind: "video", src: "guilty/IMG_8681-silent.mp4", size: "full", fit: "contain" },
      {
        kind: "cycle",
        interval: 4000,
        items: [
          { src: "guilty/1-IMG_0574-2.jpg" },
          { src: "guilty/3-IMG_0571-2.jpg" },
          { src: "guilty/IMG_0626.JPG" },
          { src: "guilty/IMG_0578.JPG" },
          { src: "guilty/1.jpg" },
        ],
      },
      {
        kind: "video",
        src: "guilty/guilty-home-alpha.webm?v=alpha",
        fallback: "guilty/guilty-home-mockup.mp4?v=ededed",
        size: "full",
        fit: "contain",
        className: "slide--home-mockup",
      },
      {
        kind: "video",
        src: "guilty/guilty-about-alpha.webm?v=alpha",
        fallback: "guilty/guilty-about-mockup.mp4?v=ededed",
        size: "full",
        fit: "contain",
        rate: 1,
        className: "slide--about-mockup",
      },
      {
        kind: "video",
        src: "guilty/guiltywebsite.mov",
        size: "full",
        fit: "contain",
        className: "slide--guilty-website slide--mobile-only",
      },
      { kind: "image", src: "guilty/IMG_0635-2.jpg", size: "full", className: "slide--duo" },
      {
        kind: "cycle",
        layout: "solo",
        className: "slide--landscape",
        interval: 4000,
        items: [
          { src: "guilty/IMG_0480-2.jpg" },
          { src: "guilty/IMG_0575.JPG" },
          { src: "guilty/IMG_0577.JPG" },
          { src: "guilty/IMG_0583.JPG" },
        ],
      },
      {
        kind: "pair",
        media: "video",
        className: "slide--half-viewport",
        rate: 1.1,
        items: [
          { src: "guilty/IMG_8725-silent.mp4" },
          { src: "guilty/IMG_8660-silent.mp4" },
        ],
      },
    ],
  },
  {
    slug: "nahum-tevet-portfolio",
    title: "Nahum Tevet\nPortfolio",
    course: "Interactive web design",
    courseNote: "guided by Nir Shaked\nand Yotam Mano.",
    year: "2025",
    discipline: "Web Design",
    summary:
      "A conceptual web experience designed to reflect\n" +
      "the physical tension in Nahum Tevet’s geometric art.\n" +
      "The project centers around a single interaction: a toggle\n" +
      "button that transitions the interface from flat 2D photography\n" +
      "into a fragmented, interactive 3D environment built in Spline.\n" +
      "By bridging Figma and Spline, the design shifts the user's\n" +
      "perspective from geometric order to spatial chaos,\n" +
      "allowing for active exploration of the artwork.",
    /* Phone open-panel line breaks only (desktop keeps `summary`). */
    summaryMobile:
      "A conceptual web experience designed to reflect\n" +
      "the physical tension in Nahum Tevet’s geometric art.\n" +
      "The project centers around a single interaction:\n" +
      "a toggle button that transitions the interface from\n" +
      "flat 2D photography into a fragmented, interactive\n" +
      "3D environment built in Spline. By bridging Figma\n" +
      "and Spline, the design shifts the user's perspective\n" +
      "from geometric order to spatial chaos,\n" +
      "allowing for active exploration of the artwork.",
    teaser:
      "A web experience toggling Nahum Tevet’s\nart from flat photography into interactive 3D.",
    cover: "assets/work/01.svg",
    credits: [
      { role: "Tools", name: "Spline" },
      {
        role: "General",
        name: "All original artworks\nby Nahum Tevet.\nImages sourced from\nKristof De Clercq Gallery,\nHezi Cohen Gallery, MAAB\nGallery, and Gallery Viewer.\nModified template object;\noriginal environment",
      },
    ],
    slides: [
      {
        kind: "video",
        src: "nahum tevet/sofi-copy-hq.mp4?v=1",
        size: "full",
        fit: "contain",
        className: "slide--nahum-artwork",
      },
      {
        kind: "video",
        src: "nahum tevet/sofi-copy-hq-mobile.mp4?v=ededed",
        size: "full",
        fit: "contain",
        className: "slide--nahum-artwork slide--mobile-only",
      },
      {
        kind: "video",
        src: "nahum tevet/screen-menu.mp4?v=1",
        size: "full",
        fit: "contain",
        className: "slide--nahum-screen",
      },
      {
        kind: "pair",
        media: "video",
        className: "slide--nahum-mockups",
        items: [
          {
            src: "nahum tevet/nm2.webm?v=1",
            fallback: "nahum tevet/nm2-flat.mp4?v=1",
          },
        ],
      },
      {
        kind: "pair",
        media: "video",
        className: "slide--nahum-mockups slide--mobile-only",
        items: [
          {
            src: "nahum tevet/nm2-mobile.mp4?v=cutout",
          },
        ],
      },
      {
        kind: "image",
        src: "nahum tevet/oved-esh.png?v=1",
        size: "full",
        fit: "contain",
        className: "slide--nahum-oved",
      },
    ],
  },
  {
    slug: "herzl-16",
    title: "HERZL 16",
    course: "Illustration in real life",
    courseNote: "guided by Anat Warshavsky.",
    year: "2025",
    discipline: "Brand Collateral",
    summary:
      "As one of three winners of the Herzl 16 competition,\nI had the opportunity to collaborate with one of\nTel Aviv’s most vibrant creative spaces — designing\nnew branding to blend with their current menus,\na poster, and a canvas bag. The project blended\naesthetics with functionality, focusing on bold\nstorytelling, user engagement, and cohesive\nvisual language. The logo was adapted to align\nwith the existing menu while introducing\na refreshed, modern tone.",
    teaser: "branding for a Tel Aviv creative space",
    cover: "Herzl16/Poster_on_Concrete_Background_Mockup_2 copy.png?v=preview",
    credits: [
      { role: "Photography", name: "@Yuvalurbach" },
      { role: "Typeface", name: "Font #37 [provided by the brand]" },
      { role: "Tools", name: "Procreate" },
      {
        role: "General",
        name: "The Poster's background\nincludes visual content from\n“Graffiti City Door” by User:\nMarkBTomlinson, licensed\nunder CC BY-SA 4.0, via\nWikimedia Commons.\n [Modified]",
      },
    ],
    slides: [
      { kind: "image", src: "Herzl16/Simple_Glued_Poster_Mockup.png", size: "full", className: "slide--herzl-poster" },
      {
        kind: "pair",
        className: "slide--herzl-bags",
        items: [
          { src: "Herzl16/Free_Tote_Bag_Mockup_5 copy.png" },
          { src: "Herzl16/Free_Tote_Bag_Mockup_2 copy.png" },
        ],
      },
      { kind: "image", src: "Herzl16/Glossy_A4_Paper_Mockup_6.jpg", size: "full" },
      {
        kind: "cycle",
        interval: 4000,
        items: [
          { src: "Herzl16/IMG_0667 copy.JPG" },
          { src: "Herzl16/IMG_0670 copy.JPG" },
          { src: "Herzl16/IMG_0669 copy.JPG" },
          { src: "Herzl16/IMG_0668 copy.JPG" },
          { src: "Herzl16/IMG_0671 copy.JPG" },
          { src: "Herzl16/IMG_0666 copy.JPG" },
        ],
      },
      {
        kind: "image",
        src: "Herzl16/Poster_on_Concrete_Background_Mockup_2 copy.png",
        size: "full",
        className: "slide--herzl-concrete",
      },
      {
        kind: "pair",
        className: "slide--herzl-photos",
        items: [
          { src: "Herzl16/uvpic352.jpg" },
          { src: "Herzl16/uvpic411 2.jpg" },
        ],
      },
    ],
  },
  {
    slug: "lens",
    title: "LENS",
    course: "Interactive web design",
    courseNote: "guided by Nir Shaked\nand Yotam Mano.",
    year: "2026",
    discipline: "Creative Coding",
    summary:
      "A conceptual web experience\ntransforming the objective \"Pantone\nColor of the Year\" into a subjective,\nmulti-sensory journey. Exploring\nthe concept of synesthesia, the site\npairs each color (2000–2026) with a\nsignificant technological event. The core\ninteraction bridges 2D UI and 3D spatial\ndesign, evolving flat color swatches into\nimmersive, tangible environments built in\nSpline, allowing users to actively \"feel\" color.",
    teaser: "a synesthetic journey through Pantone colors",
    cover: "assets/work/05.svg",
    credits: [
      { role: "Inspired by", name: "Pantone®\nColor of the Year" },
      { role: "Tools", name: "Cursor, Spline", className: "close__credit--cursor" },
      {
        role: "General",
        name: "Compiled and edited\nfrom Pexels stock videos.\nNot affiliated\nwith Pantone.",
      },
    ],
    slides: [
      {
        kind: "video",
        src: "lens/lens.webm?v=alpha",
        fallback: "lens/lens-flat.mp4?v=alpha",
        size: "full",
        fit: "contain",
        className: "slide--lens-mockup",
      },
      {
        kind: "text",
        className: "slide--lens-bridge",
        heading: "[ · ]",
        body: [
          "These 3D environments translate\na synesthetic response to each\nPantone color into physical spaces,\nbridging personal perception with digital\nhistory by aligning sensory forms with\ntechnological milestones.",
        ],
      },
      {
        kind: "video",
        src: "lens/lens-about.webm?v=2",
        fallback: "lens/lens-about-flat.mp4?v=2",
        size: "full",
        fit: "contain",
        className: "slide--lens-mockup slide--lens-about",
      },
      {
        kind: "video",
        src: "lens/lens-slot-blue.mp4?v=2",
        size: "full",
        fit: "contain",
        className: "slide--lens-slot slide--lens-slot-1",
        heading: "Blue Turquoise [2005]",
        subheading: "The Data Stream",
        body:
          "Selected by Pantone as a calming\nnod to nature, this color coincides\nwith the public launch of YouTube.\nIt merges tropical depth with the\n\"Data Stream\"—the newly formed,\nrushing current of digital video\nflooding the internet.",
      },
      {
        kind: "video",
        src: "lens/lens-slot-peach.mp4",
        size: "full",
        fit: "contain",
        className: "slide--lens-slot slide--lens-slot-2",
        heading: "Peach Fuzz [2024]",
        subheading: "Synthetic Warmth",
        body:
          "Championed for its tactile, human\nwarmth, this shade emerged at the\npeak of the AI revolution. It highlights\na fascinating tension: our modern attempt\nto code empathy and simulate physical\ncomfort within an automated era.",
      },
      {
        kind: "video",
        src: "lens/lens-slot-very.mp4?v=2",
        size: "full",
        fit: "contain",
        className: "slide--lens-slot slide--lens-slot-3",
        heading: "Very Peri [2022]",
        subheading: "The Playground Cosmos",
        body:
          "Inspired by the rise of the Metaverse,\nthis color arrived alongside the James\nWebb Space Telescope's first deep-universe\nimages. It captures an era expanding\nsimultaneously inward into virtual\nsandboxes and outward into space.",
      },
      {
        kind: "video",
        src: "lens/lens-pages.mp4?v=2",
        size: "full",
        fit: "contain",
        className: "slide--lens-pages",
      },
    ],
  },
  {
    slug: "rujum",
    title: "Rujum",
    course: "Game Design & Development",
    courseNote: "guided by Eytan Majar.",
    collaboration: "a collab with Maya Shamir\nand Gal Burshtein.",
    year: "2024",
    discipline: "Game Design",
    summary:
      "Rujum is a strategic board game designed to\nchallenge, captivate, and keep players on their\ntoes. In Rujum, every move reshapes the\nbattlefield, every decision shifts the balance.\nClaim the domes, outmaneuver your rivals,\nand rise to the top.",
    teaser: "strategic board game",
    cover: "rujum photos/1-IMG_5645-VSCO.jpg?v=7",
    credits: [
      { role: "Typeface", name: "Ezer Actual (Oded Ezer)" },
      { role: "Project type", name: "Educational, Bezalel Academy" },
    ],
    slides: [
      { kind: "image", src: "rujum photos/1-IMG_5645-VSCO.jpg?v=6", size: "full" },
      { kind: "solo", src: "rujum photos/4-IMG_5640.jpg?v=6", size: "tall" },
      { kind: "image", src: "rujum photos/3-IMG_5661.jpg?v=6", size: "full" },
      {
        kind: "pair",
        items: [
          { src: "rujum photos/6-IMG_5633.jpg?v=6" },
          { src: "rujum photos/7-IMG_5626 copy.jpg?v=6" },
        ],
      },
      {
        kind: "image",
        src: "assets/work/rujum/08-contour-sketch.png?v=6",
        size: "full",
        fit: "contain",
      },
    ],
  },
  {
    slug: "coming-soon",
    title: "Coming soon",
    comingSoon: true,
    course: "",
    year: "",
    discipline: "",
    summary: "",
    cover: "assets/work/07.svg",
    credits: [],
    slides: [],
  },
  {
    slug: "torus",
    title: "Personal ID",
    course: "3x3 Animation Design Course",
    courseNote: "guided by Assaf Cohen",
    year: "2025",
    discipline: "AI Motion",
    summary:
      "Inspired by my name,\nGoni (meaning \"My Hue\" in Hebrew),\nI created a digital \"ID card\" through\nnine Instagram-format animations.\n\nEach piece acts as a personal color\nswatch, inspired by the iconic Pantone\narchitectural fans, where every shade\nrepresents a different trait of my personality\nthrough unique motion and rhythm.",
    teaser: "nine animated color-swatch self-portraits",
    cover: "assets/work/05.svg",
    credits: [
      { role: "Tools", name: "Adobe Firefly" },
    ],
    slides: [
      {
        kind: "pair",
        className: "slide--personal-phones",
        rate: 1,
        items: [
          {
            media: "video",
            src: "Personal ID/personal-id-alpha.webm?v=ededed",
            fallback: "Personal ID/personal-id-flat.mp4?v=ededed",
          },
          { src: "Personal ID/iphone-angle.png" },
        ],
      },
      {
        kind: "pile",
        media: "video",
        rate: 1,
        className: "slide--personal-carousel",
        items: [
          { src: "Personal ID/Carousel/carousel-01.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-02.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-03.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-04.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-05.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-06.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-07.mp4?v=2" },
          { src: "Personal ID/Carousel/carousel-08.mp4?v=2" },
        ],
      },
    ],
  },
];

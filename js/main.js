import { createPhoneScene } from "./phone-scene.js";

(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  if (navToggle && header && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // "Voir plus" / "Voir moins" toggle for the avis/faq lists on mobile
  // (CSS hides items past the 3rd via :nth-child until the list gets
  // .is-expanded).
  document.querySelectorAll(".list-toggle").forEach(function (btn) {
    var labelMore = btn.getAttribute("data-label-more") || btn.textContent;
    var labelLess = btn.getAttribute("data-label-less") || labelMore;
    btn.addEventListener("click", function () {
      var list = document.getElementById(btn.getAttribute("data-target"));
      if (!list) return;
      var expanded = list.classList.toggle("is-expanded");
      btn.textContent = expanded ? labelLess : labelMore;
      if (expanded) {
        // Clear any inline opacity/transform a scroll-reveal animation may
        // have set while these items were display:none (and so never
        // actually crossed their ScrollTrigger position) -- without this
        // they could stay invisible after being un-hidden.
        Array.prototype.forEach.call(list.children, function (item) {
          item.style.opacity = "";
          item.style.transform = "";
        });
      } else {
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-question");
    btn.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("is-open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });

  // Demo video: click-to-load facade -- keeps the video file off the page
  // until the user actually wants to watch, then plays it inline.
  document.querySelectorAll(".video-embed-trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var videoSrc = trigger.getAttribute("data-video-src");
      var poster = trigger.querySelector(".video-embed-thumb");
      var video = document.createElement("video");
      video.src = videoSrc;
      if (poster) video.poster = poster.getAttribute("src");
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      trigger.replaceWith(video);
      video.play().catch(function () {});
    });
  });

  // Per-feature tilt for the "comment ça marche" phone, one entry per node/tab.
  var ROTATIONS = [
    { x: 0.070, y: -0.279, z: -0.052 },
    { x: -0.052, y: 0.244, z: 0.035 },
    { x: 0.105, y: -0.209, z: 0.070 },
    { x: -0.070, y: 0.279, z: -0.052 }
  ];

  // ---- 3D phone scenes: hero + the "comment ça marche" hub phone ----
  var heroCanvas = document.getElementById("hero-phone-canvas");
  var storyCanvas = document.getElementById("story-phone-canvas");
  var heroScene = heroCanvas
    ? createPhoneScene(heroCanvas, { initialState: "radar" })
    : null;
  // App screenshots shown on the "comment ça marche" phone, one per step.
  var HOWTO_SCREENS = [
    "assets/screens/scan.webp",
    "assets/screens/rank.webp",
    "assets/screens/radar.webp",
    "assets/screens/exercices.webp"
  ];
  var storyScene = storyCanvas ? createPhoneScene(storyCanvas, { initialImage: HOWTO_SCREENS[0] }) : null;
  if (storyScene) storyScene.preload(HOWTO_SCREENS);

  var HERO_BASE_ROTATION = { x: 0.105, y: -0.349, z: -0.052 };
  if (heroScene) {
    heroScene.group.rotation.set(HERO_BASE_ROTATION.x, HERO_BASE_ROTATION.y, HERO_BASE_ROTATION.z);
  }

  // "Comment ça marche" hub diagram: one shared phone, 4 nodes (desktop) /
  // 4 tabs (mobile) that swap its screen + tilt on hover/tap. See below for
  // the wiring, after the shared render loop is set up.
  var howtoNodes = Array.prototype.slice.call(document.querySelectorAll(".howto-node"));
  var howtoTabs = Array.prototype.slice.call(document.querySelectorAll(".howto-tab"));
  var howtoLines = Array.prototype.slice.call(document.querySelectorAll(".howto-line"));
  var howtoTitleEl = document.getElementById("howto-mobile-title");
  var howtoTextEl = document.getElementById("howto-mobile-text");
  var HOWTO_COPY = [
    { title: "Prends 3 photos", text: "Face, profil, dos — un guide à l'écran te positionne, pose après pose." },
    { title: "Reçois ton grade honnête", text: "Un grade basé sur ta symétrie et ta densité musculaire, jamais comparé aux autres." },
    { title: "Explore ton radar musculaire", text: "Huit groupes musculaires passés au crible, avec ton évolution scan après scan." },
    { title: "Suis un plan sur-mesure", text: "Des exercices ciblés sur tes points faibles, adaptés à ton objectif et à tes préférences." }
  ];
  var howtoActiveIndex = 0;

  function setActiveFeature(idx) {
    if (idx === howtoActiveIndex && (howtoNodes[idx] && howtoNodes[idx].classList.contains("is-active"))) return;
    howtoActiveIndex = idx;

    howtoNodes.forEach(function (node, i) { node.classList.toggle("is-active", i === idx); });
    howtoLines.forEach(function (line, i) { line.classList.toggle("is-active", i === idx); });
    howtoTabs.forEach(function (tab, i) {
      tab.classList.toggle("is-active", i === idx);
      tab.setAttribute("aria-selected", String(i === idx));
    });
    if (howtoTitleEl && howtoTextEl && HOWTO_COPY[idx]) {
      howtoTitleEl.textContent = HOWTO_COPY[idx].title;
      howtoTextEl.textContent = HOWTO_COPY[idx].text;
    }

    if (storyScene) {
      storyScene.setImage(HOWTO_SCREENS[idx]);
      var target = ROTATIONS[idx];
      if (hasGsapGlobal()) {
        gsap.to(storyScene.group.rotation, { duration: 0.9, ease: "power2.inOut", x: target.x, y: target.y, z: target.z });
      } else {
        storyScene.group.rotation.set(target.x, target.y, target.z);
      }
    }
  }

  function hasGsapGlobal() {
    return typeof window.gsap !== "undefined";
  }

  if (storyScene) {
    storyScene.group.rotation.set(ROTATIONS[0].x, ROTATIONS[0].y, ROTATIONS[0].z);
  }

  // Auto-advance to the next step every 5s until the user takes control
  // (a click means "I'm driving now"); hovering just pauses the timer
  // for as long as the cursor stays on a card.
  var howtoAutoplayTimer = null;
  var howtoAutoplayEnabled = true;
  var howtoHovering = false;
  var howtoReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pauseHowtoAutoplay() {
    if (howtoAutoplayTimer) { clearInterval(howtoAutoplayTimer); howtoAutoplayTimer = null; }
  }

  function stopHowtoAutoplay() {
    howtoAutoplayEnabled = false;
    pauseHowtoAutoplay();
  }

  function resumeHowtoAutoplay() {
    if (!howtoAutoplayEnabled || howtoHovering || howtoReduceMotion || howtoAutoplayTimer || !howtoNodes.length) return;
    howtoAutoplayTimer = setInterval(function () {
      setActiveFeature((howtoActiveIndex + 1) % howtoNodes.length);
    }, 5000);
  }

  howtoNodes.forEach(function (node, i) {
    node.addEventListener("mouseenter", function () {
      howtoHovering = true;
      pauseHowtoAutoplay();
      setActiveFeature(i);
    });
    node.addEventListener("mouseleave", function () {
      howtoHovering = false;
      resumeHowtoAutoplay();
    });
    node.addEventListener("focus", function () { setActiveFeature(i); });
    node.addEventListener("click", function () {
      stopHowtoAutoplay();
      setActiveFeature(i);
    });
  });
  howtoTabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      stopHowtoAutoplay();
      setActiveFeature(i);
    });
  });

  resumeHowtoAutoplay();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  function renderPhones() {
    if (heroScene) heroScene.render();
    if (storyScene) storyScene.render();
  }

  if (hasGsap) {
    gsap.ticker.add(renderPhones);
  } else if (heroScene || storyScene) {
    (function loop() {
      renderPhones();
      requestAnimationFrame(loop);
    })();
  }

  if (!hasGsap || reduceMotion) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Recompute pin/trigger boundaries once web fonts have swapped in --
  // Plus Jakarta Sans loading late can reflow section heights after
  // ScrollTrigger's first measurement, which would otherwise leave the pin
  // start/end (and the mobile reveal triggers) slightly stale.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }

  // Hero phone: gentle idle float + tilt
  if (heroScene) {
    gsap.to(heroScene.group.rotation, {
      z: HERO_BASE_ROTATION.z + 0.05,
      x: HERO_BASE_ROTATION.x - 0.035,
      duration: 3.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
    gsap.to(heroScene.group.position, {
      y: 0.8,
      duration: 3.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  }

  // Parallax: layers drift at different speeds while scrolling (offset runs
  // from -v to +v px across the element's pass through the viewport).
  function parallax(el, v, trigger, start) {
    var fromTop = start === "top top";
    gsap.fromTo(el, { y: fromTop ? 0 : -v }, {
      y: fromTop ? 2 * v : v,
      ease: "none",
      scrollTrigger: { trigger: trigger || el, start: start || "top bottom", end: "bottom top", scrub: 0.6 }
    });
  }
  var heroSection = document.querySelector(".hero");
  var heroVisual = document.querySelector(".hero-visual");
  var heroCopy = document.querySelector(".hero-copy");
  if (heroSection && heroVisual) parallax(heroVisual, -60, heroSection, "top top");
  if (heroSection && heroCopy) parallax(heroCopy, 24, heroSection, "top top");
  gsap.utils.toArray(".section > .wrap > .eyebrow").forEach(function (el) { parallax(el, 8); });
  gsap.utils.toArray(".section > .wrap > .section-title").forEach(function (el) { parallax(el, 16); });
  gsap.utils.toArray(".section > .wrap > .section-lead").forEach(function (el) { parallax(el, 24); });
  gsap.utils.toArray(".privacy-visual-icon").forEach(function (el) { parallax(el, -28); });
  gsap.utils.toArray(".tile-img, .goal-card-img").forEach(function (img) {
    gsap.set(img, { scale: 1.2 });
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 }
    });
  });

  // "Comment ça marche": the diagram is pinned while the user scrolls, and
  // the four steps are revealed (with a slight parallax drift) one after the
  // other, each one becoming active in turn. Scroll replaces the autoplay.
  var howtoDiagram = document.querySelector(".howto-diagram");
  if (howtoDiagram && howtoNodes.length) {
    gsap.matchMedia().add({ desktop: "(min-width: 900px)", mobile: "(max-width: 899px)" }, function (ctx) {
      var isDesktop = ctx.conditions.desktop;
      var steps = howtoNodes.length;
      var lastIdx = -1;
      stopHowtoAutoplay();

      var tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: howtoDiagram,
          start: "center center+=38",
          end: function () { return "+=" + Math.round(window.innerHeight * 2.4); },
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var idx = Math.min(steps - 1, Math.floor(self.progress * steps));
            if (idx !== lastIdx) {
              lastIdx = idx;
              setActiveFeature(idx);
            }
            var shown = Math.min(steps - 1, Math.floor(self.progress * steps + 0.3));
            howtoLines.forEach(function (line, i) {
              line.style.visibility = isDesktop && i > shown ? "hidden" : "";
            });
          }
        }
      });

      if (isDesktop) {
        howtoNodes.forEach(function (node, i) {
          if (i === 0) return;
          var side = i < 2 ? -1 : 1;
          tl.fromTo(node,
            { autoAlpha: 0, "--tx": side * 60 + "px", "--ty": "24px" },
            { autoAlpha: 1, "--tx": "0px", "--ty": "0px", duration: 0.5, ease: "power2.out" },
            i - 0.3);
        });
        tl.to([howtoNodes[0], howtoNodes[1]], { "--dy": "20px", duration: steps }, 0);
        tl.to([howtoNodes[2], howtoNodes[3]], { "--dy": "-20px", duration: steps }, 0);
        howtoLines.forEach(function (line, i) { if (i > 0) line.style.visibility = "hidden"; });
      } else {
        tl.to({}, { duration: steps }, 0);
      }

      return function () {
        howtoLines.forEach(function (line) { line.style.visibility = ""; });
      };
    });
  }

  // Generic scroll reveals
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.from(el, {
      opacity: 0,
      y: 28,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });
})();

import { createPhoneScene } from "./phone-scene.js";
import { SCREEN_STATES } from "./phone-screens.js";

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

  // Per-step tilt + screen state, shared by the desktop pinned phone and the
  // four static mobile phones so both paths agree on what each step looks like.
  var ROTATIONS = [
    { x: 0.070, y: -0.279, z: -0.052 },
    { x: -0.052, y: 0.244, z: 0.035 },
    { x: 0.105, y: -0.209, z: 0.070 },
    { x: -0.070, y: 0.279, z: -0.052 }
  ];

  // ---- 3D phone scenes: hero, desktop pinned scroll story, mobile per-step ----
  var heroCanvas = document.getElementById("hero-phone-canvas");
  var storyCanvas = document.getElementById("story-phone-canvas");
  var heroScene = heroCanvas
    ? createPhoneScene(heroCanvas, { initialImage: "assets/screens/accueil.png" })
    : null;
  var storyScene = storyCanvas ? createPhoneScene(storyCanvas, { initialState: "pose" }) : null;

  var HERO_BASE_ROTATION = { x: 0.105, y: -0.349, z: -0.052 };
  if (heroScene) {
    heroScene.group.rotation.set(HERO_BASE_ROTATION.x, HERO_BASE_ROTATION.y, HERO_BASE_ROTATION.z);
  }

  var mobileScenes = [];
  document.querySelectorAll("[data-mobile-phone]").forEach(function (canvas) {
    var idx = parseInt(canvas.getAttribute("data-mobile-phone"), 10) - 1;
    if (idx < 0 || idx >= SCREEN_STATES.length) return;
    var scene = createPhoneScene(canvas, { initialState: SCREEN_STATES[idx] });
    scene.group.rotation.set(ROTATIONS[idx].x, ROTATIONS[idx].y, ROTATIONS[idx].z);
    mobileScenes.push(scene);
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  function renderPhones() {
    if (heroScene) heroScene.render();
    if (storyScene) storyScene.render();
    mobileScenes.forEach(function (scene) { scene.render(); });
  }

  if (hasGsap) {
    gsap.ticker.add(renderPhones);
  } else if (heroScene || storyScene || mobileScenes.length) {
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
  // Barlow/Barlow Condensed loading late can reflow section heights after
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

  // Mobile per-step phones: same subtle idle float, phase-offset per phone
  // so they don't all breathe in lockstep.
  mobileScenes.forEach(function (scene, i) {
    var base = ROTATIONS[i];
    gsap.to(scene.group.rotation, {
      z: base.z + (i % 2 === 0 ? 0.045 : -0.045),
      x: base.x - 0.03,
      duration: 3.2 + i * 0.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });
  });

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

  var headerEl = document.querySelector(".site-header");

  ScrollTrigger.matchMedia({
    "(min-width: 900px)": function () {
      var section = document.querySelector(".scrollstory");
      var grid = section.querySelector(".scrollstory-grid");
      var steps = gsap.utils.toArray(".story-step");

      if (!storyScene) return undefined;

      section.classList.add("is-pinned");

      storyScene.group.rotation.set(ROTATIONS[0].x, ROTATIONS[0].y, ROTATIONS[0].z);
      storyScene.setState(SCREEN_STATES[0]);
      gsap.set(steps, { autoAlpha: 0, y: 24 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });

      // Screen-state thresholds: the exact tl.time() at which each step's
      // content becomes "current". Driven from the timeline's own onUpdate
      // (fires every tick, including the scrub's inertial catch-up after
      // the user stops scrolling) instead of a one-shot tl.call() -- a
      // scrubbed timeline re-crosses these points going backward too, so a
      // plain .call() fires again on the way back and re-asserts the state
      // it was leaving (scrolling up from step 4 into step 3 left the phone
      // showing step 4's screen under step 3's text). Deriving the state
      // from "how far across have we scrubbed" instead of "did we just
      // cross a point" is correct in both directions by construction, and
      // ScrollTrigger's own onUpdate is scroll-event-driven so it stops
      // firing before scrub:1's ~1s easing has actually finished catching
      // up -- the timeline's onUpdate does not have that gap.
      var stateThresholds = [0];
      for (var s = 1; s < steps.length; s += 1) stateThresholds.push((s - 1) + 0.4);
      var currentStateIndex = 0;

      function stateIndexForTime(time) {
        var idx = 0;
        for (var s = 0; s < stateThresholds.length; s += 1) {
          if (time >= stateThresholds[s]) idx = s;
        }
        return idx;
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: grid,
          start: function () { return "top " + (headerEl ? headerEl.offsetHeight : 0); },
          end: "+=" + steps.length * 100 + "%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        },
        onUpdate: function () {
          var idx = stateIndexForTime(this.time());
          if (idx !== currentStateIndex) {
            currentStateIndex = idx;
            storyScene.setState(SCREEN_STATES[idx]);
          }
        }
      });

      for (var i = 1; i < steps.length; i += 1) {
        (function (i) {
          var t = i - 1;
          tl.addLabel("step" + (i + 1), t);
          tl.to(storyScene.group.rotation, { duration: 1, ease: "power2.inOut", x: ROTATIONS[i].x, y: ROTATIONS[i].y, z: ROTATIONS[i].z }, "step" + (i + 1) + "+=0.15");
          tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.35, ease: "power1.in" }, "step" + (i + 1) + "+=0.05");
          tl.to(steps[i], { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, "step" + (i + 1) + "+=0.45");
        })(i);
      }

      return function () {
        section.classList.remove("is-pinned");
        gsap.set(steps, { clearProps: "all" });
        storyScene.group.rotation.set(ROTATIONS[0].x, ROTATIONS[0].y, ROTATIONS[0].z);
        storyScene.setState(SCREEN_STATES[0]);
      };
    },

    // Below 900px the phone is never pinned (mobileScenes render statically,
    // one per step, see above) -- .story-step only needs a plain reveal here.
    "(max-width: 899px)": function () {
      gsap.utils.toArray(".story-step").forEach(function (step) {
        gsap.from(step, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: step, start: "top 72%" }
        });
      });
    }
  });
})();

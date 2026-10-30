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

  // Nav: highlight the link of the section crossing the middle of the
  // screen (aria-current for screen readers). The hero has no link, so it
  // clears the highlight.
  if (mainNav && "IntersectionObserver" in window) {
    var navLinks = Array.prototype.slice.call(mainNav.querySelectorAll('a[href^="#"]'));
    var linkFor = new Map();
    navLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      if (target && !target.hidden) linkFor.set(target, link);
    });
    var heroTarget = document.getElementById("top");
    var setCurrent = function (link) {
      navLinks.forEach(function (l) {
        var on = l === link;
        l.classList.toggle("is-current", on);
        if (on) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
    };
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(linkFor.get(entry.target) || null);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    linkFor.forEach(function (link, target) { navObserver.observe(target); });
    if (heroTarget) navObserver.observe(heroTarget);
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

  // Grades: the six grades are shown one at a time in a single stage, and
  // the first four have three tiers (I-III) picked with the tier buttons.
  // Without GSAP the ladder drives the grade directly; with GSAP the panel
  // is pinned and the scroll position drives it (see the ScrollTrigger block
  // below, which sets gradesApi.onPick so a click scrolls to that grade).
  // Tiers are never scroll-driven: they are always a click.
  // Badges are plain SVG files swapped into one <img>, preloaded once the
  // section is about to be seen.
  var gradesApi = (function () {
    var panel = document.getElementById("grades-panel");
    if (!panel) return null;
    var stage = document.getElementById("grade-stage");
    var img = document.getElementById("grade-badge-img");
    var kicker = document.getElementById("grade-kicker");
    var nameEl = document.getElementById("grade-name");
    var descEl = document.getElementById("grade-desc");
    var tiersEl = document.getElementById("grade-tiers");
    var singleEl = document.getElementById("grade-single");
    var tabs = Array.prototype.slice.call(panel.querySelectorAll(".grade-tab"));
    var tierBtns = Array.prototype.slice.call(tiersEl.querySelectorAll(".grade-tier"));
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var current = 0;
    var tier = 1;
    var swapTimer = null;
    var api = { panel: panel, count: tabs.length, onPick: null, showGrade: showGrade };

    function badgeFor(tab, t) {
      var multi = Number(tab.getAttribute("data-tiers")) > 1;
      var sizes = tab.getAttribute("data-sizes").split(",");
      return {
        src: tab.getAttribute("data-base") + (multi ? "-" + t : "") + ".svg",
        size: sizes[Math.min(t, sizes.length) - 1]
      };
    }

    function paint() {
      var tab = tabs[current];
      var multi = Number(tab.getAttribute("data-tiers")) > 1;
      var name = tab.getAttribute("data-name");
      var badge = badgeFor(tab, tier);
      var roman = ["I", "II", "III"][tier - 1];
      img.src = badge.src;
      img.style.setProperty("--w", badge.size);
      img.alt = "Badge du grade " + name + (multi ? ", palier " + roman : "");
      kicker.textContent = "Grade " + (current + 1) + " sur " + tabs.length;
      nameEl.textContent = name;
      descEl.textContent = tab.getAttribute("data-desc");
      stage.style.setProperty("--glow", tab.getAttribute("data-glow"));
      stage.setAttribute("aria-labelledby", tab.id);
      tiersEl.hidden = !multi;
      singleEl.hidden = multi;
      tierBtns.forEach(function (btn, i) {
        var on = i + 1 === tier;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", String(on));
      });
    }

    function update() {
      clearTimeout(swapTimer);
      if (reduce) { paint(); return; }
      stage.classList.add("is-swapping");
      swapTimer = setTimeout(function () {
        paint();
        stage.classList.remove("is-swapping");
      }, 140);
    }

    function show(g, t) {
      if (g === current && t === tier) return;
      if (g !== current) {
        tabs.forEach(function (tab, i) {
          var on = i === g;
          tab.classList.toggle("is-active", on);
          tab.setAttribute("aria-selected", String(on));
          tab.tabIndex = on ? 0 : -1;
        });
      }
      current = g;
      tier = t;
      update();
    }

    // Scroll position -> grade: keeps the chosen tier while the grade is
    // unchanged, otherwise starts the new grade at tier I.
    function showGrade(g) {
      if (g !== current) show(g, 1);
    }

    // A click on a grade: scroll-driven mode redirects it to a scroll
    // position, otherwise it applies directly.
    function request(g) {
      if (api.onPick) api.onPick(g);
      else show(g, 1);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { request(i); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i + tabs.length - 1) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        tabs[next].focus({ preventScroll: true });
        request(next);
      });
    });

    tierBtns.forEach(function (btn, i) {
      btn.addEventListener("click", function () { show(current, i + 1); });
    });

    function preload() {
      tabs.forEach(function (tab) {
        var count = Number(tab.getAttribute("data-tiers"));
        for (var t = 1; t <= count; t++) { new Image().src = badgeFor(tab, t).src; }
      });
    }
    if ("IntersectionObserver" in window) {
      var preloadObserver = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        preloadObserver.disconnect();
        preload();
      }, { rootMargin: "600px 0px" });
      preloadObserver.observe(panel);
    } else {
      preload();
    }
    return api;
  })();

  // Promo bar: click the code to copy it.
  var promoCode = document.querySelector(".promo-code");
  if (promoCode) {
    var promoStatus = document.getElementById("promo-status");
    var promoTimer = null;
    var promoDone = function (ok) {
      promoCode.classList.toggle("is-copied", ok);
      if (promoStatus) promoStatus.textContent = ok ? "Code copié" : "";
      clearTimeout(promoTimer);
      promoTimer = setTimeout(function () {
        promoCode.classList.remove("is-copied");
        if (promoStatus) promoStatus.textContent = "";
      }, 1800);
    };
    // execCommand fallback: used when the async clipboard API is missing or
    // refuses (non-secure context, no permission).
    var promoFallback = function (code) {
      var area = document.createElement("textarea");
      area.value = code;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(area);
      if (ok) promoDone(true);
    };
    promoCode.addEventListener("click", function () {
      var code = promoCode.getAttribute("data-code");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { promoDone(true); }, function () { promoFallback(code); });
      } else {
        promoFallback(code);
      }
    });
  }

  // Promo bar "i": toggles the note explaining that promo codes cancel the
  // free trial. Closes on outside click and Escape (focus goes back to "i").
  var promoInfo = document.querySelector(".promo-info");
  var promoPanel = document.getElementById("promo-info-panel");
  if (promoInfo && promoPanel) {
    var setPromoInfo = function (open) {
      promoPanel.hidden = !open;
      promoInfo.setAttribute("aria-expanded", String(open));
    };
    // Mouse devices: the note shows on hover (and on keyboard focus). Touch
    // devices keep the tap-to-toggle behaviour.
    var promoHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var promoWrap = promoInfo.parentElement;
    promoWrap.addEventListener("mouseenter", function () { if (promoHover.matches) setPromoInfo(true); });
    promoWrap.addEventListener("mouseleave", function () { if (promoHover.matches) setPromoInfo(false); });
    promoInfo.addEventListener("focus", function () {
      if (promoHover.matches && promoInfo.matches(":focus-visible")) setPromoInfo(true);
    });
    promoInfo.addEventListener("blur", function () { if (promoHover.matches) setPromoInfo(false); });
    promoInfo.addEventListener("click", function () {
      if (!promoHover.matches) setPromoInfo(promoPanel.hidden);
    });
    document.addEventListener("click", function (e) {
      if (!promoPanel.hidden && !promoPanel.contains(e.target) && !promoInfo.contains(e.target)) setPromoInfo(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !promoPanel.hidden) {
        setPromoInfo(false);
        promoInfo.focus();
      }
    });
  }

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

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  // Scan IA demo: one analysis pass per pose (key points, skeleton,
  // scores), then the next pose. Auto-advance holds while the pointer or
  // focus is on the demo, and the pause button (or a click on a pose) stops it.
  (function () {
    var demo = document.getElementById("scan-demo");
    if (!demo) return;
    var poses = Array.prototype.slice.call(demo.querySelectorAll(".scan-pose"));
    var arts = Array.prototype.slice.call(demo.querySelectorAll(".scan-art"));
    var labels = Array.prototype.slice.call(demo.querySelectorAll(".scan-labels"));
    var current = 0;
    var timers = [];
    var autoplay = !reduceMotion;
    var visible = false;
    var held = false;
    var nextTimer = null;
    var pauseBtn = document.getElementById("scan-pause");
    var STEP_MS = 2000;

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
      clearTimeout(nextTimer);
      nextTimer = null;
    }

    function run(p) {
      clearTimers();
      current = p;
      poses.forEach(function (btn, i) {
        var on = i === p;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", String(on));
        btn.tabIndex = on ? 0 : -1;
      });
      arts.forEach(function (g, i) { g.classList.toggle("is-active", i === p); });
      labels.forEach(function (l, i) { l.classList.toggle("is-active", i === p); });

      if (reduceMotion) return;
      // Three equal steps per pose: capture (silhouette only), analysis
      // (the CSS pass draws points, skeleton and scores), result.
      demo.classList.remove("is-running");
      timers.push(setTimeout(function () {
        void demo.offsetWidth;
        demo.classList.add("is-running");
      }, STEP_MS));
      scheduleNext(STEP_MS * 3);
    }

    function scheduleNext(delay) {
      clearTimeout(nextTimer);
      nextTimer = null;
      if (autoplay && visible && !held) {
        nextTimer = setTimeout(function () { run((current + 1) % poses.length); }, delay);
      }
    }

    function setAutoplay(on) {
      autoplay = on;
      if (pauseBtn) {
        pauseBtn.classList.toggle("is-paused", !on);
        pauseBtn.setAttribute("aria-label", on ? "Mettre en pause la démo" : "Relancer la démo");
      }
      scheduleNext(on ? 1500 : 0);
    }

    if (pauseBtn) {
      if (reduceMotion) pauseBtn.hidden = true;
      pauseBtn.addEventListener("click", function () { setAutoplay(!autoplay); });
    }
    demo.addEventListener("mouseenter", function () { held = true; scheduleNext(0); });
    demo.addEventListener("mouseleave", function () { held = false; scheduleNext(3000); });
    demo.addEventListener("focusin", function () { held = true; scheduleNext(0); });
    demo.addEventListener("focusout", function (e) {
      if (demo.contains(e.relatedTarget)) return;
      held = false;
      scheduleNext(3000);
    });

    poses.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        setAutoplay(false);
        run(i);
      });
      btn.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = (i + 1) % poses.length;
        else if (e.key === "ArrowLeft") next = (i + poses.length - 1) % poses.length;
        if (next === null) return;
        e.preventDefault();
        poses[next].focus();
        setAutoplay(false);
        run(next);
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var on = entries[entries.length - 1].isIntersecting;
        if (on === visible) return;
        visible = on;
        if (on) run(current);
        else clearTimers();
      }, { threshold: 0.35 }).observe(demo);
    } else {
      run(0);
    }
  })();

  // Scroll reveals: one IntersectionObserver, CSS does the animating.
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.documentElement.classList.remove("reveal-ready");
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }
  window.__smxReady = true;

  if (!hasGsap || reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // CSS "scroll-behavior: smooth" on <html> breaks ScrollTrigger: a refresh
  // made while the page is scrolled (reload, fonts, resize) measured the
  // grades pin from the wrong place and pinned it over another section.
  // While GSAP runs, smooth scrolling is done here for in-page links instead.
  document.documentElement.classList.add("js-smooth-scroll");
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var hash = link.getAttribute("href");
    var target = hash.length > 1 && document.getElementById(hash.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.pushState) history.pushState(null, "", hash);
  });

  // Recompute pin/trigger boundaries once web fonts have swapped in --
  // Plus Jakarta Sans loading late can reflow section heights after
  // ScrollTrigger's first measurement, which would otherwise leave the pin
  // start/end (and the mobile reveal triggers) slightly stale.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }

  // Hero fan: the cards open from a stack on load (--spread), then open a
  // little wider while the hero scrolls away (--open).
  var heroFan = document.getElementById("hero-fan");
  if (heroFan) {
    // Opens as the logo loader (js/logo-loader.js) fades out, not behind it.
    var openFan = function () {
      gsap.to(heroFan, { "--spread": 1, duration: 1.3, ease: "power3.out", delay: 0.15 });
    };
    var loader = document.querySelector(".smx");
    gsap.set(heroFan, { "--spread": 0 });
    if (!loader || loader.classList.contains("smx--out")) {
      openFan();
    } else {
      var loaderObserver = new MutationObserver(function () {
        if (!loader.classList.contains("smx--out")) return;
        loaderObserver.disconnect();
        openFan();
      });
      loaderObserver.observe(loader, { attributes: true, attributeFilter: ["class"] });
    }
    gsap.fromTo(heroFan, { "--open": 1 }, {
      "--open": 1.18,
      ease: "none",
      scrollTrigger: { trigger: heroFan, start: "top 70%", end: "bottom top", scrub: 0.6 }
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
  var heroHead = document.querySelector(".hero-head");
  if (heroSection && heroHead) parallax(heroHead, 20, heroSection, "top top");
  // The final CTA stays still: its lead would slide onto the note below it.
  gsap.utils.toArray(".section:not(.cta-final) > .wrap > .eyebrow").forEach(function (el) { parallax(el, 8); });
  gsap.utils.toArray(".section:not(.cta-final) > .wrap > .section-title").forEach(function (el) { parallax(el, 16); });
  gsap.utils.toArray(".section:not(.cta-final) > .wrap > .section-lead").forEach(function (el) { parallax(el, 24); });

  // "Grades": the panel is pinned and the scroll position walks through the
  // six grades in order; the badge and glow drift with the overall progress
  // (--prog) for a parallax feel. Clicking a grade scrolls to it; the tiers
  // (I-III) stay a plain click.
  if (gradesApi) {
    var gradesPanel = gradesApi.panel;
    var gradeCount = gradesApi.count;
    // Compact pinned layout first, so the trigger measures the final height.
    gradesPanel.classList.add("is-pinned");
    var gradesTrigger = ScrollTrigger.create({
      trigger: gradesPanel,
      // Centre the panel in the space under the header (never tighter than
      // 16px below it when the viewport is short).
      start: function () {
        var headerH = header ? header.offsetHeight : 76;
        var top = Math.max(headerH + 16, (window.innerHeight - gradesPanel.offsetHeight) / 2 + headerH / 2);
        return "top top+=" + Math.round(top);
      },
      end: function () { return "+=" + Math.round(window.innerHeight * 0.6 * gradeCount); },
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        gradesApi.showGrade(Math.min(gradeCount - 1, Math.floor(self.progress * gradeCount)));
        gradesPanel.style.setProperty("--prog", self.progress.toFixed(3));
      }
    });
    gradesApi.onPick = function (g) {
      var y = gradesTrigger.start + (g + 0.5) / gradeCount * (gradesTrigger.end - gradesTrigger.start);
      window.scrollTo({ top: y, behavior: "smooth" });
    };
  }


  // Reload / back: the browser restores the scroll position before the
  // grades pin exists and while the logo loader still locks the page, so
  // the page is shorter than its final height and the pinned panel could
  // end up on top of another section. Restore the position ourselves, once
  // the loader is gone and the pin has measured the final layout.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
    var navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var isReturn = navEntry && (navEntry.type === "reload" || navEntry.type === "back_forward");
    var savedY = 0;
    try { savedY = Number(sessionStorage.getItem("smx-scroll")) || 0; } catch (e) {}
    window.addEventListener("pagehide", function () {
      try { sessionStorage.setItem("smx-scroll", String(Math.round(window.scrollY))); } catch (e) {}
    });
    var restoreScroll = function () {
      ScrollTrigger.refresh();
      if (isReturn && savedY) window.scrollTo({ top: savedY, behavior: "instant" });
      ScrollTrigger.update();
    };
    var loaderRoot = document.querySelector(".smx");
    if (!loaderRoot) {
      restoreScroll();
    } else {
      var loaderGone = new MutationObserver(function () {
        if (loaderRoot.isConnected) return;
        loaderGone.disconnect();
        restoreScroll();
      });
      loaderGone.observe(document.documentElement, { childList: true });
    }
  }

})();

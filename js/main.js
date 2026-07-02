/* ============================================================
   Blue Modern Advisory — v2 motion engine
   GSAP + ScrollTrigger + SplitText + ScrambleText + Lenis.
   Timing constants reverse-engineered from ciridae.com.
   ============================================================ */

(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
  gsap.defaults({ duration: 0.8, ease: "power2" });

  var SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyz";
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  var isMobile = window.innerWidth < 768;

  document.documentElement.classList.add("js");
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* ---------- smooth scroll (Lenis, ciridae config) ---------- */

  var lenis = new Lenis({
    duration: 1.4,
    easing: function (t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1.6,
  });
  window.lenis = lenis;

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  /* ---------- helpers ---------- */

  function splitChars(el) {
    return new SplitText(el, { type: "lines,chars", mask: "lines" });
  }

  // ciridae hero pattern: chars scramble in with autoAlpha, 0.4s, stagger 0.01
  function scrambleIn(tl, chars, position) {
    tl.from(
      chars,
      {
        scrambleText: { chars: SCRAMBLE_CHARS, text: "{original}", speed: 0.5 },
        duration: 0.4,
        stagger: 0.01,
      },
      position,
    );
    tl.fromTo(
      chars,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.4, stagger: 0.01 },
      "<",
    );
  }

  /* ---------- boot sequence (logo focus-pull, every load) ---------- */

  function boot() {
    var isHome = !!document.querySelector(".hero");
    var bootEl = document.querySelector(".boot");
    var logo = document.querySelector(isHome ? ".hero-center" : ".boot-logo");
    var bg = document.querySelector(".hero-bg");
    var nav = document.querySelector(".nav");
    var ticker = document.querySelector(".ticker");
    var edges = document.querySelectorAll(".hero-edge");
    var foot = document.querySelector(".hero-foot");

    document.body.classList.add("is-booting");
    lenis.stop();

    if (reduceMotion) {
      gsap.set([logo, bg, nav, ticker, edges, foot].filter(Boolean), {
        clearProps: "all",
        autoAlpha: 1,
      });
      if (logo) gsap.set(logo, { filter: "blur(0px)", opacity: 1 });
      if (bootEl) bootEl.classList.add("is-done");
      document.body.classList.remove("is-booting");
      lenis.start();
      return;
    }

    gsap.set([nav, ticker], { autoAlpha: 0 });

    var tl = gsap.timeline({
      paused: true,
      defaults: { ease: "power2", duration: 0.8 },
      onComplete: function () {
        if (bootEl) bootEl.classList.add("is-done");
        document.body.classList.remove("is-booting");
        lenis.start();
        ScrollTrigger.refresh();
      },
    });

    // 1. logo fades in through a heavy blur (focus pull)
    tl.fromTo(logo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.3);
    tl.fromTo(
      logo,
      { filter: "blur(20px)" },
      { filter: "blur(0px)", duration: 2.2 },
      "<",
    );

    if (isHome) {
      // 2. edge labels decode with a char scramble
      edges.forEach(function (edge, i) {
        var chars = splitChars(edge).chars;
        scrambleIn(tl, chars, i === 0 ? "<0.2" : "<0.1");
      });

      // 3. bottom statement decodes
      if (foot) {
        var footChars = splitChars(foot).chars;
        scrambleIn(tl, footChars, "<0.2");
      }

      // 4. backdrop + chrome fade in last
      tl.fromTo(
        [bg, nav, ticker],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, ease: "power1" },
        "<",
      );
    } else {
      // subpages: hold the mark, then hand off to the page hero
      tl.to(logo, { autoAlpha: 0, duration: 0.5, ease: "power1" }, "+=0.35");
      tl.add(function () {
        if (bootEl) bootEl.classList.add("is-done");
      });
      tl.fromTo(
        [nav, ticker],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.8, ease: "power1" },
        "<",
      );

      var heroLabel = document.querySelector(".page-hero .section-label");
      var heroTitle = document.querySelector(".page-hero h1");
      var heroStand = document.querySelector(".page-hero .standfirst");
      if (heroLabel) scrambleIn(tl, splitChars(heroLabel).chars, "<0.1");
      if (heroTitle) scrambleIn(tl, splitChars(heroTitle).chars, "<0.2");
      if (heroStand)
        tl.fromTo(
          heroStand,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          "<0.3",
        );
    }

    setTimeout(function () {
      tl.play();
    }, 10);
    // safety: never trap the user in the loader
    setTimeout(function () {
      if (logo) gsap.set(logo, { filter: "blur(0px)", autoAlpha: 1 });
      if (bootEl) bootEl.classList.add("is-done");
      lenis.start();
      document.body.classList.remove("is-booting");
    }, 4200);
  }

  /* ---------- scroll reveals ---------- */

  function revealPage() {
    // masked-line scramble reveals for display text
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (reduceMotion) return;
      var split = new SplitText(el, { type: "lines,chars", mask: "lines" });
      var tl = gsap.timeline({ paused: true, defaults: { ease: "power2" } });
      scrambleIn(tl, split.chars, 0);
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        onEnter: function () {
          tl.play();
        },
      });
    });

    // paragraph scramble (ciridae TextAnimation: per word, line*0.1 + word*0.005)
    document.querySelectorAll("[data-scramble-reveal]").forEach(function (el) {
      if (reduceMotion) return;
      var split = new SplitText(el, { type: "lines,words", mask: "lines" });
      var tl = gsap.timeline({ paused: true, defaults: { ease: "power2" } });
      split.lines.forEach(function (line, li) {
        var words = line.querySelectorAll("div");
        words.forEach(function (word, wi) {
          var pos = li * 0.1 + wi * 0.005;
          tl.from(
            word,
            {
              scrambleText: {
                chars: SCRAMBLE_CHARS,
                text: "{original}",
                speed: 0.25,
              },
              duration: 0.4,
            },
            pos,
          );
          tl.fromTo(
            word,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4 },
            pos,
          );
        });
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        onEnter: function () {
          tl.play();
        },
      });
    });

    // simple fades
    document.querySelectorAll("[data-fade]").forEach(function (el) {
      if (reduceMotion) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      var delay = parseFloat(el.getAttribute("data-fade")) || 0;
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: delay,
          scrollTrigger: { trigger: el, start: "top 85%" },
        },
      );
    });

    // grouped stagger fades
    document.querySelectorAll("[data-fade-group]").forEach(function (group) {
      var items = group.children;
      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 80%" },
        },
      );
    });

    // image parallax (linear scrub)
    if (!reduceMotion && !isMobile) {
      document.querySelectorAll("[data-parallax]").forEach(function (el) {
        var amount = parseFloat(el.getAttribute("data-parallax")) || 12;
        gsap.fromTo(
          el,
          { yPercent: -amount },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    }

    // stat counters
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (reduceMotion || isNaN(target)) return;
      var obj = { value: 0 };
      gsap.to(obj, {
        value: target,
        duration: 1,
        ease: "power3",
        onUpdate: function () {
          el.textContent = Math.round(obj.value);
        },
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  }

  /* ---------- what-we-build transition (pinned glow build, sky + cards rise) ---------- */

  function initWwbScene() {
    var scene = document.querySelector(".statement-scene--pin");
    if (!scene || reduceMotion || isMobile) return;

    var mark = scene.querySelector(".constellation img");
    var halo = scene.querySelector(".constellation .halo");

    // phase 1: pin the statement while the mark builds from faint to lit
    var buildTl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: "top top",
        end: "+=100%",
        pin: true,
        scrub: true,
      },
    });
    if (mark) {
      buildTl.fromTo(
        mark,
        { opacity: 0.3, scale: 0.92, filter: "blur(3px) brightness(1)" },
        {
          opacity: 1,
          scale: 1.1,
          filter: "blur(0px) brightness(1.7)",
          ease: "power1",
        },
        0,
      );
    }
    if (halo) {
      buildTl.fromTo(
        halo,
        { opacity: 0.12, scale: 0.7 },
        { opacity: 1, scale: 1.4, ease: "power1" },
        0,
      );
    }

    // phase 2: sky section sweeps up; cards rise with a scrubbed staggered lag
    var sky = document.querySelector(".sky");
    if (!sky) return;
    var skyImg = sky.querySelector(".sky-bg img");
    if (skyImg) {
      gsap.fromTo(
        skyImg,
        { scale: 1.18 },
        {
          scale: 1,
          ease: "power1",
          scrollTrigger: {
            trigger: sky,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        },
      );
    }
    if (window.innerWidth > 1023) {
      var cards = sky.querySelectorAll(".sky-card");
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: "32vh" },
          {
            y: 0,
            ease: "power1",
            stagger: 0.15,
            scrollTrigger: {
              trigger: sky,
              start: "top 92%",
              end: "top 12%",
              scrub: true,
            },
          },
        );
      }
    }
  }

  /* ---------- footer parallax ---------- */

  function initFooter() {
    var footer = document.querySelector(".footer");
    var leak = document.querySelector(".footer-leak img");
    if (!footer || reduceMotion || isMobile) return;
    gsap.fromTo(
      footer,
      { yPercent: 12 },
      {
        yPercent: 0,
        ease: "expo.in",
        scrollTrigger: {
          trigger: footer,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
    if (leak) {
      gsap.fromTo(
        leak,
        { scale: 1.25, yPercent: -12 },
        {
          scale: 1,
          yPercent: 0,
          ease: "power1",
          scrollTrigger: {
            trigger: leak.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }
  }

  /* ---------- scroll-reactive marquee ---------- */

  function initMarquee() {
    document.querySelectorAll(".marquee").forEach(function (marquee) {
      var track = marquee.querySelector(".marquee-track");
      if (!track || reduceMotion) return;

      track.style.animation = "none";
      var setX = gsap.quickSetter(track, "x", "%");
      var state = { move: 0, velocity: 0, enter: 1 };

      lenis.on("scroll", function (e) {
        state.velocity = gsap.utils.clamp(-1, 1, e.velocity / 60);
      });

      marquee.addEventListener("mouseenter", function () {
        gsap.to(state, { enter: 0, duration: 0.6, ease: "power3" });
      });
      marquee.addEventListener("mouseleave", function () {
        gsap.to(state, { enter: 1, duration: 0.6, ease: "power3" });
      });

      gsap.ticker.add(function () {
        state.velocity *= 0.92;
        var dir = state.velocity < 0 ? -1 : 1;
        state.move -=
          (0.028 + Math.abs(state.velocity) * 0.25) * state.enter * dir;
        if (state.move <= -50) state.move += 50;
        if (state.move > 0) state.move -= 50;
        setX(state.move);
      });
    });
  }

  /* ---------- accordion (what we build) ---------- */

  function initAccordion() {
    document.querySelectorAll(".acc").forEach(function (acc) {
      var panels = acc.querySelectorAll(".acc-panel");
      function open(panel) {
        panels.forEach(function (p) {
          p.classList.toggle("is-open", p === panel);
        });
      }
      panels.forEach(function (panel) {
        panel.addEventListener("mouseenter", function () {
          if (window.innerWidth > 1023) open(panel);
        });
        panel.addEventListener("click", function () {
          open(panel);
        });
      });
      if (panels.length) open(panels[panels.length - 1]);
    });
  }

  /* ---------- sliders ---------- */

  function initSliders() {
    document.querySelectorAll(".slider").forEach(function (slider) {
      var track = slider.querySelector(".slider-track");
      var slides = slider.querySelectorAll(".slide");
      var current = slider.querySelector("[data-slider-current]");
      var prev = slider.querySelector("[data-slider-prev]");
      var next = slider.querySelector("[data-slider-next]");
      var index = 0;

      function update() {
        track.style.transform =
          "translateX(" + -slides[index].offsetLeft + "px)";
        if (current) current.textContent = index + 1 + " / " + slides.length;
      }

      if (prev)
        prev.addEventListener("click", function () {
          index = (index - 1 + slides.length) % slides.length;
          update();
        });
      if (next)
        next.addEventListener("click", function () {
          index = (index + 1) % slides.length;
          update();
        });
      window.addEventListener("resize", update);
      update();
    });
  }

  /* ---------- FAQ + ledger expanders ---------- */

  function initExpanders() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      var body = item.querySelector(".faq-a");
      btn.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        document
          .querySelectorAll(".faq-item.is-open")
          .forEach(function (other) {
            if (other !== item) {
              other.classList.remove("is-open");
              gsap.to(other.querySelector(".faq-a"), {
                height: 0,
                duration: 0.6,
                ease: "power2.inOut",
              });
              other
                .querySelector(".faq-q")
                .setAttribute("aria-expanded", "false");
            }
          });
        item.classList.toggle("is-open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        gsap.to(body, {
          height: isOpen ? 0 : body.scrollHeight,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: function () {
            ScrollTrigger.refresh();
          },
        });
      });
    });

    document.querySelectorAll(".ledger-row").forEach(function (row) {
      var detail = row.querySelector(".ledger-detail");
      if (!detail) return;
      row.setAttribute("tabindex", "0");
      function toggle() {
        var isOpen = row.classList.contains("is-open");
        document
          .querySelectorAll(".ledger-row.is-open")
          .forEach(function (other) {
            if (other !== row) {
              other.classList.remove("is-open");
              gsap.to(other.querySelector(".ledger-detail"), {
                height: 0,
                duration: 0.6,
                ease: "power2.inOut",
              });
            }
          });
        row.classList.toggle("is-open", !isOpen);
        gsap.to(detail, {
          height: isOpen ? 0 : detail.scrollHeight,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: function () {
            ScrollTrigger.refresh();
          },
        });
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ---------- nav: hide on scroll down, show on up ---------- */

  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var lastY = 0;
    var upDistance = 0;
    setTimeout(function () {
      lenis.on("scroll", function (e) {
        var y = e.scroll;
        if (document.body.classList.contains("menu-open")) {
          lastY = y;
          return;
        }
        if (y > lastY && y > 200) {
          nav.classList.add("is-hidden");
          upDistance = 0;
        } else if (y < lastY) {
          upDistance += lastY - y;
          if (upDistance > 10) nav.classList.remove("is-hidden");
        }
        lastY = y;
      });
    }, 300);
    nav.addEventListener("mouseenter", function () {
      nav.classList.remove("is-hidden");
    });
  }

  /* ---------- burger menu ---------- */

  function initMenu() {
    var menu = document.querySelector(".menu");
    var trigger = document.querySelector("[data-menu-toggle]");
    var label = trigger ? trigger.querySelector(".menu-label") : null;
    if (!menu || !trigger) return;

    function setLabel(text) {
      if (!label) return;
      if (reduceMotion) {
        label.textContent = text;
        return;
      }
      gsap.to(label, {
        scrambleText: { text: text, chars: SCRAMBLE_CHARS, speed: 0.5 },
        duration: 0.5,
      });
    }

    trigger.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("menu-open");
      menu.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
      setLabel(isOpen ? "CLOSE" : "MENU");
      if (isOpen) lenis.stop();
      else lenis.start();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        menu.classList.remove("is-open");
        setLabel("MENU");
        lenis.start();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open"))
        trigger.click();
    });
  }

  /* ---------- link hover scramble ---------- */

  function initLinkScramble() {
    if (reduceMotion) return;
    document.querySelectorAll("[data-hover-scramble]").forEach(function (el) {
      var target = el.querySelector(".scramble-target") || el;
      var original = target.textContent;
      var playing = false;
      el.addEventListener("mouseenter", function () {
        if (playing) return;
        playing = true;
        gsap.to(target, {
          scrambleText: { text: original, chars: SCRAMBLE_CHARS, speed: 0.25 },
          duration: 0.5,
          onComplete: function () {
            target.textContent = original;
            playing = false;
          },
        });
      });
    });
  }

  /* ---------- page transitions (leave fade) ---------- */

  function initTransitions() {
    var overlay = document.querySelector(".transition-veil");
    if (!overlay) return;
    document.querySelectorAll('a[href$=".html"]').forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href || /^https?:/i.test(href)) return;
      link.addEventListener("click", function (e) {
        if (reduceMotion) return;
        e.preventDefault();
        lenis.stop();
        gsap.to(overlay, {
          autoAlpha: 1,
          duration: 0.6,
          ease: "expo.out",
          onComplete: function () {
            window.location.href = href;
          },
        });
      });
    });
  }

  /* ---------- ticker year stamp ---------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- go ---------- */

  window.addEventListener("pageshow", function (e) {
    // restore after bfcache back-navigation (veil left opaque)
    if (e.persisted) window.location.reload();
  });

  function start() {
    boot();
    revealPage();
    initWwbScene();
    initFooter();
    initMarquee();
    initAccordion();
    initSliders();
    initExpanders();
    initNav();
    initMenu();
    initLinkScramble();
    initTransitions();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener("load", start);
  }
})();

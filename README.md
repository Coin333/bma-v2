# Blue Modern Advisory — v2

Ground-up rebuild of bluemodernadvisory.com in a cinematic dark system modeled on ciridae.com, in the BMA navy/paper/cyan palette. Static HTML/CSS/JS, no build step.

## Run

```
python3 -m http.server 8214
```

Then open http://localhost:8214.

## Stack

- GSAP 3.13 + ScrollTrigger + SplitText + ScrambleText (all free since 3.13), vendored in `js/vendor/`
- Lenis smooth scroll (duration 1.4, expo-out easing, wheelMultiplier 1.6)
- Barlow Condensed (display) / Inter (body) / IBM Plex Mono (labels), via Google Fonts

## Motion system (`js/main.js`)

- Boot: BMA logo focus-pull (blur 20px to 0, 2.2s) on every page load; homepage then decodes edge labels and the statement with a character scramble before the backdrop and chrome fade in
- Scroll reveals: `data-reveal` (masked-line char scramble), `data-scramble-reveal` (per-word), `data-fade`, `data-fade-group`, `data-parallax`, `data-count`
- Scroll-reactive logo marquee, hover-expanding texture accordion, sliders with mono counters, hide-on-scroll pill nav, fullscreen scramble menu, page-leave veil

## Content

All copy carried verbatim from the previous site (repo: Coin333/blue-modern-advisory) plus the enterprise-stack one-pager (Operate / Engineer / Relate engines). Imagery in `assets/img/` is AI-generated to palette.

Built with D1 Vibe Coding

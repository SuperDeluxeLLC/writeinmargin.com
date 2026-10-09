/* Margin site: base.js
   Shared behaviour for every page. Exposes window.MarginSite. Reference: DESIGN-NOTES.md.

   Load it in <head> with no defer (it sets the theme before first paint):
     <script src="base.js"></script>
   Everything here only ADDS: with this file missing or failing, every page still reads
   in full. Content is only ever blanked by a player, and only once its demo is on screen. */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY_THEME = 'margin-theme';

  /* ---- small things ------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function store(key, val) {            // browser storage can throw or be empty: never depend on it
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) {}
    return null;
  }
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var MS = {
    $: $, $$: $$, sleep: sleep, ready: ready,
    /* how fast the demos type: a share of a fast typist's time per letter. A page may set its own. */
    pace: 0.45,
    /* true when the viewer asked for less motion. Read it at the moment you animate. */
    get reduced() { return !!mq.matches; },
    viewTransitions: typeof document.startViewTransition === 'function'
  };

  /* ---- theme: auto | light | dark, as data-theme on <html> --------------------
     auto = no attribute, the system decides. ?theme=dark in the URL forces one
     for a look without remembering it. */
  var theme = {
    get: function () { return root.getAttribute('data-theme') || 'auto'; },
    set: function (mode, remember) {
      if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
      else { mode = 'auto'; root.removeAttribute('data-theme'); }
      if (remember !== false) store(KEY_THEME, mode === 'auto' ? null : mode);
      $$('[data-theme-toggle]').forEach(paintToggle);
      return mode;
    },
    cycle: function () {
      var next = { auto: 'light', light: 'dark', dark: 'auto' }[theme.get()];
      return theme.set(next);
    }
  };
  function paintToggle(b) {
    var m = theme.get();
    var name = { auto: 'matches your system', light: 'light', dark: 'dark' }[m];
    var next = { auto: 'light', light: 'dark', dark: 'automatic' }[m];
    b.setAttribute('data-mode', m);
    b.setAttribute('aria-label', 'Theme: ' + name + '. Switch to ' + next);
    b.setAttribute('title', 'Theme: ' + name);
  }
  MS.theme = theme;

  /* ---- paper: the site wears Newsprint by day and Ink black by night, and nothing else.
     The paper picker is gone from every page; this shim stays only because screenplay.js still
     calls MS.paper.get() once at load. It remembers a name and sets data-paper on <html>, which
     site.css ignores. It goes the day screenplay.js drops that call. */
  var picked = null;
  MS.paper = {
    get: function () { return picked || 'white'; },
    picked: function () { return picked; },
    set: function (name) {
      picked = name && name !== 'white' ? name : null;
      if (picked) root.setAttribute('data-paper', picked); else root.removeAttribute('data-paper');
      return MS.paper.get();
    }
  };

  // before first paint: a saved choice, then any URL override
  (function boot() {
    var q = '';
    try { q = location.search; } catch (e) {}
    var t = /[?&]theme=(light|dark|auto)\b/.exec(q);
    if (t) theme.set(t[1], false);
    else { var saved = store(KEY_THEME); if (saved === 'light' || saved === 'dark') theme.set(saved, false); }
  })();

  /* ---- when visible ------------------------------------------------------------
     onVisible(el, cb, {threshold:.35, once:true, rootMargin, onLeave}) -> stop()
     Without IntersectionObserver, cb runs at once, so nothing waits for it.   */
  function onVisible(el, cb, opt) {
    opt = opt || {};
    if (!('IntersectionObserver' in window)) { cb(el); return function () {}; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (opt.once !== false) io.unobserve(e.target); cb(e.target); }
        else if (opt.onLeave) opt.onLeave(e.target);
      });
    }, { threshold: opt.threshold == null ? 0.35 : opt.threshold, rootMargin: opt.rootMargin || '0px' });
    io.observe(el);
    return function () { io.disconnect(); };
  }
  MS.onVisible = onVisible;

  /* ---- typewriter ----------------------------------------------------------------
     type(el, text, {speed:34, jitter:.35, caret:true, startAt:0, onChar, pace}) -> promise
     Types into an element's text. With reduced motion it writes the whole text at
     once. The returned promise has .cancel() (stops where it is) and .finish()
     (jumps to the full text). A caret span (.caret) follows the text if asked.   */
  function type(el, text, opt) {
    opt = opt || {};
    var speed = opt.speed == null ? 34 : opt.speed, jitter = opt.jitter == null ? 0.35 : opt.jitter;
    var node = document.createTextNode(''), caret = null, stopped = false, wake = null, i = opt.startAt || 0;
    el.textContent = '';
    el.appendChild(node);
    if (opt.caret !== false && !MS.reduced) {
      caret = document.createElement('span');
      caret.className = 'caret on'; caret.setAttribute('aria-hidden', 'true');
      el.appendChild(caret);
    }
    function done() { if (caret && caret.parentNode) caret.parentNode.removeChild(caret); }
    var p = new Promise(function (resolve) {
      if (MS.reduced) { node.nodeValue = text; resolve(); return; }
      node.nodeValue = text.slice(0, i);
      (function step() {
        if (stopped) { done(); resolve(); return; }
        if (i >= text.length) { done(); resolve(); return; }
        i++;
        node.nodeValue = text.slice(0, i);
        if (caret) caret.classList.remove('on');
        if (opt.onChar) opt.onChar(i, text.charAt(i - 1));
        var ch = text.charAt(i - 1);
        // A fast typist: letters in a word come in a burst (about 30-55 ms), a hair longer
        // at a space, a short beat after punctuation. Nothing types slower than a person would.
        var each = Math.min(speed * 0.45, 55);
        var pause = /[.,;:!?]/.test(ch) ? 110 : ch === ' ' ? each * 0.6 : 0;
        var wait = (Math.max(14, each * (1 + (Math.random() * 2 - 1) * jitter)) + pause) * (opt.pace || MS.pace || 1);
        wake = setTimeout(function () { if (caret) caret.classList.add('on'); step(); }, wait);
      })();
    });
    p.cancel = function () { stopped = true; clearTimeout(wake); };
    p.finish = function () { stopped = true; clearTimeout(wake); node.nodeValue = text; done(); };
    return p;
  }
  MS.type = type;

  /* ---- player: "when visible, play", with a replay button ------------------------------
     player(el, {
       settle(),            put the demo in its finished state (the same as the static HTML)
       reset(),             optional: blank what play() will write
       play(ctx),           async; ctx = {sleep, type, alive()} - stop when alive() is false
       after(),             optional: after a play that ran to the end
       replay: button|selector,   restarts it
       threshold: .4, delay: 400, once: true
     }) -> {play, replay, settle, destroy}
   Reduced motion, no IntersectionObserver or a failed play(): settle() and nothing else. */
  function player(el, o) {
    var token = 0, started = false, cancelers = [];
    function ctx(my) {
      return {
        alive: function () { return my === token; },
        sleep: function (ms) { return sleep(ms).then(function () { return my === token; }); },
        type: function (target, text, opt) {
          var p = type(target, text, opt); cancelers.push(p); return p.then(function () { return my === token; });
        }
      };
    }
    function stop() { token++; cancelers.forEach(function (c) { c.cancel(); }); cancelers = []; }
    function settle() { stop(); if (o.settle) o.settle(); }
    function run() {
      stop();
      if (MS.reduced) { if (o.settle) o.settle(); return Promise.resolve(); }
      var my = ++token;
      if (o.reset) o.reset();
      var go = (o.play ? o.play(ctx(my)) : Promise.resolve());
      return Promise.resolve(go).then(function () { if (my === token && o.after) o.after(); },
        function () { if (my === token) settle(); });
    }
    var btn = typeof o.replay === 'string' ? $(o.replay) : o.replay;
    if (btn) btn.addEventListener('click', function () { started = true; run(); });
    var stopVis = function () {};
    if (!MS.reduced && 'IntersectionObserver' in window) {
      stopVis = onVisible(el, function () {
        if (started) return; started = true;
        setTimeout(run, o.delay == null ? 400 : o.delay);
      }, { threshold: o.threshold == null ? 0.4 : o.threshold, once: o.once !== false });
    }
    return { play: run, replay: run, settle: settle, destroy: function () { stop(); stopVis(); } };
  }
  MS.player = player;

  /* ---- drag ---------------------------------------------------------------------------------
     drag(handle, {area, axis:'both'|'x'|'y', onStart, onMove, onEnd, keyStep:.05})
     Pointer drag with capture, touch-safe. Position is normalised 0..1 inside `area`
     (default: handle's parent): onMove({x, y, px, py, dx, dy, event}). If the handle is
     focusable, the arrow keys move it by keyStep (Shift = 5x) so a demo works from the keyboard.
     Returns {destroy, set(x,y)}.                                                               */
  function drag(handle, o) {
    o = o || {}; var axis = o.axis || 'both', area = o.area || handle.parentNode, active = false, last = { x: 0, y: 0 }, start = null;
    handle.style.touchAction = 'none';
    function rect() { return area.getBoundingClientRect(); }
    function pos(e) {
      var r = rect(), px = e.clientX - r.left, py = e.clientY - r.top;
      var x = r.width ? Math.max(0, Math.min(1, px / r.width)) : 0, y = r.height ? Math.max(0, Math.min(1, py / r.height)) : 0;
      return { x: axis === 'y' ? last.x : x, y: axis === 'x' ? last.y : y, px: px, py: py, event: e };
    }
    function emit(p) {
      p.dx = start ? p.px - start.px : 0; p.dy = start ? p.py - start.py : 0;
      last = { x: p.x, y: p.y };
      if (o.onMove) o.onMove(p);
    }
    function down(e) {
      if (e.button != null && e.button > 0) return;
      active = true; try { handle.setPointerCapture(e.pointerId); } catch (x) {}
      start = pos(e); if (o.onStart) o.onStart(start);
      handle.classList.add('is-dragging'); emit(pos(e)); e.preventDefault();
    }
    function move(e) { if (active) emit(pos(e)); }
    function up(e) {
      if (!active) return; active = false; handle.classList.remove('is-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (x) {}
      if (o.onEnd) o.onEnd(pos(e));
    }
    function key(e) {
      var k = e.key, step = (o.keyStep || 0.05) * (e.shiftKey ? 5 : 1), dx = 0, dy = 0;
      if (k === 'ArrowLeft') dx = -step; else if (k === 'ArrowRight') dx = step;
      else if (k === 'ArrowUp') dy = -step; else if (k === 'ArrowDown') dy = step; else return;
      e.preventDefault();
      var r = rect(), x = Math.max(0, Math.min(1, last.x + (axis === 'y' ? 0 : dx))), y = Math.max(0, Math.min(1, last.y + (axis === 'x' ? 0 : dy)));
      start = null;
      emit({ x: x, y: y, px: x * r.width, py: y * r.height, event: e }); if (o.onEnd) o.onEnd({ x: x, y: y, px: x * r.width, py: y * r.height, event: e });
    }
    handle.addEventListener('pointerdown', down);
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', key);
    return {
      set: function (x, y) { last = { x: x, y: y }; },
      destroy: function () {
        handle.removeEventListener('pointerdown', down); handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up);
        handle.removeEventListener('keydown', key);
      }
    };
  }
  MS.drag = drag;

  /* movable(el, {within, onDrop, snap:[w,h], step:12}) - a card you can pick up and put down
     inside `within` (default: its parent). It moves with transform (--dx, --dy), so layout is
     untouched; Escape returns it. Arrow keys nudge it (Shift = bigger). onDrop({el, x, y}).
     Adds .is-dragging while held. Returns {reset, destroy}. */
  function movable(el, o) {
    o = o || {}; var within = o.within || el.parentNode, ax = 0, ay = 0, bx = 0, by = 0, step = o.step || 12;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.style.touchAction = 'none'; el.style.cursor = 'grab';
    function apply() {
      var w = within.getBoundingClientRect(), r = el.getBoundingClientRect();
      bx = Math.max(ax + (w.left - r.left), Math.min(ax + (w.right - r.right), bx));
      by = Math.max(ay + (w.top - r.top), Math.min(ay + (w.bottom - r.bottom), by));
      if (o.snap) { bx = Math.round(bx / o.snap[0]) * o.snap[0]; by = Math.round(by / o.snap[1]) * o.snap[1]; }
      ax = bx; ay = by;
      el.style.setProperty('--dx', bx + 'px'); el.style.setProperty('--dy', by + 'px');
      el.style.transform = 'translate(' + bx + 'px,' + by + 'px)';
    }
    var sx = 0, sy = 0, down = false, px0 = 0, py0 = 0;
    function dn(e) {
      if (e.button != null && e.button > 0) return;
      down = true; px0 = e.clientX; py0 = e.clientY; sx = bx; sy = by;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add('is-dragging'); el.style.cursor = 'grabbing'; e.preventDefault();
    }
    function mv(e) { if (!down) return; bx = sx + e.clientX - px0; by = sy + e.clientY - py0; apply(); }
    function upp(e) {
      if (!down) return; down = false; el.classList.remove('is-dragging'); el.style.cursor = 'grab';
      try { el.releasePointerCapture(e.pointerId); } catch (x) {}
      if (o.onDrop) o.onDrop({ el: el, x: bx, y: by });
    }
    function key(e) {
      var s = step * (e.shiftKey ? 4 : 1), moved = true;
      if (e.key === 'ArrowLeft') bx -= s; else if (e.key === 'ArrowRight') bx += s;
      else if (e.key === 'ArrowUp') by -= s; else if (e.key === 'ArrowDown') by += s;
      else if (e.key === 'Escape') { bx = 0; by = 0; } else moved = false;
      if (!moved) return; e.preventDefault(); apply(); if (o.onDrop) o.onDrop({ el: el, x: bx, y: by });
    }
    el.addEventListener('pointerdown', dn); el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', upp); el.addEventListener('pointercancel', upp);
    el.addEventListener('keydown', key);
    return {
      reset: function () { bx = by = ax = ay = 0; el.style.transform = ''; el.style.removeProperty('--dx'); el.style.removeProperty('--dy'); },
      destroy: function () {
        el.removeEventListener('pointerdown', dn); el.removeEventListener('pointermove', mv);
        el.removeEventListener('pointerup', upp); el.removeEventListener('pointercancel', upp); el.removeEventListener('keydown', key);
      }
    };
  }
  MS.movable = movable;

  /* ---- same-page swaps -------------------------------------------------------------------------------
     transition(fn) wraps a same-page change (swap a lens, flip a view) in a view transition where
     the browser has them and the viewer allows motion; otherwise it just runs fn. */
  MS.transition = function (fn) {
    if (MS.viewTransitions && !MS.reduced) {
      try { return document.startViewTransition(fn); } catch (e) {}
    }
    fn();
  };

  /* ---- the wordmark, typed in ------------------------------------------------------------------------
     Once a visit, the header's wordmark opens as the logo, the m and its caret, and a moment later the
     rest of the name is typed after it. The letters still to come keep their room, so
     nothing beside it moves. Decided here in <head>, before the first paint, so the whole name never
     flashes first; with reduced motion, no storage or no script, it is simply the name. */
  var KEY_TYPED = 'margin-wordmark-typed';
  var typeWordmark = false;
  if (!MS.reduced) {
    try {
      typeWordmark = !sessionStorage.getItem(KEY_TYPED);
      if (typeWordmark) { sessionStorage.setItem(KEY_TYPED, '1'); root.classList.add('wordmark-to-type'); }
    } catch (e) { typeWordmark = false; }
  }
  function typeTheWordmark() {
    var brand = $('.site-header .brand'), name = brand ? brand.textContent : '';
    function settle() {
      if (brand) { brand.textContent = name; brand.classList.remove('is-typing'); }
      root.classList.remove('wordmark-to-type');
    }
    if (!brand || name.length < 2) { settle(); return; }
    try {
      var typed = document.createElement('span'), caret = document.createElement('span'), rest = document.createElement('span');
      caret.className = 'brand-caret on'; rest.className = 'brand-rest';
      caret.setAttribute('aria-hidden', 'true'); rest.setAttribute('aria-hidden', 'true');
      typed.textContent = name.charAt(0); rest.textContent = name.slice(1);
      brand.textContent = '';
      brand.appendChild(typed); brand.appendChild(caret); brand.appendChild(rest);
      brand.classList.add('is-typing');
    } catch (e) { settle(); return; }
    // The m and the caret, blinking as a caret does while it waits, for three blinks; then the
    // rest at a writer's pace, the caret steady while it types. Then it is the plain wordmark, whose
    // caret goes on blinking from a steady start, as a caret does once the typing stops.
    var i = 1;
    setTimeout(function step() {
      if (i >= name.length) { settle(); return; }
      caret.classList.remove('on');
      i++;
      typed.textContent = name.slice(0, i); rest.textContent = name.slice(i);
      setTimeout(step, 110 + Math.random() * 70);
    }, 3150);
  }

  /* ---- header: the theme toggle and the current page ------------------------------------------------------ */
  ready(function () {
    if (typeWordmark) typeTheWordmark();
    // The header stays put; a hairline under it once the page has moved beneath it.
    var header = $('.site-header');
    if (header) {
      var edge = function () { header.classList.toggle('is-scrolled', window.scrollY > 0); };
      window.addEventListener('scroll', edge, { passive: true });
      edge();
    }
    $$('[data-theme-toggle]').forEach(function (b) {
      paintToggle(b);
      b.addEventListener('click', function () { MS.transition(function () { theme.cycle(); }); });
    });
    var here = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    $$('.site-nav a[href]').forEach(function (a) {
      var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
      var p = u.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      if (!u.hash && p === here && !a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
    });
  });

  window.MarginSite = MS;
})();

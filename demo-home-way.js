/* Home, section 2: one job (branch a draft, read it beside the last) done by keyboard, by
   menus and panels, and by touch. The keyboard window is also the range: a slider that opens
   the page from bare, out through the shelf, the board and the notes, to two drafts split.
   The static HTML is the finished state of every route; this file only adds. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;
  var ways = $('#ways');
  if (!ways) return;

  var panels = { kb: $('#way-kb'), menu: $('#way-menu'), touch: $('#way-touch') };
  var tabs = { kb: $('#tab-kb'), menu: $('#tab-menu'), touch: $('#tab-touch') };
  var keys = ['kb', 'menu', 'touch'];
  var current = 'kb', userPicked = false, cycle = 0;
  var R = window.MarginRange, only = null;      // only: the one stop a visitor picked, or null for the whole tour
  var rg = $('#rg'), ctl = $('#rg-ctl'), stopsEl = $$('[role="radio"]', ctl);

  function set(el, o) { Object.keys(o).forEach(function (k) { el.setAttribute('data-' + k, o[k]); }); }
  function steps(el, n) {
    $$('.steps li', el).forEach(function (li) {
      var s = li.getAttribute('data-s');
      li.classList.toggle('on', s === 'v' ? n >= 9 : parseInt(s, 10) <= n);
    });
  }
  function final(key) {
    var el = panels[key];
    if (key === 'kb') { if (R) R.finish(only === null ? 1 : only); else { setStop(1); $('.sh__typed', el).textContent = 'new draft'; filter(el, 'new draft'); } steps(el, 9); return; }
    else if (key === 'menu') set(el, { a: 1, b: 1, panel: 0, 'new': 1, menu: 0 });
    else set(el, { a: 1, b: 1, panel: 0, 'new': 1 });
    steps(el, 9);
    var v = $('.wy__voice', el); if (v) { v.classList.remove('is-listening'); voiceEnd(); }
    var f = $('.finger', el); if (f) f.classList.remove('is-on');
    var t = $('.sh__typed', el); if (t) t.textContent = '';
    $$('.sh__row', el).forEach(function (r) { r.hidden = false; });
  }

  /* the shelf filters as you type, like the real one */
  function filter(el, q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean), first = null;
    $$('.sh__row:not([data-x])', el).forEach(function (r) {   // rows the stops add themselves (data-x) are theirs to show
      var hay = (r.getAttribute('data-k') + ' ' + r.textContent).toLowerCase();
      var ok = words.every(function (w) { return hay.indexOf(w) >= 0; });
      r.hidden = !ok; r.classList.remove('is-on');
      if (ok && !first) first = r;
    });
    if (first) first.classList.add('is-on');
  }
  function typeInShelf(c, el, text, speed) {
    var t = $('.sh__typed', el);
    return c.type(t, text, { speed: speed || 80, jitter: .25, caret: false, onChar: function () { filter(el, t.textContent); } });
  }

  /* touch: a finger that goes to the thing it taps */
  function tapTo(c, el, sel) {
    var scr = $('.ipad__screen', el), target = $(sel, el), f = $('.finger', el);
    if (!target || !scr) return Promise.resolve(true);
    var r = target.getBoundingClientRect(), s = scr.getBoundingClientRect();
    f.style.left = (r.left + r.width / 2 - s.left) + 'px';
    f.style.top = (r.top + r.height / 2 - s.top) + 'px';
    f.classList.add('is-on');
    return c.sleep(750).then(function (ok) {
      if (!ok) return false;
      f.classList.add('is-tap');
      return c.sleep(160).then(function (ok2) { f.classList.remove('is-tap'); return ok2; });
    });
  }

  /* voice: the phone listens, the page sets what it hears */
  function voiceEnd() {
    var d = $('#dv-slug'); if (!d) return;
    d.textContent = 'Int. Kitchen - Morning'; $('#dv-cue').textContent = 'Tom'; $('#dv-dlg').textContent = 'I know what it was.';
    $('#dv-said').innerHTML = '&ldquo;Tom. I know what it was.&rdquo;';
  }
  async function voice(c, el) {
    var box = $('.wy__voice', el), said = $('#dv-said');
    ['#dv-slug', '#dv-cue', '#dv-dlg'].forEach(function (s) { $(s).textContent = ''; });
    said.textContent = '';
    box.classList.add('is-listening');
    if (!await c.type(said, '“Scene. Interior kitchen morning.”', { speed: 36, caret: false })) return false;
    if (!await c.sleep(300)) return false;
    $('#dv-slug').textContent = 'Int. Kitchen - Morning';
    if (!await c.sleep(900)) return false;
    if (!await c.type(said, '“Tom. I know what it was.”', { speed: 36, caret: false })) return false;
    if (!await c.sleep(250)) return false;
    $('#dv-cue').textContent = 'Tom'; $('#dv-dlg').textContent = 'I know what it was.';
    box.classList.remove('is-listening');
    return true;
  }

  var scripts = {
    /* the window's five stops, each played (demo-home-range.js): the whole tour, or the one picked */
    kb: async function (c) {
      if (!R) return;
      var list = only === null ? [0, 1, 2, 3, 4] : [only];
      for (var k = 0; k < list.length; k++) {
        if (!await R.play(list[k], c)) return;
        if (k < list.length - 1 && !await c.sleep(1200)) return;
      }
    },
    menu: async function (c) {
      var el = panels.menu;
      set(el, { a: 1, b: 0, panel: 0, 'new': 0, menu: 0 }); steps(el, 0);
      if (!await c.sleep(700)) return;
      set(el, { panel: 1 }); steps(el, 1);
      if (!await c.sleep(1300)) return;
      var plus = $('.dr--old .dr__row.is-open [data-act="plus"]', el);
      if (plus) { plus.classList.add('is-press'); if (!await c.sleep(450)) return; plus.classList.remove('is-press'); }
      set(el, { 'new': 1, a: 0, b: 1 }); steps(el, 2);
      if (!await c.sleep(1500)) return;
      set(el, { menu: 1 });
      if (!await c.sleep(1700)) return;
      set(el, { menu: 0, panel: 0, a: 1, b: 1 }); steps(el, 4);
    },
    touch: async function (c) {
      var el = panels.touch, f = $('.finger', el);
      set(el, { a: 1, b: 0, panel: 0, 'new': 0 }); steps(el, 0); f.classList.remove('is-on');
      ['#dv-slug', '#dv-cue', '#dv-dlg'].forEach(function (s) { $(s).textContent = ''; }); $('#dv-said').textContent = '';
      if (!await c.sleep(600)) return;
      if (!await tapTo(c, el, '[data-tap="drafts"]')) return;
      set(el, { panel: 1 }); steps(el, 1);
      if (!await c.sleep(800)) return;
      if (!await tapTo(c, el, '.dr--old .dr__row.is-open [data-act="plus"]')) return;
      set(el, { 'new': 1, a: 0, b: 1 }); steps(el, 2);
      if (!await c.sleep(1000)) return;
      if (!await tapTo(c, el, '[data-tap="split"]')) return;
      set(el, { a: 1, b: 1, panel: 0 }); steps(el, 3); f.classList.remove('is-on');
      if (!await c.sleep(900)) return;
      steps(el, 9); await voice(c, el);
    }
  };

  var player = MS.player(ways, {
    delay: 200, threshold: 0.3, replay: '#ways-replay',
    settle: function () { keys.forEach(final); },
    reset: function () { /* each script blanks its own route */ },
    play: function (c) { return scripts[current](c); },
    // left alone, it walks the three routes in turn; the moment you pick one, it stops
    // the tour ends on the split; the other two routes are not shown on this page
    after: function () {}
  });

  function select(key, focus, auto) {
    if (!auto) { userPicked = true; cycle++; }
    current = key;
    keys.forEach(function (k) {
      var on = k === key;
      panels[k].classList.toggle('is-on', on);
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[k].tabIndex = on ? 0 : -1;
    });
    if (focus) tabs[key].focus();
    player.play();
  }
  keys.forEach(function (k, i) {
    tabs[k].addEventListener('click', function () { select(k); });
    tabs[k].addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!n) return; e.preventDefault(); select(keys[(i + n + 3) % 3], true);
    });
  });
  $('#ways-tabs').hidden = false; $('#ways-replay').hidden = false;
  ways.classList.add('is-live');
  panels.kb.classList.add('is-on');
  if (R) R.init({ setStop: setStop, filter: filter });
  keys.forEach(final);

  /* ---- the range: the keyboard window, opened out from bare to full by a segmented control ------------ */
  function setStop(i, pages) {
    var p = pages || { a: 1, b: i === 4 ? 1 : 0 };
    rg.setAttribute('data-stop', i); rg.setAttribute('data-a', p.a); rg.setAttribute('data-b', p.b);
    stopsEl.forEach(function (b, n) {
      var on = n === i && !pages;
      b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on || (pages && n === 0) ? 0 : -1;
    });
    if (i !== 1) { var t = $('.sh__typed', rg); t.textContent = ''; filter(rg, ''); }
  }
  /* picking a stop plays that stop, from its start */
  function pick(n) {
    only = n; userPicked = true; cycle++;
    if (!R || MS.reduced) { player.settle(); if (!R) setStop(n); steps(panels.kb, 9); return; }
    current = 'kb'; player.play();
  }
  stopsEl.forEach(function (b, n) {
    b.addEventListener('click', function () { pick(n); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return; e.preventDefault();
      var m = (n + d + stopsEl.length) % stopsEl.length; pick(m); stopsEl[m].focus();
    });
  });
  ctl.hidden = false; $('#rg-cap').hidden = false;
  $('#ways-replay').addEventListener('click', function () { userPicked = true; cycle++; });
})();

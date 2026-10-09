/* Home, section 3: one page that turns from screenplay to novel to article, each formatted as
   you type, then Read, which shows what prints. The static HTML holds all three finished pages. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;
  var root = $('#kinds-demo');
  if (!root) return;

  var keys = ['sp', 'nv', 'ar'];
  var pages = { sp: $('#kp-sp'), nv: $('#kp-nv'), ar: $('#kp-ar') };
  var tabs = { sp: $('#ktab-sp'), nv: $('#ktab-nv'), ar: $('#ktab-ar') };
  var readBtn = $('#kinds-read'), current = 'sp', turning = false;
  var wide = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: false };   // wide: all three pages stand side by side, no turning

  var saved = {};   // finished text of every typed piece, read once from the static page
  var typed = ['sp-slug', 'sp-syn', 'sp-act', 'sp-cue', 'sp-par', 'sp-dlg', 'sp-cue2', 'sp-dlg2', 'sp-act2', 'sp-cue3', 'sp-dlg3', 'sp-cue4', 'sp-dlg4', 'nv-h', 'nv-syn', 'nv-p1', 'nv-p1b', 'nv-orn', 'nv-p2', 'ar-p1', 'ar-mk', 'ar-p2'];
  typed.forEach(function (id) { saved[id] = $('#' + id).textContent; });

  function setRead(on) {
    root.setAttribute('data-read', on ? '1' : '0');
    readBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function finish() {
    typed.forEach(function (id) { var e = $('#' + id); e.textContent = saved[id]; e.classList.remove('raw'); });
    $('#nv-ch').classList.remove('is-hid'); $('#ar-note').classList.remove('is-hid'); $('#nv-note').classList.remove('is-hid');
    ['#ar-fn', '#nv-fn'].forEach(function (q) { var fn = $(q); fn.textContent = '1'; fn.classList.remove('raw'); });
  }
  function show(key) {
    current = key;
    keys.forEach(function (k) {
      pages[k].classList.remove('is-on', 'is-under', 'is-turn');
      if (k === key) pages[k].classList.add('is-on');
      var on = k === key;
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false'); tabs[k].tabIndex = on ? 0 : -1;
    });
  }
  /* turn the page like a leaf: the old one swings away on its left edge, the next waits beneath */
  function turn(key) {
    if (key === current) return Promise.resolve();
    var from = pages[current], to = pages[key];
    if (wide.matches || MS.reduced || !from.animate) { show(key); return Promise.resolve(); }
    to.classList.add('is-under'); from.classList.add('is-turn');
    keys.forEach(function (k) { var on = k === key; tabs[k].setAttribute('aria-selected', on ? 'true' : 'false'); tabs[k].tabIndex = on ? 0 : -1; });
    var a = from.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-98deg)' }], { duration: 760, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    return a.finished.then(function () { a.cancel(); show(key); }, function () { show(key); });
  }

  async function raw(c, id, text, speed, pause) {
    var e = $('#' + id); e.classList.add('raw');
    var ok = await c.type(e, text, { speed: speed * .7 });
    if (!ok) return false;
    e.classList.remove('raw'); e.textContent = saved[id] != null ? saved[id] : text;
    return c.sleep(Math.round((pause == null ? 220 : pause) * .7));
  }
  async function plain(c, id, speed, pause) {
    var ok = await c.type($('#' + id), saved[id], { speed: speed * .7 });
    return ok && c.sleep(Math.round((pause == null ? 180 : pause) * .7));
  }
  /* only the last lines of each page are written live: the rest is already there, so no page is ever empty */
  var tail = ['sp-cue2', 'sp-dlg2', 'sp-act2', 'sp-cue3', 'sp-dlg3', 'sp-cue4', 'sp-dlg4', 'nv-p1b', 'nv-orn', 'nv-p2', 'ar-mk', 'ar-p2'];
  function blank() {
    tail.forEach(function (id) { $('#' + id).textContent = ''; });
    $('#ar-note').classList.add('is-hid'); $('#ar-fn').textContent = '';
  }

  var player = MS.player(root, {
    delay: 250, threshold: 0.4, replay: '#kinds-replay',
    settle: function () { turning = false; finish(); setRead(true); show(current); },
    reset: function () { turning = true; blank(); setRead(false); show('sp'); },
    play: async function (c) {
      // the screenplay: a cue types in small letters and sets itself in capitals
      if (!await c.sleep(500)) return;
      if (!await raw(c, 'sp-cue2', 'may (o.s.)', 50, 220)) return;
      if (!await plain(c, 'sp-dlg2', 26, 220)) return;
      if (!await plain(c, 'sp-act2', 17, 260)) return;
      if (!await raw(c, 'sp-cue3', 'tom', 60, 220)) return;
      if (!await plain(c, 'sp-dlg3', 34, 260)) return;
      if (!await raw(c, 'sp-cue4', 'may', 60, 220)) return;
      if (!await plain(c, 'sp-dlg4', 40, 900)) return;

      // the novel: three asterisks set themselves as a break
      await turn('nv'); if (!c.alive()) return;
      if (!await c.sleep(300)) return;
      if (!await plain(c, 'nv-p1b', 14, 300)) return;
      if (!await raw(c, 'nv-orn', '***', 150, 450)) return;
      $('#nv-orn').innerHTML = '<span>***</span>';
      if (!await plain(c, 'nv-p2', 30, 1000)) return;

      // the article: [^ opens a footnote
      await turn('ar'); if (!c.alive()) return;
      if (!await c.sleep(300)) return;
      if (!await plain(c, 'ar-mk', 22, 200)) return;
      if (!await plain(c, 'ar-p2', 17, 160)) return;
      var fn = $('#ar-fn'); fn.classList.add('raw');
      if (!await c.type(fn, '[^', { speed: 140, caret: false })) return;
      if (!await c.sleep(266)) return;
      fn.classList.remove('raw'); fn.textContent = '1'; $('#ar-note').classList.remove('is-hid');
      if (!await c.sleep(1100)) return;
      setRead(true);                                   // the private marks go
      turning = false;
    }
  });

  function pick(key, focus) {
    player.settle(); turn(key); if (focus) tabs[key].focus();
  }
  keys.forEach(function (k, i) {
    tabs[k].addEventListener('click', function () { pick(k); });
    tabs[k].addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!n) return; e.preventDefault(); pick(keys[(i + n + 3) % 3], true);
    });
  });
  readBtn.addEventListener('click', function () { var on = readBtn.getAttribute('aria-pressed') !== 'true'; player.settle(); setRead(on); });

  $('#kinds-tabs').hidden = false; readBtn.hidden = false; $('#kinds-replay').hidden = false;
  root.classList.add('is-live');
  setRead(true); show('sp');
})();

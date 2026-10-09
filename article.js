/* Margin site: article.js
   The Article page's demos. Each one is a recreation of the app, its finished state is the static
   HTML (so JS off, reduced motion and a failed script all read), and each has a replay or can be
   worked by hand. Built on window.MarginSite (base.js). */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  // This page types the most words of any, so it types at twice the
  // site's pace.
  MS.pace = 0.5;
  var $ = MS.$, $$ = MS.$$;

  function byId(id) { return document.getElementById(id); }
  function guard(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[article.js] ' + name, e); }
  }
  function fmt(n) { return Number(n).toLocaleString('en-GB'); }
  function words(t) { t = (t || '').trim(); return t ? t.split(/\s+/).length : 0; }
  // keep a demo's height while it blanks and refills, so the page below does not jump
  function hold(el) { el.style.minHeight = el.offsetHeight + 'px'; }
  function release(el) { el.style.minHeight = ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // A player that gives way when the viewer takes over: a press or a key during the show
  // settles it, so their own action lands on the finished state.
  function player(el, o) {
    var running = false, pl, play = o.play, settle = o.settle;
    o.play = function (c) {
      running = true;
      return Promise.resolve(play(c)).then(function (r) { running = false; return r; },
        function (e) { running = false; throw e; });
    };
    o.settle = function () { running = false; settle(); };
    pl = MS.player(el, o);
    ['pointerdown', 'keydown'].forEach(function (ev) {
      el.addEventListener(ev, function () { if (running) pl.settle(); }, true);
    });
    return pl;
  }

  // type into a form field, one character at a time
  function typeField(c, input, text, speed) {
    var ghost = document.createElement('span');
    input.classList.add('is-typing');
    return c.type(ghost, text, {
      caret: false, speed: speed,
      onChar: function (n) { input.value = text.slice(0, n); input.dispatchEvent(new Event('input')); }
    }).then(function (ok) { input.classList.remove('is-typing'); return ok; });
  }

  /* ---- hero: the piece writes itself ------------------------------------------------------- */
  guard('hero', function () {
    var demo = byId('hero-demo'), page = byId('h-page');
    if (!demo || !page) return;
    var els = $$('[data-ty]', page), fn = byId('h-fn'), note = byId('h-note'), nt = byId('h-nt'), cnt = byId('h-count');
    var ntFull = nt.textContent, fnFull = fn.textContent;
    els.forEach(function (e) { e._full = e.textContent; });
    function count() {
      var n = 0;
      $$('[data-w]', page).forEach(function (e) { n += words(e.textContent); });
      cnt.textContent = fmt(n);
    }
    function fillAll() {
      els.forEach(function (e) { e.textContent = e._full; });
      fn.hidden = false; fn.textContent = fnFull; note.hidden = false; nt.textContent = ntFull;
      count();
    }
    player(demo, {
      replay: '#h-replay', delay: 700, threshold: .3,
      settle: function () { fillAll(); release(page); },
      reset: function () {
        fillAll(); hold(page);
        els.forEach(function (e) { e.textContent = ''; });
        fn.hidden = true; note.hidden = true; nt.textContent = ''; cnt.textContent = '0';
      },
      play: async function (c) {
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          var ok = await c.type(el, el._full, { speed: +el.getAttribute('data-sp') || 20, onChar: el.hasAttribute('data-w') ? count : null });
          if (!ok) return;
          if (el.nextElementSibling === fn) {
            fn.hidden = false; fn.textContent = '';
            if (!(await c.type(fn, '[^', { speed: 190, caret: false }))) return;
            if (!(await c.sleep(300))) return;
            fn.textContent = fnFull; note.hidden = false; nt.textContent = '';
            if (!(await c.type(nt, ntFull, { speed: 11 }))) return;
            if (!(await c.sleep(450))) return;
          } else if (!(await c.sleep(el.classList.contains('pc__hd') ? 350 : 90))) return;
        }
        release(page);
      }
    });
  });

  /* ---- 1: the title page sets the head ----------------------------------------------------- */
  guard('head', function () {
    var demo = byId('head-demo');
    if (!demo) return;
    var inputs = $$('input[data-for]', demo), fulls = inputs.map(function (i) { return i.value; });
    function mirror(inp) {
      var out = byId(inp.getAttribute('data-for')), v = inp.value;
      if (inp.id === 'hd-title') { out.textContent = v.trim() ? v : 'Headline'; out.classList.toggle('is-empty', !v.trim()); }
      else out.textContent = v;
    }
    inputs.forEach(function (i) { i.addEventListener('input', function () { mirror(i); }); });
    player(demo, {
      replay: '#hd-replay', threshold: .45,
      settle: function () {
        inputs.forEach(function (i, k) { i.value = fulls[k]; i.classList.remove('is-typing'); mirror(i); });
      },
      reset: function () { inputs.forEach(function (i) { i.value = ''; mirror(i); }); },
      play: async function (c) {
        if (!(await c.sleep(150))) return;
        for (var k = 0; k < inputs.length; k++) {
          if (!(await typeField(c, inputs[k], fulls[k], k === 1 ? 14 : 30))) return;
          if (!(await c.sleep(130))) return;
        }
      }
    });
  });

  /* ---- 2: footnotes -------------------------------------------------------------------------- */
  guard('footnotes', function () {
    var demo = byId('fn-demo'), page = byId('f-page');
    if (!demo || !page) return;
    var raw = byId('f-raw'), m2 = byId('f-m2'), n2 = byId('f-n2'), t2 = byId('f-t2'), c1 = byId('f-c1');
    var undo = byId('f-undo'), undoL = byId('f-undo-l'), steps = $$('#f-steps li');
    var full = t2.textContent;
    function now(k) { steps.forEach(function (s, i) { s.classList.toggle('is-now', i === k - 1); }); }
    function caretAfterMark(on) { c1.innerHTML = on ? '<span class="caret on" aria-hidden="true"></span>' : ''; }
    function setUndone(u) {
      m2.hidden = u; n2.hidden = u;
      undo.setAttribute('aria-pressed', u ? 'true' : 'false');
      undoL.textContent = u ? 'Put it back' : 'Take it back';
      now(u ? 3 : 0);
    }
    undo.addEventListener('click', function () { setUndone(undo.getAttribute('aria-pressed') !== 'true'); });
    function finished() {
      raw.hidden = true; t2.textContent = full; caretAfterMark(false); setUndone(false); now(0);
    }
    player(demo, {
      replay: '#f-replay', threshold: .5,
      settle: function () { finished(); release(page); },
      reset: function () {
        finished(); hold(page);
        m2.hidden = true; n2.hidden = true; t2.textContent = '';
      },
      play: async function (c) {
        if (!(await c.sleep(350))) return;
        now(1); raw.hidden = false;
        if (!(await c.type(raw, '[^', { speed: 240 }))) return;
        if (!(await c.sleep(420))) return;
        raw.hidden = true; m2.hidden = false; n2.hidden = false; t2.textContent = '';
        if (!(await c.type(t2, full, { speed: 20 }))) return;
        if (!(await c.sleep(350))) return;
        now(2); caretAfterMark(true);
        if (!(await c.sleep(1500))) return;
        caretAfterMark(false); now(0); release(page);
      }
    });
  });

  /* ---- 3: sources and facts ------------------------------------------------------------------- */
  guard('sources', function () {
    var demo = byId('src-demo'), page = byId('s-page');
    if (!demo || !page) return;
    var jo = byId('s-jo'), srcMk = byId('s-src'), tk = byId('s-tk'), open = byId('s-open'), done = byId('s-done');
    var statT = byId('s-stat-t'), cb = byId('s-cb'), cbl = byId('s-cb-l'), cbline = byId('s-cbline');
    var srcFull = srcMk.textContent, tkSpan = null, body = $('.frame__body', demo) || $('.stage__body', demo);
    var order = $$('[data-fact]', page).map(function (e) { return e.getAttribute('data-fact'); });
    var facts = {};
    $$('.fact', demo).forEach(function (li) {
      var id = li.getAttribute('data-id');
      facts[id] = {
        id: id, li: li, pos: order.indexOf(id), isTk: id === 'tk', sec: li.getAttribute('data-sec'),
        mk: id === 'tk' ? null : $('[data-fact="' + id + '"]', page),
        claim: $('.fact__q', li).textContent, done: li.classList.contains('is-done'),
        when: id === 'f0' ? 'Tue 29 Sept' : 'today', gone: false, start: li.classList.contains('is-done')
      };
    });
    function render() {
      var list = Object.keys(facts).map(function (k) { return facts[k]; }).sort(function (a, b) { return a.pos - b.pos; });
      var openN = 0, tkLeft = 0, checkedN = 0;
      list.forEach(function (f) {
        f.li.classList.toggle('is-gone', f.gone);
        if (f.gone) return;
        (f.done ? done : open).appendChild(f.li);
        f.li.classList.toggle('is-done', f.done);
        var ring = $('button.ring', f.li);
        if (ring) {
          ring.setAttribute('aria-pressed', f.done ? 'true' : 'false');
          ring.setAttribute('aria-label', f.done ? 'Checked: ' + f.claim + '. Press to take it back' : 'Tick the check: ' + f.claim);
        }
        $('.fact__m', f.li).textContent = f.done ? f.sec + ' · checked ' + f.when
          : (f.isTk ? f.sec + ' · a fact still owed' : f.sec + ' · rests on: as the page says');
        if (f.mk) {
          f.mk.classList.toggle('is-done', f.done);
          f.mk.textContent = '{{' + (f.done ? 'checked' : 'check') + ': ' + f.claim + '}}';
        }
        if (f.isTk) tkLeft++; else if (!f.done) openN++; else checkedN++;
      });
      // the Fact check's own line: what is still open, what is checked; Ready to file when nothing is
      var left = openN + tkLeft;
      statT.textContent = left ? left + ' open · ' + checkedN + ' checked' : 'Ready to file';
    }
    demo.addEventListener('click', function (e) {
      var r = e.target.closest ? e.target.closest('button.ring') : null;
      if (!r) return;
      var f = facts[r.closest('.fact').getAttribute('data-id')];
      if (!f) return;
      f.done = !f.done; f.when = 'today'; render();
    });
    tk.addEventListener('click', function () {
      if (tkSpan) return;
      tkSpan = document.createElement('span');
      tkSpan.className = 'tk is-written';
      tk.parentNode.replaceChild(tkSpan, tk);
      MS.type(tkSpan, 'It began on 28 September.', { speed: 28 }).then(function () { facts.tk.gone = true; render(); });
    });
    // terms: three side by side, one on
    var terms = $$('.terms .app-chip', demo);
    terms.forEach(function (b) {
      b.addEventListener('click', function () {
        terms.forEach(function (o) { var on = o === b; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      });
    });
    // checked back today
    function todayWords() { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    function setCb(on) {
      cb.setAttribute('aria-pressed', on ? 'true' : 'false');
      cb.textContent = on ? 'Not checked back' : 'Checked back today';
      cbl.textContent = on ? 'checked back ' + todayWords() : 'not checked back yet';
      cbline.hidden = !on;
      cbline.textContent = on ? 'checked back ' + todayWords() : '';
    }
    cb.addEventListener('click', function () { setCb(cb.getAttribute('aria-pressed') !== 'true'); });

    function finished() {
      Object.keys(facts).forEach(function (k) { var f = facts[k]; f.done = f.start; f.gone = false; f.when = k === 'f0' ? 'Tue 29 Sept' : 'today'; });
      if (tkSpan && tkSpan.parentNode) { tkSpan.parentNode.replaceChild(tk, tkSpan); }
      tkSpan = null;
      srcMk.textContent = srcFull; jo.hidden = false; jo.classList.remove('is-new');
      terms.forEach(function (o, i) { o.classList.toggle('on', i === 0); o.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
      setCb(false); render();
    }
    player(demo, {
      replay: '#s-replay', threshold: .4,
      settle: function () { finished(); release(body); },
      reset: function () { finished(); hold(body); srcMk.textContent = ''; jo.hidden = true; },
      play: async function (c) {
        if (!(await c.sleep(500))) return;
        if (!(await c.type(srcMk, srcFull, { speed: 15 }))) return;
        if (!(await c.sleep(650))) return;
        jo.hidden = false; jo.classList.add('is-new');
        if (!(await c.sleep(900))) return;
        jo.classList.remove('is-new'); release(body);
      }
    });
  });

  /* ---- 4: tracked changes ----------------------------------------------------------------------- */
  guard('changes', function () {
    var demo = byId('ch-demo');
    if (!demo) return;
    var chgs = $$('.chg', demo), paras = $$('.wp[data-wp]', demo), stat = byId('c-stat'), sel = -1, shown = true;
    var pwho = 'Ellis Marrow';
    chgs.forEach(function (ch, i) {
      ch._ins = $('ins', ch); ch._del = $('del', ch); ch._full = ch._ins.textContent;
      ch.setAttribute('data-s', 'pending'); ch.setAttribute('role', 'button');
      ch.setAttribute('aria-label', 'Change ' + (i + 1) + ' of ' + chgs.length + ': ' + describe(ch) + '. Press to select it');
    });
    function describe(ch) {
      return ch.getAttribute('data-kind') === 'insert' ? 'inserted a paragraph'
        : 'replaced “' + ch.getAttribute('data-old') + '” with “' + ch.getAttribute('data-new') + '”';
    }
    function pending() { return chgs.filter(function (c) { return c.getAttribute('data-s') === 'pending'; }); }
    function refresh() {
      chgs.forEach(function (c, i) { c.classList.toggle('is-sel', i === sel); });
      paras.forEach(function (p) {
        if ($('.chg[data-s="pending"]', p) && shown) p.setAttribute('data-pending', ''); else p.removeAttribute('data-pending');
      });
      var left = pending().length;
      if (!shown) stat.textContent = 'Draft 1 · no changes yet';
      else if (sel >= 0) {
        var c = chgs[sel], s = c.getAttribute('data-s');
        stat.textContent = 'Change ' + (sel + 1) + ' of ' + chgs.length + ' · ' + pwho + ' · ' + describe(c) + (s === 'pending' ? '' : ' · ' + s);
      } else stat.textContent = left ? left + (left === 1 ? ' change' : ' changes') + ' · ' + pwho : 'No changes left';
    }
    function select(i) { sel = i; refresh(); }
    function step(dir) {
      var p = pending(); if (!p.length) return select(-1);
      var from = sel < 0 ? (dir > 0 ? -1 : chgs.length) : sel, i = from;
      for (var n = 0; n < chgs.length; n++) {
        i = (i + dir + chgs.length) % chgs.length;
        if (chgs[i].getAttribute('data-s') === 'pending') return select(i);
      }
    }
    function decide(state) {
      if (sel < 0 || chgs[sel].getAttribute('data-s') !== 'pending') { var p = pending(); if (!p.length) return; sel = chgs.indexOf(p[0]); }
      chgs[sel].setAttribute('data-s', state);
      var left = pending();
      if (left.length) { var from = sel, i = from; for (var n = 0; n < chgs.length; n++) { i = (i + 1) % chgs.length; if (chgs[i].getAttribute('data-s') === 'pending') { sel = i; break; } } }
      else { /* keep the last decision in view */ }
      refresh();
    }
    byId('c-prev').addEventListener('click', function () { step(-1); });
    byId('c-next').addEventListener('click', function () { step(1); });
    byId('c-acc').addEventListener('click', function () { decide('accepted'); });
    byId('c-rej').addEventListener('click', function () { decide('rejected'); });
    demo.addEventListener('click', function (e) {
      var ch = e.target.closest ? e.target.closest('.chg') : null;
      if (ch) select(chgs.indexOf(ch));
    });
    demo.addEventListener('keydown', function (e) {
      var ch = e.target.closest ? e.target.closest('.chg') : null;
      if (ch && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(chgs.indexOf(ch)); }
    });
    function finished() {
      shown = true; sel = -1;
      chgs.forEach(function (c) { c.setAttribute('data-s', 'pending'); c._ins.textContent = c._full; c._del && c._del.classList.remove('is-plain'); });
      paras.forEach(function (p) { p.classList.remove('is-bare'); });
      refresh();
    }
    byId('c-reset').addEventListener('click', function () { finished(); });
    refresh();
    player(demo, {
      replay: '#c-save', threshold: .4,
      settle: finished,
      reset: function () {
        finished(); shown = false;
        chgs.forEach(function (c) { c._ins.textContent = ''; if (c._del) c._del.classList.add('is-plain'); });
        $$('.wp--ins', demo).forEach(function (p) { p.classList.add('is-bare'); });
        refresh();
      },
      play: async function (c) {
        if (!(await c.sleep(500))) return;
        shown = true;
        for (var i = 0; i < chgs.length; i++) {
          var ch = chgs[i];
          select(i);
          if (ch._del) { ch._del.classList.remove('is-plain'); if (!(await c.sleep(420))) return; }
          else ch.closest('.wp').classList.remove('is-bare');
          if (!(await c.type(ch._ins, ch._full, { speed: 30 }))) return;
          if (!(await c.sleep(300))) return;
        }
        select(0);
      }
    });
  });

  /* ---- 5: Read ------------------------------------------------------------------------------------- */
  guard('read', function () {
    var demo = byId('rd-demo'), sheet = byId('r-sheet'), btn = byId('r-toggle');
    if (!demo || !sheet || !btn) return;
    function apply(v) {
      sheet.setAttribute('data-view', v);
      btn.setAttribute('aria-pressed', v === 'read' ? 'true' : 'false');
    }
    function setView(v, animate) { if (animate) MS.transition(function () { apply(v); }); else apply(v); }
    var pl = player(demo, {
      threshold: .55, delay: 900,
      settle: function () { apply('read'); },
      play: async function (c) {
        // starts as printed; shows the source it came from, then Read turns it back into the page
        if (!(await c.sleep(200))) return;
        setView('write', true);
        if (!(await c.sleep(2200))) return;
        setView('read', true);
      }
    });
    btn.addEventListener('click', function () {
      var next = sheet.getAttribute('data-view') === 'read' ? 'write' : 'read';
      setView(next, true);
    });
  });

  /* ---- 6: sending to an editor ----------------------------------------------------------------------- */
  guard('send', function () {
    var demo = byId('sd-demo');
    if (!demo) return;
    var list = byId('e-readers'), add = byId('e-add'), send = byId('e-send'), sent = byId('e-sent');
    var files = $$('.send__files .app-chip', demo), listHTML = list.innerHTML, sentHTML = sent.innerHTML;
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], idle = null;
    function names() {
      return $$('.reader', list).map(function (r) { return $('.in', r).value.trim(); }).filter(Boolean);
    }
    function fileWords() {
      return files.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.textContent; }).join(', ');
    }
    function ready() { return names().length > 0 && !!fileWords(); }
    function paint() { send.setAttribute('aria-disabled', ready() ? 'false' : 'true'); }
    function row(name, when, what, fresh) {
      var li = document.createElement('li'), b = document.createElement('b'), w = document.createElement('span'), f = document.createElement('span');
      b.textContent = name; w.className = 'app-faded'; w.textContent = when; f.className = 'app-chip'; f.textContent = what;
      li.appendChild(b); li.appendChild(w); li.appendChild(f);
      if (fresh) li.className = 'is-new';
      return li;
    }
    function doSend() {
      if (!ready()) return;
      var d = new Date(), when = 'filed ' + DAYS[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' · draft 2';
      names().reverse().forEach(function (n) { sent.insertBefore(row(n, when, fileWords(), true), sent.firstChild); });
      send.textContent = 'Sent'; clearTimeout(idle);
      idle = setTimeout(function () { send.textContent = 'Send'; }, 1400);
    }
    send.addEventListener('click', doSend);
    add.addEventListener('click', function () {
      var li = document.createElement('li');
      li.className = 'reader';
      li.innerHTML = '<input class="in" type="text" placeholder="Name" aria-label="Name"><input class="in" type="text" placeholder="Email" aria-label="Email"><button class="x" type="button" aria-label="Take this reader off">×</button>';
      list.appendChild(li); $('.in', li).focus(); paint();
    });
    list.addEventListener('click', function (e) {
      var x = e.target.closest ? e.target.closest('.x') : null;
      if (x) { x.closest('.reader').remove(); paint(); }
    });
    list.addEventListener('input', paint);
    files.forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', on); paint();
      });
    });
    function finished() {
      list.innerHTML = listHTML; sent.innerHTML = sentHTML; send.textContent = 'Send';
      files.forEach(function (b) { b.setAttribute('aria-pressed', 'true'); b.classList.add('on'); });
      paint();
    }
    player(demo, {
      replay: '#e-replay', threshold: .4,
      settle: finished,
      reset: function () {
        finished();
        $$('.in', list).forEach(function (i) { i.value = ''; });
        sent.innerHTML = ''; paint();
      },
      play: async function (c) {
        var ins = $$('.in', list);
        if (!(await c.sleep(450))) return;
        if (!(await typeField(c, ins[0], 'R. Okafor', 60))) return;
        if (!(await typeField(c, ins[1], 'okafor@weeklyreporter.example', 22))) return;
        if (!(await c.sleep(600))) return;
        send.textContent = 'Sent'; paint();
        sent.innerHTML = sentHTML; sent.firstChild.className = 'is-new';
        if (!(await c.sleep(1100))) return;
        send.textContent = 'Send';
      }
    });
    paint();
  });

  /* ---- 7: length and deadline --------------------------------------------------------------------------- */
  guard('goals', function () {
    var demo = byId('ln-demo');
    if (!demo) return;
    var WORDS = 640, DAY = 864e5, TODAY = Date.UTC(2026, 9, 1), due = Date.UTC(2026, 9, 5), len = 2200;
    var D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function dstr(ms) { var d = new Date(ms); return D[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + M[d.getUTCMonth()]; }
    var chips = $$('#g-len .app-chip', demo), early = byId('g-early'), late = byId('g-late'), flashT = {};
    function flash(id) {
      var el = byId(id); el.classList.add('is-flash'); clearTimeout(flashT[id]);
      flashT[id] = setTimeout(function () { el.classList.remove('is-flash'); }, 900);
    }
    function render() {
      var days = Math.round((due - TODAY) / DAY), left = Math.max(0, len - WORDS);
      byId('g-due').textContent = 'Due ' + dstr(due) + ' · ' + days + (days === 1 ? ' day' : ' days');
      byId('g-n').textContent = fmt(WORDS) + ' of ' + fmt(len) + ' words';
      byId('g-day').textContent = left ? fmt(Math.ceil(left / days)) + ' a day to make it' : 'already at length';
      byId('g-fill').style.width = Math.min(100, WORDS / len * 100) + '%';
      byId('g-bar').setAttribute('aria-label', fmt(WORDS) + ' of ' + fmt(len) + ' words');
      byId('g-k-len').textContent = fmt(len) + ' words';
      byId('g-k-dl').textContent = dstr(due) + ' 12:00';
      early.setAttribute('aria-disabled', days <= 1 ? 'true' : 'false');
    }
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        len = +b.getAttribute('data-len');
        chips.forEach(function (o) { var on = o === b; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        render(); flash('g-k-len');
      });
    });
    early.addEventListener('click', function () { if (due - TODAY > DAY) { due -= DAY; render(); flash('g-k-dl'); } });
    late.addEventListener('click', function () { due += DAY; render(); flash('g-k-dl'); });
    render();
  });
})();

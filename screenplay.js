/* Margin site: screenplay.js
   The screenplay page's demos. Every demo's static HTML is its finished state; this file
   only adds motion and interaction on top (see DESIGN-NOTES.md). Uses window.MarginSite. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;

  /* controls that need script appear; their static stand-ins go */
  $$('[data-js]').forEach(function (e) { e.hidden = false; });
  $$('[data-nojs]').forEach(function (e) { e.hidden = true; });

  /* the first touch ends the demo's own show: finish it, and never start it later */
  function tame(p) { if (p) { p.settle(); p.destroy(); } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function anim(el, frames, opt) {
    if (!el.animate || MS.reduced) return null;
    try { return el.animate(frames, opt); } catch (e) { return null; }
  }
  var GLIDE = 'cubic-bezier(.4,0,.2,1)';

  /* ==========================================================================
     1. The page types itself and dresses itself
     ========================================================================== */
  (function typing() {
    var sheet = $('#ty-sheet');
    if (!sheet) return;
    var lines = $$('#ty-sheet>div:not(.sc-pno)');
    var finals = lines.map(function (l) {
      var tx = $('.tx', l);
      return { cls: l.className, n: l.getAttribute('data-n'), text: tx.textContent };
    });
    var caret = document.createElement('span');
    caret.className = 'caret on';
    caret.setAttribute('aria-hidden', 'true');

    function hnote(line) { var h = $('.hnote', line); if (h) h.classList.add('is-in'); }
    function settle() {
      lines.forEach(function (l, i) {
        l.hidden = false; l.className = finals[i].cls;
        if (finals[i].n) l.setAttribute('data-n', finals[i].n); else l.removeAttribute('data-n');
        $('.tx', l).textContent = finals[i].text;
      });
      $$('.hnote', sheet).forEach(function (h) { h.classList.remove('is-in'); });
      sheet.classList.remove('is-blank');
      sheet.style.minHeight = '';
      if (caret.parentNode) caret.parentNode.removeChild(caret);
    }
    function reset() {
      sheet.style.minHeight = sheet.offsetHeight + 'px';
      sheet.classList.add('is-blank');
      lines.forEach(function (l) {
        l.hidden = true; l.className = 'sc-act'; l.removeAttribute('data-n');
        $('.tx', l).textContent = '';
      });
    }
    function mk(tx) {
      tx.textContent = '';
      var L = document.createTextNode(''), R = document.createTextNode('');
      tx.appendChild(L); tx.appendChild(caret); tx.appendChild(R);
      return { L: L, R: R };
    }
    async function keys(c, p, str, o) {
      o = o || {};
      for (var i = 0; i < str.length; i++) {
        p.L.nodeValue += str.charAt(i);
        if (o.onChar) o.onChar(p.L.nodeValue);
        caret.classList.remove('on');
        var ch = str.charAt(i);
        var each = Math.min((o.speed || 38) * 0.45, 55);   // a fast typist, as MarginSite.type
        var wait = Math.max(14, each * (0.65 + Math.random() * 0.7)) + (/[.,:]/.test(ch) ? 110 : ch === ' ' ? each * 0.6 : 0);
        if (!(await c.sleep(wait))) return false;
        caret.classList.add('on');
      }
      return true;
    }
    async function play(c) {
      var i = 0, l, p, ok;
      // 1. scene heading: lowercase at first, capitals the moment it knows
      l = lines[i]; l.hidden = false; p = mk($('.tx', l));
      if (!(await c.sleep(450))) return;
      ok = await keys(c, p, 'int. bar - night', { speed: 52, onChar: function (t) {
        if (/^(int|ext)\./i.test(t) && l.className !== 'sc-slug') { l.className = 'sc-slug'; l.setAttribute('data-n', finals[0].n); hnote(l); }
      } });
      if (!ok) return;
      if (!(await c.sleep(600))) return;
      // 2. action
      i = 1; l = lines[i]; l.hidden = false; p = mk($('.tx', l));
      if (!(await keys(c, p, finals[1].text, { speed: 24 }))) return;
      if (!(await c.sleep(500))) return;
      // 3. Tab on an empty line starts a character
      i = 2; l = lines[i]; l.hidden = false; p = mk($('.tx', l));
      if (!(await c.sleep(650))) return;
      l.className = 'sc-cue'; hnote(l);
      if (!(await c.sleep(450))) return;
      if (!(await keys(c, p, 'may', { speed: 70 }))) return;
      if (!(await c.sleep(450))) return;
      // 4. ( opens a parenthetical and closes itself
      i = 3; l = lines[i]; l.hidden = false; l.className = 'sc-dlg'; p = mk($('.tx', l));
      if (!(await c.sleep(350))) return;
      p.L.nodeValue = '('; p.R.nodeValue = ')'; l.className = 'sc-par'; hnote(l);
      if (!(await c.sleep(650))) return;
      if (!(await keys(c, p, 'quietly', { speed: 52 }))) return;
      if (!(await c.sleep(450))) return;
      p.L.nodeValue += p.R.nodeValue; p.R.nodeValue = '';
      // 5. speech: under a cue the line is in the speech's column from the first key, as the app sets it
      i = 4; l = lines[i]; l.hidden = false; l.className = 'sc-dlg'; p = mk($('.tx', l));
      if (!(await keys(c, p, finals[4].text, { speed: 40 }))) return;
      if (!(await c.sleep(500))) return;
      i = 5; l = lines[i]; l.hidden = false; p = mk($('.tx', l));
      if (!(await c.sleep(350))) return;
      l.className = 'sc-cue';
      if (!(await keys(c, p, 'tom', { speed: 70 }))) return;
      if (!(await c.sleep(300))) return;
      i = 6; l = lines[i]; l.hidden = false; l.className = 'sc-dlg'; p = mk($('.tx', l));
      if (!(await keys(c, p, finals[6].text, { speed: 50 }))) return;
      if (!(await c.sleep(550))) return;
      // 6. transition
      i = 7; l = lines[i]; l.hidden = false; p = mk($('.tx', l));
      ok = await keys(c, p, 'cut to:', { speed: 56, onChar: function (t) {
        if (/to:$/i.test(t) && l.className !== 'sc-tr') { l.className = 'sc-tr'; hnote(l); }
      } });
      if (!ok) return;
      if (!(await c.sleep(900))) return;
      settle();
    }
    MS.player($('#ty-demo'), { replay: '#ty-replay', threshold: .3, delay: 500, reset: reset, settle: settle, play: play });
  })();

  /* ==========================================================================
     2. Fountain: point at a line, see its page
     ========================================================================== */
  (function fountain() {
    var demo = $('#fn-demo');
    if (!demo) return;
    var src = $$('.fn-ln[data-k]', demo), pg = $$('.fn-pg', demo), hand = $('#fn-hand');
    var say = {
      slug: 'a scene heading, in capitals', syn: 'a synopsis stays off the page', act: 'action',
      cue: 'a character cue', par: 'a parenthetical', dlg: 'dialogue',
      share: 'a note for whoever reads', tr: 'a transition'
    };
    var order = ['slug', 'syn', 'act', 'cue', 'par', 'dlg', 'share', 'tr'];
    function on(k) {
      src.forEach(function (e) { e.classList.toggle('is-on', e.getAttribute('data-k') === k); });
      pg.forEach(function (e) { e.classList.toggle('is-on', e.getAttribute('data-k') === k); });
      hand.textContent = k ? say[k] : 'point at a line';
    }
    var pl;
    function touch(k) { if (pl) tame(pl); hand.setAttribute('aria-live', 'polite'); on(k); }
    src.concat(pg).forEach(function (e) {
      var k = e.getAttribute('data-k');
      e.addEventListener('mouseenter', function () { touch(k); });
      e.addEventListener('focus', function () { touch(k); });
    });
    src.forEach(function (e, i) { e.setAttribute('tabindex', i === 0 ? '0' : '-1'); });
    src.forEach(function (e, i) {
      e.addEventListener('keydown', function (ev) {
        var n = ev.key === 'ArrowDown' ? i + 1 : ev.key === 'ArrowUp' ? i - 1 : -1;
        if (n < 0 || n >= src.length) return;
        ev.preventDefault(); src[i].setAttribute('tabindex', '-1'); src[n].setAttribute('tabindex', '0'); src[n].focus();
      });
    });
    $('.fn-pair', demo).addEventListener('mouseleave', function () { on(null); });
    on(null);
    pl = MS.player($('.fn-pair', demo), {
      replay: '#fn-replay', threshold: .35, delay: 600,
      reset: function () { on(null); },
      settle: function () { on(null); },
      play: async function (c) {
        for (var i = 0; i < order.length; i++) {
          on(order[i]);
          if (!(await c.sleep(1050))) return;
        }
        on(null);
      }
    });
  })();

  /* ==========================================================================
     3. Drafts and History
     ========================================================================== */
  (function drafts() {
    var graph = $('#dr-graph'), hist = $('#dr-hist'), tabD = $('#dr-tab-drafts'), tabH = $('#dr-tab-hist');
    if (!graph) return;
    var LINE = {
      s: 'He hated most things that lasted.', d2: 'He hated everything that lasted.',
      d3: 'He hated most things that stayed.', d3a: 'He hated most things that stayed. Her too.',
      d4: 'He never hated a thing. He just left.'
    };
    var drafts, open, tab, moments, sel, seq, fresh;
    var ICON = {
      clock: '<circle cx="8" cy="8" r="5.6"/><path d="M8 4.8V8l2.2 1.4"/>',
      plus: '<path d="M8 3.2v9.6M3.2 8h9.6"/>',
      split: '<rect x="2.4" y="3" width="11.2" height="10" rx="1.6"/><path d="M8 3v10"/>',
      merge: '<path d="M4 2.8v2.2A3.6 3.6 0 0 0 7.6 8.6H8M12 2.8v2.2A3.6 3.6 0 0 1 8.4 8.6H8M8 8.6v4.6M5.9 11.2L8 13.3l2.1-2.1"/>'
    };
    function svgi(n) { return '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }

    function initial() {
      drafts = [
        { id: 's', name: 'The Lighter', parent: null, line: LINE.s, pill: 'the script' },
        { id: 'd2', name: 'Draft 2', parent: 's', line: LINE.d2, pill: 'from The Lighter' },
        { id: 'd3', name: 'Draft 3', parent: 's', line: LINE.d3, pill: 'from The Lighter' },
        { id: 'd3a', name: 'Draft 3a', parent: 'd3', line: LINE.d3a, pill: 'from Draft 3' },
        { id: 'd4', name: 'Draft 4', parent: 's', line: LINE.d4, pill: 'from The Lighter' }
      ];
      open = 'd3'; tab = 'drafts'; sel = null; seq = 0; fresh = null;
      moments = [
        { id: 'm1', t: 'Sprint, 25 min', s: 'Today 14:02 · and 12 saves before it', line: LINE.d3 },
        { id: 'm2', t: 'Pink pages issued', s: 'Today 11:30', line: LINE.s },
        { id: 'm3', t: 'Merged from Draft 2a', s: 'Yesterday', line: LINE.d2 },
        { id: 'm4', t: 'Kept: white draft', s: 'Tuesday', line: 'He hated things that lasted.' }
      ];
    }
    function byId(id) { for (var i = 0; i < drafts.length; i++) if (drafts[i].id === id) return drafts[i]; }
    function idx(id) { for (var i = 0; i < drafts.length; i++) if (drafts[i].id === id) return i; return -1; }
    function depth(d) { var n = 0; while (d.parent) { d = byId(d.parent); n++; } return n; }
    function chain(d) { var a = []; while (d.parent) { d = byId(d.parent); a.unshift(d); } return a; }
    function lastDesc(i) {
      var id = drafts[i].id, last = i;
      drafts.forEach(function (d, j) { var p = d; while (p.parent) { if (p.parent === id) { last = Math.max(last, j); break; } p = byId(p.parent); } });
      return last;
    }
    function kids(id) { return drafts.filter(function (d) { return d.parent === id; }); }

    function addChild(pid) {
      var p = byId(pid), n = kids(pid).length, name, base;
      if (!p.parent) name = 'Draft ' + (2 + n);
      else {
        base = p.name.replace(/^Draft /, '');
        name = 'Draft ' + base + (/\d$/.test(base) ? String.fromCharCode(97 + n) : (n + 1));
      }
      var d = { id: 'n' + (++seq), name: name, parent: pid, line: p.line, pill: 'from ' + p.name + ' · just now' };
      drafts.splice(lastDesc(idx(pid)) + 1, 0, d);
      open = d.id; fresh = d.id; sel = null;
      return d;
    }
    function merge(id) {
      var d = byId(id), p = byId(d.parent);
      if (!d.parent || d.merged) return;
      d.merged = true; d.pill = 'from ' + p.name + ', merged · just now';
      moments.unshift({ id: 'mm' + (++seq), t: 'Merged from ' + d.name, s: 'Just now', line: p.line, fresh: true });
      if (open === id) open = p.id;
      sel = null;
    }
    var OTHER = 'He hated most things that stayed. Not her.';
    function final() { initial(); addChild('d3').line = OTHER; merge('d4'); fresh = null; moments[0].fresh = false; moments[0].s = 'Today'; byId('d4').pill = 'from The Lighter, merged · today'; byId('n1').pill = 'from Draft 3 · just now'; }

    var STEP = 14;
    function lane(x1, y1, x2, y2, m) { return '<path class="l' + (m ? ' m' : '') + '" d="M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2 + '"/>'; }
    function rowHTML(i, maxD) {
      var d = drafts[i], dep = depth(d), W = (maxD + 1) * STEP + 4;
      function x(j) { return 7 + j * STEP; }
      var up = chain(d), s = '<svg class="dg-lanes" viewBox="0 0 ' + W + ' 30" width="' + (W / 12.5) + 'em" height="2.4em" aria-hidden="true" focusable="false">';
      up.forEach(function (a, j) { if (lastDesc(idx(a.id)) > i) s += lane(x(j), 0, x(j), 30, a.merged); });
      if (dep > 0) s += '<path class="l fork' + (d.merged ? ' m' : '') + '" d="M' + x(dep - 1) + ',0 C' + x(dep - 1) + ',9 ' + x(dep) + ',6 ' + x(dep) + ',15"/>';
      if (lastDesc(i) > i) s += lane(x(dep), 15, x(dep), 30, d.merged);
      up.concat([d]).forEach(function (M) {
        if (!M.merged || lastDesc(idx(M.id)) !== i) return;
        var mj = depth(M), px = x(mj - 1), y0 = M === d ? 15 : 0;
        if (M !== d) s += lane(x(mj), 0, x(mj), y0, true);
        s += lane(px, 0, px, 30, false);
        s += '<path class="bend" d="M' + x(mj) + ',' + y0 + ' C' + x(mj) + ',' + (y0 + (30 - y0) * 0.62) + ' ' + px + ',' + (30 - (30 - y0) * 0.5) + ' ' + px + ',29"/>';
        s += '<path class="arrow" d="M' + (px - 2.4) + ',26.6 L' + px + ',23.8 L' + (px + 2.4) + ',26.6"/>';
      });
      s += '<circle class="dot' + (d.id === open ? ' o' : d.merged ? ' m' : '') + '" cx="' + x(dep) + '" cy="15" r="3"/></svg>';
      var acts = '<button type="button" data-do="hist" aria-label="History of ' + esc(d.name) + '" title="History">' + svgi('clock') + '</button>' +
        '<button type="button" data-do="new" aria-label="New draft off ' + esc(d.name) + '" title="New draft off ' + esc(d.name) + '">' + svgi('plus') + '</button>' +
        '<button type="button" data-do="split" aria-label="Split with ' + esc(d.name) + '" title="Split with ' + esc(d.name) + '">' + svgi('split') + '</button>';
      if (d.parent && !d.merged) acts += '<button type="button" data-do="merge" aria-label="Merge ' + esc(d.name) + ' into ' + esc(byId(d.parent).name) + '" title="Merge into ' + esc(byId(d.parent).name) + '">' + svgi('merge') + '</button>';
      return '<li class="dg-row' + (d.id === open ? ' is-open' : '') + (d.merged ? ' is-merged' : '') + (d.id === fresh ? ' is-new' : '') + '" data-id="' + d.id + '">' + s +
        '<button type="button" class="dg-name" data-do="open"' + (d.id === open ? ' aria-current="true"' : '') + '>' + esc(d.name) + '</button>' +
        '<span class="dg-pill">' + esc(d.pill) + '</span><span class="dg-act">' + acts + '</span></li>';
    }
    function renderGraph() {
      var maxD = 0; drafts.forEach(function (d) { maxD = Math.max(maxD, depth(d)); });
      var h = '<ol class="dg" aria-label="Drafts">';
      for (var i = 0; i < drafts.length; i++) h += rowHTML(i, maxD);
      graph.innerHTML = h + '</ol>';
    }
    function current() { return byId(open); }
    function renderHist() {
      var d = current(), h = '<p class="hs-head">Every moment kept <span>· ' + esc(d.name) + '</span></p><div class="hs-list">';
      moments.forEach(function (m) {
        h += '<button type="button" class="hs-m' + (m.fresh ? ' is-fresh' : '') + '" aria-pressed="' + (sel === m.id) + '" data-m="' + m.id + '"><span class="hs-ic">' +
          svgi('clock') + '</span><span class="hs-t">' + esc(m.t) + '</span><span class="hs-s">' + esc(m.s) + '</span></button>';
      });
      h += '</div>';
      if (sel) {
        var m = moments.filter(function (x) { return x.id === sel; })[0];
        h += '<div class="hs-look"><span>Looking at · <b>' + esc(m.s.split(' · ')[0]) + ' · ' + esc(m.t) + '</b></span><button type="button" class="hs-put" data-put>Put back</button></div>';
      }
      h += '<p class="hs-foot">All the way back · Mon 8 Sep 09:00 · the first moment kept</p>';
      hist.innerHTML = h;
    }
    function renderSplit() {
      var d = current(), left = d.parent ? byId(d.parent) : kids(d.id)[0] || d;
      var m = sel ? moments.filter(function (x) { return x.id === sel; })[0] : null;
      $('#dr-left-name').textContent = left.name;
      $('#dr-left-line').textContent = left.line;
      $('#dr-right-name').textContent = m ? 'Looking at · ' + m.t : d.name;
      var rl = $('#dr-right-line'); rl.textContent = m ? m.line : d.line;
      rl.classList.toggle('is-changed', rl.textContent !== left.line);
      $('#dr-title').textContent = 'The Lighter' + (d.parent || d.id !== 's' ? ' · ' + d.name : '');
    }
    function render() {
      tabD.setAttribute('aria-pressed', tab === 'drafts'); tabH.setAttribute('aria-pressed', tab === 'hist');
      graph.hidden = tab !== 'drafts'; hist.hidden = tab !== 'hist';
      if (tab === 'drafts') renderGraph(); else renderHist();
      renderSplit();
      fresh = null; moments.forEach(function (m) { m.fresh = false; });
    }

    graph.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-do]'); if (!b) return;
      var row = b.closest('.dg-row'), id = row.getAttribute('data-id'), a = b.getAttribute('data-do');
      tame(pl);
      if (a === 'open') { open = id; sel = null; }
      else if (a === 'new') addChild(id);
      else if (a === 'split') { open = id; sel = null; }
      else if (a === 'merge') merge(id);
      else if (a === 'hist') { open = id; tab = 'hist'; }
      render();
      if (a === 'new') { var nb = $('.dg-row.is-open .dg-name', graph); if (nb) nb.focus({ preventScroll: true }); }
    });
    tabD.addEventListener('click', function () { tame(pl); tab = 'drafts'; render(); });
    tabH.addEventListener('click', function () { tame(pl); tab = 'hist'; render(); });
    hist.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-m')) { sel = sel === b.getAttribute('data-m') ? null : b.getAttribute('data-m'); render(); }
      else if (b.hasAttribute('data-put')) {
        var m = moments.filter(function (x) { return x.id === sel; })[0], d = current();
        moments.unshift({ id: 'mp' + (++seq), t: 'Today, kept first', s: 'Just now · before putting back', line: d.line, fresh: true });
        d.line = m.line; sel = null; render();
      }
    });

    var pl = MS.player($('#dr-demo'), {
      replay: '#dr-replay', threshold: .25, delay: 500,
      reset: function () { initial(); render(); },
      settle: function () { final(); render(); },
      play: async function (c) {
        if (!(await c.sleep(1100))) return;
        addChild('d3'); render();
        if (!(await c.sleep(1500))) return;
        current().line = OTHER; render();
        if (!(await c.sleep(1800))) return;
        merge('d4'); render();
        if (!(await c.sleep(1200))) return;
        byId('n1').pill = 'from Draft 3 · just now';
      }
    });
    final(); render();
  })();

  /* ==========================================================================
     4. Board, cards, outline
     ========================================================================== */
  (function board() {
    var demo = $('#bd-demo'), acts = $('#bd-acts');
    if (!acts) return;
    var lists = $$('.bd-list', acts), cards = $$('.bd-card', acts), live = $('#bd-live');
    var outline = $('#bd-outline'), order = $('#bd-order'), eyebrow = $('.bd-main .app-eyebrow', demo);
    var STATES = ['none', 'half', 'good', 'cut'], LABEL = { none: 'nothing yet', half: 'rough', good: 'good', cut: 'cut?' };
    var view = 'board', dragging = null;
    function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }
    function ordered() { return cards.slice().sort(function (a, b) { return cmp(a, b); }); }
    function cmp(a, b) {
      var all = $$('.bd-card', acts); return all.indexOf(a) - all.indexOf(b);
    }

    function renumber(markId) {
      var all = $$('.bd-card', acts), page = 1;
      all.forEach(function (c, i) {
        $('.bd-no', c).textContent = i + 1;
        var n = +c.getAttribute('data-pages') || 1;
        $('.bd-pp', c).textContent = 'pp. ' + page + (n > 1 ? '–' + (page + n - 1) : '');
        page += n;
        c.setAttribute('aria-label', 'Scene ' + (i + 1) + ', ' + c.getAttribute('data-slug') + '. Space lifts it.');
      });
      order.innerHTML = all.map(function (c, i) {
        return '<li' + (c.getAttribute('data-id') === markId ? ' class="is-moved"' : '') + '><span class="num">' + (i + 1) + '</span>' + esc(c.getAttribute('data-slug')) + '</li>';
      }).join('');
      if (markId) setTimeout(function () { $$('.is-moved', order).forEach(function (e) { e.classList.remove('is-moved'); }); }, 1500);
      if (view === 'outline') renderOutline();
    }

    function renderOutline() {
      var all = $$('.bd-card', acts), pi = -1, oi = -1, pages = [];
      all.forEach(function (c, i) {
        if (c.getAttribute('data-thread') === 'plant') pi = i;
        if (c.getAttribute('data-thread') === 'payoff') oi = i;
      });
      var lo = Math.min(pi, oi), hi = Math.max(pi, oi), h = '';
      var ahead = 0; if (pi >= 0 && oi > pi) for (var k = pi; k < oi; k++) ahead += +all[k].getAttribute('data-pages') || 1;
      var back = 0; if (pi >= 0 && oi >= 0 && oi < pi) for (var q = oi; q < pi; q++) back += +all[q].getAttribute('data-pages') || 1;
      h += '<p class="ol-head"><span>Threads</span><span class="app-chip tag">the lighter</span><span>' + (oi > pi ? 'paid off' : 'paid off before it is planted') + '</span></p>';
      all.forEach(function (c, i) {
        var t = c.getAttribute('data-thread'), cls = 'ol-row';
        if (pi >= 0 && oi >= 0) { if (i === lo) cls += ' t-first'; else if (i === hi) cls += ' t-last'; else if (i > lo && i < hi) cls += ' t-mid'; }
        var sen = '';
        if (t === 'plant') sen = 'plants the lighter';
        if (t === 'payoff') sen = oi > pi ? 'pays off the lighter, ' + ahead + (ahead === 1 ? ' page' : ' pages') + ' back' : 'pays off the lighter, ' + back + (back === 1 ? ' page' : ' pages') + ' before it is planted';
        h += '<div class="' + cls + '"' + (t ? ' data-t="' + t + '"' : '') + '><span class="ol-knot"><i class="ol-dot"></i></span><span class="ol-no">' + (i + 1) + '</span>' +
          '<span class="ol-t"><span class="ol-slug">' + esc(c.getAttribute('data-slug')) + '</span><span class="ol-syn">' + esc(c.getAttribute('data-syn')) + '</span>' +
          (sen ? '<span class="ol-sen">' + sen + '</span>' : '') + '</span>' +
          '<span class="ol-end"><span class="ring" data-s="' + $('.ring', c).getAttribute('data-s') + '" aria-hidden="true"></span>' + esc($('.bd-pp', c).textContent) + '</span></div>';
      });
      outline.innerHTML = h;
    }

    /* the ring: nothing yet, rough, good, cut? */
    acts.addEventListener('click', function (e) {
      var r = e.target.closest('button.ring'); if (!r) return;
      var next = STATES[(STATES.indexOf(r.getAttribute('data-s')) + 1) % STATES.length];
      r.setAttribute('data-s', next);
      r.setAttribute('aria-label', 'Status: ' + LABEL[next] + '. Press to change');
      say('Scene status: ' + LABEL[next]);
      e.stopPropagation();
    });

    /* views */
    $$('#bd-views button').forEach(function (b) {
      b.addEventListener('click', function () {
        view = b.getAttribute('data-view');
        $$('#bd-views button').forEach(function (o) { var on = o === b; o.setAttribute('aria-pressed', on); o.classList.toggle('on', on); });
        acts.hidden = view !== 'board'; outline.hidden = view !== 'outline';
        eyebrow.textContent = view === 'board' ? 'Board' : 'Outline';
        if (view === 'outline') renderOutline();
      });
    });

    /* moving a card: FLIP the others, renumber the script */
    function moveTo(card, list, i) {
      card._moving = true; setTimeout(function () { card._moving = false; }, 80);
      var others = $$('.bd-card', acts).filter(function (c) { return c !== card; });
      var before = others.map(function (c) { return c.getBoundingClientRect(); });
      var sibs = $$('.bd-card', list).filter(function (c) { return c !== card; });
      list.insertBefore(card, sibs[i] || null);
      others.forEach(function (c, k) {
        var b = c.getBoundingClientRect(), dx = before[k].left - b.left, dy = before[k].top - b.top;
        if (dx || dy) anim(c, [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 260, easing: GLIDE });
      });
      renumber();
    }
    function slotOf(card) { var l = card.parentNode; return { list: l, i: $$('.bd-card', l).indexOf(card) }; }
    function where(card) { var s = slotOf(card); return (s.list.getAttribute('data-act')) + ', place ' + (s.i + 1); }

    $$('.bd-card', acts).forEach(function (card) {
      var grip = document.createElement('span'); grip.className = 'bd-grip'; grip.setAttribute('aria-hidden', 'true');
      var no = $('.bd-no', card); no.parentNode.insertBefore(grip, $('.ring', card) || null);
      card.setAttribute('aria-describedby', 'bd-hint');
      card.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || e.target.closest('.ring')) return;
        if (e.pointerType === 'touch' && !e.target.closest('.bd-grip')) return;
        var r = card.getBoundingClientRect();
        dragging = { card: card, sx: e.clientX, sy: e.clientY, gx: e.clientX - r.left, gy: e.clientY - r.top, on: false, id: e.pointerId, home: slotOf(card) };
        try { card.setPointerCapture(e.pointerId); } catch (x) {}
      });
      card.addEventListener('pointermove', function (e) {
        var d = dragging; if (!d || d.card !== card || e.pointerId !== d.id) return;
        if (!d.on) {
          if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 6) return;
          d.on = true; card.classList.add('is-lifted'); say('Lifted scene ' + $('.bd-no', card).textContent);
        }
        e.preventDefault();
        // which act and place is the pointer over?
        var best = null, bd = 1e12;
        lists.forEach(function (l) {
          var r = l.getBoundingClientRect(), dx = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0,
            dy = e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0, dd = dx * dx + dy * dy;
          if (dd < bd) { bd = dd; best = l; }
        });
        var sibs = $$('.bd-card', best).filter(function (c) { return c !== card; }), at = sibs.length;
        for (var i = 0; i < sibs.length; i++) { var sr = sibs[i].getBoundingClientRect(); if (e.clientY < sr.top + sr.height / 2) { at = i; break; } }
        var cur = slotOf(card);
        if (cur.list !== best || cur.i !== at) moveTo(card, best, at);
        card.style.transform = 'none';
        var r2 = card.getBoundingClientRect();
        card.style.transform = 'translate(' + (e.clientX - d.gx - r2.left) + 'px,' + (e.clientY - d.gy - r2.top) + 'px) scale(1.02)';
      });
      function end(e) {
        var d = dragging; if (!d || d.card !== card) return;
        dragging = null;
        try { card.releasePointerCapture(e.pointerId); } catch (x) {}
        if (!d.on) return;
        var from = card.style.transform; card.style.transform = 'none';
        anim(card, [{ transform: from }, { transform: 'none' }], { duration: 240, easing: GLIDE });
        card.classList.remove('is-lifted');
        renumber(card.getAttribute('data-id'));
        card.classList.remove('is-moved'); void card.offsetWidth; card.classList.add('is-moved');
        say('Scene moved: ' + where(card));
      }
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);
      card.addEventListener('lostpointercapture', function () { if (dragging && dragging.card === card && dragging.on) { dragging = null; card.style.transform = ''; card.classList.remove('is-lifted'); } });

      /* the keyboard: space lifts, arrows move, space drops, escape puts it back */
      card.addEventListener('keydown', function (e) {
        if (e.target !== card) return;
        var k = e.key;
        if (!card._kb) {
          if (k === ' ' || k === 'Enter') { e.preventDefault(); card._kb = { home: slotOf(card) }; card.classList.add('is-lifted'); say('Lifted scene ' + $('.bd-no', card).textContent + '. Arrow keys move it, space puts it down, escape puts it back.'); }
          return;
        }
        var s = slotOf(card), li = lists.indexOf(s.list), sibs = $$('.bd-card', s.list).length;
        if (k === 'ArrowUp') { e.preventDefault(); if (s.i > 0) moveTo(card, s.list, s.i - 1); else if (li > 0) moveTo(card, lists[li - 1], $$('.bd-card', lists[li - 1]).length); }
        else if (k === 'ArrowDown') { e.preventDefault(); if (s.i < sibs - 1) moveTo(card, s.list, s.i + 1); else if (li < lists.length - 1) moveTo(card, lists[li + 1], 0); }
        else if (k === 'ArrowLeft' || k === 'ArrowRight') {
          e.preventDefault(); var nl = lists[li + (k === 'ArrowRight' ? 1 : -1)];
          if (nl) moveTo(card, nl, Math.min(s.i, $$('.bd-card', nl).length));
        } else if (k === ' ' || k === 'Enter') {
          e.preventDefault(); card._kb = null; card.classList.remove('is-lifted'); renumber(card.getAttribute('data-id'));
          card.classList.remove('is-moved'); void card.offsetWidth; card.classList.add('is-moved'); say('Scene put down: ' + where(card)); return;
        } else if (k === 'Escape') {
          e.preventDefault(); var h = card._kb.home; card._kb = null; card.classList.remove('is-lifted'); moveTo(card, h.list, h.i); say('Put back: ' + where(card)); card.focus({ preventScroll: true }); return;
        } else return;
        card.focus({ preventScroll: true }); say(where(card));
      });
      card.addEventListener('blur', function () { if (card._kb && !card._moving) { card._kb = null; card.classList.remove('is-lifted'); } });
    });
    renumber();
  })();

  /* ==========================================================================
     5. Threads and margin notes
     ========================================================================== */
  (function notes() {
    var demo = $('#nt-demo'), box = $('#nt-pagebox'), margin = $('#nt-margin');
    if (!box) return;
    var sheet = $('#nt-sheet'), plant = $('#nt-plant'), payoff = $('#nt-payoff'), rows = $('#nt-rows');
    var rPlant = $('.nt-row[data-k="plant"]', rows), rPay = $('.nt-row[data-k="payoff"]', rows);
    var kPlant = $('.nt-knot', rPlant), kPay = $('.nt-knot', rPay);
    var notes = $$('.nt-note', margin), washes = { nell: $('#nt-wash-nell'), jo: $('#nt-wash-jo') };
    var settledBtn = $('#nt-settled'), settled = [];
    var texts = { plant: $('.tx', plant).textContent, payoff: $('.tx', payoff).textContent };
    var said = {}; notes.forEach(function (n) { said[n.getAttribute('data-who')] = $('.nt-said', n).textContent; });

    function layout() {
      var wide = getComputedStyle(margin).position === 'absolute';
      var mr = margin.getBoundingClientRect(), floor = 0;
      notes.forEach(function (n) {
        if (!wide) { n.style.top = ''; return; }
        if (n.hidden || n.classList.contains('is-settled')) return;
        var a = document.getElementById(n.getAttribute('data-anchor'));
        var top = a.getBoundingClientRect().top - mr.top - 2;
        top = Math.max(top, floor);
        n.style.top = top + 'px';
        floor = top + n.offsetHeight + 6;
      });
      box.style.minHeight = '';
      if (wide) {
        var need = Math.ceil(mr.top - box.getBoundingClientRect().top + floor + 16);
        if (need > box.offsetHeight) box.style.minHeight = need + 'px';
      }
    }
    if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(box);
    window.addEventListener('resize', layout);
    margin.classList.add('is-aligned');

    function sentences(on) { $$('.nt-t small', rows).forEach(function (s) { s.style.opacity = on ? '' : '0'; }); }
    function count() {
      if (!settled.length) { settledBtn.hidden = true; return; }
      settledBtn.hidden = false; settledBtn.textContent = settled.length + ' settled · Put back';
    }
    margin.addEventListener('click', function (e) {
      tame(pl);
      var line = e.target.closest('.nt-line'), note = e.target.closest('.nt-note');
      if (line && note) {
        var card = $('.nt-card', note), openNow = card.hidden;
        card.hidden = !openNow; line.setAttribute('aria-expanded', openNow); layout(); return;
      }
      var b = e.target.closest('[data-act]');
      if (b && note) {
        var who = note.getAttribute('data-who');
        if (b.getAttribute('data-act') === 'close') { $('.nt-card', note).hidden = true; $('.nt-line', note).setAttribute('aria-expanded', 'false'); layout(); $('.nt-line', note).focus(); }
        else {
          note.classList.add('is-settled'); washes[who].classList.add('is-off'); $('.nt-card', note).hidden = true;
          $('.nt-line', note).setAttribute('aria-expanded', 'false');
          settled.push(note); count(); layout();
        }
      }
    });
    settledBtn.addEventListener('click', function () {
      tame(pl);
      settled.forEach(function (n) { n.classList.remove('is-settled'); washes[n.getAttribute('data-who')].classList.remove('is-off'); });
      settled = []; count(); layout();
    });
    notes.forEach(function (n) {
      var form = $('.nt-form', n), input = $('input', form), reply = $('.nt-reply', n);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim(); if (!v) return;
        $('span', reply).textContent = v; reply.hidden = false; input.value = ''; layout();
      });
    });

    var shelfRows = ['plant', 'payoff', 'gag', 'beat'];
    function shelf(after, typed) {
      var el = $('.nt-shelf', sheet);
      if (!el) { el = document.createElement('div'); el.className = 'nt-shelf'; after.parentNode.insertBefore(el, after.nextSibling); }
      var list = shelfRows.filter(function (r) { return r.indexOf(typed) === 0; });
      el.innerHTML = list.map(function (r, i) { return '<div class="' + (i === 0 ? 'lit' : '') + '"><span class="ey">' + (i === 0 ? 'Thread' : '') + '</span><span><span class="w">' + r + '</span></span></div>'; }).join('');
      return el;
    }
    function unshelf() { var el = $('.nt-shelf', sheet); if (el) el.parentNode.removeChild(el); }

    function settle() {
      unshelf();
      [plant, payoff].forEach(function (l) { l.hidden = false; });
      $('.tx', plant).textContent = texts.plant; $('.tx', payoff).textContent = texts.payoff;
      kPlant.classList.add('is-open'); kPay.classList.add('is-filled'); rPlant.classList.remove('is-undrawn'); sentences(true);
      notes.forEach(function (n) { n.hidden = false; $('.nt-said', n).textContent = said[n.getAttribute('data-who')]; });
      washes.nell.classList.remove('is-off'); washes.jo.classList.remove('is-off');
      layout();
    }
    function reset() {
      settled = []; count();
      notes.forEach(function (n) { n.classList.remove('is-settled'); n.hidden = true; $('.nt-card', n).hidden = true; $('.nt-line', n).setAttribute('aria-expanded', 'false'); });
      plant.hidden = true; payoff.hidden = true; $('.tx', plant).textContent = ''; $('.tx', payoff).textContent = '';
      kPlant.classList.remove('is-open'); kPay.classList.remove('is-filled'); rPlant.classList.add('is-undrawn'); sentences(false);
      washes.nell.classList.add('is-off'); washes.jo.classList.add('is-off');
      layout();
    }
    async function typeTo(c, el, text, speed) { var ok = await c.type(el, text, { speed: speed, caret: true }); layout(); return ok; }
    async function play(c) {
      if (!(await c.sleep(700))) return;
      plant.hidden = false; var tx = $('.tx', plant);
      if (!(await typeTo(c, tx, '{{pl', 120))) return;
      var typed = 'pl'; shelf(plant, typed); layout();
      if (!(await c.sleep(1100))) return;
      unshelf();
      if (!(await typeTo(c, tx, '{{plant: the lighter}}', 30))) return;
      kPlant.classList.add('is-open'); sentences(true); $$('.nt-t small', rows)[1].style.opacity = '0';
      if (!(await c.sleep(1000))) return;
      payoff.hidden = false;
      if (!(await typeTo(c, $('.tx', payoff), texts.payoff, 26))) return;
      kPay.classList.add('is-filled'); rPlant.classList.remove('is-undrawn'); sentences(true);
      if (!(await c.sleep(1200))) return;
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i], who = n.getAttribute('data-who'), s = $('.nt-said', n);
        n.hidden = false; s.textContent = ''; washes[who].classList.remove('is-off'); layout();
        if (!(await c.sleep(450))) return;
        if (!(await typeTo(c, s, said[who], 22))) return;
        if (!(await c.sleep(600))) return;
      }
      layout();
    }
    var pl = MS.player($('#nt-demo'), { replay: '#nt-replay', threshold: .25, delay: 500, reset: reset, settle: settle, play: play });
    layout();
  })();

  /* ==========================================================================
     6. Lenses
     ========================================================================== */
  (function lenses() {
    var win = $('#ls-win'); if (!win) return;
    var btns = $$('#ls-seg [data-lens]'), tool = $('#ls-tool');
    var hl = $('#ls-hl'), run = $('#ls-run'), hint = $('#ls-runhint');
    var mine = $$('#ls-sheet [data-who="may"]:not(.sc-cue)');
    function setLens(l) {
      win.setAttribute('data-lens', l);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lens') === l); });
      tool.textContent = l === 'actor' ? 'Actor, May' : l[0].toUpperCase() + l.slice(1);
      if (l !== 'actor') setRun(false);
    }
    function setRun(on) {
      win.setAttribute('data-run', on ? 'on' : 'off'); run.setAttribute('aria-pressed', on); run.classList.toggle('on', on);
      mine.forEach(function (m) {
        m.classList.remove('is-shown');
        if (on) { m.setAttribute('tabindex', '0'); m.setAttribute('role', 'button'); m.setAttribute('aria-label', 'Show the line'); }
        else { m.removeAttribute('tabindex'); m.removeAttribute('role'); m.removeAttribute('aria-label'); }
      });
      hint.textContent = on ? 'Your lines are covered. Press a blank for the line.' : 'Your lines in ink, the rest stepped back.';
    }
    function setHl(on) { win.setAttribute('data-hl', on ? 'on' : 'off'); hl.setAttribute('aria-pressed', on); hl.classList.toggle('on', on); }
    btns.forEach(function (b) { b.addEventListener('click', function () { tame(pl); setLens(b.getAttribute('data-lens')); }); });
    hl.addEventListener('click', function () { setHl(hl.getAttribute('aria-pressed') !== 'true'); });
    run.addEventListener('click', function () { setRun(run.getAttribute('aria-pressed') !== 'true'); });
    mine.forEach(function (m) {
      function flip() { if (win.getAttribute('data-run') === 'on') m.classList.toggle('is-shown'); }
      m.addEventListener('click', flip);
      m.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
    });
    function settle() { setHl(true); setRun(false); setLens('writer'); }
    var pl = MS.player($('#ls-demo'), {
      threshold: .3, delay: 700, settle: settle, reset: settle,
      play: async function (c) {
        if (!(await c.sleep(1400))) return;
        setLens('director'); if (!(await c.sleep(3300))) return;
        setLens('actor'); if (!(await c.sleep(2500))) return;
        setRun(true); if (!(await c.sleep(1800))) return;
        mine[0].classList.add('is-shown'); if (!(await c.sleep(1400))) return;
        settle();
      }
    });
    settle();
  })();

  /* ==========================================================================
     7. Revisions and production reports
     ========================================================================== */
  (function revisions() {
    var stack = $('#rv-stack'); if (!stack) return;
    var NAMES = ['white', 'blue', 'pink', 'yellow', 'green', 'goldenrod', 'buff', 'salmon', 'cherry', 'tan', 'ivory'];
    var sheet = $('#rv-sheet'), pill = $('#rv-pill'), pillText = $('#rv-pilltext'), passes = $$('#rv-passes .pass'), rpPass = $('#rp-pass'), head = $('#rv-head');
    var cur = 2;
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function backs() { return $$('.rv-back', stack); }
    function rebuild() {
      backs().forEach(function (b) { b.parentNode.removeChild(b); });
      for (var k = Math.min(4, cur); k >= 1; k--) addBack(NAMES[cur - k], k, false);
    }
    function addBack(name, k, isNew) {
      var b = document.createElement('span'); b.className = 'rv-back' + (isNew ? ' is-new' : ''); b.setAttribute('data-rev', name); b.setAttribute('aria-hidden', 'true');
      b.style.setProperty('--k', k); stack.insertBefore(b, $('.rv-wrap', stack));
    }
    function paint(i) {
      sheet.setAttribute('data-rev', NAMES[i]); pill.setAttribute('data-rev', NAMES[i]);
      pillText.textContent = cap(NAMES[i]) + ' · 1 Oct 2026 · 3 changed pages';
      rpPass.textContent = cap(NAMES[i]);
      if (head) head.textContent = i === 0 ? 'White draft' : cap(NAMES[i]) + ' revision \u00B7 1 Oct 2026';
      passes.forEach(function (p, j) { p.setAttribute('aria-pressed', j === i); });
    }
    function setPass(i) {
      var prev = cur; cur = i;
      if (i === prev + 1) {
        backs().forEach(function (b) { var k = +b.style.getPropertyValue('--k') + 1; if (k > 4) b.parentNode.removeChild(b); else b.style.setProperty('--k', k); });
        addBack(NAMES[prev], 1, true);
      } else rebuild();
      paint(i);
    }
    passes.forEach(function (p, j) { p.addEventListener('click', function () { tame(pl); setPass(j); }); });
    $('#rv-next').addEventListener('click', function () { tame(pl); setPass((cur + 1) % NAMES.length); });
    var strip = $('#rp-strip'), rp = $('#rp');
    strip.addEventListener('click', function () { var on = strip.getAttribute('aria-pressed') !== 'true'; strip.setAttribute('aria-pressed', on); rp.classList.toggle('is-strip', on); });
    function settle() { cur = 2; rebuild(); paint(2); }
    var pl = MS.player($('#rv-demo'), {
      threshold: .3, delay: 600, settle: settle,
      reset: function () { cur = 0; rebuild(); paint(0); },
      play: async function (c) {
        if (!(await c.sleep(1100))) return;
        setPass(1); if (!(await c.sleep(1000))) return;
        setPass(2);
      }
    });
    settle();
  })();

  /* ==========================================================================
     8. Share
     ========================================================================== */
  (function share() {
    var demo = $('#sh-demo'); if (!demo) return;
    var files = {}; $$('.sh-file', demo).forEach(function (f) { files[f.getAttribute('data-file')] = f; });
    function drop(f) { f.style.visibility = ''; f.classList.remove('is-drop'); void f.offsetWidth; f.classList.add('is-drop'); }
    $$('.sh-row--go', demo).forEach(function (b) {
      b.addEventListener('click', function () { tame(pl); drop(files[b.getAttribute('data-file')]); });
    });
    function settle() { Object.keys(files).forEach(function (k) { files[k].style.visibility = ''; files[k].classList.remove('is-drop'); }); }
    var pl = MS.player(demo, {
      replay: '#sh-replay', threshold: .35, delay: 600, settle: settle,
      reset: function () { Object.keys(files).forEach(function (k) { files[k].classList.remove('is-drop'); files[k].style.visibility = 'hidden'; }); },
      play: async function (c) {
        var seq = ['pdf', 'fdx', 'fountain'];
        for (var i = 0; i < seq.length; i++) {
          if (!(await c.sleep(i ? 650 : 900))) return;
          drop(files[seq[i]]);
        }
      }
    });
  })();

  /* ==========================================================================
     9. The smaller things
     ========================================================================== */
  (function minis() {
    /* Read a PDF: their sheet, or the reading page */
    var pdf = $('.mi-pdf'), flip = $('.mi-flip');
    if (pdf && flip) {
      var scrawl = $$('.mi-pdf__scrawl path', pdf);
      function view(v) {
        pdf.setAttribute('data-view', v); flip.setAttribute('aria-pressed', v === 'theirs');
        flip.textContent = v === 'theirs' ? 'Back to reading' : 'Their own page';
        if (v === 'theirs') scrawl.forEach(function (p) { anim(p, [{ strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDasharray: 1, strokeDashoffset: 0 }], { duration: 900, delay: 200, easing: GLIDE, fill: 'backwards' }); });
      }
      flip.addEventListener('click', function () { tame(plPdf); view(pdf.getAttribute('data-view') === 'theirs' ? 'read' : 'theirs'); });
      var plPdf = MS.player($('#mi-pdf'), {
        threshold: .5, delay: 900, settle: function () { view('read'); },
        play: async function (c) { if (!(await c.sleep(700))) return; view('theirs'); if (!(await c.sleep(2400))) return; view('read'); }
      });
    }

    /* Dictate: the table-read phrase, the page's answer */
    var dict = $('.mi-dict');
    if (dict) {
      var said = $('#mi-said-t'), made = $('#mi-made'), sTxt = said.textContent, mTxt = made.textContent;
      MS.player($('#mi-dict'), {
        replay: '#mi-dict-replay', threshold: .5, delay: 700,
        reset: function () { said.textContent = ''; made.textContent = ''; },
        settle: function () { dict.classList.remove('is-live'); said.textContent = sTxt; made.textContent = mTxt; },
        play: async function (c) {
          dict.classList.add('is-live');
          if (!(await c.type(said, 'Scene. Interior kitchen morning.', { speed: 52, caret: false }))) return;
          dict.classList.remove('is-live');
          if (!(await c.sleep(450))) return;
          if (!(await c.type(made, 'int. kitchen - morning', { speed: 28, caret: false }))) return;
          made.textContent = mTxt;
        }
      });
    }

    /* Sprints: three wooden taps, on press only */
    var tapBtn = $('#mi-tap'), spr = $('.mi-sprint'), AC = null;
    if (tapBtn) {
      tapBtn.addEventListener('click', function () {
        spr.classList.remove('is-tap'); void spr.offsetWidth; spr.classList.add('is-tap');
        try {
          var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
          AC = AC || new C(); if (AC.state === 'suspended') AC.resume();
          [[0, 293.66], [.28, 220], [.56, 146.83]].forEach(function (t) { tap(AC.currentTime + .03 + t[0], t[1]); });
        } catch (e) {}
      });
    }
    function tap(t, f) {
      var o = AC.createOscillator(), g = AC.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .96, t + .2);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + .25);
      var n = AC.createBufferSource(), len = Math.floor(AC.sampleRate * .03), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      n.buffer = buf; var ng = AC.createGain(); ng.gain.value = .22; n.connect(ng); ng.connect(AC.destination); n.start(t);
    }

    /* Pencil: the underline, the circle, the note in the margin */
    var pen = $('.mi-pencil');
    if (pen) {
      var ul = $('.mi-ink__ul', pen), ring = $('.mi-ink__ring', pen), handNote = $('.mi-hand', pen), running = [];
      function clear() { running.forEach(function (a) { try { a.cancel(); } catch (e) {} }); running = []; [ul, ring].forEach(function (p) { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }); handNote.style.opacity = ''; }
      MS.player($('#mi-pencil'), {
        replay: '#mi-pencil-replay', threshold: .5, delay: 700, settle: clear,
        reset: function () { [ul, ring].forEach(function (p) { p.style.strokeDasharray = 1; p.style.strokeDashoffset = 1; }); handNote.style.opacity = '0'; },
        play: async function (c) {
          if (!(await c.sleep(500))) return;
          var a = anim(ul, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 700, easing: GLIDE, fill: 'forwards' }); if (a) running.push(a);
          if (!(await c.sleep(900))) return;
          var b = anim(ring, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 650, easing: GLIDE, fill: 'forwards' }); if (b) running.push(b);
          if (!(await c.sleep(750))) return;
          var d = anim(handNote, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' }); if (d) running.push(d);
          if (!(await c.sleep(600))) return;
          clear();
        }
      });
    }

    /* Settings: the Icons choice moves the rail; the switches do what they say */
    var setWin = $('#mi-set-win'), setPage = $('#mi-set-page');
    if (setWin) {
      var icons = $$('#mi-set-icons button');
      icons.forEach(function (b) {
        b.addEventListener('click', function () {
          var w = b.getAttribute('data-icons');
          MS.transition(function () {
            setWin.classList.toggle('win--rail-r', w === 'right');
            setWin.classList.toggle('win--rail-t', w === 'top');
            icons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          });
        });
      });
      $$('.tg', setWin).forEach(function (t) {
        t.addEventListener('click', function () {
          var on = t.getAttribute('aria-checked') !== 'true';
          t.setAttribute('aria-checked', String(on));
          if (setPage) setPage.setAttribute('data-' + t.getAttribute('data-set'), on ? '1' : '0');
        });
      });
    }

    /* Thirteen papers: pick one, the page takes it (not remembered) */
    var sws = $$('#mi-sw .sw');
    function pressed() { var cur = MS.paper.get(); sws.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-paper') === cur); }); }
    sws.forEach(function (b) {
      b.addEventListener('click', function () {
        var same = b.getAttribute('aria-pressed') === 'true';
        MS.paper.set(same ? 'white' : b.getAttribute('data-paper'), false);
        pressed();
      });
    });
    pressed();
  })();
})();

/* Home, section 1: the drafts demo. A Mac window with the Drafts panel, a page that writes
   itself, a graph you can press or drag the dot along, Compare (the split) and History.
   The static HTML in index.html is the finished state; this file only adds. */
(function (root) {
  'use strict';

  /* ---- the model: a sample script's drafts ---------------------------------------------- */
  var BASE = [
    { id: 's', name: 'The Lighter', parent: null, tom: 'I did.', pill: '' },
    { id: 'd2', name: 'Draft 2', parent: 's', tom: 'I kept everything.', pill: 'from The Lighter' },
    { id: 'd3', name: 'Draft 3', parent: 's', tom: 'I did. Ask me why.', pill: 'from The Lighter' }
  ];
  var D3A = { id: 'd3a', name: 'Draft 3a', parent: 'd3', tom: 'I did. It’s yours.', pill: 'from Draft 3' };
  var TRIES = ['I did. It’s yours.', 'I did. I’d do it again.', 'I did. Light it.', 'I kept it for you.', 'Every night.'];
  var ACT = 'Rain on the window. TOM sets a brass lighter on the bar and does not look at it.';
  var MAXD = 7;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function find(ds, id) { for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i]; return null; }
  function copy(ds) { return ds.map(function (d) { return { id: d.id, name: d.name, parent: d.parent, tom: d.tom, pill: d.pill }; }); }

  function order(ds) {
    var out = [];
    (function walk(pid, depth) {
      ds.filter(function (d) { return d.parent === pid; }).forEach(function (d) { out.push({ d: d, lane: depth }); walk(d.id, depth + 1); });
    })(null, 0);
    return out;
  }
  function childName(parent, nth) {
    if (parent.parent === null) return 'Draft ' + (2 + nth);
    var base = parent.name.replace('Draft ', '');
    return 'Draft ' + base + (/\d$/.test(base) ? String.fromCharCode(97 + nth) : String(nth + 1));
  }
  function hasRv(ds, d) { var p = d.parent ? find(ds, d.parent) : null; return !!p && p.tom !== d.tom; }

  /* ---- html builders (also run in node to pre-render the static page) --------------------- */
  var H = 26;
  function X(l) { return 8 + 12 * l; }
  function ico(id) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  function graphHTML(ds, openId, newId) {
    var rows = order(ds), n = rows.length, maxLane = 0, byId = {};
    rows.forEach(function (r, i) { r.i = i; r.y = 13 + H * i; byId[r.d.id] = r; if (r.lane > maxLane) maxLane = r.lane; });
    var W = 16 + 12 * maxLane, s = '';
    rows.forEach(function (r) {
      var kids = rows.filter(function (k) { return k.d.parent === r.d.id; });
      if (kids.length) s += '<line class="g-lane" x1="' + X(r.lane) + '" y1="' + r.y + '" x2="' + X(r.lane) + '" y2="' + (kids[kids.length - 1].y - 13) + '"/>';
    });
    rows.forEach(function (r) {
      if (r.d.parent === null) return;
      var p = byId[r.d.parent];
      s += '<path class="g-fork' + (r.d.id === newId ? ' is-new' : '') + '" pathLength="1" d="M' + X(p.lane) + ' ' + (r.y - 13) + ' C' + X(p.lane) + ' ' + (r.y - 6.5) + ' ' + X(r.lane) + ' ' + (r.y - 6.5) + ' ' + X(r.lane) + ' ' + r.y + '"/>';
    });
    rows.forEach(function (r) {
      s += '<circle class="g-dot' + (r.d.id === openId ? ' is-open' : '') + '" data-id="' + r.d.id + '" cx="' + X(r.lane) + '" cy="' + r.y + '" r="3"/>';
    });
    var svg = '<svg class="dr__svg" viewBox="0 0 ' + W + ' ' + (n * H) + '" style="width:' + (W / 10) + 'em;height:' + (n * 2.6) + 'em" aria-hidden="true" focusable="false">' + s + '</svg>';
    var list = rows.map(function (r) {
      var d = r.d, open = d.id === openId, p = d.parent ? find(ds, d.parent) : null;
      var acts = '<span class="dr__acts">' +
        '<button type="button" class="dr__act" data-act="history" aria-label="History of ' + esc(d.name) + '" title="History">' + ico('clock') + '</button>' +
        (ds.length < MAXD ? '<button type="button" class="dr__act" data-act="plus" aria-label="New draft off ' + esc(d.name) + '" title="New draft off ' + esc(d.name) + '">' + ico('plus') + '</button>' : '') +
        (p ? '<button type="button" class="dr__act" data-act="split" aria-label="Split with ' + esc(p.name) + '" title="Split with ' + esc(p.name) + '">' + ico('split') + '</button>' : '') +
        '</span>';
      return '<div class="dr__row' + (open ? ' is-open' : '') + '" data-id="' + d.id + '"><button type="button" class="dr__name" data-open="' + d.id + '"' + (open ? ' aria-current="true"' : '') + '><span class="dr__n">' + esc(d.name) + '</span>' + (d.pill ? '<span class="dr__pill">' + esc(d.pill) + '</span>' : '') + '</button>' + acts + '</div>';
    }).join('');
    var o = byId[openId];
    var knob = '<button type="button" class="dr__knob" role="slider" aria-orientation="vertical" aria-label="Open draft" aria-valuemin="0" aria-valuemax="' + (n - 1) + '" aria-valuenow="' + o.i + '" aria-valuetext="' + esc(o.d.name) + '" style="--kx:' + (X(o.lane) / 10) + 'em;--ky:' + (o.i * 2.6 + 1.3) + 'em"></button>';
    return svg + '<div class="dr__rows" style="margin-left:' + (W / 10) + 'em">' + list + '</div>' + knob;
  }

  function sheetHTML(o) {
    var L = o.lines == null ? 6 : o.lines, id = function (k) { return o.ids ? ' id="hs-' + k + '"' : ''; };
    var h = '<div class="sheet-wrap"><div class="sheet">';
    h += '<div class="sc-slug" data-n="1"' + id('slug') + '>Int. Bar - Night</div>';
    if (L > 1) h += '<div class="sc-act"' + id('act') + '>' + ACT + '</div>';
    if (L > 2) h += '<div class="sc-cue"' + id('c1') + '>May</div>';
    if (L > 3) h += '<div class="sc-dlg"' + id('d1') + '>You kept it.</div>';
    if (L > 4) h += '<div class="sc-cue"' + id('c2') + '>Tom</div>';
    if (L > 5) h += '<div class="sc-dlg' + (o.rv ? ' rv' : '') + (o.wash ? ' wash' : '') + '"' + id('d2') + '>' + esc(o.tom) + '</div>';
    return h + '</div></div>';
  }

  var MOMENTS = [
    { id: 'm1', day: 'Today', t: '14:02', label: 'Sprint, 25 min', lines: 6, tom: null },
    { id: 'm2', day: 'Yesterday', t: '18:30', label: 'Merged from Draft 2a', lines: 6, tom: 'I did.' },
    { id: 'm3', day: 'Mon 28 Sep', t: '16:40', label: 'Kept: the white draft', lines: 4, tom: null },
    { id: 'm4', day: 'Mon 28 Sep', t: '09:00', label: 'The first moment kept', lines: 2, tom: null }
  ];

  function cmpHTML(ds, openId) {
    var d = find(ds, openId), p = d.parent ? find(ds, d.parent) : null, left, right;
    if (p) { left = p; right = d; } else { left = d; right = ds.filter(function (x) { return x.parent === d.id; })[0] || d; }
    var rv = left !== right && left.tom !== right.tom;
    return '<div class="hw__cmp">' +
      '<p class="hw__keys"><span class="keys"><kbd>⌥</kbd><kbd>⌘</kbd><kbd>\\</kbd></span> Split with ' + esc(left.name) + '</p>' +
      '<div class="hw__cmpcol"><p class="hw__name">' + esc(left.name) + '</p>' + sheetHTML({ tom: left.tom }) + '</div>' +
      '<div class="hw__cmpcol"><p class="hw__name is-here">' + ico('pencil') + '<span>' + esc(right.name) + '</span></p>' + sheetHTML({ tom: right.tom, rv: rv, wash: rv }) + '</div></div>';
  }

  function historyHTML(ds, openId, moments, picked, extra) {
    var d = find(ds, openId), days = [], byDay = {};
    moments.forEach(function (m) { if (!byDay[m.day]) { byDay[m.day] = []; days.push(m.day); } byDay[m.day].push(m); });
    var pm = null; moments.forEach(function (m) { if (m.id === picked) pm = m; });
    var panel = '<aside class="hw__panel" aria-label="History">' +
      '<div class="hw__ptitle"><button class="hw__h2" type="button" data-view="branch">Drafts</button><h3 class="hw__h">History</h3></div>' +
      '<div class="app-card hx__lead"><p class="app-eyebrow">' + ico('clock') + ' History · ' + esc(d.name) + ' · ' + moments.length + ' moments</p><p class="hx__title">Every moment kept</p></div>' +
      days.map(function (day) {
        return '<div class="app-card hx__day"><p class="app-eyebrow">' + esc(day) + '</p>' + byDay[day].map(function (m) {
          return '<button type="button" class="hx__m' + (m.id === picked ? ' is-on' : '') + '" data-m="' + m.id + '"><time>' + m.t + '</time><i aria-hidden="true"></i><span>' + esc(m.label) + '</span></button>';
        }).join('') + '</div>';
      }).join('') +
      (pm ? '<div class="app-card hx__put"><p class="app-eyebrow">Put back · ' + esc(pm.day.toLowerCase()) + ' ' + pm.t + '</p><p class="hx__title">' + esc(pm.label) + '</p><p class="hx__txt">The script, the cards, the notes and the ink all come back as they were. Today is kept first, so this can be undone.</p><div class="hx__btns"><button type="button" class="ctl is-solid" data-act="putback">Put back</button><button type="button" class="ctl" data-act="notnow">Not now</button></div></div>' : '') +
      (extra ? '<p class="hw__hint">' + esc(extra) + '</p>' : '') + '</aside>';
    var m = pm || moments[0];
    var tom = m.tom == null ? d.tom : m.tom;
    var page = '<div class="hw__page"><p class="hw__name"><span>Looking at · ' + esc(m.day.toLowerCase()) + ' ' + m.t + ' · ' + esc(m.label) + '</span></p>' + sheetHTML({ lines: m.lines, tom: tom }) + '</div>';
    return panel + page;
  }

  var api = { graphHTML: graphHTML, sheetHTML: sheetHTML, BASE: BASE, D3A: D3A };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof document === 'undefined') return;

  /* ---- the browser side -------------------------------------------------------------------- */
  var MS = root.MarginSite;
  if (!MS) return;
  var $ = MS.$;
  var hero = $('#hero'), hw = $('#hw');
  if (!hero || !hw) return;

  var drafts = copy(BASE).concat([copy([D3A])[0]]), open = 'd3a', view = 'branch', picked = null, moments = MOMENTS.slice(), tries = 1, playing = false, notice = '';
  var dr = $('#dr-body'), sheetBox = $('#hw-sheet'), nameEl = $('#hw-name'), hint = $('#hw-hint');
  var seg = $('#hero-seg'), replay = $('#hero-replay');
  var knob = null, rowsEl = null, dragging = false;
  var panes = { branch: $('#pane-branch'), compare: $('#pane-compare'), history: $('#pane-history') };

  function emPx() { return parseFloat(getComputedStyle(dr).fontSize) || 16; }
  function cur() { return find(drafts, open); }

  function renderGraph(newId) {
    dr.innerHTML = graphHTML(drafts, open, newId);
    knob = $('.dr__knob', dr); rowsEl = $('.dr__rows', dr);
  }
  function renderSheet() {
    var d = cur();
    sheetBox.innerHTML = sheetHTML({ ids: true, tom: d.tom, rv: hasRv(drafts, d) });
    nameEl.innerHTML = '<span>' + esc(d.name) + '</span>';
  }
  function renderBranch(newId) { renderGraph(newId); renderSheet(); hint.textContent = drafts.length >= MAXD ? 'That is plenty. Replay to start again.' : 'Press a draft, or drag the dot.'; hint.hidden = drafts.length < MAXD; }

  function setOpen(id, o) {
    o = o || {};
    open = id;
    var rows = order(drafts), idx = 0, lane = 0;
    rows.forEach(function (r, i) { if (r.d.id === id) { idx = i; lane = r.lane; } });
    MS.$$('.dr__row', dr).forEach(function (r) {
      var on = r.getAttribute('data-id') === id;
      r.classList.toggle('is-open', on);
      var b = $('.dr__name', r); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    MS.$$('.g-dot', dr).forEach(function (c) { c.classList.toggle('is-open', c.getAttribute('data-id') === id); });
    knob.setAttribute('aria-valuenow', idx); knob.setAttribute('aria-valuetext', cur().name);
    knob.style.setProperty('--kx', ((8 + 12 * lane) / 10) + 'em');
    if (!o.keepKnobY) knob.style.setProperty('--ky', (idx * 2.6 + 1.3) + 'em');
    renderSheet();
  }

  function setView(v) {
    view = v; hw.setAttribute('data-view', v);
    MS.$$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false'); });
    Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== v; });
    if (v === 'compare') panes.compare.innerHTML = cmpHTML(drafts, open);
    if (v === 'history') { picked = null; notice = ''; panes.history.innerHTML = historyHTML(drafts, open, moments, picked, notice); }
    if (v === 'branch') { renderBranch(); }
  }

  function addDraft(fromId, text) {
    var p = find(drafts, fromId), nth = drafts.filter(function (d) { return d.parent === fromId; }).length;
    var d = { id: 'n' + drafts.length + fromId, name: childName(p, nth), parent: fromId, tom: text, pill: 'from ' + p.name };
    drafts.push(d); open = d.id;
    return d;
  }

  /* ---- interactions ------------------------------------------------------------------------------ */
  function stopAuto() { hw.classList.add('is-used'); if (playing) { playing = false; player.settle(); } }

  hero.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-act],[data-view],[data-m]');
    if (!t || !hero.contains(t)) return;
    stopAuto();
    if (t.hasAttribute('data-view')) { setView(t.getAttribute('data-view')); return; }
    if (t.hasAttribute('data-open')) { setOpen(t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-m')) { picked = t.getAttribute('data-m'); panes.history.innerHTML = historyHTML(drafts, open, moments, picked, notice); return; }
    var a = t.getAttribute('data-act');
    if (a === 'history') setView('history');
    else if (a === 'split') setView('compare');
    else if (a === 'plus') {
      var rowId = t.closest('.dr__row').getAttribute('data-id');
      var text = TRIES[tries % TRIES.length]; tries++;
      addDraft(rowId, text); renderBranch(open);
    } else if (a === 'putback') {
      var m = null; moments.forEach(function (x) { if (x.id === picked) m = x; });
      if (m) {
        var d = cur(), before = d.tom;
        moments.unshift({ id: 'k' + moments.length, day: 'Today', t: '14:09', label: 'Kept before putting back', lines: 6, tom: before });
        if (m.tom != null) d.tom = m.tom;
        picked = null; notice = 'Put back. The moment before it is kept too.';
        panes.history.innerHTML = historyHTML(drafts, open, moments, picked, notice);
      }
    } else if (a === 'notnow') { picked = null; panes.history.innerHTML = historyHTML(drafts, open, moments, picked, notice); }
  });

  /* the dot: drag it down the graph, or arrow keys, and the draft under it opens */
  function dragStart(e) {
    var k = e.target.closest('.dr__knob'); if (!k) return;
    stopAuto();
    dragging = true; try { k.setPointerCapture(e.pointerId); } catch (x) {}
    k.classList.add('is-drag'); e.preventDefault();
  }
  function dragMove(e) {
    if (!dragging) return;
    var rows = order(drafts), em = emPx(), r = dr.getBoundingClientRect();
    var y = Math.max(1.3, Math.min((rows.length - 1) * 2.6 + 1.3, (e.clientY - r.top - em * .4) / em));
    knob.style.setProperty('--ky', y + 'em');
    var idx = Math.max(0, Math.min(rows.length - 1, Math.floor(y / 2.6)));
    if (rows[idx].d.id !== open) setOpen(rows[idx].d.id, { keepKnobY: true });
  }
  function dragEnd(e) {
    if (!dragging) return; dragging = false;
    knob.classList.remove('is-drag'); try { knob.releasePointerCapture(e.pointerId); } catch (x) {}
    setOpen(open);
  }
  dr.addEventListener('pointerdown', dragStart);
  dr.addEventListener('pointermove', dragMove);
  dr.addEventListener('pointerup', dragEnd);
  dr.addEventListener('pointercancel', dragEnd);
  dr.addEventListener('keydown', function (e) {
    if (!e.target.classList || !e.target.classList.contains('dr__knob')) return;
    var rows = order(drafts), idx = 0; rows.forEach(function (r, i) { if (r.d.id === open) idx = i; });
    var nx = idx;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nx = idx - 1; else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nx = idx + 1;
    else if (e.key === 'Home') nx = 0; else if (e.key === 'End') nx = rows.length - 1; else return;
    e.preventDefault(); stopAuto();
    nx = Math.max(0, Math.min(rows.length - 1, nx)); setOpen(rows[nx].d.id);
    var k = $('.dr__knob', dr); if (k) k.focus();
  });

  /* ---- the autoplay: the page writes itself, then a draft branches off ----------------------------- */
  function erase(el, c, speed) {
    return new Promise(function (res) {
      var t = el.textContent;
      (function step() {
        if (!c.alive()) { res(false); return; }
        if (!t.length) { res(true); return; }
        t = t.slice(0, -1); el.textContent = t;
        setTimeout(step, Math.min(speed * 0.5, 30));   // held backspace: quick
      })();
    });
  }

  var player = MS.player(hero, {
    delay: 150, threshold: 0.35,
    replay: replay,
    settle: function () {
      playing = false;
      drafts = copy(BASE).concat([copy([D3A])[0]]); open = 'd3a'; tries = 1; moments = MOMENTS.slice();
      setView('branch');
    },
    reset: function () {
      playing = true; hw.classList.remove('is-used');
      drafts = copy(BASE); open = 'd3'; tries = 1; moments = MOMENTS.slice();
      setView('branch');
      hint.textContent = ''; hint.hidden = true;
    },
    play: async function (c) {
      function el(k) { return $('#hs-' + k); }
      // the first frame is the whole page; press the plus on the open draft and a new one forks off
      if (!await c.sleep(1300)) return;
      var plus = $('.dr__row.is-open [data-act="plus"]', dr);
      if (plus) { plus.classList.add('is-press'); if (!await c.sleep(420)) return; plus.classList.remove('is-press'); }
      addDraft('d3', D3A.tom); var born = open; renderGraph(open);
      nameEl.innerHTML = '<span>' + esc(cur().name) + '</span>';
      if (!await c.sleep(650)) return;
      var d2 = el('d2');
      if (!await erase(d2, c, 22)) return;
      d2.classList.add('raw');
      d2.classList.remove('rv');
      if (!await c.type(d2, D3A.tom, { speed: 40 })) return;
      d2.classList.remove('raw'); d2.classList.add('rv');
      // the dot goes up the graph to Draft 2 and comes back: it is a handle, and it opens what it lands on
      if (!await c.sleep(900)) return;
      setOpen('d2'); if (!await c.sleep(1400)) return;
      setOpen('d3'); if (!await c.sleep(1100)) return;
      setOpen(born);
      hint.textContent = 'Press a draft, or drag the dot.'; hint.hidden = true;
      playing = false;
    }
  });

  // the controls only exist with JS
  seg.hidden = false; replay.hidden = false;
  MS.$$('.hw__h2', hw).forEach(function (b) { b.hidden = false; });
  hero.classList.add('is-live');
  setView('branch');
})(typeof window !== 'undefined' ? window : globalThis);

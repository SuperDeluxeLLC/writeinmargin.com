/* Margin site: novel.js
   The novel page's demos. Each reads its finished state from the HTML (so it reads with JS off),
   blanks and replays it once when it scrolls into view, and has a Replay or a control of its own.
   MarginSite.player settles every demo at once under reduced motion. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function words(s) { s = (s || '').trim(); return s ? s.split(/\s+/).length : 0; }
  var GLIDE = 'cubic-bezier(.4,0,.2,1)';
  // run fn(0..1) over ms; resolves true when it finished, false when ok() said stop
  function tween(ms, fn, ok) {
    return new Promise(function (res) {
      var t0 = null;
      function step(t) {
        if (ok && !ok()) { res(false); return; }
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        fn(e);
        if (k < 1) requestAnimationFrame(step); else res(true);
      }
      requestAnimationFrame(step);
    });
  }
  function pressGroup(btns, active) {
    btns.forEach(function (b) {
      var on = b === active;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
  }

  /* ---- hero: a chapter that numbers itself and counts its words ---------------------------- */
  (function hero() {
    var demo = $('#hero-demo'); if (!demo) return;
    var page = $('.nv-page', demo), label = $('#hp-label'), title = $('#hp-title'), eq = $('#hp-eq'),
        pov = $('#hp-pov'), when = $('#hp-when'), p1 = $('#hp-p1'), p2 = $('#hp-p2'), sb = $('#hp-sb'),
        p3 = $('#hp-p3'), count = $('#hp-count');
    var T = {}, all = [title, eq, pov, when, p1, p2, p3];
    all.forEach(function (e) { T[e.id] = e.textContent; });
    var body = [p1, p2, p3];
    var final = body.reduce(function (a, e) { return a + words(T[e.id]); }, 0);
    function setCount(n) { count.innerHTML = 'ch. 1 &middot; ' + n + ' words'; }
    function settle() {
      all.forEach(function (e) { e.textContent = T[e.id]; });
      label.style.visibility = ''; sb.style.visibility = ''; sb.classList.remove('is-raw'); sb.textContent = '* * *';
      page.style.minHeight = ''; setCount(final);
    }
    function reset() {
      page.style.minHeight = page.offsetHeight + 'px';
      all.forEach(function (e) { e.textContent = ''; });
      label.style.visibility = 'hidden'; sb.style.visibility = 'hidden'; sb.textContent = '* * *'; setCount(0);
    }
    async function play(c) {
      var base = 0;
      if (!(await c.sleep(300))) return;
      if (!(await c.type(title, T['hp-title'], { speed: 70, onChar: function (i) { if (i === 1) label.style.visibility = ''; } }))) return;
      await c.sleep(250);
      if (!(await c.type(eq, T['hp-eq'], { speed: 14 }))) return;
      if (!(await c.type(pov, T['hp-pov'], { speed: 30 }))) return;
      if (!(await c.type(when, T['hp-when'], { speed: 22 }))) return;
      await c.sleep(200);
      for (var i = 0; i < body.length; i++) {
        var el = body[i], t = T[el.id], b = base;
        if (i === 2) {
          sb.style.visibility = ''; sb.classList.add('is-raw');
          if (!(await c.type(sb, '***', { speed: 120, caret: false }))) return;
          await c.sleep(450); sb.classList.remove('is-raw'); sb.textContent = '* * *'; await c.sleep(300);
        }
        if (!(await c.type(el, t, { speed: 24, onChar: function (n) { setCount(b + words(t.slice(0, n))); } }))) return;
        base += words(t);
        if (!(await c.sleep(250))) return;
      }
      settle();
    }
    MS.player(demo, { replay: '#hero-replay', reset: reset, settle: settle, play: play, threshold: .3, delay: 500 });
  })();

  /* ---- 1. chapters in parts: pick one up and put it down ---------------------------------- */
  (function board() {
    var root = $('#nv-board'); if (!root) return;
    var lists = $$('.nv-chs', root), status = $('#board-status'), live = $('#board-live');
    var orig = lists.map(function (l) { return Array.prototype.slice.call(l.children); });
    var st = null, down = null, touched = false;
    function rows() { return $$('.nv-ch', root); }
    function parts() { return $$('.nv-part', root); }
    function say(s) { live.textContent = s; }
    function total() { return rows().reduce(function (a, r) { return a + (+r.dataset.w); }, 0); }
    function setStatus(r) { status.innerHTML = 'ch. ' + r.dataset.n + ' &middot; ' + fmt(total()) + ' words'; }
    function renumber() {
      rows().forEach(function (r, i) { r.setAttribute('data-n', i + 1); $('.nv-num', r).textContent = i + 1; });
      parts().forEach(function (p) {
        var rs = $$('.nv-ch', p), w = 0;
        rs.forEach(function (r) { w += +r.dataset.w; });
        $('.nv-part__n', p).innerHTML = rs.length + ' chapters &middot; ' + fmt(w) + ' words';
      });
    }
    function flip(fn, except) {
      var rs = rows().filter(function (r) { return r !== except; });
      var before = rs.map(function (r) { return r.getBoundingClientRect(); });
      fn();
      if (MS.reduced || !rs[0] || !rs[0].animate) return;
      rs.forEach(function (r, i) {
        var a = r.getBoundingClientRect(), dx = before[i].left - a.left, dy = before[i].top - a.top;
        if (dx || dy) r.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 280, easing: GLIDE });
      });
    }
    function place(row, list, ref) {
      if (row.parentNode === list && row.nextElementSibling === ref) return;
      flip(function () { list.insertBefore(row, ref); renumber(); }, row);
    }
    function lift(row, px, py, via) {
      var r = row.getBoundingClientRect();
      st = { row: row, gx: px - r.left, gy: py - r.top, pl: row.parentNode, pn: row.nextElementSibling, via: via || 'pointer' };
      row.classList.add('is-lifted');
    }
    function follow(px, py) {
      var row = st.row; row.style.transform = '';
      var n = row.getBoundingClientRect();
      row.style.transform = 'translate(' + (px - st.gx - n.left) + 'px,' + (py - st.gy - n.top) + 'px)';
    }
    function moveTo(px, py) {
      var best = null, bd = 1e12;
      parts().forEach(function (p) {
        var b = p.getBoundingClientRect();
        var dx = px < b.left ? b.left - px : px > b.right ? px - b.right : 0, dy = py < b.top ? b.top - py : py > b.bottom ? py - b.bottom : 0;
        var d = dx * dx + dy * dy; if (d < bd) { bd = d; best = p; }
      });
      var list = $('.nv-chs', best), ref = null;
      var kids = Array.prototype.filter.call(list.children, function (k) { return k !== st.row; });
      for (var i = 0; i < kids.length; i++) {
        var b = kids[i].getBoundingClientRect();
        if (py < b.top + b.height / 2) { ref = kids[i]; break; }
      }
      place(st.row, list, ref);
      follow(px, py);
    }
    function where(row) { var p = row.closest('.nv-part'); return (p ? $('header b', p).textContent.split(':')[0] : ''); }
    function announce(row) { say('Chapter ' + row.dataset.title + ' is now chapter ' + row.dataset.n + ', in ' + where(row) + '.'); }
    function drop() {
      if (!st) return;
      var row = st.row, from = row.style.transform;
      row.style.transform = ''; row.classList.remove('is-lifted');
      if (from && !MS.reduced && row.animate) row.animate([{ transform: from }, { transform: 'none' }], { duration: 280, easing: GLIDE });
      renumber(); setStatus(row); announce(row); st = null;
    }
    function cancel() {
      if (!st) return;
      var row = st.row; place(row, st.pl, st.pn && st.pn.parentNode === st.pl ? st.pn : null);
      row.style.transform = ''; row.classList.remove('is-lifted'); renumber(); setStatus(row); st = null;
    }
    function restore() {
      cancel();
      lists.forEach(function (l, i) { orig[i].forEach(function (r) { r.style.transform = ''; l.appendChild(r); }); });
      renumber(); setStatus($('.nv-ch[data-title="What the keeper kept"]', root));
    }
    root.addEventListener('pointerdown', function (e) {
      var row = e.target.closest && e.target.closest('.nv-ch');
      if (!row || e.button > 0) return;
      if (e.pointerType === 'touch' && !e.target.closest('.nv-grip')) return;
      if (st) { var s = st; drop(); if (s.row === row) return; }
      touched = true;
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, row: row };
      try { root.setPointerCapture(e.pointerId); } catch (x) {}
    });
    root.addEventListener('pointermove', function (e) {
      if (!down || e.pointerId !== down.id) return;
      if (!st) { if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) < 5) return; lift(down.row, down.x, down.y); }
      moveTo(e.clientX, e.clientY);
    });
    function end(e) {
      if (!down || e.pointerId !== down.id) return;
      try { root.releasePointerCapture(e.pointerId); } catch (x) {}
      down = null; if (st && st.via === 'pointer') drop();
    }
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);
    function kbMove(dir) {
      var row = st.row, list = row.parentNode, idx = lists.indexOf(list);
      if (dir < 0) {
        var prev = row.previousElementSibling;
        if (prev) place(row, list, prev); else if (idx > 0) place(row, lists[idx - 1], null);
      } else {
        var next = row.nextElementSibling;
        if (next) place(row, list, next.nextElementSibling); else if (idx < lists.length - 1) place(row, lists[idx + 1], lists[idx + 1].firstElementChild);
      }
      row.focus(); setStatus(row); announce(row);
    }
    root.addEventListener('keydown', function (e) {
      var row = e.target.closest && e.target.closest('.nv-ch'); if (!row) return;
      if (!st) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault(); touched = true; lift(row, 0, 0, 'kb');
          say('Lifted chapter ' + row.dataset.title + '. Arrow up or down moves it, space drops it, escape puts it back.');
        }
        return;
      }
      if (st.row !== row) return;
      if (e.key === 'ArrowUp') { e.preventDefault(); kbMove(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); kbMove(1); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(); row.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); row.focus(); say('Put back.'); }
    });
    root.addEventListener('focusout', function () {
      setTimeout(function () { if (st && st.via === 'kb' && !root.contains(document.activeElement)) drop(); }, 0);
    });
    async function play(c) {
      touched = false;
      var ok = function () { return c.alive() && !touched; };
      if (!(await c.sleep(700)) || touched) return;
      var row = $('.nv-ch[data-title="What the keeper kept"]', root), target = $('.nv-ch[data-title="Ida’s ledger"]', root);
      var r = row.getBoundingClientRect(), sx = r.left + r.width * .4, sy = r.top + r.height / 2;
      lift(row, sx, sy);
      await tween(1400, function (e) {
        var t = target.getBoundingClientRect(), ex = t.left + t.width * .4, ey = t.top + t.height * .92;
        moveTo(sx + (ex - sx) * e, sy + (ey - sy) * e);
      }, ok);
      if (st && st.row === row && !touched) { await c.sleep(200); if (st && st.row === row) drop(); }
    }
    MS.player(root.closest('.demo'), { replay: '#board-replay', reset: restore, settle: restore, play: play, threshold: .45, delay: 600 });
  })();

  /* ---- 2. whose eyes ---------------------------------------------------------------------- */
  (function eyes() {
    var root = $('#nv-eyes'); if (!root) return;
    var card = $('.nv-eyescard', root), cells = $$('.nv-cell', root), bar = $('#eyes-bar'), whos = $('#eyes-whos'),
        aways = $('#eyes-aways'), live = $('#eyes-live');
    var P = { label: $('#ep-label'), title: $('#ep-title'), pov: $('#ep-pov'), when: $('#ep-when') };
    var NUM = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];
    var NAME = { maren: 'Maren', tobias: 'Tobias', ida: 'Ida' };
    var MONTH = { Mar: 'March', Apr: 'April' };
    var data = cells.map(function (c) { return { n: +c.dataset.n, title: c.dataset.title, who: c.dataset.who, w: +c.dataset.w, when: c.dataset.when }; });
    var told = {}, gap = null, touched = false, here = 7;
    function resetTold() { data.forEach(function (d) { told[d.n] = d.who; }); }
    resetTold();
    function whenFull(s) { return s.replace(/\b(Mar|Apr)\b/, function (m) { return MONTH[m]; }); }
    function show(n, noPov) {
      var d = data[n - 1]; here = n;
      P.label.textContent = 'Chapter ' + NUM[n]; P.title.textContent = d.title;
      if (!noPov) P.pov.textContent = told[n] ? '{{pov: ' + NAME[told[n]] + '}}' : '';
      P.when.textContent = d.when ? '{{when: ' + whenFull(d.when) + '}}' : '';
      cells.forEach(function (c) { c.setAttribute('aria-current', +c.dataset.n === n ? 'true' : 'false'); });
    }
    function pct(share) { var w = Math.round(share * 100); return share > 0 && w === 0 ? '<1%' : w + '%'; }
    function render() {
      var tw = 0, per = { maren: [0, 0], tobias: [0, 0], ida: [0, 0], '': [0, 0] }, order = [], at = {};
      data.forEach(function (d, i) {
        var w = told[d.n] || '';
        cells[i].setAttribute('data-who', w); cells[i].style.setProperty('--who', w ? 'var(--nv-' + w + ')' : 'var(--nv-unsaid)');
        per[w][0]++; per[w][1] += d.w; tw += d.w;
        if (w) { if (order.indexOf(w) < 0) order.push(w); (at[w] = at[w] || []).push(i); }
      });
      $$('i', bar).forEach(function (seg) {
        var k = per[seg.dataset.who];
        seg.hidden = k[0] === 0; seg.style.flexGrow = k[1] || (k[0] ? 1 : 0);
      });
      $$('.nv-who', whos).forEach(function (b) {
        var k = per[b.dataset.who], li = b.parentNode; li.hidden = k[0] === 0;
        $('span', b).innerHTML = (b.dataset.who ? k[0] + ' chapters &middot; ' + fmt(k[1]) + ' words &middot; ' + pct(k[1] / tw) : k[0] + ' chapters &middot; ' + fmt(k[1]) + ' words &middot; ' + pct(k[1] / tw));
      });
      var list = [];
      if (order.length >= 2) {
        order.forEach(function (w) {
          var ix = at[w];
          for (var k = 0; k + 1 < ix.length; k++) {
            var gone = ix[k + 1] - ix[k] - 1;
            if (gone >= 5) list.push({ w: w, from: ix[k] + 2, to: ix[k + 1], chapters: gone, after: k + 1 });
          }
        });
        list.sort(function (a, b) { return b.chapters - a.chapters || a.from - b.from; });
      }
      aways.innerHTML = list.slice(0, 2).map(function (a) {
        var nm = NAME[a.w];
        return '<li><button type="button" class="nv-away" data-from="' + a.from + '" data-to="' + a.to + '" aria-pressed="' + (gap && gap.from === a.from ? 'true' : 'false') + '"><b>' + nm + ' is gone for ' + a.chapters + ' chapters</b><span>Chapters ' + a.from + ' to ' + a.to + ' are told by others, after ' + a.after + ' of ' + nm + '’s.</span></button></li>';
      }).join('') + (list.length > 2 ? '<li class="nv-more">and ' + (list.length - 2) + ' more</li>' : '');
      cells.forEach(function (c) { c.classList.toggle('is-gap', !!gap && +c.dataset.n >= gap.from && +c.dataset.n <= gap.to); });
      if (gap) card.setAttribute('data-gap', ''); else card.removeAttribute('data-gap');
    }
    function setFocus(w) {
      if (w) card.setAttribute('data-focus', w); else card.removeAttribute('data-focus');
      $$('.nv-who', whos).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.who === w && w ? 'true' : 'false'); });
    }
    whos.addEventListener('click', function (e) {
      var b = e.target.closest('.nv-who'); if (!b) return; touched = true;
      var on = b.getAttribute('aria-pressed') !== 'true'; gap = null; setFocus(on ? b.dataset.who : ''); render();
      live.textContent = on ? (NAME[b.dataset.who] || 'Not said') + '’s chapters' : 'All chapters';
    });
    aways.addEventListener('click', function (e) {
      var b = e.target.closest('.nv-away'); if (!b) return; touched = true;
      var from = +b.dataset.from, to = +b.dataset.to, on = !(gap && gap.from === from);
      setFocus(''); gap = on ? { from: from, to: to } : null; render();
      if (on) { show(from); live.textContent = 'Chapters ' + from + ' to ' + to + ' are told by others. Page at chapter ' + from + '.'; }
    });
    $('#eyes-rib', root).addEventListener('click', function (e) {
      var c = e.target.closest('.nv-cell'); if (!c) return; touched = true;
      show(+c.dataset.n); live.textContent = 'Chapter ' + c.dataset.n + ', ' + c.dataset.title + (told[c.dataset.n] ? ', ' + NAME[told[c.dataset.n]] : ', not said');
    });
    function settle() { resetTold(); gap = null; setFocus(''); render(); show(7); }
    function reset() { touched = false; data.forEach(function (d) { told[d.n] = ''; }); gap = null; setFocus(''); render(); show(1); P.pov.textContent = ''; }
    async function play(c) {
      var ok = function () { return c.alive() && !touched; };
      if (!(await c.sleep(500)) || touched) return;
      if (!(await c.type(P.pov, '{{pov: Maren}}', { speed: 60 })) || touched) return;
      await c.sleep(350);
      told[1] = 'maren'; render();
      var done = resetTold; var final = {}; data.forEach(function (d) { final[d.n] = d.who; });
      for (var n = 2; n <= 16; n++) {
        if (!ok()) return;
        await c.sleep(n < 5 ? 520 : 170);
        if (!ok()) return;
        told[n] = final[n]; show(n); render();
      }
      await c.sleep(700); if (!ok()) return;
      show(7);
    }
    MS.player(root.closest('.demo'), { replay: '#eyes-replay', reset: reset, settle: settle, play: play, threshold: .4, delay: 500 });
  })();

  /* ---- 3. the story timeline ------------------------------------------------------------- */
  (function timeline() {
    var root = $('#nv-tl'); if (!root) return;
    var segs = $$('[data-mode]', root.closest('.stage')).filter(function (b) { return b.tagName === 'BUTTON'; });
    var info = $('#tl-info'), blks = $$('.nv-blk[data-n]', root);
    var base = info.textContent, touched = false;
    function setMode(m) { root.setAttribute('data-mode', m); segs.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); }); }
    segs.forEach(function (b) { b.addEventListener('click', function () { touched = true; setMode(b.dataset.mode); }); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.nv-blk[data-n]'); if (!b) return; touched = true;
      blks.forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); });
      info.textContent = b.dataset.info;
    });
    $$('#tl-ooo li').forEach(function (li) {
      var t = $('b', li), orig = t.textContent, btn = $('button', li), ch = li.dataset.ch;
      btn.addEventListener('click', function () {
        var said = li.classList.toggle('is-said');
        t.textContent = said ? 'Chapter ' + ch + ' is a flashback, as you said' : orig;
        btn.textContent = said ? 'Ask again' : 'It’s a flashback';
      });
    });
    $$('#tl-ooo li button').forEach(function (b) { b.addEventListener('click', function () { b.blur(); }); });
    async function play(c) {
      touched = false;
      if (!(await c.sleep(900)) || touched) return;
      setMode('happened');
      if (!(await c.sleep(3200)) || touched) return;
      setMode('told');
    }
    MS.player(root.closest('.demo'), { replay: null, reset: function () { setMode('told'); }, settle: function () { setMode('told'); }, play: play, threshold: .5, delay: 500 });
  })();

  /* ---- 4. bring in a book ----------------------------------------------------------------- */
  (function bring() {
    var root = $('#nv-bring'); if (!root) return;
    var file = $('#bi-file'), counts = $$('[data-count]', root), rows = $$('.nv-found__row', root), mrows = $$('.nv-mrow', root),
        make = $('#bi-make'), touched = false;
    function setCount(i, e) { counts[i].textContent = Math.round(+counts[i].dataset.count * e); }
    function settle() {
      file.classList.remove('is-away');
      counts.forEach(function (b, i) { setCount(i, 1); });
      rows.concat(mrows).forEach(function (r) { r.classList.remove('is-off'); });
    }
    function reset() {
      touched = false; file.classList.add('is-away');
      counts.forEach(function (b, i) { setCount(i, 0); });
      rows.concat(mrows).forEach(function (r) { r.classList.add('is-off'); });
    }
    async function fill(c) {
      for (var i = 0; i < mrows.length; i++) { if (c && !c.alive()) return; mrows[i].classList.remove('is-off'); await MS.sleep(60); }
    }
    async function play(c) {
      if (!(await c.sleep(400))) return;
      file.classList.remove('is-away');
      if (!(await c.sleep(1000))) return;
      for (var i = 0; i < rows.length; i++) {
        rows[i].classList.remove('is-off');
        var k = i;
        if (!(await tween(420, function (e) { setCount(k, e); }, c.alive))) return;
        if (!(await c.sleep(120))) return;
      }
      if (!(await c.sleep(600))) return;
      make.classList.add('is-press');
      if (!(await c.sleep(250))) return;
      make.classList.remove('is-press');
      await fill(c);
    }
    make.addEventListener('click', function () {
      touched = true; mrows.forEach(function (r) { r.classList.add('is-off'); }); fill(null);
    });
    $$('.nv-found__chg .ctl', root).forEach(function (b, i, all) { b.addEventListener('click', function () { pressGroup(all, b); }); });
    MS.player(root.closest('.demo'), { replay: '#bring-replay', reset: reset, settle: settle, play: play, threshold: .4, delay: 400 });
  })();

  /* ---- 5. revision checks ------------------------------------------------------------------ */
  (function revision() {
    var root = $('#nv-rev'); if (!root) return;
    var prose = $('#rev-prose'), items = $$('.nv-checks li', root), next = $('#rev-next');
    var order = ['close', 'yours', 'filter', 'long', 'tags'], idx = -1;
    function marks(ch) { return $$('.mk[data-check="' + ch + '"]', prose); }
    items.forEach(function (li) {
      var g = {}; marks(li.dataset.check).forEach(function (m, i) { g[m.dataset.g || 'm' + i] = 1; });
      $('.nv-n', li).textContent = Object.keys(g).length;
    });
    function clearHere() { $$('.mk.is-here', prose).forEach(function (m) { m.classList.remove('is-here'); }); }
    function setOn(ch, on) {
      prose.classList.toggle('on-' + ch, on);
      var li = items.filter(function (l) { return l.dataset.check === ch; })[0];
      li.classList.toggle('is-off', !on); $('input', li).checked = on;
      if (!on) { clearHere(); idx = -1; }
    }
    items.forEach(function (li) { $('input', li).addEventListener('change', function (e) { touched = true; setOn(li.dataset.check, e.target.checked); }); });
    var touched = false;
    next.addEventListener('click', function () {
      touched = true;
      var seen = {}, list = $$('.mk', prose).filter(function (m) {
        if (!prose.classList.contains('on-' + m.dataset.check)) return false;
        if (m.dataset.g) { if (seen[m.dataset.g]) return false; seen[m.dataset.g] = 1; }
        return true;
      });
      if (!list.length) return;
      clearHere(); idx = (idx + 1) % list.length; list[idx].classList.add('is-here');
    });
    function settle() { order.forEach(function (c) { setOn(c, true); }); }
    function reset() { touched = false; order.forEach(function (c) { setOn(c, false); }); }
    async function play(c) {
      if (!(await c.sleep(600))) return;
      for (var i = 0; i < order.length; i++) {
        if (touched) return;
        setOn(order[i], true);
        if (!(await c.sleep(1000))) return;
      }
    }
    MS.player(root.closest('.demo'), { replay: '#rev-replay', reset: reset, settle: settle, play: play, threshold: .45, delay: 400 });
  })();

  /* ---- 6. paperback interior --------------------------------------------------------------- */
  (function paperback() {
    var root = $('#nv-pb'); if (!root) return;
    var spreads = $$('.nv-spread', root), what = $('#pb-what'), fig = $('#pb-fig'), prev = $('#pb-prev'), nextB = $('#pb-next');
    var LEAD = { charter: 15, iowan: 15, baskerville: 15.5 };
    var S = { w: 5.5, h: 8.5, stock: 'cream', face: 'charter', right: true, heads: true, front: true, back: true, cur: 'b' }, touched = false;
    var chips = { trim: $$('[data-trim]', root), stock: $$('[data-stock]', root).filter(function (b) { return b.tagName === 'BUTTON'; }), face: $$('[data-face]', root).filter(function (b) { return b.tagName === 'BUTTON'; }) };
    function list() {
      return spreads.filter(function (s) {
        var k = s.dataset.sp;
        if (s.classList.contains('sp-front') && !S.front) return false;
        if (s.classList.contains('sp-back') && !S.back) return false;
        if (k === 'd-on' && !S.right) return false;
        if (k === 'd-off' && S.right) return false;
        return true;
      });
    }
    function view() {
      var L = list(), i = -1;
      L.forEach(function (s, n) { if (s.dataset.sp === S.cur) i = n; });
      if (i < 0) { var twin = { 'd-on': 'd-off', 'd-off': 'd-on' }[S.cur]; L.forEach(function (s, n) { if (s.dataset.sp === twin) i = n; }); }
      if (i < 0) { // the page we were on is gone: stay near it
        var all = spreads.map(function (s) { return s.dataset.sp; }), at = all.indexOf(S.cur);
        for (var d = 0; d < all.length && i < 0; d++) {
          [at - d, at + d].forEach(function (a) { if (i < 0 && a >= 0 && a < all.length) { var f = L.map(function (s) { return s.dataset.sp; }).indexOf(all[a]); if (f >= 0) i = f; } });
        }
        if (i < 0) i = 0;
      }
      S.cur = L[i].dataset.sp;
      spreads.forEach(function (s) { s.hidden = s !== L[i]; });
      what.textContent = L[i].dataset.what;
      prev.disabled = i <= 0; nextB.disabled = i >= L.length - 1;
    }
    function layout() {
      var lead = LEAD[S.face];
      root.style.setProperty('--tw', S.w); root.style.setProperty('--th', S.h);
      root.style.setProperty('--lines', Math.floor((S.h - 1.8) * 72 / lead));
      root.setAttribute('data-stock', S.stock); root.setAttribute('data-face', S.face);
      var spine = 312 * (S.stock === 'cream' ? 0.0025 : 0.002252);
      fig.innerHTML = '312 pages &middot; spine ' + spine.toFixed(2) + ' in';
    }
    function setTrim(w, h) { S.w = w; S.h = h; layout(); pressGroup(chips.trim, chips.trim.filter(function (b) { return b.dataset.trim === w + ',' + h; })[0]); }
    function setStock(s) { S.stock = s; layout(); pressGroup(chips.stock, chips.stock.filter(function (b) { return b.dataset.stock === s; })[0]); }
    function setFace(f) { S.face = f; layout(); pressGroup(chips.face, chips.face.filter(function (b) { return b.dataset.face === f; })[0]); }
    function setSw(k, on) {
      S[k] = on; root.setAttribute('data-' + k, on ? 'on' : 'off');
      var inp = $('[data-sw="' + k + '"]', root); if (inp) inp.checked = on; view();
    }
    function step(d) { var L = list(), i = L.map(function (s) { return s.dataset.sp; }).indexOf(S.cur); i = Math.max(0, Math.min(L.length - 1, i + d)); S.cur = L[i].dataset.sp; view(); }
    chips.trim.forEach(function (b) { b.addEventListener('click', function () { touched = true; var p = b.dataset.trim.split(','); setTrim(+p[0], +p[1]); }); });
    chips.stock.forEach(function (b) { b.addEventListener('click', function () { touched = true; setStock(b.dataset.stock); }); });
    chips.face.forEach(function (b) { b.addEventListener('click', function () { touched = true; setFace(b.dataset.face); }); });
    $$('[data-sw]', root).forEach(function (i) { i.addEventListener('change', function () { touched = true; setSw(i.dataset.sw, i.checked); }); });
    prev.addEventListener('click', function () { touched = true; step(-1); });
    nextB.addEventListener('click', function () { touched = true; step(1); });
    function settle() { S.cur = 'b'; setTrim(5.5, 8.5); setStock('cream'); setFace('charter'); ['right', 'heads', 'front', 'back'].forEach(function (k) { setSw(k, true); }); }
    async function play(c) {
      touched = false;
      var go = async function (fn, ms) { if (touched) return false; fn(); return c.sleep(ms); };
      if (!(await c.sleep(500))) return;
      if (!(await go(function () { setTrim(6, 9); }, 1200))) return;
      if (!(await go(function () { setTrim(5, 8); }, 1200))) return;
      if (!(await go(function () { setTrim(5.5, 8.5); }, 900))) return;
      if (!(await go(function () { setStock('white'); }, 1300))) return;
      if (!(await go(function () { setStock('cream'); }, 900))) return;
      if (!(await go(function () { step(1); }, 1700))) return;
      if (!(await go(function () { step(1); }, 1700))) return;
      if (!(await go(function () { setSw('right', false); }, 1900))) return;
      if (!(await go(function () { setSw('right', true); }, 1200))) return;
      if (!(await go(function () { S.cur = 'b'; view(); }, 200))) return;
    }
    layout(); view();
    MS.player(root.closest('.demo'), { replay: '#pb-replay', reset: settle, settle: settle, play: play, threshold: .45, delay: 600 });
  })();

  /* ---- 7. queries, series ------------------------------------------------------------------ */
  (function queries() {
    var ul = $('#q-rows'); if (!ul) return;
    var dara = $('[data-r="dara"]', ul), cormac = $('[data-r="cormac"]', ul), figs = $$('#q-fig b');
    function figures(more, wait) { figs[1].textContent = more; figs[3].textContent = wait; }
    function owed() {
      $('[data-st]', dara).textContent = 'Asked for the full'; $('[data-nx]', dara).innerHTML = 'Send the full &middot; by 14 Oct';
      ul.insertBefore(dara, cormac); figures(3, 0);
    }
    function waiting() {
      $('[data-st]', dara).textContent = 'Waiting · 20 days'; $('[data-nx]', dara).textContent = 'Closes 23 Oct';
      ul.appendChild(dara); figures(2, 1);
    }
    function flip(fn) {
      var rs = $$('li', ul), b = rs.map(function (r) { return r.getBoundingClientRect(); });
      fn();
      if (MS.reduced) return;
      rs.forEach(function (r, i) { var a = r.getBoundingClientRect(), dy = b[i].top - a.top; if (dy && r.animate) r.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 520, easing: GLIDE }); });
    }
    MS.player($('#q-demo'), {
      replay: '#q-replay', reset: waiting, settle: owed, threshold: .5, delay: 600,
      play: async function (c) { if (!(await c.sleep(1500))) return; flip(owed); }
    });
    var segs = $$('#s-demo [data-s]'), people = $('#s-people');
    segs.forEach(function (b) { b.addEventListener('click', function () { people.setAttribute('data-s', b.dataset.s); pressGroup(segs, b); }); });
  })();
})();

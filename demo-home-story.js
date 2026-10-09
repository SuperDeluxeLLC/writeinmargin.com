/* Home, section 4: see the whole story. A board whose cards you move (the same scenes read as
   an outline and as a page), and, for a book, Whose eyes. The static HTML in
   index.html is the finished state; this file only adds. All content is sample content. */
(function (root) {
  'use strict';

  /* ---- the sample screenplay's scenes ------------------------------------------------------ */
  var SC = [
    { id: 1, slug: 'Int. bar - night', beat: 'He is given something he does not want.', cast: ['Tom', 'May'], ring: 2, len: '1 6/8', th: 'plants the lighter', knot: 'plant' },
    { id: 2, slug: 'Ext. pier - dawn', beat: 'May almost lets it go.', cast: ['May'], ring: 1, c: 'pink', len: '4/8', th: 'pays off the lighter', knot: 'payoff' },
    { id: 3, slug: 'Int. Tom’s kitchen - morning', beat: 'The kettle screams and he lets it.', cast: ['Tom'], ring: 2, len: '7/8' },
    { id: 4, slug: 'Int. car - day', beat: 'Neither of them mentions it.', cast: ['Tom', 'May'], ring: 0, len: '2' },
    { id: 5, slug: 'Ext. pier - night', beat: 'He waits. She is late.', cast: ['Tom'], ring: 0, len: '1 1/8' },
    { id: 6, slug: 'Int. bar - night', beat: 'The lighter, finally lit.', cast: ['Tom', 'May'], ring: 1, len: '1' }
  ];
  var ACTS = [{ name: 'Act one', ids: [1, 2, 3] }, { name: 'Act two', ids: [4, 5, 6] }];
  var RING = ['nothing yet', 'rough', 'good'];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function scene(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; return null; }
  function ico(id) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  function short(slug) { return slug.replace(/^(Int|Ext)\. /, ''); }

  /* A card as the app draws it (CardsView): SCENE n and its ring, the heading, what happens, the people as
     chips with their initials in their own colours, the thread as a pill, and its length and pages at the foot. */
  var CAST = { Tom: 'tom', May: 'may' };
  function who(c, lead) { return '<span class="app-chip who-' + (CAST[c] || 'x') + (lead ? ' own' : '') + '"><i>' + c.charAt(0) + '</i>' + c + '</span>'; }
  function eighths(len) { var m = /^(?:(\d+)\s*)?(?:(\d)\/8)?$/.exec(len) || []; return (+(m[1] || 0)) * 8 + (+(m[2] || 0)); }
  function pages(ids) {      // the pages each scene runs over, in the order the board has them: p. 3, or pp. 3–4
    var at = 0, out = {};
    ids.forEach(function (id) {
      var len = eighths(scene(id).len), a = Math.floor(at / 8) + 1, b = Math.floor((at + len - 1) / 8) + 1;
      out[id] = a === b ? 'p. ' + a : 'pp. ' + a + '\u2013' + b; at += len;
    });
    return out;
  }
  function cardHTML(s, n, pp) {
    return '<div class="bcard" data-id="' + s.id + '"' + (s.c ? ' data-c="' + s.c + '"' : '') + ' tabindex="0" aria-label="Scene ' + n + ', ' + esc(s.slug) + '. Arrow keys move it.">' +
      '<div class="bcard__top"><span class="bcard__grip" aria-hidden="true"></span><span class="app-scene-n bcard__n">' + n + '</span>' +
      '<button type="button" class="bring" data-ring="' + s.ring + '" aria-label="Scene ' + n + ', ' + RING[s.ring] + '. Press to change."></button></div>' +
      '<p class="bcard__slug">' + esc(s.slug) + '</p><p class="bcard__beat">' + esc(s.beat) + '</p>' +
      '<div class="bcard__who">' + s.cast.map(function (c, i) { return who(c); }).join('') + '</div>' +
      (s.knot ? '<div class="bcard__th"><span class="app-thread">the lighter</span></div>' : '') +
      '<p class="bcard__foot app-foot">' + s.len + ' &middot; <span class="bcard__pp">' + (pp || '') + '</span></p></div>';
  }
  function boardHTML(acts) {
    var n = 0, pp = pages([].concat.apply([], acts.map(function (a) { return a.ids; })));
    return acts.map(function (a, i) {
      return '<section class="bd__act" data-act="' + i + '" aria-label="' + a.name + '"><p class="app-eyebrow bd__ah">' + a.name + '</p><div class="bd__cards">' +
        a.ids.map(function (id) { return cardHTML(scene(id), ++n, pp[id]); }).join('') + '</div></section>';
    }).join('');
  }
  function orderLine(acts) {
    var n = 0, out = [];
    acts.forEach(function (a) { a.ids.forEach(function (id) { out.push(++n + ' ' + short(scene(id).slug).replace(/ - .*/, '')); }); });
    return out.join(' · ');
  }
  function outlineHTML(acts) {
    var flat = [], n = 0, pl = -1, po = -1;
    acts.forEach(function (a) { a.ids.forEach(function (id) { flat.push(scene(id)); }); });
    flat.forEach(function (s, i) { if (s.knot === 'plant') pl = i; if (s.knot === 'payoff') po = i; });
    var line = '';
    if (pl >= 0 && po >= 0) { var a = Math.min(pl, po), b = Math.max(pl, po); line = '<i class="ol__thread" style="top:' + (a * 2.8 + 1.4) + 'em;height:' + ((b - a) * 2.8) + 'em"></i>'; }
    return '<ol class="ol">' + line + flat.map(function (s) {
      n++;
      return '<li class="ol__row"><span class="ol__knot' + (s.knot ? ' is-' + s.knot : '') + '" aria-hidden="true"></span><span class="ol__n">' + n + '</span><span class="ol__slug">' + esc(s.slug) + '</span><span class="ol__beat">' + esc(s.beat) + (s.th ? ' <em>' + esc(s.th) + '</em>' : '') + '</span><span class="ol__len">' + s.len + '</span><span class="bring is-static" data-ring="' + s.ring + '" role="img" aria-label="' + RING[s.ring] + '"></span></li>';
    }).join('') + '</ol>';
  }
  function pageHTML(acts) {
    var n = 0, h = '<div class="sheet-wrap"><div class="sheet">';
    acts.forEach(function (a) { a.ids.forEach(function (id) {
      var s = scene(id); n++;
      h += '<div class="sc-slug" data-n="' + n + '">' + esc(s.slug) + '</div><div class="sc-act">' + esc(s.beat) + '</div>';
    }); });
    return h + '</div></div>';
  }

  /* ---- the sample book: Whose eyes (the timeline lives on the novel page) --------------------- */
  var WHO = { M: { name: 'Maren', ink: 'limeade', ch: 11, words: '21,610', pct: 67 }, T: { name: 'Tobias', ink: 'pink', ch: 3, words: '6,530', pct: 20 }, I: { name: 'Ida', ink: 'lavender', ch: 2, words: '4,260', pct: 13 } };
  // n, title, who, date
  var CH = [
    [1, 'The lamp room', 'M', '14 March 1988'], [2, 'Wick and paraffin', 'M', '15 March 1988'],
    [3, 'Ida’s ledger', 'I', 'the winter of 1962'], [4, 'The relief boat', 'T', '18 March 1988'],
    [5, 'Nets', 'M', '20 March 1988'], [6, 'A letter from Hollin', 'T', '22 March 1988'],
    [7, 'Fog signal', 'M', '25 March 1988'], [8, 'The Aurelia comes in', 'M', '2 April 1988'],
    [9, 'What the keeper kept', 'I', '1962'], [10, 'Leaving Skerry', 'M', '9 April 1988'],
    [11, 'Hollin harbour', 'M', 'no date yet'], [12, 'Rooms over the chandler’s', 'M', '12 April 1988'],
    [13, 'The school on the hill', 'M', '3 May 1988'], [14, 'The ferry at Hollin', 'T', '3 May 1988'],
    [15, 'Market day', 'M', '14 May 1988'], [16, 'The inquiry', 'M', 'June 1988']
  ];

  function eyesHTML() {
    var bar = ['M', 'T', 'I'].map(function (k) { return '<i class="eyes__seg" data-w="' + k + '" style="flex:' + WHO[k].pct + '"></i>'; }).join('');
    var who = ['M', 'T', 'I'].map(function (k) {
      var w = WHO[k];
      return '<li><button type="button" class="who" data-w="' + k + '" aria-pressed="false"><i class="who__dot" aria-hidden="true"></i><b>' + w.name + '</b><span>' + w.ch + ' chapters &middot; ' + w.words + ' words &middot; ' + w.pct + '%</span></button></li>';
    }).join('');
    function tiles(a, b) {
      return CH.filter(function (c) { return c[0] >= a && c[0] <= b; }).map(function (c) {
        return '<button type="button" class="ch" data-n="' + c[0] + '" data-w="' + c[2] + '" aria-label="Chapter ' + c[0] + ', ' + esc(c[1]) + ', in ' + WHO[c[2]].name + '’s eyes"><b>' + c[0] + '</b></button>';
      }).join('');
    }
    return '<div class="eyes__grid">' +
      '<div class="eyes__card eyes__who-card"><p class="app-eyebrow">' + ico('eye') + ' Whose eyes</p>' +
      '<div class="eyes__bar" role="img" aria-label="Maren tells 67 percent of the words, Tobias 20, Ida 13">' + bar + '</div>' +
      '<ul class="eyes__who">' + who + '</ul><p class="eyes__gone" id="eyes-gone" aria-live="polite"></p></div>' +
      '<div class="eyes__card eyes__parts"><div><p class="app-eyebrow">Part one</p><div class="ch-tiles">' + tiles(1, 8) + '</div></div><div><p class="app-eyebrow">Part two</p><div class="ch-tiles">' + tiles(9, 16) + '</div></div></div></div>' +
      '<p class="eyes__detail" id="eyes-detail" aria-live="polite"></p>';
  }

  var api = { boardHTML: boardHTML, eyesHTML: eyesHTML, ACTS: ACTS, orderLine: orderLine };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof document === 'undefined') return;

  /* ---- the browser side ------------------------------------------------------------------------------ */
  var MS = root.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;

  /* ===== the board ===== */
  var board = $('#board-demo');
  if (board) (function () {
    var acts = ACTS.map(function (a) { return { name: a.name, ids: a.ids.slice() }; });
    var screen = $('#bd-screen'), host = $('#bd-acts'), live = $('#bd-live'), order = $('#bd-order');
    var panes = { board: $('#bd-pane-board'), outline: $('#bd-pane-outline'), script: $('#bd-pane-script') };
    var seg = $('#bd-views'), view = 'board', drag = null;

    function flip(els, fn) {
      var before = els.map(function (e) { return e.getBoundingClientRect(); });
      fn();
      if (MS.reduced) return;
      els.forEach(function (e, i) {
        var a = before[i], b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
        if ((dx || dy) && e.animate) e.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.4,0,.2,1)' });
      });
    }
    function cards() { return $$('.bcard:not(.bcard--ph)', host); }
    function sync() {
      acts = $$('.bd__act', host).map(function (el, i) {
        return { name: ACTS[i].name, ids: $$('.bcard:not(.bcard--ph)', el).map(function (c) { return +c.getAttribute('data-id'); }) };
      });
      var n = 0, pp = pages(cards().map(function (c) { return +c.getAttribute('data-id'); }));
      $$('.bcard:not(.bcard--ph)', host).forEach(function (c) {
        n++; var s = scene(+c.getAttribute('data-id'));
        $('.bcard__n', c).textContent = n;
        $('.bcard__pp', c).textContent = pp[s.id];      // the pages follow the card, as the app's do
        c.setAttribute('aria-label', 'Scene ' + n + ', ' + s.slug + '. Arrow keys move it.');
        var rb = $('.bring', c); rb.setAttribute('aria-label', 'Scene ' + n + ', ' + RING[s.ring] + '. Press to change.');
      });
      order.textContent = orderLine(acts);
      $$('.bd__act', host).forEach(function (el) { el.classList.toggle('is-empty', !$('.bcard', el)); });
    }
    function announce(card) {
      var act = card.closest('.bd__act'), n = $('.bcard__n', card).textContent;
      live.textContent = 'Scene ' + n + ', ' + scene(+card.getAttribute('data-id')).slug + ', is now in ' + act.getAttribute('aria-label') + ', number ' + (1 + $$('.bcard', act).indexOf(card)) + '.';
    }

    /* pointer: lift a card, the others make room, it settles where you let go */
    function actAt(x, y) {
      var best = null, bd = 1e9;
      $$('.bd__act', host).forEach(function (el) {
        var r = el.getBoundingClientRect();
        var dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0, dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
        var d = dx * dx + dy * dy; if (d < bd) { bd = d; best = el; }
      });
      return best;
    }
    host.addEventListener('pointerdown', function (e) {
      var card = e.target.closest('.bcard'); if (!card || e.target.closest('.bring')) return;
      if (e.pointerType !== 'mouse' && !e.target.closest('.bcard__grip')) return;
      if (e.button != null && e.button > 0) return;
      e.preventDefault();
      var r = card.getBoundingClientRect(), s = screen.getBoundingClientRect();
      var ph = document.createElement('div'); ph.className = 'bcard bcard--ph'; ph.style.height = r.height + 'px';
      var orig = card.nextElementSibling;
      card.parentNode.insertBefore(ph, card);
      drag = { card: card, ph: ph, dx: e.clientX - r.left, dy: e.clientY - r.top, from: card.parentNode, orig: orig };
      card.classList.add('is-drag'); card.style.width = r.width + 'px';
      card.style.left = (r.left - s.left) + 'px'; card.style.top = (r.top - s.top) + 'px';
      try { card.setPointerCapture(e.pointerId); } catch (x) {}
    });
    host.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var s = screen.getBoundingClientRect();
      drag.card.style.left = (e.clientX - drag.dx - s.left) + 'px'; drag.card.style.top = (e.clientY - drag.dy - s.top) + 'px';
      var act = actAt(e.clientX, e.clientY), list = $('.bd__cards', act), ref = null;
      $$('.bd__act', host).forEach(function (a) { a.classList.toggle('is-over', a === act); });
      var sibs = $$('.bcard', list).filter(function (c) { return c !== drag.card && c !== drag.ph; });
      for (var i = 0; i < sibs.length; i++) { var r = sibs[i].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { ref = sibs[i]; break; } }
      var ph = drag.ph;
      var nx = ph.nextElementSibling; if (nx === drag.card) nx = nx.nextElementSibling;
      if (ph.parentNode === list && nx === ref) return;
      flip(sibs, function () { list.insertBefore(ph, ref); });
    });
    function drop(cancel) {
      if (!drag) return;
      var d = drag; drag = null;
      $$('.bd__act', host).forEach(function (a) { a.classList.remove('is-over'); });
      var r0 = d.card.getBoundingClientRect();
      if (cancel) d.from.insertBefore(d.ph, d.orig);
      d.card.classList.remove('is-drag'); d.card.style.width = d.card.style.left = d.card.style.top = '';
      d.ph.parentNode.replaceChild(d.card, d.ph);
      var r1 = d.card.getBoundingClientRect();
      if (!MS.reduced && d.card.animate) d.card.animate([{ transform: 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.4,0,.2,1)' });
      sync(); announce(d.card);
    }
    host.addEventListener('pointerup', function () { drop(false); });
    host.addEventListener('pointercancel', function () { drop(true); });

    /* keyboard: arrows move the focused card; left and right change act */
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drag) drop(true); });
    host.addEventListener('keydown', function (e) {
      var card = e.target.closest && e.target.classList.contains('bcard') ? e.target : null; if (!card) return;
      var all = $$('.bd__act', host), act = card.closest('.bd__act'), ai = all.indexOf(act), list = card.parentNode;
      var sibs = $$('.bcard', list), i = sibs.indexOf(card), tgt = list, ref = null;
      if (e.key === 'ArrowUp') { if (i === 0) return; ref = sibs[i - 1]; }
      else if (e.key === 'ArrowDown') { if (i === sibs.length - 1) return; ref = sibs[i + 2] || null; }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        var nx = all[ai + (e.key === 'ArrowLeft' ? -1 : 1)]; if (!nx) return;
        tgt = $('.bd__cards', nx); var ts = $$('.bcard', tgt); ref = ts[Math.min(i, ts.length)] || null;
      } else return;
      e.preventDefault();
      flip(cards(), function () { tgt.insertBefore(card, ref); });
      sync(); card.focus(); announce(card);
    });
    /* a ring comes round: nothing yet, rough, good */
    host.addEventListener('click', function (e) {
      var b = e.target.closest('.bring'); if (!b) return;
      var c = b.closest('.bcard'), s = scene(+c.getAttribute('data-id'));
      s.ring = (s.ring + 1) % 3; b.setAttribute('data-ring', s.ring); sync();
    });

    function setView(v) {
      view = v;
      Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== v; });
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false'); });
      if (v === 'outline') panes.outline.innerHTML = outlineHTML(acts);
      if (v === 'script') panes.script.innerHTML = pageHTML(acts);
    }
    seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setView(b.getAttribute('data-view')); });
    seg.hidden = false; $('#bd-hint').hidden = false;
    sync();
  })();

  /* ===== whose eyes ===== */
  var eyes = $('#eyes-demo');
  if (eyes) (function () {
    var who = null, detail = $('#eyes-detail'), gone = $('#eyes-gone');
    var title = {}; CH.forEach(function (c) { title[c[0]] = c; });

    function paint() {
      $$('.who', eyes).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-w') === who ? 'true' : 'false'); });
      $$('.ch', eyes).forEach(function (b) { b.classList.toggle('is-dim', !!who && b.getAttribute('data-w') !== who); });
      $$('.eyes__seg', eyes).forEach(function (b) { b.classList.toggle('is-dim', !!who && b.getAttribute('data-w') !== who); });
      // the longest stretch someone is absent: the real card names it when it is five chapters or more
      var tiles = $$('.ch', eyes); tiles.forEach(function (t) { t.classList.remove('is-gone'); });
      gone.textContent = '';
      if (who) {
        var mine = CH.filter(function (c) { return c[2] === who; }).map(function (c) { return c[0]; }), best = null;
        for (var i = 0; i < mine.length - 1; i++) { var gap = mine[i + 1] - mine[i] - 1; if (gap >= 5 && (!best || gap > best.gap)) best = { from: mine[i] + 1, to: mine[i + 1] - 1, gap: gap }; }
        if (best) {
          gone.textContent = WHO[who].name + ' is gone for ' + best.gap + ' chapters. Chapters ' + best.from + ' to ' + best.to + ' are told by others.';
          tiles.forEach(function (t) { var n = +t.getAttribute('data-n'); if (n >= best.from && n <= best.to) t.classList.add('is-gone'); });
        }
      }
    }
    function press(n) {
      var c = title[n]; detail.textContent = 'Chapter ' + n + ', ' + c[1] + '. In ' + WHO[c[2]].name + '’s eyes. ' + (c[3] === 'no date yet' ? 'No date yet.' : c[3] + '.');
    }
    eyes.addEventListener('click', function (e) {
      var w = e.target.closest('.who');
      if (w) { var k = w.getAttribute('data-w'); who = who === k ? null : k; paint(); detail.textContent = who ? WHO[who].name + ': ' + WHO[who].ch + ' chapters, ' + WHO[who].words + ' words.' : ''; return; }
      var c = e.target.closest('.ch'); if (c) press(+c.getAttribute('data-n'));
    });
    // a quiet entrance: each person in turn lights their own chapters, then it hands over to you
    MS.onVisible(eyes, function () {
      if (MS.reduced) return;
      function free() { return !eyes.getAttribute('data-touched'); }
      var seq = ['M', 'T', 'I', null], i = 0;
      setTimeout(function step() {
        if (!free()) return;
        who = seq[i++]; paint();
        detail.textContent = who ? WHO[who].name + ': ' + WHO[who].ch + ' chapters, ' + WHO[who].words + ' words.' : '';
        if (i < seq.length) setTimeout(step, 1400);
      }, 1200);
    }, { threshold: .5 });
    eyes.addEventListener('pointerdown', function () { eyes.setAttribute('data-touched', '1'); });
    eyes.addEventListener('keydown', function () { eyes.setAttribute('data-touched', '1'); });
    eyes.classList.add('is-live');
    paint();
  })();
})(typeof window !== 'undefined' ? window : globalThis);

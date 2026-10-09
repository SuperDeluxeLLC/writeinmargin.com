/* Home, the hero's five stops, each played as the app does it, every key shown under the window as it
   lands. A bare page: a scene typed, the cast offered under a cue, a wrinkle, a parenthetical, a
   transition. ⌘K: a to-do added and a draft branched. The board: a scene dragged with the page following,
   then the next scene by key. Notes: words highlighted into a note, a {{ }} and a [[ ]] written on the page,
   the note opened to half the window and written in, a file dragged in from outside and read by the Inbox.
   The split: a line changed, marked on both sides, merged up.
   demo-home-way.js calls play(n, c) with the player's context, so a stop stops the moment another is
   picked. Every stop puts the window back first, so any stop can follow any other. The static HTML is the
   finished state; with reduced motion this file only finishes. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;
  var rg = $('#rg');
  if (!rg) return;
  var screen = $('.rg__screen', rg), pointer = $('.rg__pointer', rg), keysEl = $('#rg-keys');
  var pageA = $('.wy__pg--a .sheet', rg), pageB = $('.wy__pg--b .sheet', rg);
  var hooks = { setStop: function () {}, filter: function () {} };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function caret() { var c = document.createElement('span'); c.className = 'caret on'; c.setAttribute('aria-hidden', 'true'); return c; }

  /* Types into el at a pace a viewer can read, the caret after the words; each() sees the text so far. */
  async function typeIn(c, el, text, o) {
    o = o || {};
    var base = o.keep ? el.textContent : '', node = document.createTextNode(base), k = caret();
    el.textContent = ''; el.appendChild(node); el.appendChild(k);
    for (var i = 0; i < text.length; i++) {
      node.nodeValue = base + text.slice(0, i + 1);
      k.classList.remove('on');
      if (o.each) o.each(node.nodeValue);
      var ch = text.charAt(i), d = (o.speed || 70) * (0.7 + Math.random() * 0.6) + (/[.,:?]/.test(ch) ? 160 : ch === ' ' ? 25 : 0);
      if (!await c.sleep(d)) { if (k.parentNode) k.remove(); return false; }
      k.classList.add('on');
    }
    if (!o.leaveCaret && k.parentNode) k.remove();
    return true;
  }
  async function erase(c, el, speed) {
    var t = el.textContent;
    for (var i = t.length; i >= 0; i--) { el.textContent = t.slice(0, i); if (!await c.sleep(speed || 22)) return false; }
    return true;
  }

  /* The keys, under the window: each press as it lands, and what it did. A word in place of a key (drag,
     right-click) is a gesture. */
  function keys(list, label) {
    if (!keysEl) return;
    keysEl.innerHTML = (list || []).map(function (k) {
      return '<kbd' + (k.length > 3 ? ' class="is-word"' : '') + '>' + esc(k) + '</kbd>';
    }).join('') + (label ? '<span>' + esc(label) + '</span>' : '');
    keysEl.classList.remove('is-on'); void keysEl.offsetWidth; keysEl.classList.add('is-on');
  }
  function keysOff() { if (keysEl) { keysEl.innerHTML = ''; keysEl.classList.remove('is-on'); } }

  /* The pointer: goes to the middle (or a side) of a thing, and presses. */
  function at(el, fx, fy) {
    var r = el.getBoundingClientRect(), s = screen.getBoundingClientRect();
    return { x: r.left - s.left + r.width * (fx == null ? 0.5 : fx), y: r.top - s.top + r.height * (fy == null ? 0.5 : fy) };
  }
  function moveTo(p) { pointer.hidden = false; pointer.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; }
  function pointerOff() { pointer.hidden = true; pointer.style.transition = ''; }
  var draftEl = $('#rg-draft', rg);
  function draft(name) { if (draftEl) draftEl.textContent = name; }

  /* ---- 0. a bare page: a scene typed, the cast under a cue, a wrinkle, a parenthetical, a transition ---- */
  var lines = pageA ? $$(':scope > div:not(.sh)', pageA).map(function (el) {
    return { el: el, cls: el.className, text: el.textContent, n: el.getAttribute('data-n') };
  }) : [];
  function pageAWhole() {
    $$('[data-tmp]', pageA).forEach(function (t) { t.remove(); });
    lines.forEach(function (l) { l.el.hidden = false; l.el.className = l.cls; l.el.textContent = l.text; if (l.n) l.el.setAttribute('data-n', l.n); });
  }
  function line(cls) {
    var d = document.createElement('div'); d.className = cls; d.setAttribute('data-tmp', '');
    pageA.appendChild(d); return d;
  }
  /* The cast under the cue line, as the app sets it into the page: the same shelf as ⌘K's, a name a row,
     the keys said once at its foot. */
  function cueShelf(after, rows) {
    var sh = document.createElement('div'); sh.className = 'sh sh--cue'; sh.setAttribute('data-tmp', '');
    sh.innerHTML = rows.map(function (r) { return '<div class="sh__row"><i></i><b>' + esc(r[0]) + '</b><em>' + esc(r[1] || '') + '</em></div>'; }).join('') +
      '<p class="sh__foot">↑↓ move &nbsp; return takes it &nbsp; esc leaves</p>';
    after.parentNode.insertBefore(sh, after.nextSibling);
    return sh;
  }
  function arm(sh, i) { $$('.sh__row', sh).forEach(function (r, k) { r.classList.toggle('is-on', k === i); }); }
  function holdAt(el, before, after) {
    el.textContent = ''; el.appendChild(document.createTextNode(before || '')); el.appendChild(caret());
    if (after) el.appendChild(document.createTextNode(after));
  }
  async function bare(c) {
    hooks.setStop(0); draft('Draft 2');
    lines.forEach(function (l) { l.el.hidden = true; });
    var head = line('sc-act'); head.appendChild(caret());
    if (!await c.sleep(800)) return false;
    // a heading: typed in lowercase, set as one the moment it starts like one
    if (!await typeIn(c, head, 'int. bar - night', { speed: 80, each: function (t) {
      if (/^(int|ext)\./i.test(t) && head.className !== 'sc-slug') { head.className = 'sc-slug'; head.setAttribute('data-n', '1'); keys(['i', 'n', 't', '.'], 'a scene heading'); }
    } })) return false;
    if (!await c.sleep(500)) return false;
    keys(['⏎'], 'action');
    var act = line('sc-act');
    if (!await typeIn(c, act, 'Rain on the window. TOM sets a brass lighter on the bar.', { speed: 38 })) return false;
    if (!await c.sleep(450)) return false;
    // Tab on an empty line: a character, and the cast under it
    var cue = line('sc-cue'); cue.appendChild(caret());
    keys(['⏎', 'Tab'], 'a character · the cast opens under the line');
    var sh = cueShelf(cue, [['May'], ['Tom']]);
    if (!await c.sleep(1300)) return false;
    arm(sh, 0); keys(['↓'], 'May');
    if (!await c.sleep(700)) return false;
    sh.remove(); holdAt(cue, 'May'); keys(['⏎'], 'taken');
    if (!await c.sleep(700)) return false;
    // Tab after the name: brackets, and the wrinkles that go in them
    holdAt(cue, 'May (', ')'); keys(['Tab'], 'a wrinkle');
    sh = cueShelf(cue, [['May (V.O.)', 'heard, not in the room'], ['May (O.S.)', 'in the scene, off screen'], ['May (CONT’D)', 'still speaking']]);
    if (!await c.sleep(1200)) return false;
    arm(sh, 0); keys(['↓']);
    if (!await c.sleep(450)) return false;
    arm(sh, 1); keys(['↓', '↓'], 'off screen');
    if (!await c.sleep(700)) return false;
    sh.remove(); cue.textContent = 'May (O.S.)'; keys(['⏎'], 'May (O.S.)');
    if (!await c.sleep(500)) return false;
    var dlg = line('sc-dlg');
    if (!await typeIn(c, dlg, 'You kept it.', { speed: 75 })) return false;
    if (!await c.sleep(500)) return false;
    // Return from a speech: who speaks next
    var cue2 = line('sc-cue'); cue2.appendChild(caret());
    keys(['⏎'], 'who speaks next');
    sh = cueShelf(cue2, [['Tom'], ['May']]);
    if (!await c.sleep(1100)) return false;
    holdAt(cue2, 't'); sh.remove(); sh = cueShelf(cue2, [['Tom']]); arm(sh, 0); keys(['t'], 'Tom');
    if (!await c.sleep(700)) return false;
    sh.remove(); cue2.textContent = 'Tom'; keys(['⏎'], 'taken');
    if (!await c.sleep(450)) return false;
    var par = line('sc-par');
    keys(['('], 'a parenthetical');
    if (!await typeIn(c, par, '(not looking at it)', { speed: 55 })) return false;
    if (!await c.sleep(350)) return false;
    keys(['⏎'], 'his line');
    var dlg2 = line('sc-dlg');
    if (!await typeIn(c, dlg2, 'I kept everything.', { speed: 65 })) return false;
    if (!await c.sleep(450)) return false;
    // a transition: set right once it ends like one
    keys(['⏎', '⏎']);
    var tr = line('sc-act');
    if (!await typeIn(c, tr, 'cut to:', { speed: 95, each: function (t) {
      if (/ to:$/i.test(t) && tr.className !== 'sc-tr') { tr.className = 'sc-tr'; keys(['t', 'o', ':'], 'a transition'); }
    } })) return false;
    return c.sleep(2400);
  }

  /* ---- 1. ⌘K: a to-do added, then a draft branched ----------------------------------------------------- */
  var shelf = pageA ? $('.sh', pageA) : null, typed = shelf ? $('.sh__typed', shelf) : null;
  var todoRow = null, addedRow = null;
  if (shelf) {
    var foot = $('.sh__foot', shelf);
    todoRow = document.createElement('div'); todoRow.className = 'sh__row'; todoRow.hidden = true; todoRow.setAttribute('data-k', 'todo'); todoRow.setAttribute('data-x', '');
    todoRow.innerHTML = '<i>To do</i><b></b><em>Loose</em>';
    addedRow = document.createElement('div'); addedRow.className = 'sh__row is-added'; addedRow.hidden = true; addedRow.setAttribute('data-x', '');
    addedRow.innerHTML = '<i>Added</i><b></b><em>Loose</em>';
    shelf.insertBefore(todoRow, foot); shelf.insertBefore(addedRow, foot);
  }
  function shelfShow(t) {
    if (/^todo\b/i.test(t)) {
      $$('.sh__row', shelf).forEach(function (r) { r.hidden = true; r.classList.remove('is-on'); });
      todoRow.hidden = false; todoRow.classList.add('is-on');
      $('b', todoRow).textContent = 'Add “' + t.replace(/^todo\s*/i, '') + '”';
    } else { hooks.filter(rg, t); todoRow.hidden = true; addedRow.hidden = true; }
  }
  async function cmdk(c) {
    pageAWhole(); hooks.setStop(1); draft('Draft 2');
    typed.textContent = ''; shelfShow('');
    keys(['⌘', 'K'], 'opens under the line you are on');
    if (!await c.sleep(1300)) return false;
    if (!await typeIn(c, typed, 'todo buy a brass lighter', { speed: 72, each: shelfShow })) return false;
    if (!await c.sleep(600)) return false;
    // return: it is added, and ⌘K stays open for the next
    todoRow.hidden = true; addedRow.hidden = false; $('b', addedRow).textContent = '✓ buy a brass lighter';
    typed.textContent = ''; keys(['⏎'], 'a to-do, filed in Notes');
    if (!await c.sleep(1700)) return false;
    addedRow.hidden = true; shelfShow('');
    if (!await typeIn(c, typed, 'new draft', { speed: 90, each: shelfShow })) return false;
    if (!await c.sleep(700)) return false;
    keys(['⏎'], 'Draft 2a, off Draft 2');
    hooks.setStop(0, { a: 0, b: 1 }); draft('Draft 2a');   // return: Draft 2a, on its own
    return c.sleep(2600);
  }

  /* ---- 2. the board: a scene dragged, the page following; then the next scene by key ------------------- */
  var SCENES = [
    ['Int. bar - night', 'Rain on the window. TOM sets a brass lighter on the bar.', 'May', 'You kept it.', '1 6/8'],
    ['Ext. pier - dawn', 'Grey water. MAY at the rail, the lighter in her fist.', 'May', 'I could drop it.', '4/8'],
    ['Int. Tom’s kitchen - morning', 'The kettle screams. Tom lets it.', 'Tom', 'Not today.', '7/8'],
    ['Int. car - day', 'Tom drives. May watches the road.', 'May', 'You missed the turn.', '2'],
    ['Ext. pier - night', 'Tom at the rail. She is late.', 'Tom', 'Come on, May.', '1 1/8'],
    ['Int. bar - night', 'The lighter on the bar, where he left it.', 'Tom', 'She’ll be back for it.', '1'],
    ['Ext. harbour - day', 'Gulls over the boats. May with a letter, unopened.', 'May', 'Not yet.', '6/8'],
    ['Int. May’s flat - night', 'The letter by the sink. The lighter beside it.', 'May', 'All right.', '1 2/8'],
    ['Ext. lighthouse - dusk', 'The lamp turns. Nobody comes.', 'Tom', 'May?', '5/8'],
    ['Int. bar - night', 'May flicks the lighter. It catches.', 'May', 'There.', '1 3/8']
  ];
  var order = [], here = 0, rows = $('#rg-rows', rg), run = $('#rg-run', rg), runBox = $('.rg__run', rg), count = $('#rg-count', rg);
  var hereEye = $('.ap-here .ap-eye', rg), hereSlug = $('.ap-here .ap-slug', rg), nextEye = $('.ap-next .ap-eye', rg), nextSlug = $('.ap-next .ap-slug', rg);
  function eighths(s) { var t = 0; s.split(' ').forEach(function (p) { var f = p.split('/'); t += f.length > 1 ? +f[0] : +p * 8; }); return t; }
  function ring(i) { return i === 0 ? ' is-half' : i === 1 ? ' is-done' : ''; }
  function renderBoard(moved) {
    if (!rows) return;
    rows.innerHTML = order.map(function (id, k) {
      var s = SCENES[id];
      return '<li data-id="' + id + '"' + (k === here ? ' class="is-here"' : '') + '><span class="rg__ring' + ring(id) + '"></span><span class="ap-n">' + (k + 1) +
        '</span><span class="ap-slug">' + esc(s[0]) + '</span><span class="ap-len">' + s[4] + '</span></li>';
    }).join('');
    if (count) count.textContent = 'Scenes · ' + order.length + ' scenes · 11 pp';
    if (run) run.innerHTML = order.map(function (id, k) {
      var s = SCENES[id], m = id === moved ? ' is-moved' : '';
      return '<div class="sc-slug' + m + '" data-n="' + (k + 1) + '" data-at="' + k + '">' + esc(s[0]) + '</div><div class="sc-act' + m + '">' + esc(s[1]) +
        '</div><div class="sc-cue' + m + '">' + esc(s[2]) + '</div><div class="sc-dlg' + m + '">' + esc(s[3]) + '</div>';
    }).join('');
    if (moved != null) { var li = $('li[data-id="' + moved + '"]', rows); if (li) li.classList.add('is-moved'); }
    herePanel();
  }
  function herePanel() {
    if (!hereEye) return;
    var before = 0; for (var k = 0; k < here; k++) before += eighths(SCENES[order[k]][4]);
    hereEye.textContent = 'You are in · Scene ' + (here + 1) + ' · p. ' + (1 + Math.floor(before / 8));
    hereSlug.textContent = SCENES[order[here]][0];
    var nx = order[here + 1];
    nextEye.textContent = nx == null ? 'Next · the end' : 'Next · Scene ' + (here + 2);
    nextSlug.textContent = nx == null ? '' : SCENES[nx][0];
  }
  function scrollRunTo(k, smooth) {
    if (!runBox || !run) return;
    var slug = $('[data-at="' + k + '"]', run); if (!slug) return;
    var top = slug.getBoundingClientRect().top - runBox.getBoundingClientRect().top + runBox.scrollTop - 12;
    if (smooth && runBox.scrollTo) runBox.scrollTo({ top: top, behavior: 'smooth' }); else runBox.scrollTop = top;
  }
  function goHere(k) { here = k; $$('li', rows).forEach(function (li, n) { li.classList.toggle('is-here', n === k); }); herePanel(); scrollRunTo(k, true); }
  function boardStart() { order = SCENES.map(function (_, i) { return i; }); here = 0; renderBoard(); if (runBox) runBox.scrollTop = 0; }
  async function board(c) {
    pageAWhole(); hooks.setStop(2); boardStart(); draft('Draft 2');
    keys(['⌥', '⌘', '2'], 'the board, beside the page');
    if (!await c.sleep(1500)) return false;
    var from = $('li[data-id="6"]', rows), to = $('li[data-id="2"]', rows);
    moveTo(at(from, 0.35, 0.6));
    if (!await c.sleep(1000)) return false;
    // pick it up: a ghost of the card, the row left behind as a gap
    var g = document.createElement('div'); g.className = 'rg__ghost'; g.textContent = SCENES[6][0];
    var a = at(from, 0, 0); g.style.left = a.x + 'px'; g.style.top = a.y + 'px'; screen.appendChild(g);
    from.classList.add('is-lifted'); keys(['drag'], 'a scene to a new place');
    if (!await c.sleep(450)) { g.remove(); return false; }
    var b = at(to, 0, 0), dy = b.y - a.y;
    g.style.transform = 'translateY(' + dy + 'px)';
    var p = at(from, 0.35, 0.6); moveTo({ x: p.x, y: p.y + dy });
    to.classList.add('is-gap');
    if (!await c.sleep(1100)) { g.remove(); return false; }
    // let go: the board and the page take the new order, and the page goes to it
    order.splice(order.indexOf(6), 1); order.splice(2, 0, 6);
    here = 2; g.remove(); renderBoard(6); scrollRunTo(2, true);
    keys(['drag'], 'scene 7 is now scene 3 · the page follows');
    if (!await c.sleep(900)) return false;
    pointerOff();
    if (!await c.sleep(1900)) return false;
    // the next scene, and the next, by key
    goHere(3); keys(['⌥', '⌘', '↓'], 'next scene');
    if (!await c.sleep(1500)) return false;
    goHere(4); keys(['⌥', '⌘', '↓'], 'next scene');
    return c.sleep(2400);
  }

  /* ---- 3. notes: words highlighted, as the app does it, and the note they make; notes on the page; the Inbox --- */
  var notes = $('.rg__notes', rg), todos = $('#rg-todos', rg), todoCount = $('#rg-todo-count', rg);
  var inbox = $('#rg-inbox', rg), inboxN = $('#rg-inbox-n', rg), inboxOpen = $('#rg-inbox-open', rg), keepAll = $('#rg-keep', rg);
  var loose = $('#rg-loose', rg), looseN = $$('.rg-loose-n', rg), back = $('.nt-back', rg), cardsView = $('.nt-views [data-v="cards"]', rg);
  var hlNote = $('#rg-hlnote', rg), hlBody = $('#rg-hlbody', rg), md = $('#rg-md', rg), wordsN = $('#rg-words', rg);
  var drop = $('#rg-drop', rg), file = $('.rg__file', rg);
  var pnotes = $('#rg-pnotes', rg), pnotesN = $('#rg-pnotes-n', rg), pnotesList = $('#rg-pnotes-list', rg);
  var actLine = lines[1] && lines[1].el, mayLine = lines[3] && lines[3].el;
  var todosHTML = todos ? todos.innerHTML : '';
  /* the pens, as the app lists them; a new writer's is the yellow */
  var PENS = ['#5EC0CC', '#F26AA8', '#C2D936', '#93C84C', '#B6A0D9', '#FFE14D'], PEN = '#FFE14D';
  function view(v) { notes.setAttribute('data-view', v); rg.classList.toggle('is-half', v === 'open'); }
  function looseCount(n) { looseN.forEach(function (e) { e.textContent = 'Not in a stack · ' + n + (n === 1 ? ' note' : ' notes'); }); }
  function notesStart() {
    if (!notes) return;
    view('top'); notes.classList.remove('is-drop');
    todos.innerHTML = todosHTML; todoCount.textContent = 'To do · 1 open';
    inboxN.textContent = 'Inbox · nothing waiting'; inbox.classList.remove('is-open'); inboxOpen.hidden = true;
    hlNote.hidden = true; hlNote.classList.remove('is-new'); hlBody.innerHTML = ''; looseCount(1); loose.classList.remove('is-new');
    pnotes.hidden = true; pnotesList.innerHTML = ''; md.innerHTML = ''; wordsN.textContent = '6';
    drop.hidden = true; file.hidden = true; keepAll.classList.remove('is-press');
  }
  /* The row the lines part for over words selected (HighlightBar): Highlight and its key, the pens with the one
     in use underlined, a hairline, then the asks. Set into the page above the words' line. */
  function partedRow(before) {
    var r = document.createElement('div'); r.className = 'pr'; r.setAttribute('data-tmp', '');
    r.innerHTML = '<div class="pr__line"><b>Highlight</b><kbd>⇧⌘H</kbd><span class="pr__pens">' +
      PENS.map(function (h) { return '<span' + (h === PEN ? ' class="is-on"' : '') + '><i style="--p:' + h + '"></i><u></u></span>'; }).join('') +
      '</span></div><div class="pr__line"><span class="pr__ask">Note</span><s>/</s><span class="pr__ask">Note for the team</span><s>/</s><span class="pr__ask">Ask the room</span></div>';
    before.parentNode.insertBefore(r, before);
    return r;
  }
  /* A line of the note as the app's Formatted view sets it: a mark goes once it is a mark — "# " a heading,
     "- [ ] " a box, "- " a bullet, **words** bold once they close — and until then it is typed as it is. */
  function dress(line) {
    var h = esc(line);
    if (/^# /.test(line)) return '<p class="md-h1">' + h.slice(2) + '</p>';
    if (/^- \[ \] /.test(line)) h = '<span class="md-box"></span>' + h.slice(6);
    else if (/^- (?!\[)/.test(line)) h = '<span class="md-dot"></span>' + h.slice(2);
    h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    return '<p>' + h + '</p>';
  }
  /* the same note on its card: the heading bold, a box a circle, a bullet a dash */
  function cardLines(text) {
    return text.split('\n').map(function (l) {
      if (/^# /.test(l)) return '<h4>' + esc(l.slice(2)) + '</h4>';
      var h = esc(l).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      if (/^- \[ \] /.test(l)) return '<p><span class="md-box"></span>' + h.slice(6) + '</p>';
      if (/^- /.test(l)) return '<p>– ' + h.slice(2) + '</p>';
      return '<p>' + h + '</p>';
    }).join('');
  }
  var MARKS = [[/^# $/, ['#'], 'a heading'], [/\*\*[^*]+\*\*$/, ['*', '*'], 'bold'], [/^- \[ \] $/, ['-', '[', ']'], 'a box to tick · it goes to To do'], [/^- (?!\[)$/, ['-'], 'a list']];
  var NOTE = '# Why he keeps it\nIt was **her** father’s.\n- [ ] find a brass Zippo\n- the pier, at dawn';
  async function noteWrite(c, text) {
    var done = [], ls = text.split('\n'), count = 6;
    for (var i = 0; i < ls.length; i++) {
      var cur = '';
      if (i) keys(['⏎']);
      for (var j = 0; j < ls[i].length; j++) {
        cur += ls[i].charAt(j);
        md.innerHTML = done.concat([dress(cur)]).join('');
        var last = md.lastElementChild; if (last) last.appendChild(caret());
        for (var m = 0; m < MARKS.length; m++) if (MARKS[m][0].test(cur)) { keys(MARKS[m][1], MARKS[m][2]); break; }
        if (cur.charAt(cur.length - 1) === ' ') wordsN.textContent = String(++count);
        if (!await c.sleep(55 + Math.random() * 45)) return false;
      }
      done.push(dress(ls[i])); wordsN.textContent = String(++count);
      if (!await c.sleep(320)) return false;
    }
    md.innerHTML = done.join('');
    return true;
  }
  /* A note written into the page: {{ }} the writer's own, red and never printed; [[ ]] in the script, blue,
     for whoever reads it. Loose lists them under On the page, with the page they are on. */
  async function pageNote(c, el, words, own) {
    var span = document.createElement('span'); span.className = 'nt-m ' + (own ? 'nt-m--red' : 'nt-m--blue');
    el.appendChild(document.createTextNode(' ')); el.appendChild(span);
    var open = own ? '{{' : '[[', shut = own ? '}}' : ']]';
    keys(open.split(''), own ? 'a note to yourself · never printed' : 'a note in the script · for whoever reads it');
    if (!await typeIn(c, span, open + words + shut, { speed: 60 })) return false;
    var li = document.createElement('li'); li.className = 'is-new';
    li.innerHTML = '<span>' + esc(open + words + shut) + '</span><span>p. 1</span>';
    pnotesList.appendChild(li); pnotes.hidden = false;
    pnotesN.textContent = 'On the page · ' + pnotesList.children.length;
    return true;
  }
  async function press(c, el, fx, fy, wait) {
    moveTo(at(el, fx == null ? 0.5 : fx, fy == null ? 0.5 : fy));
    return c.sleep(wait || 850);
  }
  async function notesPlay(c) {
    pageAWhole(); notesStart(); hooks.setStop(3); draft('Draft 2');
    keys(['⇧', '⌘', 'I'], 'Notes, beside the page');
    if (!await c.sleep(1400)) return false;

    // words selected on the page: the lines part above them and the highlight row stands in the room
    var full = actLine.textContent, word = 'a brass lighter on the bar', i0 = full.indexOf(word), sel;
    function paint(n, pen) {
      actLine.innerHTML = esc(full.slice(0, i0)) + (pen ? '<mark class="hl" style="--pen:' + PEN + '">' : '') +
        (n ? '<span class="rg__sel">' + esc(full.slice(i0, i0 + n)) + '</span>' : '<span class="rg__sel"></span>') +
        (pen ? '</mark>' : '') + esc(full.slice(i0 + n));
      return $('.rg__sel', actLine);
    }
    sel = paint(0);
    if (!await press(c, sel, 0, 0.7, 1000)) return false;
    keys(['drag'], 'words on the page');
    pointer.style.transition = 'transform .1s linear';
    for (var n = 1; n <= word.length; n++) { sel = paint(n); moveTo(at(sel, 1, 0.7)); if (!await c.sleep(36)) return false; }
    pointer.style.transition = '';
    var row = partedRow(actLine); moveTo(at(sel, 1, 0.7));
    keys([], 'the lines part · Highlight, the pens, a note');
    if (!await c.sleep(1700)) return false;
    paint(word.length, true); keys(['⇧', '⌘', 'H'], 'highlight · in the last pen used');
    if (!await c.sleep(1300)) return false;
    // a click away: the row goes, the pen stays, and the words are a note in Loose
    if (!await press(c, lines[4].el, 0.9, 0.5, 700)) return false;
    row.remove();
    actLine.innerHTML = esc(full.slice(0, i0)) + '<mark class="hl" style="--pen:' + PEN + '">' + esc(word) + '</mark>' + esc(full.slice(i0 + word.length));
    looseCount(2); loose.classList.add('is-new'); keys([], 'kept as a note in Loose, with its scene');
    if (!await c.sleep(1300)) return false;

    // Loose opened, the note on it; the note opened, to half the window
    if (!await press(c, loose, 0.3, 0.6)) return false;
    view('stack'); hlNote.hidden = false; hlNote.classList.add('is-new');
    if (!await c.sleep(1500)) return false;
    if (!await press(c, hlNote, 0.7, 0.5)) return false;
    pointerOff(); view('open'); keys([], 'a note opens to half the window');
    if (!await c.sleep(1100)) return false;
    if (!await noteWrite(c, NOTE)) return false;
    if (!await c.sleep(1200)) return false;
    if (!await press(c, cardsView, 0.5, 0.5, 700)) return false;
    view('stack'); hlBody.innerHTML = cardLines(NOTE); pointerOff(); keys([], 'back to cards');
    if (!await c.sleep(1300)) return false;

    // notes typed straight onto the page, listed on Loose
    if (!await pageNote(c, actLine, 'he wants her to ask', true)) return false;
    if (!await c.sleep(800)) return false;
    if (!await pageNote(c, mayLine, 'softer?', false)) return false;
    if (!await c.sleep(1300)) return false;

    // back to the stacks: the note's box is a to-do now, with the note it came from
    if (!await press(c, back, 0.3, 0.5, 700)) return false;
    view('top'); pointerOff();
    var li = document.createElement('li'); li.className = 'is-new'; li.innerHTML = '<i></i><span>find a brass Zippo</span><em>a brass lighter on the bar</em>';
    todos.appendChild(li); todoCount.textContent = 'To do · 2 open'; keys([], 'the box in the note is a to-do');
    if (!await c.sleep(1900)) return false;

    // a file from outside the app, dropped on the column: the Inbox reads it and says what each piece is
    var s = screen.getBoundingClientRect(), cy = s.height * 0.4;
    file.style.transition = 'none'; file.style.transform = 'translate(' + (s.width + 40) + 'px,' + cy + 'px)'; file.hidden = false;
    pointer.style.transition = 'none'; moveTo({ x: s.width + 70, y: cy + 30 });
    void file.offsetWidth; file.style.transition = ''; pointer.style.transition = '';
    keys(['drag'], 'a file, from outside Margin');
    if (!await c.sleep(120)) return false;
    var t = at(notes, 0.42, 0.62);
    file.style.transform = 'translate(' + t.x + 'px,' + t.y + 'px)'; moveTo({ x: t.x + 30, y: t.y + 30 });
    if (!await c.sleep(1200)) return false;
    notes.classList.add('is-drop'); drop.hidden = false;
    if (!await c.sleep(1200)) return false;
    file.hidden = true; drop.hidden = true; notes.classList.remove('is-drop'); pointerOff();
    inbox.classList.add('is-open'); inboxOpen.hidden = false; inboxN.textContent = 'Inbox · 2 new · from 1 place';
    keys([], 'cut into pieces · each says what it is, where it would go, and why');
    if (!await c.sleep(3400)) return false;
    if (!await press(c, keepAll, 0.5, 0.55, 850)) return false;
    keepAll.classList.add('is-press');
    if (!await c.sleep(250)) return false;
    keepAll.classList.remove('is-press'); pointerOff();
    inbox.classList.remove('is-open'); inboxOpen.hidden = true; inboxN.textContent = 'Inbox · nothing waiting';
    var kept = document.createElement('li'); kept.className = 'is-new'; kept.innerHTML = '<i></i><span>Ask the harbour master about filming at dawn</span>';
    todos.appendChild(kept); todoCount.textContent = 'To do · 3 open';
    keys([], 'kept · the to-do in To do, the question in the Bible');
    return c.sleep(2600);
  }

  /* ---- 4. the split: a line changed in the new draft, marked on both sides, and merged up ---------------- */
  var bLine = pageB ? $('.sc-dlg.rv', pageB) : null, aLine = lines[5] && lines[5].el;
  var bText = bLine ? bLine.textContent : '', aText = aLine ? aLine.textContent : '';
  var bCount = $('#rg-count-b', rg), bHead = $('.wy__pg--b .hw__name', rg), menu = $('.rg__menu', rg);
  function splitStart() {
    if (!bLine) return;
    bLine.className = 'sc-dlg'; bLine.textContent = aText;
    if (aLine) { aLine.classList.remove('was', 'is-merged'); aLine.textContent = aText; }
    if (bCount) bCount.textContent = '';
    if (menu) menu.hidden = true;
  }
  function splitDone() {
    if (!bLine) return;
    bLine.className = 'sc-dlg rv wash'; bLine.textContent = bText;
    if (aLine) { aLine.classList.remove('is-merged'); aLine.classList.add('was'); aLine.textContent = aText; }
    if (bCount) bCount.textContent = '+1 −1';
    if (menu) menu.hidden = true;
  }
  async function split(c) {
    pageAWhole(); splitStart(); hooks.setStop(4); draft('Draft 2a');
    keys(['⌥', '⌘', '\\'], 'the draft before, beside it');
    if (!await c.sleep(1500)) return false;
    moveTo(at(bLine, 1, 0.6));
    if (!await c.sleep(800)) return false;
    pointerOff(); keys([], 'written in, in either half');
    if (!await erase(c, bLine, 45)) return false;
    if (!await typeIn(c, bLine, bText, { speed: 85 })) return false;
    splitDone(); keys([], 'what changed is marked on both sides');
    if (!await c.sleep(2000)) return false;
    // the merge, from the name over the draft
    var h = at($('span', bHead), 0.5, 0.6);
    moveTo(h);
    if (!await c.sleep(900)) return false;
    menu.hidden = false;
    var sw = screen.getBoundingClientRect().width;
    menu.style.left = Math.min(h.x + 4, sw - menu.offsetWidth - 12) + 'px'; menu.style.top = (h.y + 8) + 'px';
    keys(['right-click'], 'the draft’s name');
    if (!await c.sleep(900)) return false;
    var item = $('b', menu); moveTo(at(item, 0.35, 0.6)); item.classList.add('is-on');
    if (!await c.sleep(800)) return false;
    item.classList.remove('is-on'); menu.hidden = true; pointerOff();
    aLine.classList.remove('was'); aLine.textContent = bText; aLine.classList.add('is-merged');
    bLine.className = 'sc-dlg'; bCount.textContent = 'merged';
    keys([], 'merged · Draft 2 takes the line');
    return c.sleep(2600);
  }

  var PLAY = [bare, cmdk, board, notesPlay, split];
  /* what each stop's finished state says under the window, with nothing playing */
  var REST = [null, [['⌘', 'K'], 'opens under the line you are on'], [['⌥', '⌘', '2'], 'the board, beside the page'],
    [['⇧', '⌘', 'I'], 'Notes, beside the page'], [['⌥', '⌘', '\\'], 'the draft before, beside it']];
  function reset() {
    pointerOff(); keysOff(); $$('.rg__ghost', rg).forEach(function (g) { g.remove(); });
    pageAWhole(); boardStart(); notesStart(); splitDone();
    if (typed) typed.textContent = '';
    if (todoRow) { todoRow.hidden = true; addedRow.hidden = true; }
  }
  window.MarginRange = {
    init: function (h) { hooks = h; reset(); },
    play: function (n, c) { reset(); return PLAY[n](c); },
    /* the finished state of a stop: what the static page shows, for reduced motion and when a stop is let go */
    finish: function (n) {
      reset(); hooks.setStop(n); draft(n === 4 ? 'Draft 2a' : 'Draft 2');
      if (n === 1 && typed) { typed.textContent = 'new draft'; shelfShow('new draft'); }
      if (REST[n]) { keys(REST[n][0], REST[n][1]); keysEl.classList.remove('is-on'); }
    }
  };
})();

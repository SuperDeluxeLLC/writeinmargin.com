/* Margin site: the ⌘K page's three demos. Uses MarginSite (base.js).
   The static HTML is each demo's finished state; nothing waits on this file.
   ⌘K is drawn as the app draws it: a shelf set into the page under the caret's line, in the
   page's own face, the eyebrows in its margin and the keys for what you are doing at its foot. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;

  /* rows: [eyebrow, title, detail, class] */
  function fill(ol, list) {
    ol.innerHTML = '';
    list.forEach(function (r) {
      var li = document.createElement('li');
      if (r[3]) li.className = r[3];
      [['ck-eye', r[0]], ['ck-t', r[1]], ['ck-d', r[2] || '']].forEach(function (p) {
        var s = document.createElement('span'); s.className = p[0]; s.textContent = p[1]; li.appendChild(s);
      });
      ol.appendChild(li);
    });
  }
  var SP = '   ';
  function keys(list) { return list.join(SP); }

  /* ---- the hero: four things done from ⌘K on one page -------------------------------------- */
  var hero = $('#ck-hero');
  if (hero) {
    var pal = $('#ck-pal', hero), typed = $('#ck-typed', hero), rows = $('#ck-rows', hero), foot = $('#ck-foot', hero);
    var sprint = $('#ck-sprint', hero), line = $('#ck-line', hero);
    var names = $$('[data-name]', hero);
    var ticker = null;
    var MOVE = keys(['↑↓ move', 'return takes it', 'esc back to the page']);
    var ADDED = keys(['return adds it', '/ another list', 'esc done']);
    var HINT = ['', 'Type the next and press return · / another list · esc when you’re done', '', 'is-hint'];
    var LISTS = [['To do', 'Loose · To do', '3 to do', 'is-on'], ['To do', 'Act two · To do', '5 to do'], ['To do', 'Derek · To do', '2 to do']];
    var PROPS = [['To do', 'New list: Props', 'a new stack', 'is-on'], ['To do', 'Loose · To do', '3 to do']];

    function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }
    function settle() {
      stopTicker();
      pal.hidden = false;
      typed.textContent = 'todo ';
      fill(rows, [['Added', '✓ buy film', 'Props', 'is-added'], ['Added', '✓ call Sam', 'Props', 'is-added'], HINT]);
      foot.textContent = ADDED;
      names.forEach(function (n) { n.textContent = 'MAYA'; n.classList.remove('is-lit'); });
      $$('.is-found', hero).forEach(function (n) { n.classList.remove('is-found'); });
      sprint.hidden = true;
    }
    function reset() { settle(); pal.hidden = true; typed.textContent = ''; rows.innerHTML = ''; }

    async function ask(c, words, list) {
      pal.hidden = false;
      typed.textContent = '';
      rows.innerHTML = '';
      foot.textContent = MOVE;
      if (!(await c.sleep(260))) return false;
      if (!(await c.type(typed, words, { speed: 34 }))) return false;
      fill(rows, list);
      if (!(await c.sleep(650))) return false;
      pal.hidden = true;                                       // Return
      return c.sleep(220);
    }

    MS.player(hero, {
      settle: settle,
      reset: reset,
      replay: '#ck-replay',
      play: async function (c) {
        if (!(await ask(c, 'rename Maya to Mia', [['Do', 'Rename Maya to Mia everywhere', '2 cues, 1 mention', 'is-on']]))) return;
        names.forEach(function (n) { n.textContent = 'MIA'; n.classList.add('is-lit'); });
        if (!(await c.sleep(1100))) return;
        names.forEach(function (n) { n.classList.remove('is-lit'); });

        if (!(await ask(c, 'find kettle', [['Line', 'The kettle starts to scream. Nobody moves.', 'Nurses’ station', 'is-on'],
                                           ['Line', 'MIA turns the kettle off without looking.', 'Nurses’ station']]))) return;
        var first = hero.querySelector('.ck-page p:nth-child(2)');
        if (first) first.classList.add('is-found');
        if (!(await c.sleep(1100))) return;
        if (first) first.classList.remove('is-found');

        if (!(await ask(c, 'sprint 25', [['Do', 'Start a 25-minute sprint', '', 'is-on']]))) return;
        sprint.hidden = false;
        var left = 25 * 60, b = sprint.querySelector('b');
        stopTicker();
        ticker = setInterval(function () {
          left -= 1;
          if (b) b.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
        }, 1000);
        if (!(await c.sleep(1200))) return;

        // a to-do: the rows are the lists; a slash and a new name makes one; ⌘K stays open for the next
        pal.hidden = false; typed.textContent = ''; rows.innerHTML = '';
        foot.textContent = keys(['↑↓ picks the list', '/ finds one or makes one', 'return adds it']);
        if (!(await c.sleep(260))) return;
        if (!(await c.type(typed, 'todo buy film', { speed: 34 }))) return;
        fill(rows, LISTS);
        if (!(await c.sleep(1100))) return;
        if (!(await c.type(typed, 'todo buy film /props', { speed: 60, startAt: 13 }))) return;
        fill(rows, PROPS);
        if (!(await c.sleep(1000))) return;
        typed.textContent = 'todo ';                            // Return
        fill(rows, [['Added', '✓ buy film', 'Props', 'is-added'], HINT]);
        foot.textContent = ADDED;
        if (line) line.classList.add('is-found');
        if (!(await c.sleep(500))) return;
        if (line) line.classList.remove('is-found');
        if (!(await c.sleep(400))) return;
        if (!(await c.type(typed, 'todo call Sam', { speed: 40, startAt: 5 }))) return;
        if (!(await c.sleep(450))) return;
        typed.textContent = 'todo ';
        fill(rows, [['Added', '✓ buy film', 'Props', 'is-added'], ['Added', '✓ call Sam', 'Props', 'is-added'], HINT]);
      }
    });
  }

  /* ---- the note: the title typed, a stack picked, the rest written right there ------------------ */
  var nd = $('#ck-note-demo');
  if (nd) {
    var kN = $('#ckn-k', nd), typedN = $('#ckn-typed', nd), rowsN = $('#ckn-rows', nd), whereN = $('#ckn-where', nd);
    var writeN = $('#ckn-write', nd), footN = $('#ckn-foot', nd);
    var BODY = 'Third time it eats his pound.\nHe starts talking to it.';
    var STACKS = [['Note', 'Loose', '3 notes', 'is-on'], ['Note', 'Act two', '5 notes'], ['Note', 'Derek', '2 notes'], ['Note', 'Research', '4 notes']];
    var PICKED = [['Note', 'Derek', '2 notes', 'is-on'], ['Note', 'Loose', '3 notes']];
    var PICK = keys(['↑↓ picks the stack', '/ finds one', 'return writes the rest', '⇧return keeps the title alone']);
    var WRITE = keys(['⌘return done', 'esc done too', '⌘/ another stack', 'return a new line']);
    function writing(text) {
      kN.textContent = 'Note';
      typedN.textContent = 'The vending machine wins'; typedN.classList.add('is-title');
      whereN.textContent = 'in Derek · kept as you type';
      rowsN.hidden = true; writeN.hidden = false; writeN.textContent = text;
      footN.textContent = WRITE;
    }
    function settle() { writing(BODY); }
    function reset() {
      kN.textContent = '⌘K'; typedN.textContent = ''; typedN.classList.remove('is-title'); whereN.textContent = '';
      rowsN.hidden = false; rowsN.innerHTML = ''; writeN.hidden = true; writeN.textContent = '';
      footN.textContent = PICK;
    }
    MS.player(nd, {
      settle: settle,
      reset: reset,
      replay: '#ckn-replay',
      play: async function (c) {
        if (!(await c.sleep(300))) return;
        if (!(await c.type(typedN, 'note The vending machine wins', { speed: 34 }))) return;
        fill(rowsN, STACKS);
        if (!(await c.sleep(1400))) return;
        if (!(await c.type(typedN, 'note The vending machine wins /de', { speed: 70, startAt: 28 }))) return;
        fill(rowsN, PICKED);
        if (!(await c.sleep(1100))) return;
        writing('');                                           // Return
        if (!(await c.sleep(500))) return;
        await c.type(writeN, BODY, { speed: 38 });
      }
    });
  }

  /* ---- the question: typed, three dots while the reader reads, then the answer word by word ---------- */
  var rd = $('#ck-room-demo');
  if (rd) {
    var typedR = $('#ckr-typed', rd), whoR = $('#ckr-who', rd), convo = $('#ckr-convo', rd), footR = $('#ckr-foot', rd);
    var rowsR = $('.ck-rows', rd);
    var ASK = keys(['↑↓ move', 'return asks', '⇧return asks in a new room', '⌘return goes on in the room', 'esc back to the page']);
    var READING = keys(['⌘. stops', '⌘return goes on in the room', 'esc back to the page, and it keeps answering']);
    var AFTER = [['Note', 'Keep as a note', 'Loose (in no stack) · / picks a stack', 'is-on'], ['Room', 'Go on in the room', '⌘return'], ['Room', 'Start a new room', '⇧return asks in one']];
    var THINKING = [['Room', 'Stop', '⌘.', 'is-on'], ['Room', 'Go on in the room', '⌘return']];
    var TURNS = [
      { q: 'why does Derek keep feeding the machine', a: 'Because it is the one thing on the ward that answers him back. The third time it eats his pound he starts talking to it.', chip: 'Sc 9 · p. 31' },
      { q: 'does it ever pay off', a: 'Yes. In 14 it drops a Twix for May, not him, and he takes it as a betrayal.', chip: 'Sc 14 · p. 52' }
    ];
    var settledHTML = convo.innerHTML, held = 0;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
    function settle() {
      convo.innerHTML = settledHTML; typedR.textContent = ''; whoR.textContent = 'This Mac';
      fill(rowsR, AFTER); footR.textContent = ASK;
    }
    function reset() {
      if (!held) { held = convo.offsetHeight; convo.style.minHeight = held + 'px'; }   // no jump as it fills
      convo.innerHTML = ''; typedR.textContent = ''; whoR.textContent = 'This Mac';
      fill(rowsR, AFTER); footR.textContent = ASK;
    }
    async function turn(c, t) {
      if (!(await c.type(typedR, t.q, { speed: 38 }))) return false;
      if (!(await c.sleep(380))) return false;
      typedR.textContent = '';                                  // Return
      var ex = el('div', 'ck-ex'), q = el('p', 'ck-q'), a = el('p', 'ck-a');
      q.appendChild(el('span', '', t.q));
      var words = el('span', 'ck-aw'), dots = el('span', 'ck-dots'), chips = el('span', 'ck-chips');
      dots.setAttribute('aria-label', 'reading');
      dots.innerHTML = '<i></i><i></i><i></i>';
      a.appendChild(dots); a.appendChild(words); a.appendChild(chips);
      ex.appendChild(q); ex.appendChild(a); convo.appendChild(ex);
      whoR.textContent = 'This Mac · reading'; fill(rowsR, THINKING); footR.textContent = READING;
      if (!(await c.sleep(1400))) return false;
      a.removeChild(dots);
      var cur = el('span', 'ck-cur'); cur.setAttribute('aria-hidden', 'true');
      var list = t.a.split(' ');
      for (var i = 0; i < list.length; i++) {
        words.textContent = list.slice(0, i + 1).join(' ');
        words.appendChild(cur);
        if (!(await c.sleep(MS.reduced ? 0 : 70))) return false;
      }
      words.textContent = t.a;
      chips.appendChild(el('span', 'ck-chip', t.chip));
      whoR.textContent = 'This Mac'; fill(rowsR, AFTER); footR.textContent = ASK;
      return true;
    }
    MS.player(rd, {
      settle: settle,
      reset: reset,
      replay: '#ckr-replay',
      play: async function (c) {
        if (!(await c.sleep(400))) return;
        if (!(await turn(c, TURNS[0]))) return;
        if (!(await c.sleep(1200))) return;
        await turn(c, TURNS[1]);
      }
    });
  }
})();

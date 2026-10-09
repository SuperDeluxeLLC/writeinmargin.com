/* Home, section 6: Share (a file falls out of each row, the rows change with the kind) and the
   eleven revision colours. The paperback interior's spread lives on the novel page. Static HTML is the finished state. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$, $$ = MS.$$;

  /* ---- Share ---------------------------------------------------------------------------------- */
  var share = $('#share-demo');
  if (share) (function () {
    var KINDS = {
      sp: { title: 'The Lighter', rows: [['PDF', 'The Lighter.pdf', 'The Lighter.pdf', 'PDF'], ['Final Draft', 'The Lighter.fdx', 'The Lighter.fdx', 'FDX'], ['Fountain', 'The Lighter.fountain', 'The Lighter.fountain', 'FOUNTAIN'], ['Production reports', 'The Lighter, reports.pdf', 'The Lighter, reports.pdf', 'PDF']] },
      nv: { title: 'Low Water at Skerry', rows: [['Manuscript', 'a Word file', 'Low Water at Skerry.docx', 'DOCX'], ['ePub', 'for e-readers', 'Low Water at Skerry.epub', 'EPUB'], ['PDF', 'pages as they print', 'Low Water at Skerry.pdf', 'PDF'], ['Paperback interior…', 'for the printer', 'Low Water at Skerry, interior.pdf', 'PDF']] },
      ar: { title: 'The second signature', rows: [['Word', 'the editor’s file', 'The second signature.docx', 'DOCX'], ['Word with changes since…', 'tracked for the editor', 'The second signature, changes.docx', 'DOCX'], ['PDF', 'pages as they print', 'The second signature.pdf', 'PDF'], ['Markdown', 'plain text', 'The second signature.md', 'MD']] }
    };
    var kind = 'sp', rows = $('#sh2-rows'), desk = $('#sh2-desk'), title = $('#sh2-title'), wtitle = $('#sh2-wtitle'), seg = $('#sh2-kinds');
    var PAGE = function (t) { return '<span class="file__sheet" data-t="' + esc(t) + '" aria-hidden="true"></span>'; };

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function paintRows() {
      var k = KINDS[kind]; title.textContent = k.title; if (wtitle) wtitle.textContent = k.title;
      rows.innerHTML = k.rows.map(function (r, i) { return '<li><button type="button" class="sh2__row" data-i="' + i + '"><b>' + esc(r[0]) + '</b><span>' + esc(r[2]) + '</span></button></li>'; }).join('');
    }
    function drop(i, quiet) {
      var r = KINDS[kind].rows[i], f = document.createElement('div');
      f.className = 'file' + (MS.reduced || quiet ? '' : ' is-new'); f.setAttribute('role', 'listitem');
      f.innerHTML = PAGE(r[3]) + '<b class="file__ext">' + esc(r[3]) + '</b><span class="file__name">' + esc(r[2]) + '</span>';
      var same = $$('.file', desk).filter(function (x) { return $('.file__name', x).textContent === r[2]; })[0];
      if (same) same.remove();
      desk.appendChild(f);
      var all = $$('.file', desk); if (all.length > 6) all[0].remove();
    }
    function settleKind() { paintRows(); desk.innerHTML = ''; [0, 1, 2].forEach(function (i) { drop(i, true); }); }

    var player = MS.player(share, {
      delay: 300, threshold: 0.45, replay: '#sh2-replay',
      settle: settleKind,
      reset: function () { paintRows(); desk.innerHTML = ''; },
      play: async function (c) {
        for (var i = 0; i < 3; i++) {
          if (!await c.sleep(i ? 750 : 900)) return;
          var b = $$('.sh2__row', rows)[i]; b.classList.add('is-press');
          if (!await c.sleep(200)) return;
          drop(i); b.classList.remove('is-press');
        }
      }
    });
    rows.addEventListener('click', function (e) {
      var b = e.target.closest('.sh2__row'); if (!b) return;
      if (player.settle) { var had = $$('.file', desk).length; if (had < 1) { desk.innerHTML = ''; } }
      drop(+b.getAttribute('data-i'));
    });
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      kind = b.getAttribute('data-kind');
      $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      player.play();
    });
    seg.hidden = false; $('#sh2-replay').hidden = false;
  })();

  /* ---- the eleven colours ---------------------------------------------------------------------- */
  var passes = $('#passes-demo');
  if (passes) (function () {
    var sheet = $('#pass-sheet'), label = $('#pass-label'), head = $('#pass-head'), btns = $$('.pass', passes);
    function pick(btn) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      sheet.setAttribute('data-rev', btn.getAttribute('data-rev'));
      label.textContent = btn.getAttribute('data-rev') === 'white' ? 'White draft' : btn.textContent + ' Revision';
      head.textContent = btn.getAttribute('data-rev') === 'white' ? '' : btn.textContent + ' Revision \u00B7 1 Oct 2026';
    }
    var player = MS.player(passes, {
      delay: 400, threshold: 0.3,
      settle: function () { pick(btns[1]); },
      reset: function () { pick(btns[0]); },
      play: async function (c) {
        for (var i = 1; i < btns.length; i++) { if (!await c.sleep(420)) return; pick(btns[i]); }
        if (!await c.sleep(700)) return;
        pick(btns[1]);
      }
    });
    btns.forEach(function (b) { b.addEventListener('click', function () { player.settle(); pick(b); }); });
  })();
})();

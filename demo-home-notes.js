/* Home, section 5: marks and threads typed onto the page (with the thread drawn down the
   outline), and the Apple Pencil's ink staying with its line. Static HTML is the finished state. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;
  var $ = MS.$;

  var mac = $('#notes-mac');
  if (mac) (function () {
    var win = $('.nt__win', mac), plant = $('#nt-plant'), pay = $('#nt-pay'), note = $('#nt-note');
    var tp = plant.textContent, ty = pay.textContent, tn = note.textContent;
    MS.player(mac, {
      delay: 300, threshold: 0.5, replay: '#notes-replay',
      settle: function () { plant.textContent = tp; pay.textContent = ty; note.textContent = tn; win.classList.add('has-plant', 'has-pay'); },
      reset: function () { plant.textContent = ''; pay.textContent = ''; note.textContent = ''; win.classList.remove('has-plant', 'has-pay'); },
      play: async function (c) {
        if (!await c.sleep(600)) return;
        if (!await c.type(plant, tp, { speed: 44 })) return;
        if (!await c.sleep(350)) return;
        win.classList.add('has-plant');
        if (!await c.sleep(700)) return;
        if (!await c.type(pay, ty, { speed: 44 })) return;
        if (!await c.sleep(250)) return;
        win.classList.add('has-pay');
        if (!await c.sleep(1100)) return;
        await c.type(note, tn, { speed: 30 });
      }
    });
    $('#notes-replay').hidden = false;
  })();

  var pen = $('.pen'), box = $('#notes-pencil'), add = $('#pen-add');
  if (pen && box) {
    MS.player(box, {
      delay: 300, threshold: 0.5,
      settle: function () { pen.classList.remove('is-drawing'); },
      reset: function () { pen.classList.remove('is-drawing'); void pen.offsetWidth; pen.classList.add('is-drawing'); },
      play: async function (c) { await c.sleep(3200); pen.classList.remove('is-drawing'); }
    });
    add.hidden = false;
    add.addEventListener('click', function () {
      var on = add.getAttribute('aria-pressed') !== 'true';
      add.setAttribute('aria-pressed', on ? 'true' : 'false');
      add.textContent = on ? 'Take it away' : 'Add a scene above';
      pen.classList.toggle('is-added', on);
    });
  }
})();

/* Margin home page: home.js. Small page-wide behaviour; each demo has its own demo-home-*.js. */
(function () {
  'use strict';
  var MS = window.MarginSite;
  if (!MS) return;

  /* the full privacy policy sits behind one disclosure; a link to it opens it */
  var policy = document.getElementById('policy');
  function openPolicy() {
    if (!policy) return;
    var h = location.hash;
    if (h === '#privacy' || h === '#policy') policy.open = true;
  }
  openPolicy();
  window.addEventListener('hashchange', openPolicy);

  /* the small-screen pages menu: closes on a choice, on Escape and on a press outside it */
  var navm = document.querySelector('.navm details');
  if (navm) {
    navm.addEventListener('click', function (e) { if (e.target.closest('.navm__list a')) navm.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navm.open) { navm.open = false; navm.querySelector('summary').focus(); } });
    document.addEventListener('click', function (e) { if (navm.open && !navm.contains(e.target)) navm.open = false; });
  }
})();

// Fills the "Get the beta" section from release.js, which
// scripts/release-mac-beta.sh writes for every Mac build. The TestFlight
// link is set in testflight.js once Apple has the app.
(function () {
  var release = window.MARGIN_RELEASE || null;
  var testflight = window.MARGIN_TESTFLIGHT || (release && release.testflight) || null;
  var $ = function (id) { return document.getElementById(id); };

  function size(bytes) {
    return bytes >= 1e6 ? (bytes / 1e6).toFixed(0) + " MB" : Math.max(1, Math.round(bytes / 1e3)) + " KB";
  }
  function day(iso) {
    var d = new Date(iso + "T12:00:00Z");
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  }
  function enable(a, href) {
    a.href = href;
    a.removeAttribute("aria-disabled");
  }

  var mac = release && release.mac;
  if (mac && /^https:\/\/github\.com\//.test(mac.url) && /^[0-9a-f]{64}$/.test(mac.sha256)) {
    enable($("mac-get"), mac.url);
    $("mac-get").textContent = "Download for Mac · " + size(mac.bytes);
    $("mac-meta").textContent = "Version " + release.version + " (" + release.build + ") · " + day(release.date) + " · " + mac.minimumOS + " or later";
    $("mac-sha").textContent = mac.sha256;
    $("mac-sum").hidden = false;
    if (mac.notarized) {
      $("mac-gate").textContent = "Open it like any other app. Apple has checked this build.";
    }
  } else {
    $("mac-meta").textContent = "The first Mac build is on its way.";
  }

  $("mac-copy").addEventListener("click", function () {
    var text = $("mac-sha").textContent, button = this;
    var done = function () { button.textContent = "Copied"; setTimeout(function () { button.textContent = "Copy"; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  });

  if (testflight && /^https:\/\/testflight\.apple\.com\//.test(testflight)) {
    enable($("ios-get"), testflight);
    $("ios-wait").hidden = true;
  }

  // Put the visitor's own device first.
  var ua = navigator.userAgent || "";
  var touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  var onIOS = /iPhone|iPad|iPod/.test(ua) || touchMac;
  var onMac = /Macintosh/.test(ua) && !touchMac;
  var here = onIOS ? $("way-ios") : onMac ? $("way-mac") : null;
  if (here) {
    here.classList.add("here");
    if (onIOS) here.parentNode.insertBefore(here, here.parentNode.firstChild);
  }
})();

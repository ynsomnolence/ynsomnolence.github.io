(function () {
  var d = document.documentElement;
  if (window.self !== window.top) {
    d.style.display = 'none';
    try { window.top.location.replace(window.self.location.href); } catch (e) {}
    return;
  }
  d.classList.add('is-loading');
  window.__kawaFallback = function (motivo) {
    if (window.__kawaReady || window.__kawaDown) return;
    window.__kawaDown = true;
    d.classList.remove('js', 'is-loading');
    d.classList.add('no-app');
  };
  setTimeout(function () { if (!window.__kawaBooted && !window.__kawaAsking) window.__kawaFallback('tempo esgotado'); }, 7000);
})();

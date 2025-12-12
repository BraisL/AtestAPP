// AtestAPP — autoajuste de altura del iframe (sin scroll interno)
(function () {
  'use strict';

  function notificarAltura() {
    // Si no estamos dentro de un iframe, no hacemos nada.
    if (window.parent === window) return;

    const altura = Math.max(
      document.body?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0
    );

    if (!Number.isFinite(altura) || altura <= 0) return;
    window.parent.postMessage({ type: 'resize-iframe', height: altura }, '*');
  }

  window.addEventListener('load', notificarAltura);

  if ('ResizeObserver' in window) {
    try {
      new ResizeObserver(notificarAltura).observe(document.body);
    } catch (_) {
      // fallback abajo
    }
  }

  // Fallback básico
  window.addEventListener('resize', notificarAltura);
})();

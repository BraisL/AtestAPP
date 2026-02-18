// AtestAPP — lógica del "shell" (header + navegación + iframe)
(function () {
  'use strict';

  const U = window.UtilidadesAtestapp;
  const CLAVE_DATOS_UNIDAD = U?.CLAVES_LOCALSTORAGE?.DATOS_UNIDAD || 'datosUnidad';

  const REMOTE_VERSION_URLS = [
    'https://raw.githubusercontent.com/BraisL/AtestAPP/main/ui/js/version.js',
    'https://raw.githack.com/BraisL/AtestAPP/main/ui/js/version.js'
  ];

  function parseSemver(v) {
    const m = String(v || '').trim().match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!m) return [0, 0, 0];
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  }

  function isRemoteNewer(remote, local) {
    const A = parseSemver(remote);
    const B = parseSemver(local);
    for (let i = 0; i < 3; i++) {
      if (A[i] !== B[i]) return A[i] > B[i];
    }
    return false;
  }

  function safeClone(obj) {
    try { return obj ? JSON.parse(JSON.stringify(obj)) : null; } catch (_) { return null; }
  }

  function getLocalVersionFallback() {
    const el = document.getElementById('version');
    const v = el?.dataset?.appVersion ? String(el.dataset.appVersion).trim() : '';
    return v || '0.0.0';
  }

  function renderHeaderTitleVersion(localVersion) {
    const host = document.querySelector('.header-center');
    if (!host) return;

    let vEl = document.getElementById('header-app-version');
    if (!vEl) {
      vEl = document.createElement('span');
      vEl.id = 'header-app-version';
      vEl.style.fontSize = '0.65em';
      vEl.style.fontWeight = '400';
      vEl.style.marginLeft = '0.35em';
      vEl.style.opacity = '0.85';

      const strong = host.querySelector('strong');
      if (strong) strong.insertAdjacentElement('afterend', vEl);
      else host.appendChild(vEl);
    }

    vEl.textContent = `v${localVersion}`;
  }

  function renderVersionUI(localVersion, latestVersionOrNull) {
    const el = document.getElementById('version');
    if (!el) return;

    if (latestVersionOrNull) {
      const latest = String(latestVersionOrNull).trim();
      el.innerHTML = `<span id="version-update">Versión ${latest} disponible</span>`;
    } else {
      el.textContent = '';
    }
  }

  function hideHeaderUpdateButton() {
    const a = document.getElementById('btn-update');
    if (a) a.style.display = 'none';
  }

  function ensureHeaderUpdateButton(latest) {
    const host = document.getElementById('version-update') || document.getElementById('version');
    if (!host) return;

    let a = document.getElementById('btn-update');
    if (!a) {
      a = document.createElement('a');
      a.id = 'btn-update';
      a.target = '_blank';
      a.rel = 'noopener';
      a.style.marginLeft = '0.35em';
      a.style.textDecoration = 'none';
      a.style.cursor = 'pointer';
      a.style.display = 'none';
      a.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i>';
    }

    a.href = latest.downloadUrl || latest.pageUrl || 'https://github.com/BraisL/AtestAPP/releases/latest';
    a.title = `Descargar actualización v${latest.version}`;
    a.style.display = 'inline-block';

    host.insertAdjacentElement('afterend', a);
  }

  function ensureUpdateMenuLink(latest) {
    const infoDropdown = document.querySelector('.dropbtn-info')?.parentElement?.querySelector('.dropdown-content');
    if (!infoDropdown) return;

    let a = document.getElementById('menu-actualizacion');
    if (!a) {
      a = document.createElement('a');
      a.id = 'menu-actualizacion';
      a.target = '_blank';
      infoDropdown.prepend(a);
    }

    a.href = latest.downloadUrl || latest.pageUrl || 'https://github.com/BraisL/AtestAPP/releases/latest';
    a.textContent = `Disponible la v${latest.version}`;
    a.title = latest.notes ? latest.notes : `Nueva versión: v${latest.version}`;
  }

  // --------- MEJORAS A) y B) ---------

  function looksLikeVersionManifest(jsText) {
    const t = String(jsText || '').trim();
    if (!t) return false;

    // Cortafuegos contra portales cautivos / HTML / errores
    if (t.startsWith('<!doctype') || t.startsWith('<html') || t.startsWith('<HTML')) return false;

    // Heurística: el manifest debe tocar ATESTAPP_LATEST y tener "version"
    if (!/ATESTAPP_LATEST/.test(t)) return false;
    if (!/version\s*[:=]/i.test(t)) return false;

    return true;
  }

  function cleanupOldRemoteMarkers() {
    // Por si en algún momento se volvió a la técnica de <script> y quedaron restos:
    // No rompe nada si no existen.
    document.querySelectorAll('script[data-atestapp-remote="1"]').forEach(s => {
      try { s.remove(); } catch (_) {}
    });
  }

  function loadRemoteManifest(localSnapshot, cb) {
    try { window.ATESTAPP_LATEST = undefined; } catch (_) {}

    let i = 0;
    cleanupOldRemoteMarkers();

    const tryNext = () => {
      if (i >= REMOTE_VERSION_URLS.length) {
        if (localSnapshot) window.ATESTAPP_LATEST = localSnapshot;
        return cb && cb(new Error('No se pudo cargar un manifest remoto válido'), null);
      }

      const baseUrl = REMOTE_VERSION_URLS[i++];

      // cache-busting + sin caché del navegador
      const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + Date.now();

      fetch(url, { cache: 'no-store' })
        .then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(js => {
          // Debug útil para pillar HTML de portal cautivo
          console.log('[AtestApp] version.js remoto recibido (primeros 120 chars):', String(js).slice(0, 120));

          // MEJORA A: validar antes de eval
          if (!looksLikeVersionManifest(js)) {
            console.warn('[AtestApp] Respuesta remota no parece un manifest válido (posible portal cautivo/bloqueo):', baseUrl);
            return tryNext();
          }

          // Ejecuta el JS remoto en el contexto actual
          (0, eval)(js);

          const latest = window.ATESTAPP_LATEST;
          if (latest && typeof latest === 'object' && latest.version) {
            return cb && cb(null, latest);
          }

          console.warn('[AtestApp] Manifest remoto sin ATESTAPP_LATEST.version:', baseUrl);
          tryNext();
        })
        .catch(err => {
          console.warn('[AtestApp] No se pudo cargar manifest remoto:', baseUrl, err);
          tryNext();
        });
    };

    tryNext();
  }

  function checkUpdates() {
    const localSnapshot = safeClone(window.ATESTAPP_LATEST);
    const localVersion = (localSnapshot && localSnapshot.version)
      ? String(localSnapshot.version).trim()
      : getLocalVersionFallback();

    renderHeaderTitleVersion(localVersion);
    renderVersionUI(localVersion, null);
    hideHeaderUpdateButton();

    loadRemoteManifest(localSnapshot, (err, latest) => {
      if (localSnapshot) window.ATESTAPP_LATEST = localSnapshot;

      if (err || !latest || !latest.version) {
        console.warn('[AtestApp] No hay manifest remoto válido (ATESTAPP_LATEST.version). Revisa ui/js/version.js en GitHub.');
        return;
      }

      if (isRemoteNewer(latest.version, localVersion)) {
        renderVersionUI(localVersion, latest.version);
        ensureHeaderUpdateButton(latest);
        ensureUpdateMenuLink(latest);
      }
    });
  }

  // Compatibilidad: si existe la clave antigua, la copiamos a la nueva (una vez).
  U?.migrarDatosUnidadSiProcede?.();

  function obtenerDatosUnidad() {
    return (
      U?.leerJsonLocalStorage?.(CLAVE_DATOS_UNIDAD) ||
      U?.leerJsonLocalStorage?.('unitData') ||
      null
    );
  }

  function obtenerEtiquetaUnidad(datosUnidad) {
    if (!datosUnidad) return 'Sin datos de unidad';
    const tipoPuesto = String(datosUnidad.tipopuesto || '').trim();
    const nombreUnidad = String(datosUnidad.nombreunidad || '').trim();
    return (tipoPuesto || nombreUnidad) ? `${tipoPuesto} ${nombreUnidad}`.trim() : 'Sin datos de unidad';
  }

  function actualizarNombreUnidad() {
    const elNombreUnidad = document.getElementById('nombre-unidad');
    if (!elNombreUnidad) return;
    elNombreUnidad.textContent = obtenerEtiquetaUnidad(obtenerDatosUnidad());
  }

  function actualizarFechaHora() {
    const ahora = new Date();

    const hora = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const fecha = ahora.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const elFechaHora = document.getElementById('fecha-hora');
    if (elFechaHora) elFechaHora.textContent = `${hora} | ${fecha}`;
  }

  function iniciarReloj() {
    actualizarFechaHora();
    setTimeout(function tick() {
      actualizarFechaHora();
      setTimeout(tick, 1000 - (Date.now() % 1000));
    }, 1000 - (Date.now() % 1000));
  }

  function cargarPagina(ruta) {
    const marcoContenido = document.getElementById('marco-contenido');
    if (!marcoContenido) return;
    marcoContenido.src = ruta;
  }

  document.addEventListener('DOMContentLoaded', () => {
    iniciarReloj();
    checkUpdates();
    actualizarNombreUnidad();

    document.addEventListener('click', (e) => {
      const enlace = e.target.closest && e.target.closest('a[data-page]');
      if (!enlace) return;
      e.preventDefault();
      cargarPagina(enlace.getAttribute('data-page'));
    });

    window.addEventListener('storage', (e) => {
      if (e.key === CLAVE_DATOS_UNIDAD || e.key === 'unitData') actualizarNombreUnidad();
    });
  });

  window.addEventListener('message', (e) => {
    const datos = e.data;
    if (!datos || typeof datos.type !== 'string') return;

    if (datos.type === 'resize-iframe') {
      const marcoContenido = document.getElementById('marco-contenido');
      if (!marcoContenido) return;
      const altura = Number(datos.height);
      if (!Number.isFinite(altura) || altura <= 0) return;
      marcoContenido.style.height = `${altura}px`;
      return;
    }

    if (datos.type === 'datos-unidad-actualizados') {
      actualizarNombreUnidad();
    }
  });
})();

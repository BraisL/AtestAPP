// AtestAPP — utilidades compartidas (sin dependencias externas)
(function () {
  'use strict';

  const CLAVES_LOCALSTORAGE = {
    // Clave nueva (ES). Se mantiene compatibilidad leyendo también la antigua.
    DATOS_UNIDAD: 'datosUnidad',
    DATOS_UNIDAD_ANTIGUA: 'unitData',
  };

  function leerJsonLocalStorage(clave) {
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return null;
      return JSON.parse(crudo);
    } catch (_) {
      return null;
    }
  }

  function guardarJsonLocalStorage(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
  }

  function borrarLocalStorage(clave) {
    localStorage.removeItem(clave);
  }

  function sanearNombreBaseArchivo(nombre) {
    return (nombre || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  function asegurarExtension(nombreArchivo, extension) {
    const recortado = (nombreArchivo || '').trim();
    if (!recortado) return '';
    const minus = recortado.toLowerCase();
    return minus.endsWith(extension) ? recortado : `${recortado}${extension}`;
  }

  function migrarDatosUnidadSiProcede() {
    const nuevos = localStorage.getItem(CLAVES_LOCALSTORAGE.DATOS_UNIDAD);
    const antiguos = localStorage.getItem(CLAVES_LOCALSTORAGE.DATOS_UNIDAD_ANTIGUA);
    if (!nuevos && antiguos) {
      // Copiar tal cual: el payload es el mismo.
      localStorage.setItem(CLAVES_LOCALSTORAGE.DATOS_UNIDAD, antiguos);
    }
  }

function descargarJson(datos, nombreArchivo) {
  const nombre = String(nombreArchivo || '').trim() || 'datos.json';
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function leerArchivoComoTexto(archivo) {
  return new Promise((resolve, reject) => {
    try {
      const lector = new FileReader();
      lector.onload = (ev) => resolve(String(ev?.target?.result || ''));
      lector.onerror = () => reject(new Error('Error al leer el archivo'));
      lector.readAsText(archivo);
    } catch (e) {
      reject(e);
    }
  });
}

async function leerJsonDeArchivo(archivo) {
  const texto = await leerArchivoComoTexto(archivo);
  return JSON.parse(texto);
}

  // Exponer en window (no ES modules; compatible con <script src="...">)
  window.UtilidadesAtestapp = {
    CLAVES_LOCALSTORAGE,
    leerJsonLocalStorage,
    guardarJsonLocalStorage,
    borrarLocalStorage,
    sanearNombreBaseArchivo,
    asegurarExtension,
    migrarDatosUnidadSiProcede,
    descargarJson,
    leerArchivoComoTexto,
    leerJsonDeArchivo,
  };
})();

// AtestAPP — gestión de datos de unidad
(function () {
  'use strict';

  const U = window.UtilidadesAtestapp;
  const CLAVE_DATOS_UNIDAD = U?.CLAVES_LOCALSTORAGE?.DATOS_UNIDAD || 'datosUnidad';

  function notificarActualizacionAlShell() {
    try {
      window.parent?.postMessage?.({ type: 'datos-unidad-actualizados' }, '*');
    } catch (_) {}
  }

  function asegurarExtensionJson(nombreArchivo) {
    return U?.asegurarExtension ? U.asegurarExtension(nombreArchivo, '.json') : (nombreArchivo || '');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const formularioDatosUnidad = document.getElementById('unit-data-form');
    const botonBorrar = document.getElementById('delete-btn');
    const botonDescargar = document.getElementById('download-btn');
    const entradaSubirJson = document.getElementById('upload-json');

    if (!formularioDatosUnidad) return;

    // Compatibilidad: si vienen datos antiguos, los migramos.
    U?.migrarDatosUnidadSiProcede?.();

    cargarDatosEnFormulario();

    formularioDatosUnidad.addEventListener('submit', (e) => {
      e.preventDefault();
      guardarDatos();
    });

    botonBorrar?.addEventListener('click', () => {
      if (!confirm('¿Está seguro de que quieres borrar todos los datos de la Unidad?')) return;
      U?.borrarLocalStorage?.(CLAVE_DATOS_UNIDAD);
      // mantener compatibilidad y limpiar también la clave antigua
      U?.borrarLocalStorage?.('unitData');
      formularioDatosUnidad.reset();
      notificarActualizacionAlShell();
      alert('Datos borrados correctamente');
    });

    botonDescargar?.addEventListener('click', () => {
      const datosUnidad = obtenerDatosUnidad();
      if (!datosUnidad) {
        alert('No hay datos guardados para descargar');
        return;
      }

      const base = U?.sanearNombreBaseArchivo
        ? U.sanearNombreBaseArchivo(`datos_unidad_${datosUnidad.nombreunidad || ''}`)
        : 'datos_unidad';

      const nombrePorDefecto = asegurarExtensionJson(base || 'datos_unidad');
      const entradaNombre = prompt('Introduzca el nombre del archivo:', nombrePorDefecto);
      const nombreArchivo = asegurarExtensionJson(entradaNombre);
      if (!nombreArchivo) return;

      const contenido = JSON.stringify(datosUnidad, null, 2);
      const blob = new Blob([contenido], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    });

    entradaSubirJson?.addEventListener('change', (e) => {
      const archivo = e.target.files && e.target.files[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = (evento) => {
        try {
          const datos = JSON.parse(evento.target.result);
          rellenarFormulario(datos);
          guardarDatos();
          alert('Datos cargados y guardados correctamente');
        } catch (_) {
          alert('Error al leer el archivo. Asegúrese de que es un JSON válido.');
        }
      };
      lector.readAsText(archivo);
    });

    function obtenerDatosUnidad() {
      return (
        U?.leerJsonLocalStorage?.(CLAVE_DATOS_UNIDAD) ||
        U?.leerJsonLocalStorage?.('unitData') ||
        null
      );
    }

    function guardarDatos() {
      const datosFormulario = new FormData(formularioDatosUnidad);
      const datosUnidad = Object.fromEntries(datosFormulario.entries());
      U?.guardarJsonLocalStorage?.(CLAVE_DATOS_UNIDAD, datosUnidad);
      // compat: mantener actualizada la clave antigua también
      U?.guardarJsonLocalStorage?.('unitData', datosUnidad);
      notificarActualizacionAlShell();
      alert('Datos guardados correctamente');
    }

    function cargarDatosEnFormulario() {
      const datosUnidad = obtenerDatosUnidad();
      if (datosUnidad) rellenarFormulario(datosUnidad);
    }

    function rellenarFormulario(datos) {
      for (const clave in datos) {
        const campo = formularioDatosUnidad.elements[clave];
        if (!campo) continue;
        campo.value = datos[clave];
      }
    }
  });
})();

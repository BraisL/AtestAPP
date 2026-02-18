# AtestApp

Aplicación web local (offline) para redactar diligencias y documentos policiales en España, pensada para ahorrar tiempo, reducir errores y unificar formato en la redacción.

Se ejecuta abriendo `index.html`. La salida final se obtiene mediante el diálogo de impresión del navegador, pudiendo guardarse como PDF.

## Objetivo

Facilitar la labor instructora con una herramienta ligera y portable que permita:
- Redactar documentos con un formato consistente.
- Reutilizar datos para no repetir información.
- Generar PDFs listos para imprimir o archivar.
- Exportar e importar casos/diligencias en JSON para copias de seguridad y traslado entre equipos.

## Qué incluye actualmente

- Datos de unidad guardables en el equipo y export/import en JSON.
- Diligencia libre con paginación automática al imprimir.
- Elementos añadidos gestionados aparte del texto (por ejemplo TIPs, filiaciones y cierres) que se imprimen en su lugar correspondiente.
- Descarga/carga de diligencias en JSON manteniendo compatibilidad con archivos antiguos.

## Requisitos

- Navegador: Chrome.
- No requiere instalación ni conexión a internet para trabajar.

## Privacidad

No se envía información a ningún servidor. Los datos se guardan localmente en el navegador y/o en archivos JSON exportados por el usuario.

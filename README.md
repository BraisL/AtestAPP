# ATESTAPP — V0

Aplicación web local (offline) para la redacción y generación de atestados y documentos policiales.

- **Sin backend**: se ejecuta abriendo `index.html`.
- **Navegadores**: Chrome / Edge.
- **Persistencia**: `localStorage` + exportación/importación en **JSON**.

## Funcionalidades incluidas (V0)

### Shell (aplicación principal)
- Cabecera con **nombre de unidad** y **reloj** (hora + fecha en tiempo real).
- Menú de navegación que carga páginas internas en un **iframe**.
- Autoajuste de la altura del iframe para evitar scroll interno.

### Datos de la unidad
- Formulario para:
  - Comandancia, Compañía, Tipo de puesto, Nombre del puesto.
  - Dirección, Localidad, Provincia, Código postal, Teléfono, Correo.
- Acciones:
  - **Guardar** en `localStorage`.
  - **Borrar** datos guardados.
  - **Descargar** los datos en un archivo `.json`.
  - **Cargar** los datos desde un archivo `.json`.
- La cabecera se actualiza automáticamente al guardar/borrar.

### Diligencias
- **Diligencia libre**:
  - Campos: nº de atestado, folio, nombre de diligencia (obligatorio) y texto.
  - Render sobre plantilla (`ui/assets/diligencia_base.png`).
  - **Previsualización** opcional.
  - **Impresión a PDF** usando el diálogo del navegador.
  - **Paginado automático**: si el texto no cabe, genera páginas adicionales.
  - **Exportar** la diligencia a `.json` y **cargar** desde `.json`.
- **Diligencia libre sin datos**: igual que la anterior, pero **sin insertar datos de unidad** en el pie.

### Secciones en preparación (placeholder)
- Atestado Tipo 1 / Tipo 2 / Tipo 3.
- Documentos.
- Información de interés.

## Persistencia y compatibilidad
- La clave principal de `localStorage` para la unidad es `datosUnidad`.
- Por compatibilidad, también se lee/escribe la clave antigua `unitData`.

## Estructura del proyecto
- `index.html` — shell (cabecera, menú e iframe).
- `ui/css/style.css` — estilos globales.
- `ui/js/`:
  - `utilidades.js` — helpers comunes.
  - `shell.js` — navegación, reloj y cabecera.
  - `unidad.js` — gestión de datos de unidad.
  - `diligencialibre.js` — diligencia libre (con y sin datos).
- `ui/pages/` — páginas internas.
- `ui/assets/` — recursos (plantillas).

## Uso rápido
1. Abrir `index.html`.
2. Ir a **Unidad** y guardar/cargar los datos.
3. Ir a **Diligencias → Diligencia libre** y redactar.
4. Pulsar **IMPRIMIR (PDF)** → “Guardar como PDF”.

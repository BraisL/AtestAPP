document.addEventListener('DOMContentLoaded', () => {
  const unitDataForm = document.getElementById('unit-data-form');
  const deleteBtn = document.getElementById('delete-btn');
  const downloadBtn = document.getElementById('download-btn');
  const uploadJson = document.getElementById('upload-json');

  if (!unitDataForm) return;

  loadDataIntoForm();

  unitDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveData();
  });

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('¿Está seguro de que quieres borrar todos los datos de la Unidad?')) {
        localStorage.removeItem('unitData');
        unitDataForm.reset();
        alert('Datos borrados correctamente');
      }
    });
  }

  function sanitizeFileBaseName(name) {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  function ensureJsonExt(fileName) {
    const trimmed = (fileName || '').trim();
    if (!trimmed) return '';
    return trimmed.toLowerCase().endsWith('.json') ? trimmed : `${trimmed}.json`;
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      let unitData = null;
      try { unitData = JSON.parse(localStorage.getItem('unitData')); } catch (_) {}

      if (!unitData) {
        alert('No hay datos guardados para descargar');
        return;
      }

      const base = sanitizeFileBaseName(`datos_unidad_${unitData.nombreunidad || ''}`);
      const defaultFileName = ensureJsonExt(base || 'datos_unidad');

      const fileNameInput = prompt('Introduzca el nombre del archivo:', defaultFileName);
      const fileName = ensureJsonExt(fileNameInput);
      if (!fileName) return;

      const dataStr = JSON.stringify(unitData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  if (uploadJson) {
    uploadJson.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          populateForm(data);
          saveData();
          alert('Datos cargados y guardados correctamente');
        } catch (error) {
          alert('Error al leer el archivo. Asegúrese de que es un JSON válido.');
        }
      };
      reader.readAsText(file);
    });
  }

  function saveData() {
    const formData = new FormData(unitDataForm);
    const unitData = Object.fromEntries(formData.entries());
    localStorage.setItem('unitData', JSON.stringify(unitData));
    alert('Datos guardados correctamente');
  }

  function loadDataIntoForm() {
    let unitData = null;
    try { unitData = JSON.parse(localStorage.getItem('unitData')); } catch (_) {}
    if (unitData) populateForm(unitData);
  }

  function populateForm(data) {
    for (const key in data) {
      const input = unitDataForm.elements[key];
      if (!input) continue;
      input.value = data[key];
    }
  }
});

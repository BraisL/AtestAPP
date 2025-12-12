document.addEventListener('DOMContentLoaded', () => {
    const fillDataBtn = document.getElementById('fill-data-btn');
    const unitDataForm = document.getElementById('unit-data-form');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const downloadBtn = document.getElementById('download-btn');
    const uploadJson = document.getElementById('upload-json');
    const unitNameDisplay = document.getElementById('unit-name');

    // Cargar datos existentes al iniciar
    loadDataIntoForm();

    fillDataBtn.addEventListener('click', () => {
        unitDataForm.classList.toggle('hidden');
    });

    unitDataForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveData();
    });

    deleteBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos de la unidad?')) {
            localStorage.removeItem('unitData');
            unitDataForm.reset();
            updateHeader();
            alert('Datos borrados correctamente.');
        }
    });

    downloadBtn.addEventListener('click', () => {
        const unitData = JSON.parse(localStorage.getItem('unitData'));
        if (unitData) {
            const fileName = prompt('Introduce el nombre del archivo:', 'datos_unidad.json');
            if (fileName) {
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
            }
        } else {
            alert('No hay datos guardados para descargar.');
        }
    });

    uploadJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    populateForm(data);
                    saveData();
                    alert('Datos cargados y guardados correctamente.');
                } catch (error) {
                    alert('Error al leer el archivo. Asegúrate de que es un JSON válido.');
                }
            };
            reader.readAsText(file);
        }
    });

    function saveData() {
        const formData = new FormData(unitDataForm);
        const unitData = Object.fromEntries(formData.entries());
        localStorage.setItem('unitData', JSON.stringify(unitData));
        updateHeader();
        alert('Datos guardados correctamente.');
    }

    function loadDataIntoForm() {
        const unitData = JSON.parse(localStorage.getItem('unitData'));
        if (unitData) {
            populateForm(unitData);
        }
    }

    function populateForm(data) {
        for (const key in data) {
            const input = unitDataForm.elements[key];
            if (input) {
                if (input.type === 'radio') {
                    document.querySelector(`input[name="${key}"][value="${data[key]}"]`).checked = true;
                } else {
                    input.value = data[key];
                }
            }
        }
    }

    function updateHeader() {
        const unitData = JSON.parse(localStorage.getItem('unitData'));
        if (unitData && unitData.unitName) {
            unitNameDisplay.textContent = `${unitData.unitType || ''} ${unitData.unitName}`;
        } else {
            unitNameDisplay.textContent = 'Sin datos unidad';
        }
    }
});

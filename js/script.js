function updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    const formattedDateTime = now.toLocaleString('es-ES', options);
    const datetimeSpan = document.getElementById('datetime');
    if (datetimeSpan) {
        // Clear previous text content
        while (datetimeSpan.childNodes.length > 1) {
            datetimeSpan.removeChild(datetimeSpan.lastChild);
        }
        datetimeSpan.insertAdjacentText('beforeend', formattedDateTime);
    }
}

// Actualizar la fecha y hora cada segundo
setInterval(updateDateTime, 1000);

// Llamar a la función una vez al cargar la página
updateDateTime();

document.addEventListener('DOMContentLoaded', () => {
    const unitData = JSON.parse(localStorage.getItem('unitData'));
    if (unitData) {
        document.getElementById('unit-name').textContent = `${unitData.unitType} ${unitData.unitName}`;
    }
});

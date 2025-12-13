//Función fecha y hora
function updateDateTime() {
    const now = new Date();
    
    const time = now.toLocaleTimeString('es-ES', {
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    });

    const date = now.toLocaleDateString('es-Es', {
        day:'2-digit', 
        month: '2-digit', 
        year: 'numeric'
    });
    
    const formattedDateTime = `${time} - ${date}`;
    const datetimeSpan = document.getElementById('datetime');
    if (datetimeSpan) datetimeSpan.textContent = formattedDateTime;

}

// Actualizar la fecha y hora cada 1 segundo
setInterval(updateDateTime, 1000);

// Llamar a la función una vez al cargar la página
updateDateTime();

document.addEventListener('DOMContentLoaded', () => {
    const unitData = JSON.parse(localStorage.getItem('unitData'));
    if (unitData) {
        document.getElementById('unit-name').textContent = `${unitData.tipopuesto} ${unitData.nombreunidad}`;
    }
});

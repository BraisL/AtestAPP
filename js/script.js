function updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    };
    const formattedDateTime = now.toLocaleString('es-ES', options);
    document.getElementById('datetime').textContent = formattedDateTime;
}

// Actualizar la fecha y hora cada segundo
setInterval(updateDateTime, 1000);

// Llamar a la función una vez al cargar la página
updateDateTime();

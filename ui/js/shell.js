function getUnitLabel(unitData) {
  if (!unitData) return 'Sin datos de unidad';
  const t = (unitData.tipopuesto || unitData.unitType || '').trim();
  const n = (unitData.nombreunidad || unitData.unitName || '').trim();
  return (t || n) ? `${t} ${n}`.trim() : 'Sin datos de unidad';
}

function updateUnitName() {
  const el = document.getElementById('unit-name');
  if (!el) return;

  let unitData = null;
  try {
    unitData = JSON.parse(localStorage.getItem('unitData'));
  } catch (_) {}

  el.textContent = getUnitLabel(unitData);
}

function updateDateTime() {
  const now = new Date();

  const time = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const date = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const el = document.getElementById('datetime');
  if (el) el.textContent = `${time} | ${date}`;
}

// Tick alineado al segundo real
function startClock() {
  updateDateTime();
  setTimeout(function tick() {
    updateDateTime();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }, 1000 - (Date.now() % 1000));
}

function loadPage(path) {
  const frame = document.getElementById('contentFrame');
  if (!frame) return;
  frame.src = path;
}

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  updateUnitName();

  // Clics de navegación: cualquier <a data-page="..."> cambia el iframe
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-page]');
    if (!a) return;
    e.preventDefault();
    loadPage(a.getAttribute('data-page'));
  });

  // Si una página interna guarda unitData en localStorage, esto salta aquí
  window.addEventListener('storage', (e) => {
    if (e.key === 'unitData') updateUnitName();
  });
});

const frame = document.getElementById('contentFrame');

window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'resize-iframe') return;
  frame.style.height = `${e.data.height}px`;
});

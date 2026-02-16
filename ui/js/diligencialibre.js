// AtestAPP — Diligencia libre
(function () {
  'use strict';

  // -----------------------------
  // Config / utilidades
  // -----------------------------
  const U = window.UtilidadesAtestapp || null;
  const CLAVE_DATOS_UNIDAD = (U && U.CLAVES_LOCALSTORAGE && U.CLAVES_LOCALSTORAGE.DATOS_UNIDAD)
    ? U.CLAVES_LOCALSTORAGE.DATOS_UNIDAD
    : 'datosUnidad';

  const MODO_SIN_DATOS = document.documentElement.getAttribute('data-sin-datos') === '1';

  const porId = (id) => document.getElementById(id);

  // -----------------------------
  // Elementos del DOM (IDs del HTML)
  // -----------------------------
  const elementos = {
    atestado: porId('dlAtestado'),
    folio: porId('dlFolio'),
    nombre: porId('dlNombre'),
    texto: porId('dlTexto'),

    tipEntrada: porId('dlTipInput'),
    tipAnadir: porId('btnAddTip'),
    tipsDetalles: porId('tipsDetails'),
    tipsContador: porId('tipsCount'),
    tipsLista: porId('tipsList'),

    btnFiliaciones: porId('btnFiliaciones'),
    filiacionPanel: porId('filiacionPanel'),
    filSexo: porId('filiSexo'),
    filRela: porId('filiRelacion'),
    filNombre: porId('filiNombre'),
    filAp1: porId('filiApellido1'),
    filAp2: porId('filiApellido2'),
    filDocTipo: porId('filiDocTipo'),
    filDocNumero: porId('filiDocNumero'),
    filDocOtroWrap: porId('filiDocOtroWrap'),
    filDocOtro: porId('filiDocOtro'),
    filDocInfo: porId('filDocInfo'),
    filFechaNac: porId('filiFechaNac'),
    filLugarNac: porId('filiLugarNac'),
    filPadre: porId('filiPadre'),
    filMadre: porId('filiMadre'),
    filDomicilio: porId('filiDomicilio'),
    filLocalidad: porId('filiLocalidad'),
    filCP: porId('filiCP'),
    filProvincia: porId('filiProvincia'),
    filPais: porId('filiPais'),
    filTelefono: porId('filiTelefono'),
    filEmail: porId('filiEmail'),
    btnGuardarFiliacion: porId('btnFiliGuardar'),
    btnCancelarFiliacion: porId('btnFiliCancelar'),
    filiacionesContador: porId('filiacionesCount'),
    filiacionesLista: porId('filiacionesList'),

    botonImprimir: porId('btnImprimir'),
    botonDescargarJson: porId('btnDownloadJson'),

    paginasImpresion: porId('printPages'),

    enlaceCargarJson: porId('linkLoadJson'),
    archivoCargarJson: porId('fileLoadJson'),
  };

  // -----------------------------
  // Estado en memoria (TIPS)
  // -----------------------------
  /** @type {string[]} */
  let listaTips = [];

  /** @type {any[]} */
  let listaFiliaciones = [];

  /** Índice de edición de filiación (>=0 cuando editas) */
  let filiacionEditIdx = -1;

  // -----------------------------
  // Helpers básicos
  // -----------------------------
  function leerJsonLocalStorage(clave) {
    try {
      const v = localStorage.getItem(clave);
      if (!v) return null;
      return JSON.parse(v);
    } catch (_) {
      return null;
    }
  }

  function asegurarExtension(nombre, ext) {
    const n = String(nombre || '').trim();
    if (!n) return '';
    const e = String(ext || '').trim();
    if (!e) return n;
    return n.toLowerCase().endsWith(e.toLowerCase()) ? n : (n + e);
  }

  function sanearNombreBaseArchivo(nombre) {
    const base = String(nombre || '').trim() || 'diligencia';
    return base
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 80);
  }

  function normalizarTip(texto) {
    return String(texto || '').replace(/\s+/g, ' ').trim();
  }

  function escaparHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m]));
  }

  function enMayusculasSeguro(v) {
    const s = String(v || '').trim();
    return s ? s.toUpperCase() : '';
  }


  function normalizarTextoPlano(v) {
    return String(v || '').replace(/\s+/g, ' ').trim();
  }

  function normalizarFiliacion(obj) {
    const o = (obj && typeof obj === 'object') ? obj : {};
    const docTipo = String(o.docTipo || '').trim().toUpperCase();
    const out = {
      sexo: String(o.sexo || '').trim().toUpperCase(), // H/M/''
      relacion: normalizarTextoPlano(o.relacion),
      nombre: normalizarTextoPlano(o.nombre),
      apellido1: normalizarTextoPlano(o.apellido1),
      apellido2: normalizarTextoPlano(o.apellido2),
      docTipo: (docTipo === 'DNI' || docTipo === 'NIE' || docTipo === 'OTRO') ? docTipo : '',
      docNumero: normalizarTextoPlano(o.docNumero),
      docOtro: normalizarTextoPlano(o.docOtro),
      fechaNac: String(o.fechaNac || '').trim(), // YYYY-MM-DD
      lugarNac: normalizarTextoPlano(o.lugarNac),
      padre: normalizarTextoPlano(o.padre),
      madre: normalizarTextoPlano(o.madre),
      domicilio: normalizarTextoPlano(o.domicilio),
      localidad: normalizarTextoPlano(o.localidad),
      cp: normalizarTextoPlano(o.cp),
      provincia: normalizarTextoPlano(o.provincia),
      pais: normalizarTextoPlano(o.pais),
      telefono: normalizarTextoPlano(o.telefono),
      email: normalizarTextoPlano(o.email),
    };
    return out;
  }

  function formatearFechaEspanol(iso) {
    const s = String(iso || '').trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return '';
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${d} de ${meses[mo-1]} de ${y}`;
  }

  function palabraGenero(sexo, masc, fem) {
    const s = String(sexo || '').trim().toUpperCase();
    if (s === 'M') return fem;
    if (s === 'H') return masc;
    return `${masc}/${fem}`;
  }

  function esPaisEspana(pais) {
    const p = String(pais || '').trim().toLowerCase();
    return !p || p === 'españa' || p === 'espana' || p === 'spain';
  }

  function construirTextoFiliacion(f) {
    const x = normalizarFiliacion(f);
    const relacion = normalizarTextoPlano(x.relacion);
    const nombre = normalizarTextoPlano(x.nombre);
    const ap1 = normalizarTextoPlano(x.apellido1);
    const ap2 = normalizarTextoPlano(x.apellido2);

    const partes = [];

    const nomCompleto = [nombre, enMayusculasSeguro(ap1), enMayusculasSeguro(ap2)]
      .filter(Boolean).join(' ').trim();

    const cabeza = [relacion, nomCompleto].filter(Boolean).join(' - ').trim();
    if (cabeza) partes.push(cabeza);

    // Documento
    const docLabel = (x.docTipo === 'OTRO') ? normalizarTextoPlano(x.docOtro) : x.docTipo;
    if (docLabel && x.docNumero) {
      partes.push(`con ${docLabel} ${x.docNumero}`);
    }

    // Nacimiento
    const nacido = palabraGenero(x.sexo, 'nacido', 'nacida');
    const fechaTxt = formatearFechaEspanol(x.fechaNac);
    if (fechaTxt && x.lugarNac) partes.push(`${nacido} el ${fechaTxt} en ${x.lugarNac}`);
    else if (fechaTxt) partes.push(`${nacido} el ${fechaTxt}`);
    else if (x.lugarNac) partes.push(`${nacido} en ${x.lugarNac}`);

    // Padres
    const hijo = palabraGenero(x.sexo, 'hijo', 'hija');
    if (x.padre && x.madre) partes.push(`${hijo} de ${x.padre} y ${x.madre}`);
    else if (x.padre) partes.push(`${hijo} de ${x.padre}`);
    else if (x.madre) partes.push(`${hijo} de ${x.madre}`);

    // Domicilio
    const domPartes = [];
    if (x.domicilio) domPartes.push(x.domicilio);
    if (x.localidad) domPartes.push(`de ${x.localidad}`);
    let domTxt = domPartes.join(' ').trim();

    const extras = [];
    if (x.cp) extras.push(`CP: ${x.cp}`);
    if (extras.length) domTxt += ` (${extras.join(', ')})`;

    const provPais = [];
    if (x.provincia) provPais.push(x.provincia);
    if (!esPaisEspana(x.pais)) provPais.push(x.pais);

    if (domTxt) {
      if (provPais.length) partes.push(`con domicilio en ${domTxt}, ${provPais.join(', ')}`);
      else partes.push(`con domicilio en ${domTxt}`);
    } else if (provPais.length) {
      // Si no hay calle/localidad pero hay provincia/país
      partes.push(`con domicilio en ${provPais.join(', ')}`);
    }

    // Contacto
    if (x.telefono && x.email) partes.push(`con teléfono de contacto ${x.telefono} y correo electrónico ${x.email}`);
    else if (x.telefono) partes.push(`con teléfono de contacto ${x.telefono}`);
    else if (x.email) partes.push(`con correo electrónico ${x.email}`);

    // Construcción final
    if (!partes.length) return '';
    return partes.join(', ') + '.';
  }

  function textoResumenFiliacion(f) {
    const x = normalizarFiliacion(f);
    const nom = [normalizarTextoPlano(x.nombre), enMayusculasSeguro(x.apellido1), enMayusculasSeguro(x.apellido2)].filter(Boolean).join(' ').trim();
    const docLabel = (x.docTipo === 'OTRO') ? normalizarTextoPlano(x.docOtro) : x.docTipo;
    const doc = (docLabel && x.docNumero) ? `${docLabel} ${x.docNumero}` : '';
    const fn = formatearFechaEspanol(x.fechaNac);
    const base = [nom, doc, fn].filter(Boolean).join(' — ');
    return base || '(Filiación sin nombre)';
  }


  // -----------------------------
  // TIPS UI (no invasivo)
  // -----------------------------
  function renderizarTipsUI() {
    // Ahora renderiza tanto TIPs como Filiaciones en el mismo panel de gestión.
    if (!elementos.tipsDetalles || !elementos.tipsContador || !elementos.tipsLista
      || !elementos.filiacionesContador || !elementos.filiacionesLista) return;

    // Contadores
    elementos.tipsContador.textContent = String(listaTips.length);
    elementos.filiacionesContador.textContent = String(listaFiliaciones.length);

    // Limpiar listas
    elementos.tipsLista.innerHTML = '';
    elementos.filiacionesLista.innerHTML = '';

    // Mostrar/ocultar el panel
    if (listaTips.length === 0 && listaFiliaciones.length === 0) {
      elementos.tipsDetalles.style.display = 'none';
      return;
    }
    elementos.tipsDetalles.style.display = 'block';

    // TIPs
    listaTips.forEach((t, idx) => {
      const item = document.createElement('div');
      item.className = 'dl-tip-item';

      const span = document.createElement('span');
      span.className = 'dl-tip-text';
      span.title = t;
      span.textContent = t;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dl-tip-remove';
      btn.setAttribute('aria-label', 'Quitar TIP');
      btn.textContent = '×';
      btn.addEventListener('click', () => {
        listaTips.splice(idx, 1);
        renderizarTipsUI();
      });

      item.appendChild(span);
      item.appendChild(btn);
      elementos.tipsLista.appendChild(item);
    });

    // Filiaciones
    listaFiliaciones.forEach((f, idx) => {
      const item = document.createElement('div');
      item.className = 'dl-tip-item';

      const span = document.createElement('span');
      span.className = 'dl-tip-text';
      const resumen = textoResumenFiliacion(f);
      span.title = construirTextoFiliacion(f) || resumen;
      span.textContent = resumen;

      const acciones = document.createElement('div');
      acciones.className = 'dl-tip-actions';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'dl-tip-edit';
      btnEdit.setAttribute('aria-label', 'Editar filiación');
      btnEdit.title = 'Editar';
      btnEdit.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i>';
      btnEdit.addEventListener('click', () => {
        filiacionEditIdx = idx;
        mostrarPanelFiliacion(true);
        cargarFormularioFiliacion(listaFiliaciones[idx]);
      });

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'dl-tip-remove';
      btnDel.setAttribute('aria-label', 'Eliminar filiación');
      btnDel.title = 'Eliminar';
      btnDel.textContent = '×';
      btnDel.addEventListener('click', () => {
        const ok = confirm('¿Quieres eliminar esta filiación?');
        if (!ok) return;
        listaFiliaciones.splice(idx, 1);
        renderizarTipsUI();
      });

      acciones.appendChild(btnEdit);
      acciones.appendChild(btnDel);

      item.appendChild(span);
      item.appendChild(acciones);
      elementos.filiacionesLista.appendChild(item);
    });
  }

  function anadirTipDesdeEntrada() {
    if (!elementos.tipEntrada) return;
    const tip = normalizarTip(elementos.tipEntrada.value);
    if (!tip) return;

    // Evitar duplicados exactos
    if (!listaTips.some((x) => x.toLowerCase() === tip.toLowerCase())) {
      listaTips.push(tip);
    }

    elementos.tipEntrada.value = '';
    renderizarTipsUI();
    elementos.tipEntrada.focus();
  }

  function engancharEventosTips() {
    if (elementos.tipEntrada) {
      elementos.tipEntrada.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          anadirTipDesdeEntrada();
        }
      });
    }
  }

  // -----------------------------
  // Filiaciones UI
  // -----------------------------
  function mostrarPanelFiliacion(mostrar) {
    if (!elementos.filiacionPanel) return;
    elementos.filiacionPanel.style.display = mostrar ? 'block' : 'none';
  }

  function limpiarFormularioFiliacion() {
    filiacionEditIdx = -1;
    if (elementos.filSexo) elementos.filSexo.value = '';
    if (elementos.filRela) elementos.filRela.value = '';
    if (elementos.filNombre) elementos.filNombre.value = '';
    if (elementos.filAp1) elementos.filAp1.value = '';
    if (elementos.filAp2) elementos.filAp2.value = '';
    if (elementos.filDocTipo) elementos.filDocTipo.value = '';
    if (elementos.filDocNumero) elementos.filDocNumero.value = '';
    if (elementos.filDocOtro) elementos.filDocOtro.value = '';
    if (elementos.filFechaNac) elementos.filFechaNac.value = '';
    if (elementos.filLugarNac) elementos.filLugarNac.value = '';
    if (elementos.filPadre) elementos.filPadre.value = '';
    if (elementos.filMadre) elementos.filMadre.value = '';
    if (elementos.filDomicilio) elementos.filDomicilio.value = '';
    if (elementos.filLocalidad) elementos.filLocalidad.value = '';
    if (elementos.filCP) elementos.filCP.value = '';
    if (elementos.filProvincia) elementos.filProvincia.value = '';
    if (elementos.filPais) elementos.filPais.value = '';
    if (elementos.filTelefono) elementos.filTelefono.value = '';
    if (elementos.filEmail) elementos.filEmail.value = '';
    actualizarVisibilidadDocOtro();
  }

  function actualizarVisibilidadDocOtro() {
    const tipo = String(elementos.filDocTipo?.value || '').trim().toUpperCase();
    const esOtro = (tipo === 'OTRO');

    // Wrapper: id explícito o contenedor real del input "Otro"
    const wrap =
      elementos.filDocOtroWrap ||
      (elementos.filDocOtro ? (elementos.filDocOtro.closest('#filDocOtroWrap') || elementos.filDocOtro.closest('.dl-fili-field') || elementos.filDocOtro.parentElement) : null);

    if (wrap) {
      // Preferir ocultación sin reflow si existe la clase (HTML/CSS nuevo)
      if (wrap.classList && wrap.classList.contains('dl-docotro-hidden')) {
        wrap.classList.toggle('dl-docotro-hidden', !esOtro);
      } else if (wrap.classList && document.documentElement) {
        // si la clase existe en CSS aunque el wrapper no la tenga aún
        wrap.classList.toggle('dl-docotro-hidden', !esOtro);
      } else {
        // fallback
        wrap.style.display = esOtro ? 'block' : 'none';
      }
    }

    if (elementos.filDocOtro) {
      elementos.filDocOtro.disabled = !esOtro;
      if (!esOtro) elementos.filDocOtro.value = '';
    }
  }

  function obtenerNodoDocError() {
    return document.getElementById('filDocError') || document.getElementById('filiDocError');
  }

  function setDocError(msg) {
    const err = obtenerNodoDocError();
    if (err) err.textContent = msg || '';

    const icon = elementos.filDocInfo;
    if (icon) {
      icon.classList.toggle('is-visible', !!msg);
      icon.dataset.tip = msg || '';
    }

    elementos.filDocNumero?.classList.toggle('dl-invalid', !!msg);
    elementos.filDocTipo?.classList.toggle('dl-invalid', !!msg);
  }

  function validarDni(dni) {
    const s = String(dni || '').trim().toUpperCase();
    if (!/^\d{8}[A-Z]$/.test(s)) return false;
    const num = parseInt(s.slice(0, 8), 10);
    const letra = s.slice(8);
    const tabla = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return tabla[num % 23] === letra;
  }

  function validarNie(nie) {
    const s = String(nie || '').trim().toUpperCase();
    // Como mínimo: Letra + 7 números + Letra
    if (!/^[XYZ]\d{7}[A-Z]$/.test(s)) return false;

    // (Opcional pero recomendable) validar letra final como DNI:
    const pref = s[0] === 'X' ? '0' : (s[0] === 'Y' ? '1' : '2');
    const num = parseInt(pref + s.slice(1, 8), 10);
    const letra = s.slice(8);
    const tabla = 'TRWAGMYFPDXBNJZSQVHLCKE';
    return tabla[num % 23] === letra;
  }

  function validarDocumentoUI() {
    const tipo = String(elementos.filDocTipo?.value || '').trim().toUpperCase();
    const num  = String(elementos.filDocNumero?.value || '').trim().toUpperCase();

    // Si no hay nada que validar, no molestes
    if (!tipo || !num || tipo === 'OTRO') {
      setDocError('');
      return true;
    }

    if (tipo === 'DNI') {
      const ok = validarDni(num);
        setDocError(ok ? '' : 'El DNI es incorrecto.\nFormato: 12345678Z (letra de control correcta).');
      return ok;
    }

    if (tipo === 'NIE') {
      const ok = validarNie(num);
        setDocError(ok ? '' : 'El NIE es incorrecto.\nFormato: X1234567L (X/Y/Z + 7 números + letra).');
      return ok;
    }

    setDocError('');
    return true;
  }

  function leerFormularioFiliacion() {
    return normalizarFiliacion({
      sexo: elementos.filSexo?.value,
      relacion: elementos.filRela?.value,
      nombre: elementos.filNombre?.value,
      apellido1: elementos.filAp1?.value,
      apellido2: elementos.filAp2?.value,
      docTipo: elementos.filDocTipo?.value,
      docNumero: elementos.filDocNumero?.value,
      docOtro: elementos.filDocOtro?.value,
      fechaNac: elementos.filFechaNac?.value,
      lugarNac: elementos.filLugarNac?.value,
      padre: elementos.filPadre?.value,
      madre: elementos.filMadre?.value,
      domicilio: elementos.filDomicilio?.value,
      localidad: elementos.filLocalidad?.value,
      cp: elementos.filCP?.value,
      provincia: elementos.filProvincia?.value,
      pais: elementos.filPais?.value,
      telefono: elementos.filTelefono?.value,
      email: elementos.filEmail?.value,
    });
  }

  function cargarFormularioFiliacion(f) {
    const x = normalizarFiliacion(f);
    if (elementos.filSexo) elementos.filSexo.value = x.sexo || '';
    if (elementos.filRela) elementos.filRela.value = x.relacion || '';
    if (elementos.filNombre) elementos.filNombre.value = x.nombre || '';
    if (elementos.filAp1) elementos.filAp1.value = x.apellido1 || '';
    if (elementos.filAp2) elementos.filAp2.value = x.apellido2 || '';
    if (elementos.filDocTipo) elementos.filDocTipo.value = x.docTipo || '';
    if (elementos.filDocNumero) elementos.filDocNumero.value = x.docNumero || '';
    if (elementos.filDocOtro) elementos.filDocOtro.value = x.docOtro || '';
    if (elementos.filFechaNac) elementos.filFechaNac.value = x.fechaNac || '';
    if (elementos.filLugarNac) elementos.filLugarNac.value = x.lugarNac || '';
    if (elementos.filPadre) elementos.filPadre.value = x.padre || '';
    if (elementos.filMadre) elementos.filMadre.value = x.madre || '';
    if (elementos.filDomicilio) elementos.filDomicilio.value = x.domicilio || '';
    if (elementos.filLocalidad) elementos.filLocalidad.value = x.localidad || '';
    if (elementos.filCP) elementos.filCP.value = x.cp || '';
    if (elementos.filProvincia) elementos.filProvincia.value = x.provincia || '';
    if (elementos.filPais) elementos.filPais.value = x.pais || '';
    if (elementos.filTelefono) elementos.filTelefono.value = x.telefono || '';
    if (elementos.filEmail) elementos.filEmail.value = x.email || '';
    actualizarVisibilidadDocOtro();
  }

  function validarMinimosFiliacion(f) {
    const x = normalizarFiliacion(f);
    const faltan = [];
    if (!normalizarTextoPlano(x.nombre)) faltan.push('nombre');
    if (!normalizarTextoPlano(x.apellido1)) faltan.push('primer apellido');
    if (!String(x.fechaNac || '').trim()) faltan.push('fecha de nacimiento');
    if (!normalizarTextoPlano(x.domicilio)) faltan.push('domicilio');
    if (!normalizarTextoPlano(x.telefono)) faltan.push('teléfono');
    return faltan;
  }

  function guardarFiliacion() {
    const f = leerFormularioFiliacion();

    const docOk = validarDocumentoUI();
    if (!docOk) {
      const ok = confirm('El documento parece incorrecto. ¿Quieres guardar la filiación igualmente?');
      if (!ok) return;
    }

    const faltan = validarMinimosFiliacion(f);

    if (faltan.length) {
      const msg = `Faltan datos mínimos recomendados (${faltan.join(', ')}). ¿Quieres guardarla igualmente?`;
      const ok = confirm(msg);
      if (!ok) return;
    }

    if (filiacionEditIdx >= 0 && filiacionEditIdx < listaFiliaciones.length) {
      listaFiliaciones[filiacionEditIdx] = f;
    } else {
      listaFiliaciones.push(f);
    }

    limpiarFormularioFiliacion();
    mostrarPanelFiliacion(false);
    renderizarTipsUI();
  }

  function engancharEventosFiliaciones() {
    if (elementos.btnFiliaciones) {
      elementos.btnFiliaciones.addEventListener('click', () => {
        const abierto = !!elementos.filiacionPanel && elementos.filiacionPanel.style.display !== 'none';
        if (abierto) {
          mostrarPanelFiliacion(false);
          return;
        }
        limpiarFormularioFiliacion();
        mostrarPanelFiliacion(true);
        elementos.filNombre?.focus();
      });
    }


    elementos.btnCancelarFiliacion?.addEventListener('click', () => {
      limpiarFormularioFiliacion();
      mostrarPanelFiliacion(false);
    });

    elementos.btnGuardarFiliacion?.addEventListener('click', guardarFiliacion);

    elementos.filDocNumero?.addEventListener('input', validarDocumentoUI);
    elementos.filDocNumero?.addEventListener('blur', validarDocumentoUI);
    elementos.filDocTipo?.addEventListener('change', () => {
      actualizarVisibilidadDocOtro();
      validarDocumentoUI();
    });

  }


  // -----------------------------
  // Datos de unidad (pie)
  // -----------------------------
  function obtenerDatosUnidad() {
    if (MODO_SIN_DATOS) return null;

    // Preferir utilidades si existen
    const datos = (U && typeof U.leerJsonLocalStorage === 'function')
      ? (U.leerJsonLocalStorage(CLAVE_DATOS_UNIDAD) || U.leerJsonLocalStorage('unitData'))
      : (leerJsonLocalStorage(CLAVE_DATOS_UNIDAD) || leerJsonLocalStorage('unitData'));

    return datos || null;
  }

  function bloquePie(etiqueta, valor, claseExtra) {
    const v = String(valor || '').trim();
    if (!v) return '';

    const cls = claseExtra ? `pie-bloque ${claseExtra}` : 'pie-bloque';
    return `<span class="${cls}"><span class="pie-etiqueta">${escaparHtml(etiqueta)}</span> <span class="pie-valor">${escaparHtml(v)}</span></span>`;
  }

  function construirPieUnidadHtml(unidad) {
    if (!unidad) return '';

    const comandancia = enMayusculasSeguro(unidad.comandancia);
    const compania = enMayusculasSeguro(unidad.compania);
    const tipoPuesto = String(unidad.tipopuesto || '').trim();
    const nombreUnidad = enMayusculasSeguro(unidad.nombreunidad);

    const direccion = enMayusculasSeguro(unidad.direccion);
    const localidad = enMayusculasSeguro(unidad.localidad);
    const provincia = enMayusculasSeguro(unidad.provincia);
    const cp = String(unidad.codigoPostal || '').trim();

    const tfno = String(unidad.telefono || '').trim();
    const email = String(unidad.correo || '').trim();

    const etiquetaPuesto = (tipoPuesto.toLowerCase().includes('ppal') || tipoPuesto.toLowerCase().includes('principal'))
      ? 'PUESTO PRINCIPAL DE'
      : 'PUESTO DE';

    const linea1 = [
      bloquePie('COMANDANCIA DE', comandancia),
      bloquePie('COMPAÑÍA DE', compania),
      bloquePie(etiquetaPuesto, nombreUnidad),
      bloquePie('TFNO:', tfno),
    ].filter(Boolean).join('');

    const linea2 = [
      bloquePie('EMAIL:', email, 'pie-email'),
      bloquePie('DIRECCIÓN:', direccion),
      bloquePie('LOCALIDAD:', localidad),
      bloquePie('PROVINCIA:', provincia),
      bloquePie('CP:', cp),
    ].filter(Boolean).join('');

    if (!linea1 && !linea2) return '';

    return `
      <div class="pie-unidad">
        <div class="pie-linea pie-linea1">${linea1}</div>
        <div class="pie-linea pie-linea2">${linea2}</div>
      </div>
    `;
  }

  // -----------------------------
  // Lectura del formulario
  // -----------------------------
  function recogerDatosFormulario() {
    return {
      atestado: String(elementos.atestado?.value || '').trim(),
      folio: String(elementos.folio?.value || '').trim(),
      nombre: String(elementos.nombre?.value || '').trim(),
      texto: String(elementos.texto?.value || ''),
      tips: Array.isArray(listaTips) ? [...listaTips] : [],
      filiaciones: Array.isArray(listaFiliaciones) ? JSON.parse(JSON.stringify(listaFiliaciones)) : [],
      unidad: obtenerDatosUnidad(),
      creadoEn: new Date().toISOString(),
    };
  }

  // -----------------------------
  // Plantilla de hoja imprimible
  // (IMPORTANTE: sin field-fuerza / field-tips, ya no se usan)
  // -----------------------------
  function crearHoja() {
    const hoja = document.createElement('div');
    hoja.className = 'sheet';
    hoja.innerHTML = `
      <img class="sheet-bg" src="../assets/diligencia_base.png" alt="">
      <div class="overlay">
        <div class="field field-atestado"></div>
        <div class="field field-folio"></div>
        <div class="field field-titulo"></div>
        <div class="field field-texto"></div>
        <div class="field field-footer"></div>
      </div>
    `;
    return hoja;
  }

  // -----------------------------
  // Render del texto (SIN dividir en <p>)
  // - Se mantiene el comportamiento anterior (white-space: pre-wrap)
  // - Se aplica una pequeña sangría (“tab” visual) al inicio de cada línea/párrafo
  // - La última página puede incluir el bloque final: “La Fuerza Instructora” + TIPs
  //   mediante un marcador interno.
  // -----------------------------

  const MARCADOR_BLOQUES = '[[BLOQUES_FINALES]]';
  const TAG_FILI_INI = '[[FILIACIONES]]';
  const TAG_FILI_FIN = '[[/FILIACIONES]]';
  const TAG_TIPS_INI = '[[TIPS]]';
  const TAG_TIPS_FIN = '[[/TIPS]]';
  // “Tab” pequeño (mejor con NBSP para que sea 100% estable en impresión)
  const INDENT_PARRAFO = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';

  /**
   * Sangría SOLO en la primera línea de cada párrafo (tipo Word).
   * - Considera “párrafo” como bloques separados por una línea en blanco.
   * - Mantiene el render como texto normal (white-space: pre-wrap) sin usar <p>.
   */
  function aplicarIndentPrimeraLinea(texto) {
    const t = String(texto || '').replace(/\r\n/g, '\n');
    if (!t.trim()) return t;

    // Split preservando separadores (líneas en blanco)
    const partes = t.split(/(\n\s*\n+)/);
    return partes.map((seg) => {
      // Separador de párrafos: lo dejamos tal cual
      if (/^\n/.test(seg)) return seg;
      // Segmento de texto: si tiene contenido, sangrar el inicio
      return seg.trim() ? (INDENT_PARRAFO + seg.replace(/^\s+/, '')) : seg;
    }).join('');
  }

  /** Construye el sufijo (marcador + TIPs) que solo va en la última hoja. */
  function construirSufijoBloquesFinales(tips, filiaciones) {
    const arrTips = Array.isArray(tips) ? tips.map(normalizarTip).filter(Boolean) : [];
    const arrFili = Array.isArray(filiaciones) ? filiaciones.map(construirTextoFiliacion).filter(Boolean) : [];

    if (!arrTips.length && !arrFili.length) return '';

    const lineas = [];
    lineas.push('');
    lineas.push('');
    lineas.push(MARCADOR_BLOQUES);

    if (arrFili.length) {
      lineas.push(TAG_FILI_INI);
      lineas.push(...arrFili);
      lineas.push(TAG_FILI_FIN);
    }

    if (arrTips.length) {
      lineas.push(TAG_TIPS_INI);
      lineas.push(...arrTips);
      lineas.push(TAG_TIPS_FIN);
    }

    return lineas.join('\n');
  }

  /**
   * Pinta el contenido del field-texto.
   * - Sin marcador: texto plano con sangría.
   * - Con marcador: texto plano + bloque “La Fuerza Instructora” + TIPs en cajas.
   */
  function pintarTextoConBloques(nodoTexto, textoPagina) {
    if (!nodoTexto) return;

    const texto = String(textoPagina || '');
    const idx = texto.indexOf(MARCADOR_BLOQUES);

    // Página normal: solo texto
    if (idx === -1) {
      nodoTexto.innerHTML = '';
      nodoTexto.textContent = aplicarIndentPrimeraLinea(texto);
      return;
    }

    // Página con bloque final
    const parteTexto = texto.slice(0, idx).replace(/\s+$/g, '');
    const resto = texto.slice(idx + MARCADOR_BLOQUES.length);

    // Parseo por tags de secciones
    const lineas = resto.split('\n').map(l => String(l || '').trim()).filter(l => l.length > 0);

    let modo = '';
    const fili = [];
    const tips = [];

    for (const ln of lineas) {
      if (ln === TAG_FILI_INI) { modo = 'fili'; continue; }
      if (ln === TAG_FILI_FIN) { modo = ''; continue; }
      if (ln === TAG_TIPS_INI) { modo = 'tips'; continue; }
      if (ln === TAG_TIPS_FIN) { modo = ''; continue; }

      if (modo === 'fili') fili.push(ln);
      else if (modo === 'tips') tips.push(ln);
    }

    nodoTexto.innerHTML = '';

    const base = document.createElement('div');
    base.className = 'texto-base';
    base.textContent = aplicarIndentPrimeraLinea(parteTexto);
    nodoTexto.appendChild(base);

    // FILIACIONES
    if (fili.length) {
      const tituloF = document.createElement('div');
      tituloF.className = 'bloque-filiaciones-title';
      tituloF.textContent = 'FILIACIONES';
      nodoTexto.appendChild(tituloF);

      const contF = document.createElement('div');
      contF.className = 'bloque-filiaciones';
      fili.forEach((t) => {
        const p = document.createElement('div');
        p.className = 'filiacion-p';
        p.innerHTML = `<em>${escaparHtml(t)}</em>`;
        contF.appendChild(p);
      });
      nodoTexto.appendChild(contF);
    }

    // “La Fuerza Instructora” + TIPs (cajas)
    if (tips.length) {
      const fuerza = document.createElement('div');
      fuerza.className = 'bloque-fuerza';
      fuerza.textContent = 'La Fuerza Instructora';
      nodoTexto.appendChild(fuerza);

      const contTips = document.createElement('div');
      contTips.className = 'bloque-tips';
      contTips.innerHTML = tips
        .map((t) => `<span class="tip-box">${escaparHtml(t)}</span>`)
        .join('');
      nodoTexto.appendChild(contTips);
    } else if (fili.length) {
      // Si hay filiaciones, mantenemos el cierre estándar
      const fuerza = document.createElement('div');
      fuerza.className = 'bloque-fuerza';
      fuerza.textContent = 'La Fuerza Instructora';
      nodoTexto.appendChild(fuerza);
    }
  }

  // -----------------------------
  // Medición (paginación)
  // - Creamos un “field-texto” invisible con el mismo ancho/fuente
  // - Medimos renderizando con pintarTextoConBloques() para que sea 1:1
  // -----------------------------
  function crearNodoMedicion(hoja) {
    const objetivo = hoja ? hoja.querySelector('.field-texto') : null;

    const nodo = document.createElement('div');
    nodo.className = 'field field-texto';
    nodo.style.position = 'fixed';
    nodo.style.left = '-99999px';
    nodo.style.top = '0';
    nodo.style.height = 'auto';
    nodo.style.boxSizing = 'border-box';

    // Usar medidas reales del campo (más fiable que getComputedStyle().width en algunos casos)
    if (objetivo) {
      const rect = objetivo.getBoundingClientRect();
      if (rect && rect.width) nodo.style.width = `${rect.width}px`;
      else nodo.style.width = getComputedStyle(objetivo).width;
    } else {
      nodo.style.width = '800px';
    }

    // Copiar valores reales del campo (IMPORTANTE para que mida como imprime)
    if (objetivo) {
      const cs = getComputedStyle(objetivo);
      nodo.style.whiteSpace = cs.whiteSpace;
      nodo.style.wordBreak = cs.wordBreak;
      nodo.style.fontFamily = cs.fontFamily;
      nodo.style.fontSize = cs.fontSize;
      nodo.style.fontWeight = cs.fontWeight;
      nodo.style.fontStyle = cs.fontStyle;
      nodo.style.letterSpacing = cs.letterSpacing;
      nodo.style.wordSpacing = cs.wordSpacing;
      nodo.style.textTransform = cs.textTransform;
      nodo.style.lineHeight = cs.lineHeight;
    }

    document.body.appendChild(nodo);
    return nodo;
  }

  /**
   * Mide la altura real (en el mismo estilo del field-texto) del bloque final
   * “La Fuerza Instructora” + TIPs, para poder reservar ese espacio en la última hoja.
   */
  function medirAlturaBloqueFinal(hojaMuestra, tips, filiaciones) {
    const sufijo = construirSufijoBloquesFinales(tips, filiaciones);
    if (!sufijo) return 0;

    const medidor = crearNodoMedicion(hojaMuestra);
    medidor.innerHTML = '';
    // Render del bloque solo (sin texto base) para medir su altura exacta
    pintarTextoConBloques(medidor, sufijo.trimStart());
    const h = medidor.scrollHeight || medidor.getBoundingClientRect().height || 0;
    document.body.removeChild(medidor);
    return h;
  }

  
  // -----------------------------
  // Paginación robusta por overflow real (campo de la hoja)
  // - Evita depender de cálculos de alturas/anchos que pueden dar 0 o valores erróneos
  // - Usa el propio .field-texto de una hoja de muestra: scrollHeight vs clientHeight
  // -----------------------------
  function paginaCabeEnHoja(hojaMuestra, texto, idxPagina) {
    if (!hojaMuestra) return true;
    const campo = hojaMuestra.querySelector('.field-texto');
    if (!campo) return true;

    if (idxPagina === 0) hojaMuestra.classList.remove('sin-titulo');
    else hojaMuestra.classList.add('sin-titulo');

    campo.innerHTML = '';
    pintarTextoConBloques(campo, texto);

    // +1 para tolerar redondeos de subpíxeles
    return campo.scrollHeight <= (campo.clientHeight + 1);
  }

  function paginarTextoPorOverflow(texto, hojaMuestra) {
    const tokens = String(texto || '').replace(/\r\n/g, '\n').split(/(\s+)/);
    const paginas = [];

    let indice = 0;
    let idxPagina = 0;

    while (indice < tokens.length) {
      let lo = indice + 1;
      let hi = tokens.length;
      let mejor = indice + 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidato = tokens.slice(indice, mid).join('');

        if (paginaCabeEnHoja(hojaMuestra, candidato, idxPagina)) {
          mejor = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (mejor <= indice) mejor = indice + 1;

      paginas.push(tokens.slice(indice, mejor).join('').trimEnd());
      indice = mejor;
      idxPagina++;
    }

    return paginas.length ? paginas : [''];
  }

/**
   * Pagina el texto reservando en la ÚLTIMA hoja el hueco necesario para el bloque final.
   * Esto evita páginas “vacías” (p. ej. 1 línea en una hoja) cuando el bloque final obliga a partir.
   */
  function paginarTextoConReservaUltima(texto, hojaMuestra, alturas, alturaReservaUltima) {
    if (!alturaReservaUltima || alturaReservaUltima <= 0) {
      return paginarTexto(texto, hojaMuestra, alturas);
    }

    // 1) Primera estimación de cuántas páginas hacen falta sin reservar hueco
    let predPaginas = Math.max(1, paginarTexto(texto, hojaMuestra, alturas).length);

    // 2) Re-paginar aplicando reserva SOLO a la última página “predicha” hasta estabilizar
    let resultado = null;
    for (let i = 0; i < 6; i++) {
      resultado = paginarTextoConUltimaReducida(texto, hojaMuestra, alturas, predPaginas, alturaReservaUltima);
      if (resultado.length === predPaginas) break;
      predPaginas = resultado.length;
    }
    return resultado || [''];
  }

  /**
   * Variante de paginación con “última página” predicha a la que se le reduce altura.
   */
  function paginarTextoConUltimaReducida(texto, hojaMuestra, alturas, totalPredicho, reservaUltima) {
    const tokens = String(texto || '').replace(/\r\n/g, '\n').split(/(\s+)/);
    const medidor = crearNodoMedicion(hojaMuestra);

    /** @type {string[]} */
    const paginas = [];

    let indice = 0;
    let idxPagina = 0;

    const alturaBase = (n) => (n === 0 ? alturas.primera : alturas.restantes);

    while (indice < tokens.length) {
      let alturaMax = alturaBase(idxPagina);
      if (idxPagina === Math.max(0, totalPredicho - 1)) {
        alturaMax = Math.max(0, alturaMax - reservaUltima);
      }

      // Búsqueda binaria: máximo tramo de tokens que cabe en esta hoja
      let lo = indice + 1;
      let hi = tokens.length;
      let mejor = indice + 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidato = tokens.slice(indice, mid).join('');

        medidor.innerHTML = '';
        pintarTextoConBloques(medidor, candidato);
        const h = medidor.scrollHeight || medidor.getBoundingClientRect().height;

        if (h <= alturaMax) {
          mejor = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (mejor <= indice) mejor = indice + 1;

      const paginaTexto = tokens.slice(indice, mejor).join('').trimEnd();
      paginas.push(paginaTexto);

      indice = mejor;
      idxPagina++;
    }

    medidor.remove();
    return paginas.length ? paginas : [''];
  }

  /**
   * Pagina el texto en hojas.
   * - Página 1 usa alturas.primera
   * - Páginas 2+ usan alturas.restantes (sin reservar hueco de título)
   */
  function paginarTexto(texto, hojaMuestra, alturas) {
    const tokens = String(texto || '').replace(/\r\n/g, '\n').split(/(\s+)/);
    const medidor = crearNodoMedicion(hojaMuestra);

    /** @type {string[]} */
    const paginas = [];

    let indice = 0;
    let idxPagina = 0;

    const alturaParaPagina = (n) => (n === 0 ? alturas.primera : alturas.restantes);

    while (indice < tokens.length) {
      const alturaMax = alturaParaPagina(idxPagina);

      // Búsqueda binaria: máximo tramo de tokens que cabe en esta hoja
      let lo = indice + 1;
      let hi = tokens.length;
      let mejor = indice + 1;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidato = tokens.slice(indice, mid).join('');

        medidor.innerHTML = '';
        pintarTextoConBloques(medidor, candidato);
        const h = medidor.scrollHeight || medidor.getBoundingClientRect().height;

        if (h <= alturaMax) {
          mejor = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      if (mejor <= indice) mejor = indice + 1;

      const paginaTexto = tokens.slice(indice, mejor).join('').trimEnd();
      paginas.push(paginaTexto);

      indice = mejor;
      idxPagina++;
    }

    medidor.remove();
    return paginas.length ? paginas : [''];
  }

  // Nota: ya no usamos el “ajuste” incremental de la última página, porque produce páginas
  // casi vacías. En su lugar reservamos hueco del bloque final y paginamos desde el inicio.

// -----------------------------
  // Esperas para impresión estable
  // -----------------------------
  async function esperarFuentes() {
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    } catch (_) {}
  }

  async function esperarImagenesCargadas(contenedor) {
    const imgs = Array.from((contenedor || document).querySelectorAll('img'));
    const promesas = imgs.map((img) => new Promise((resolve) => {
      const listo = () => {
        if (img.decode) img.decode().then(resolve).catch(resolve);
        else resolve();
      };
      if (img.complete && img.naturalWidth > 0) return listo();
      img.addEventListener('load', listo, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }));
    await Promise.all(promesas);
  }

  // -----------------------------
  // Render final de páginas
  // -----------------------------
  async function renderizarPaginas(contenedor, datos) {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    await esperarFuentes();

    // Hoja de muestra (para medir alturas reales)
    const hojaMuestra = crearHoja();
    hojaMuestra.style.visibility = 'hidden';
    hojaMuestra.style.position = 'fixed';
    hojaMuestra.style.left = '-99999px';
    hojaMuestra.style.top = '0';
    document.body.appendChild(hojaMuestra);
    await esperarImagenesCargadas(hojaMuestra);

    // Paginación robusta por overflow real (si el texto excede, genera hojas adicionales)
    let paginas = paginarTextoPorOverflow(datos.texto, hojaMuestra);

    // Añadir bloque final (TIPs y/o filiaciones) a la última página si cabe.
    // Si no cabe, se envía a una hoja nueva para evitar cortes.
    const sufijo = construirSufijoBloquesFinales(datos.tips, datos.filiaciones);
    if (sufijo) {
      const idxUlt = Math.max(0, paginas.length - 1);
      const propuesta = (paginas[idxUlt] || '').trimEnd() + sufijo;

      if (paginaCabeEnHoja(hojaMuestra, propuesta, idxUlt)) {
        paginas[idxUlt] = propuesta;
      } else {
        paginas.push(sufijo.trimStart());
      }
    }

    hojaMuestra.remove();

    const pie = construirPieUnidadHtml(datos.unidad);

    // Folio autoincremental
    const folioTexto = String(datos.folio || '').trim();
    let folioBase = folioTexto ? parseInt(folioTexto, 10) : '';
    const folioEsNumero = Number.isFinite(folioBase);

    paginas.forEach((textoPagina, idx) => {
      const hoja = crearHoja();

      // Páginas 2+ no reservan hueco del título (CSS .sheet.sin-titulo)
      if (idx !== 0) hoja.classList.add('sin-titulo');

      hoja.querySelector('.field-atestado').textContent = datos.atestado;

      hoja.querySelector('.field-folio').textContent = folioEsNumero
        ? String(folioBase + idx)
        : folioTexto;

      // Título solo en la primera hoja
      hoja.querySelector('.field-titulo').textContent = (idx === 0) ? datos.nombre : '';

      const nodoTexto = hoja.querySelector('.field-texto');
      nodoTexto.innerHTML = '';
      pintarTextoConBloques(nodoTexto, textoPagina);

      hoja.querySelector('.field-footer').innerHTML = pie;

      contenedor.appendChild(hoja);
    });

    await esperarImagenesCargadas(contenedor);
  }

  async function construirDocumento() {
    const datos = recogerDatosFormulario();

    if (!datos.nombre) {
      alert('El nombre de la diligencia es obligatorio.');
      return null;
    }

    await renderizarPaginas(elementos.paginasImpresion, datos);
    return datos;
  }

  // -----------------------------
  // Eventos: imprimir / export / import
  // -----------------------------
  elementos.botonImprimir?.addEventListener('click', async () => {
    const datos = await construirDocumento();
    if (!datos) return;
    window.print();
  });

  elementos.botonDescargarJson?.addEventListener('click', async () => {
    const datos = await construirDocumento();
    if (!datos) return;

    const base = (U && typeof U.sanearNombreBaseArchivo === 'function')
      ? U.sanearNombreBaseArchivo(`diligencia_${datos.nombre}`)
      : sanearNombreBaseArchivo(`diligencia_${datos.nombre}`);

    const nombrePorDefecto = (U && typeof U.asegurarExtension === 'function')
      ? U.asegurarExtension(base || 'diligencia', '.json')
      : asegurarExtension(base || 'diligencia', '.json');

    const entradaNombre = prompt('Introduzca el nombre del archivo:', nombrePorDefecto);

    const nombreArchivo = (U && typeof U.asegurarExtension === 'function')
      ? U.asegurarExtension(entradaNombre, '.json')
      : asegurarExtension(entradaNombre, '.json');

    if (!nombreArchivo) return;

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  });

  elementos.enlaceCargarJson?.addEventListener('click', (e) => {
    e.preventDefault();
    elementos.archivoCargarJson?.click();
  });

  elementos.archivoCargarJson?.addEventListener('change', (e) => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (ev) => {
      try {
        const datos = JSON.parse(ev.target.result);

        if (typeof datos.atestado === 'string') elementos.atestado.value = datos.atestado;
        if (typeof datos.folio === 'string') elementos.folio.value = datos.folio;
        if (typeof datos.nombre === 'string') elementos.nombre.value = datos.nombre;
        if (typeof datos.texto === 'string') elementos.texto.value = datos.texto;

        // TIPs
        if (Array.isArray(datos.tips)) {
          listaTips = datos.tips.map(normalizarTip).filter(Boolean);
        } else {
          listaTips = [];
        }

        // Filiaciones
        if (Array.isArray(datos.filiaciones)) {
          listaFiliaciones = datos.filiaciones.map(normalizarFiliacion);
        } else {
          listaFiliaciones = [];
        }

        renderizarTipsUI();
        alert('Diligencia cargada correctamente');
      } catch (_) {
        alert('Error al leer el archivo. Asegúrese de que es un JSON válido.');
      }
    };
    lector.readAsText(archivo);
  });

  // -----------------------------
  // Init
  // -----------------------------
  engancharEventosTips();
  engancharEventosFiliaciones();
  renderizarTipsUI();
})();

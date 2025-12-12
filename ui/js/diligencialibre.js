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

  // -----------------------------
  // TIPS UI (no invasivo)
  // -----------------------------
  function renderizarTipsUI() {
    if (!elementos.tipsDetalles || !elementos.tipsContador || !elementos.tipsLista) return;

    elementos.tipsContador.textContent = String(listaTips.length);
    elementos.tipsLista.innerHTML = '';

    if (listaTips.length === 0) {
      elementos.tipsDetalles.style.display = 'none';
      return;
    }

    elementos.tipsDetalles.style.display = 'block';

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
    if (elementos.tipAnadir) {
      elementos.tipAnadir.addEventListener('click', anadirTipDesdeEntrada);
    }
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

  const MARCADOR_FUERZA = '[[FUERZA_INSTRUCTORA]]';
  // “Tab” pequeño (mejor con NBSP para que sea 100% estable en impresión)
  const INDENT_PARRAFO = '\u00A0\u00A0\u00A0';

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
  function construirSufijoFuerzaTips(tips) {
    const arr = Array.isArray(tips) ? tips.map(normalizarTip).filter(Boolean) : [];
    if (!arr.length) return '';
    // Nota: el marcador se detecta en pintarTextoConBloques()
    return `\n\n${MARCADOR_FUERZA}\n${arr.join('\n')}`;
  }

  /**
   * Pinta el contenido del field-texto.
   * - Sin marcador: texto plano con sangría.
   * - Con marcador: texto plano + bloque “La Fuerza Instructora” + TIPs en cajas.
   */
  function pintarTextoConBloques(nodoTexto, textoPagina) {
    if (!nodoTexto) return;

    const texto = String(textoPagina || '');
    const idx = texto.indexOf(MARCADOR_FUERZA);

    // Página normal: solo texto
    if (idx === -1) {
      nodoTexto.innerHTML = '';
      nodoTexto.textContent = aplicarIndentPrimeraLinea(texto);
      return;
    }

    // Página con bloque final
    const parteTexto = texto.slice(0, idx).replace(/\s+$/g, '');
    const resto = texto.slice(idx + MARCADOR_FUERZA.length);

    const tips = resto
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    nodoTexto.innerHTML = '';

    const base = document.createElement('div');
    base.className = 'texto-base';
    base.textContent = aplicarIndentPrimeraLinea(parteTexto);
    nodoTexto.appendChild(base);

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
    }
  }

  // -----------------------------
  // Medición (paginación)
  // - Creamos un “field-texto” invisible con el mismo ancho/fuente
  // - Medimos renderizando con pintarTextoConBloques() para que sea 1:1
  // -----------------------------
  function crearNodoMedicion(hoja) {
    const objetivo = hoja.querySelector('.field-texto');

    const nodo = document.createElement('div');
    nodo.className = 'field field-texto';
    nodo.style.position = 'fixed';
    nodo.style.left = '-99999px';
    nodo.style.top = '0';
    nodo.style.width = getComputedStyle(objetivo).width;
    nodo.style.height = 'auto';

    // Copiar los valores reales del campo (IMPORTANTE para que mida como imprime)
    const cs = getComputedStyle(objetivo);
    nodo.style.whiteSpace = cs.whiteSpace;
    nodo.style.wordBreak = cs.wordBreak;
    nodo.style.font = cs.font;
    nodo.style.lineHeight = cs.lineHeight;

    document.body.appendChild(nodo);
    return nodo;
  }

  /**
   * Mide la altura real (en el mismo estilo del field-texto) del bloque final
   * “La Fuerza Instructora” + TIPs, para poder reservar ese espacio en la última hoja.
   */
  function medirAlturaBloqueFinal(hojaMuestra, tips) {
    const sufijo = construirSufijoFuerzaTips(tips);
    if (!sufijo) return 0;

    const medidor = crearNodoMedicion(hojaMuestra);
    medidor.innerHTML = '';
    // Render del bloque solo (sin texto base) para medir su altura exacta
    pintarTextoConBloques(medidor, sufijo.trimStart());
    const h = medidor.getBoundingClientRect().height;
    medidor.remove();
    return h;
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
        const h = medidor.getBoundingClientRect().height;

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
        const h = medidor.getBoundingClientRect().height;

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

    // Alturas: primera (con título) y resto (sin título, aprovechando hueco)
    const campoTexto = hojaMuestra.querySelector('.field-texto');
    const alturaPrimera = campoTexto.getBoundingClientRect().height;

    hojaMuestra.classList.add('sin-titulo');
    const alturaRestantes = campoTexto.getBoundingClientRect().height;
    hojaMuestra.classList.remove('sin-titulo');

    const alturas = { primera: alturaPrimera, restantes: alturaRestantes };

    // Reservar hueco para el bloque final en la última hoja (si hay TIPs)
    const alturaBloqueFinal = medirAlturaBloqueFinal(hojaMuestra, datos.tips);

    // 1) Paginar el texto base reservando ese hueco SOLO en la última página
    let paginas = paginarTextoConReservaUltima(datos.texto, hojaMuestra, alturas, alturaBloqueFinal);

    // 2) Añadir el bloque final SOLO a la última página (ya cabe porque reservamos espacio)
    const sufijo = construirSufijoFuerzaTips(datos.tips);
    if (sufijo) {
      if (!Array.isArray(paginas) || paginas.length === 0) paginas = [''];
      paginas[paginas.length - 1] = (paginas[paginas.length - 1] || '').trimEnd() + sufijo;
    }

    hojaMuestra.remove();

    const pie = construirPieUnidadHtml(datos.unidad);

    // Folio autoincremental
    const folioTexto = String(datos.folio || '').trim();
    let folioBase = folioTexto ? parseInt(folioTexto, 10) : 1;
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

        if (Array.isArray(datos.tips)) {
          listaTips = datos.tips.map(normalizarTip).filter(Boolean);
          renderizarTipsUI();
        }

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
  renderizarTipsUI();
})();

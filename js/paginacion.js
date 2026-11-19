/**
 * Módulo de paginación pura y gestión de controles accesibles en SportLog.
 * Cumple con el Requisito 16 del Sprint 2:
 * - Función pura paginar() que devuelve elementos, página corregida y total de páginas.
 * - Corrección de páginas inválidas o fuera de límites a la más cercana.
 * - Generación de controles dinámicos («Anterior», números, «Siguiente») con aria-current="page"
 *   y desactivación accesible en los extremos.
 * - Sincronización en la URL (?pagina=X) con URLSearchParams y history.replaceState.
 * - Reinicio automático a la página 1 en búsquedas.
 *
 * @module paginacion
 */

export const ELEMENTOS_POR_PAGINA_DEFECTO = 6;

/**
 * Función pura que calcula la porción de elementos correspondiente a una página,
 * corrigiendo automáticamente valores fuera de límites.
 *
 * @param {Array} [lista=[]] Colección completa de elementos a paginar.
 * @param {number|string} [pagina=1] Número de página solicitado.
 * @param {number} [porPagina=ELEMENTOS_POR_PAGINA_DEFECTO] Elementos por página.
 * @returns {{
 *   elementos: Array,
 *   paginaCorregida: number,
 *   totalPaginas: number,
 *   totalElementos: number,
 *   porPagina: number
 * }}
 */
export function paginar(lista = [], pagina = 1, porPagina = ELEMENTOS_POR_PAGINA_DEFECTO) {
  const elementosTotales = Array.isArray(lista) ? lista : [];
  const total = elementosTotales.length;

  const limiteSeguro = Math.max(1, parseInt(porPagina, 10) || ELEMENTOS_POR_PAGINA_DEFECTO);
  const totalPaginas = Math.max(1, Math.ceil(total / limiteSeguro));

  // Corrección a la página válida más cercana:
  // - Si es <= 0, NaN o nulo -> página 1
  // - Si es > totalPaginas -> totalPaginas
  const paginaSolicitada = parseInt(pagina, 10);
  let paginaCorregida = 1;

  if (Number.isInteger(paginaSolicitada)) {
    if (paginaSolicitada < 1) {
      paginaCorregida = 1;
    } else if (paginaSolicitada > totalPaginas) {
      paginaCorregida = totalPaginas;
    } else {
      paginaCorregida = paginaSolicitada;
    }
  }

  const inicio = (paginaCorregida - 1) * limiteSeguro;
  const fin = inicio + limiteSeguro;
  const elementos = total === 0 ? [] : elementosTotales.slice(inicio, fin);

  return {
    elementos,
    paginaCorregida,
    totalPaginas,
    totalElementos: total,
    porPagina: limiteSeguro,
  };
}

/**
 * Obtiene el número de página actual desde los parámetros de la URL (?pagina=X).
 *
 * @param {Location} [ubicacion=window.location] Objeto de ubicación del navegador.
 * @returns {number} Página parseada o 1 por defecto.
 */
export function obtenerPaginaDeUrl(
  ubicacion = typeof window !== 'undefined' ? window.location : null,
) {
  if (!ubicacion || !ubicacion.search) {
    return 1;
  }
  const params = new URLSearchParams(ubicacion.search);
  const valor = parseInt(params.get('pagina'), 10);
  return Number.isInteger(valor) && valor >= 1 ? valor : 1;
}

/**
 * Sincroniza la página activa en los parámetros de la URL sin recargar la página.
 * Utiliza URLSearchParams y history.replaceState (Requisito 16).
 *
 * @param {number} pagina Número de página a reflejar.
 * @param {Object} [opciones={}]
 * @param {History} [opciones.historia=window.history]
 * @param {Location} [opciones.ubicacion=window.location]
 */
export function sincronizarPaginaEnUrl(
  pagina,
  {
    historia = typeof window !== 'undefined' ? window.history : null,
    ubicacion = typeof window !== 'undefined' ? window.location : null,
  } = {},
) {
  if (!historia || !ubicacion) {
    return;
  }

  const url = new URL(ubicacion.href);
  if (pagina > 1) {
    url.searchParams.set('pagina', String(pagina));
  } else {
    url.searchParams.delete('pagina');
  }

  historia.replaceState({}, '', url.toString());
}

/**
 * Reinicia la página a 1 en la URL (por ejemplo, al ejecutar un filtro de búsqueda).
 *
 * @param {Object} [opciones={}]
 */
export function reiniciarPaginaEnUrl(opciones = {}) {
  sincronizarPaginaEnUrl(1, opciones);
}

/**
 * Renderiza los controles accesibles de paginación (Anterior, números y Siguiente)
 * en el contenedor `<ul class="paginacion-lista">`.
 *
 * @param {HTMLElement} contenedorLista Elemento `<ul>` donde inyectar los items.
 * @param {Object} opciones
 * @param {number} opciones.paginaActual Página activa.
 * @param {number} opciones.totalPaginas Total de páginas.
 * @param {Document} [opciones.documento=document]
 */
export function renderizarControlesPaginacion(
  contenedorLista,
  { paginaActual, totalPaginas, documento = typeof document !== 'undefined' ? document : null },
) {
  if (!contenedorLista || !documento) {
    return;
  }

  contenedorLista.replaceChildren();

  // 1. Botón «Anterior»
  const liAnterior = documento.createElement('li');
  liAnterior.className = 'paginacion-item';

  const btnAnterior = documento.createElement('button');
  btnAnterior.type = 'button';
  btnAnterior.className = 'btn-pagina';
  btnAnterior.dataset.accion = 'anterior';
  btnAnterior.setAttribute('aria-label', 'Página anterior');
  btnAnterior.textContent = '← Anterior';

  if (paginaActual <= 1) {
    btnAnterior.disabled = true;
  }

  liAnterior.appendChild(btnAnterior);
  contenedorLista.appendChild(liAnterior);

  // 2. Números de página
  for (let p = 1; p <= totalPaginas; p++) {
    const liNumero = documento.createElement('li');
    liNumero.className = 'paginacion-item';

    const btnNumero = documento.createElement('button');
    btnNumero.type = 'button';
    btnNumero.className = 'btn-pagina';
    btnNumero.dataset.pagina = String(p);
    btnNumero.textContent = String(p);

    if (p === paginaActual) {
      btnNumero.classList.add('activo');
      btnNumero.setAttribute('aria-current', 'page');
    }

    liNumero.appendChild(btnNumero);
    contenedorLista.appendChild(liNumero);
  }

  // 3. Botón «Siguiente»
  const liSiguiente = documento.createElement('li');
  liSiguiente.className = 'paginacion-item';

  const btnSiguiente = documento.createElement('button');
  btnSiguiente.type = 'button';
  btnSiguiente.className = 'btn-pagina';
  btnSiguiente.dataset.accion = 'siguiente';
  btnSiguiente.setAttribute('aria-label', 'Página siguiente');
  btnSiguiente.textContent = 'Siguiente →';

  if (paginaActual >= totalPaginas) {
    btnSiguiente.disabled = true;
  }

  liSiguiente.appendChild(btnSiguiente);
  contenedorLista.appendChild(liSiguiente);
}

/**
 * Conecta el oyente de eventos en el contenedor de paginación usando delegación (Requisito 20)
 * para detectar pulsaciones en Anterior, Siguiente o números de página.
 *
 * @param {HTMLElement} contenedorLista Elemento contenedor de la lista.
 * @param {Function} onCambiarPagina Callback invocado con el nuevo número de página.
 * @param {Object} opciones
 * @param {number} opciones.paginaActual
 * @param {number} opciones.totalPaginas
 * @returns {Function} Función para desuscribir el evento si fuera necesario.
 */
export function manejarClickPaginacion(
  contenedorLista,
  onCambiarPagina,
  { paginaActual, totalPaginas },
) {
  if (!contenedorLista || typeof onCambiarPagina !== 'function') {
    return () => {};
  }

  const manejador = (evento) => {
    const boton = evento.target.closest('.btn-pagina');
    if (!boton || boton.disabled) {
      return;
    }

    if (boton.dataset.pagina) {
      const nuevaPagina = parseInt(boton.dataset.pagina, 10);
      if (nuevaPagina !== paginaActual) {
        onCambiarPagina(nuevaPagina);
      }
    } else if (boton.dataset.accion === 'anterior' && paginaActual > 1) {
      onCambiarPagina(paginaActual - 1);
    } else if (boton.dataset.accion === 'siguiente' && paginaActual < totalPaginas) {
      onCambiarPagina(paginaActual + 1);
    }
  };

  contenedorLista.addEventListener('click', manejador);
  return () => contenedorLista.removeEventListener('click', manejador);
}

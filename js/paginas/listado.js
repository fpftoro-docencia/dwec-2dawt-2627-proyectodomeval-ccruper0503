/**
 * Controlador de la página principal de listado de entrenamientos (listado.html).
 * Sprint 1: Control de sesión, protección de ruta privada y cabecera de usuario.
 * Sprint 2 (S2-07): Renderizado desde <template> sin innerHTML, KPIs, buscador con debounce
 * insensible a mayúsculas y tildes, filtro por disciplina, paginación sincronizada en URL
 * y borrado con confirmación mediante <dialog> nativo accesible.
 *
 * @module paginas/listado
 */

import { iniciarAvisos, lanzarAviso } from '../avisos.js';
import { protegerPaginaPrivada, configurarCabeceraPrivada, obtenerSesion } from '../sesion.js';
import { obtenerEntrenamientos, borrarEntrenamiento } from '../entrenamientos.js';
import {
  ELEMENTOS_POR_PAGINA_DEFECTO,
  paginar,
  obtenerPaginaDeUrl,
  sincronizarPaginaEnUrl,
  reiniciarPaginaEnUrl,
  renderizarControlesPaginacion,
  manejarClickPaginacion,
} from '../paginacion.js';

export const RETRASO_DEBOUNCE_DEFECTO = 250;

const ETIQUETAS_DISCIPLINA = {
  running: 'Running',
  trail: 'Trail',
  ciclismo: 'Ciclismo',
  mtb: 'MTB',
  fuerza: 'Fuerza',
  natacion: 'Natación',
  hiit: 'HIIT',
  otro: 'Otro',
};

const CLASES_DISCIPLINA = {
  running: 'running',
  trail: 'running',
  ciclismo: 'ciclismo',
  mtb: 'ciclismo',
  fuerza: 'fuerza',
  hiit: 'fuerza',
  natacion: 'natacion',
};

/**
 * Normaliza un texto eliminando tildes/diacríticos y convirtiendo a minúsculas.
 *
 * @param {string} [texto=''] Texto de entrada.
 * @returns {string} Texto normalizado para búsquedas.
 */
export function normalizarTexto(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Formatea una duración expresada en minutos totales.
 *
 * @param {number} minutosTotales Duración en minutos.
 * @returns {string} Duración legible (ej. "1h 15m" o "45 min").
 */
export function formatearDuracion(minutosTotales) {
  const minutosSeguros = Math.max(0, parseInt(minutosTotales, 10) || 0);
  if (minutosSeguros < 60) {
    return `${minutosSeguros} min`;
  }
  const horas = Math.floor(minutosSeguros / 60);
  const minutos = minutosSeguros % 60;
  return `${horas}h ${minutos}m`;
}

/**
 * Ordena los entrenamientos del más reciente al más antiguo.
 *
 * @param {Array<Object>} [lista=[]] Lista de entrenamientos.
 * @returns {Array<Object>} Copia ordenada de la lista.
 */
export function ordenarEntrenamientos(lista = []) {
  return [...lista].sort((a, b) => {
    const fechaA = a.fecha || '';
    const fechaB = b.fecha || '';
    if (fechaB !== fechaA) {
      return fechaB.localeCompare(fechaA);
    }
    const creacionA = a.creadoEn || a.fechaCreacion || '';
    const creacionB = b.creadoEn || b.fechaCreacion || '';
    return creacionB.localeCompare(creacionA);
  });
}

/**
 * Filtra los entrenamientos por término de búsqueda (sin distinguir mayúsculas ni tildes)
 * y por disciplina seleccionada.
 *
 * @param {Array<Object>} [lista=[]] Lista de entrenamientos.
 * @param {string} [termino=''] Término de búsqueda.
 * @param {string} [disciplina='todas'] Disciplina activa o 'todas'.
 * @returns {Array<Object>} Lista filtrada.
 */
export function filtrarEntrenamientos(lista = [], termino = '', disciplina = 'todas') {
  const terminoNormalizado = normalizarTexto(termino);

  return lista.filter((item) => {
    if (disciplina && disciplina !== 'todas' && item.disciplina !== disciplina) {
      return false;
    }

    if (!terminoNormalizado) {
      return true;
    }

    const etiqueta = ETIQUETAS_DISCIPLINA[item.disciplina] || item.disciplina || '';
    const campos = [item.titulo, item.disciplina, etiqueta, item.notas, item.nombreCompeticion];

    return campos.some((campo) => normalizarTexto(campo).includes(terminoNormalizado));
  });
}

/**
 * Calcula las métricas globales (KPIs) a partir de los entrenamientos del usuario.
 *
 * @param {Array<Object>} [lista=[]] Lista completa de entrenamientos del usuario.
 * @returns {{
 *   totalSesiones: number,
 *   horasActivas: number,
 *   minutosRestantes: number,
 *   distanciaTotal: number,
 *   caloriasTotales: number
 * }}
 */
export function calcularKpis(lista = []) {
  let minutosTotales = 0;
  let distanciaTotal = 0;
  let caloriasTotales = 0;

  for (const item of lista) {
    minutosTotales += Number(item.duracion) || 0;
    distanciaTotal += Number(item.distancia) || 0;
    caloriasTotales += Number(item.calorias) || 0;
  }

  return {
    totalSesiones: lista.length,
    horasActivas: Math.floor(minutosTotales / 60),
    minutosRestantes: minutosTotales % 60,
    distanciaTotal,
    caloriasTotales,
  };
}

/**
 * Abre un elemento <dialog> de forma compatible con navegadores y entornos de test.
 *
 * @param {HTMLDialogElement} dialogo Elemento dialog a abrir.
 */
function abrirDialogo(dialogo) {
  if (typeof dialogo.showModal === 'function') {
    dialogo.showModal();
  } else {
    dialogo.setAttribute('open', '');
  }
}

/**
 * Cierra un elemento <dialog> de forma compatible con navegadores y entornos de test.
 *
 * @param {HTMLDialogElement} dialogo Elemento dialog a cerrar.
 */
function cerrarDialogo(dialogo) {
  if (typeof dialogo.close === 'function') {
    dialogo.close();
  } else {
    dialogo.removeAttribute('open');
  }
}

/**
 * Inicializa la página del listado de entrenamientos.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén de sesión activa.
 * @param {Storage} [opciones.almacenEntrenamientos=localStorage] Almacén de entrenamientos.
 * @param {Function} [opciones.navegar] Función de navegación.
 * @param {Location|Object} [opciones.ubicacion] Objeto de ubicación para leer la URL.
 * @param {History|Object} [opciones.historia] Objeto history para sincronizar la URL.
 * @param {number} [opciones.porPagina=ELEMENTOS_POR_PAGINA_DEFECTO] Registros por página.
 * @param {number} [opciones.retrasoDebounce=RETRASO_DEBOUNCE_DEFECTO] Retraso del buscador en ms.
 */
export function iniciarListado({
  documento = document,
  almacenSesion = sessionStorage,
  almacenEntrenamientos = localStorage,
  navegar = (url) => location.replace(url),
  ubicacion = typeof window !== 'undefined' ? window.location : null,
  historia = typeof window !== 'undefined' ? window.history : null,
  porPagina = ELEMENTOS_POR_PAGINA_DEFECTO,
  retrasoDebounce = RETRASO_DEBOUNCE_DEFECTO,
} = {}) {
  iniciarAvisos(documento, almacenSesion);

  if (!protegerPaginaPrivada(almacenSesion, navegar)) {
    return;
  }

  configurarCabeceraPrivada(documento, almacenSesion, navegar);
  const sesion = obtenerSesion(almacenSesion);
  const usuario = sesion?.nombreUsuario;

  const contenedor = documento.getElementById('contenedor-entrenamientos');
  const plantilla = documento.getElementById('plantilla-entrenamiento');
  const panelVacio = documento.getElementById('panel-vacio');
  const panelVacioTitulo = documento.getElementById('panel-vacio-titulo');
  const panelVacioTexto = documento.getElementById('panel-vacio-texto');
  const campoBuscar = documento.getElementById('campo-buscar');
  const filtrosDisciplinas = documento.getElementById('filtros-disciplinas');
  const contadorResultados = documento.getElementById('contador-resultados');
  const paginacionNav = documento.getElementById('paginacion-entrenamientos');
  const resumenPaginacion = documento.getElementById('resumen-paginacion');
  const listaPaginacion = documento.getElementById('lista-paginacion');

  const kpiSesiones = documento.getElementById('kpi-sesiones');
  const kpiTiempo = documento.getElementById('kpi-tiempo');
  const kpiDistancia = documento.getElementById('kpi-distancia');
  const kpiCalorias = documento.getElementById('kpi-calorias');

  const dialogoBorrar = documento.getElementById('dialogo-borrar');
  const dialogoBorrarNombre = documento.getElementById('dialogo-borrar-nombre');
  const btnCancelarBorrado = documento.getElementById('btn-cancelar-borrado');
  const btnConfirmarBorrado = documento.getElementById('btn-confirmar-borrado');

  let terminoBusqueda = '';
  let disciplinaActiva = 'todas';
  let paginaActual = obtenerPaginaDeUrl(ubicacion);
  let idPendienteBorrado = null;
  let temporizadorDebounce = null;
  let desuscribirPaginacion = null;

  /**
   * Actualiza los indicadores KPI superiores con los totales del usuario.
   *
   * @param {Array<Object>} todos Lista completa de entrenamientos.
   */
  function renderizarKpis(todos) {
    const kpis = calcularKpis(todos);

    if (kpiSesiones) {
      kpiSesiones.textContent = String(kpis.totalSesiones);
    }
    if (kpiTiempo) {
      kpiTiempo.textContent = `${kpis.horasActivas}h ${kpis.minutosRestantes}m`;
    }
    if (kpiDistancia) {
      const unidad = documento.createElement('small');
      unidad.textContent = ' km';
      kpiDistancia.replaceChildren(
        documento.createTextNode(kpis.distanciaTotal.toFixed(1)),
        unidad,
      );
    }
    if (kpiCalorias) {
      const unidad = documento.createElement('small');
      unidad.textContent = ' kcal';
      kpiCalorias.replaceChildren(documento.createTextNode(String(kpis.caloriasTotales)), unidad);
    }
  }

  /**
   * Genera las píldoras de filtro por disciplina con su contador.
   *
   * @param {Array<Object>} todos Lista completa de entrenamientos.
   */
  function renderizarPillsDisciplinas(todos) {
    if (!filtrosDisciplinas) {
      return;
    }

    const conteo = new Map();
    for (const item of todos) {
      if (item.disciplina) {
        conteo.set(item.disciplina, (conteo.get(item.disciplina) || 0) + 1);
      }
    }

    if (disciplinaActiva !== 'todas' && !conteo.has(disciplinaActiva)) {
      disciplinaActiva = 'todas';
    }

    const botones = [];
    const btnTodos = documento.createElement('button');
    btnTodos.type = 'button';
    btnTodos.className = 'pill-filtro';
    btnTodos.dataset.disciplina = 'todas';
    btnTodos.textContent = `Todos (${todos.length})`;
    if (disciplinaActiva === 'todas') {
      btnTodos.classList.add('activo');
    }
    btnTodos.setAttribute('aria-pressed', String(disciplinaActiva === 'todas'));
    botones.push(btnTodos);

    for (const [clave, cantidad] of conteo.entries()) {
      const btn = documento.createElement('button');
      btn.type = 'button';
      btn.className = 'pill-filtro';
      btn.dataset.disciplina = clave;
      const etiqueta = ETIQUETAS_DISCIPLINA[clave] || clave;
      btn.textContent = `${etiqueta} (${cantidad})`;
      if (disciplinaActiva === clave) {
        btn.classList.add('activo');
      }
      btn.setAttribute('aria-pressed', String(disciplinaActiva === clave));
      botones.push(btn);
    }

    filtrosDisciplinas.replaceChildren(...botones);
  }

  /**
   * Crea un nodo de tarjeta de entrenamiento clonando la plantilla <template>.
   *
   * @param {Object} entrenamiento Registro de entrenamiento.
   * @returns {DocumentFragment|null} Fragmento listo para insertar.
   */
  function crearTarjetaEntrenamiento(entrenamiento) {
    if (!plantilla) {
      return null;
    }

    const fragmento = plantilla.content.cloneNode(true);
    const tarjeta = fragmento.querySelector('.tarjeta-entrenamiento');
    if (tarjeta) {
      tarjeta.dataset.id = entrenamiento.id || '';
    }

    const badgeDisciplina = fragmento.querySelector('.badge-disciplina');
    if (badgeDisciplina) {
      const claveDisciplina = entrenamiento.disciplina || 'otro';
      badgeDisciplina.textContent = ETIQUETAS_DISCIPLINA[claveDisciplina] || claveDisciplina;
      const claseExtra = CLASES_DISCIPLINA[claveDisciplina];
      if (claseExtra) {
        badgeDisciplina.classList.add(claseExtra);
      }
    }

    const elFecha = fragmento.querySelector('.tarjeta-fecha');
    if (elFecha) {
      elFecha.textContent = entrenamiento.fecha || '—';
    }

    const elTitulo = fragmento.querySelector('.tarjeta-titulo');
    if (elTitulo) {
      elTitulo.textContent = entrenamiento.titulo || 'Entrenamiento sin título';
    }

    const elSensaciones = fragmento.querySelector('.tarjeta-sensaciones');
    if (elSensaciones) {
      elSensaciones.textContent = entrenamiento.notas || 'Sin sensaciones registradas.';
    }

    const elDistancia = fragmento.querySelector('.distancia-num');
    if (elDistancia) {
      elDistancia.textContent =
        entrenamiento.distancia !== null && entrenamiento.distancia !== undefined
          ? `${entrenamiento.distancia} km`
          : '—';
    }

    const elDuracion = fragmento.querySelector('.duracion-num');
    if (elDuracion) {
      elDuracion.textContent = formatearDuracion(entrenamiento.duracion);
    }

    const elRitmo = fragmento.querySelector('.ritmo-num');
    if (elRitmo) {
      elRitmo.textContent = entrenamiento.frecuenciaCardiaca
        ? `${entrenamiento.frecuenciaCardiaca} ppm`
        : '—';
    }

    const elRpe = fragmento.querySelector('.badge-rpe');
    if (elRpe) {
      elRpe.textContent = `RPE ${entrenamiento.esfuerzoRpe ?? '—'}/10`;
    }

    const enlaceEditar = fragmento.querySelector('.enlace-editar');
    if (enlaceEditar) {
      enlaceEditar.href = `ficha.html?id=${encodeURIComponent(entrenamiento.id || '')}`;
    }

    const botonBorrar = fragmento.querySelector('.boton-borrar');
    if (botonBorrar) {
      botonBorrar.dataset.id = entrenamiento.id || '';
      botonBorrar.dataset.titulo = entrenamiento.titulo || '';
      botonBorrar.setAttribute(
        'aria-label',
        `Borrar entrenamiento ${entrenamiento.titulo || ''}`.trim(),
      );
    }

    return fragmento;
  }

  /**
   * Actualiza el texto resumen de la paginación sin usar innerHTML.
   *
   * @param {number} pagina Página actual.
   * @param {number} totalPaginas Total de páginas.
   * @param {number} mostrados Cantidad de registros mostrados en la página.
   */
  function actualizarResumenPaginacion(pagina, totalPaginas, mostrados) {
    if (!resumenPaginacion) {
      return;
    }

    const strongPagina = documento.createElement('strong');
    strongPagina.textContent = String(pagina);

    const strongTotal = documento.createElement('strong');
    strongTotal.textContent = String(totalPaginas);

    const strongMostrados = documento.createElement('strong');
    strongMostrados.textContent = String(mostrados);

    resumenPaginacion.replaceChildren(
      documento.createTextNode('Página '),
      strongPagina,
      documento.createTextNode(' de '),
      strongTotal,
      documento.createTextNode(' · Mostrando '),
      strongMostrados,
      documento.createTextNode(' registros'),
    );
  }

  /**
   * Recalcula filtros, paginación y renderiza la vista completa de una sola vez.
   */
  function renderizar() {
    const todos = ordenarEntrenamientos(obtenerEntrenamientos(usuario, almacenEntrenamientos));
    renderizarKpis(todos);
    renderizarPillsDisciplinas(todos);

    const filtrados = filtrarEntrenamientos(todos, terminoBusqueda, disciplinaActiva);
    const resultado = paginar(filtrados, paginaActual, porPagina);

    if (resultado.paginaCorregida !== paginaActual) {
      paginaActual = resultado.paginaCorregida;
      sincronizarPaginaEnUrl(paginaActual, { historia, ubicacion });
    }

    if (contadorResultados) {
      if (resultado.totalElementos === 0) {
        contadorResultados.textContent = 'Mostrando 0 entrenamientos';
      } else {
        const sufijo = resultado.totalElementos === 1 ? 'entrenamiento' : 'entrenamientos';
        contadorResultados.textContent = `Mostrando ${resultado.elementos.length} de ${resultado.totalElementos} ${sufijo}`;
      }
    }

    if (resultado.totalElementos === 0) {
      if (contenedor) {
        contenedor.hidden = true;
        contenedor.replaceChildren();
      }
      if (panelVacio) {
        panelVacio.hidden = false;
      }
      if (panelVacioTitulo && panelVacioTexto) {
        if (todos.length === 0) {
          panelVacioTitulo.textContent = 'Aún no hay entrenamientos guardados';
          panelVacioTexto.textContent =
            'Registra tu primera sesión para comenzar a visualizar tus métricas y progreso.';
        } else {
          panelVacioTitulo.textContent = 'No se encontraron entrenamientos';
          panelVacioTexto.textContent =
            'Prueba con otros términos de búsqueda o cambia el filtro de disciplina.';
        }
      }
    } else {
      if (panelVacio) {
        panelVacio.hidden = true;
      }
      if (contenedor) {
        contenedor.hidden = false;
        const fragmento = documento.createDocumentFragment();
        for (const item of resultado.elementos) {
          const tarjeta = crearTarjetaEntrenamiento(item);
          if (tarjeta) {
            fragmento.appendChild(tarjeta);
          }
        }
        contenedor.replaceChildren(fragmento);
      }
    }

    if (paginacionNav) {
      paginacionNav.hidden = resultado.totalPaginas <= 1;
    }

    actualizarResumenPaginacion(
      resultado.paginaCorregida,
      resultado.totalPaginas,
      resultado.elementos.length,
    );

    if (listaPaginacion) {
      renderizarControlesPaginacion(listaPaginacion, {
        paginaActual: resultado.paginaCorregida,
        totalPaginas: resultado.totalPaginas,
        documento,
      });

      if (desuscribirPaginacion) {
        desuscribirPaginacion();
      }
      desuscribirPaginacion = manejarClickPaginacion(
        listaPaginacion,
        (nuevaPagina) => {
          paginaActual = nuevaPagina;
          sincronizarPaginaEnUrl(paginaActual, { historia, ubicacion });
          renderizar();
        },
        {
          paginaActual: resultado.paginaCorregida,
          totalPaginas: resultado.totalPaginas,
        },
      );
    }
  }

  // 1. Buscador reactivo con debounce y reinicio a página 1
  if (campoBuscar) {
    campoBuscar.addEventListener('input', () => {
      if (temporizadorDebounce) {
        clearTimeout(temporizadorDebounce);
      }
      temporizadorDebounce = setTimeout(() => {
        terminoBusqueda = campoBuscar.value;
        paginaActual = 1;
        reiniciarPaginaEnUrl({ historia, ubicacion });
        renderizar();
      }, retrasoDebounce);
    });
  }

  // 2. Delegación de eventos en filtro de disciplinas
  if (filtrosDisciplinas) {
    filtrosDisciplinas.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.pill-filtro');
      if (!boton) {
        return;
      }
      const nuevaDisciplina = boton.dataset.disciplina || 'todas';
      if (nuevaDisciplina !== disciplinaActiva) {
        disciplinaActiva = nuevaDisciplina;
        paginaActual = 1;
        reiniciarPaginaEnUrl({ historia, ubicacion });
        renderizar();
      }
    });
  }

  // 3. Delegación de eventos en el listado para abrir el <dialog> de borrado
  if (contenedor && dialogoBorrar) {
    contenedor.addEventListener('click', (evento) => {
      const botonBorrar = evento.target.closest('.boton-borrar');
      if (!botonBorrar) {
        return;
      }
      idPendienteBorrado = botonBorrar.dataset.id || null;
      if (!idPendienteBorrado) {
        return;
      }
      if (dialogoBorrarNombre) {
        const titulo = botonBorrar.dataset.titulo || '';
        dialogoBorrarNombre.textContent = titulo;
        dialogoBorrarNombre.hidden = !titulo;
      }
      abrirDialogo(dialogoBorrar);
    });
  }

  // 4. Controles del diálogo de confirmación de borrado
  if (btnCancelarBorrado && dialogoBorrar) {
    btnCancelarBorrado.addEventListener('click', () => {
      idPendienteBorrado = null;
      cerrarDialogo(dialogoBorrar);
    });
  }

  if (btnConfirmarBorrado && dialogoBorrar) {
    btnConfirmarBorrado.addEventListener('click', () => {
      if (idPendienteBorrado) {
        const eliminado = borrarEntrenamiento(usuario, idPendienteBorrado, almacenEntrenamientos);
        idPendienteBorrado = null;
        cerrarDialogo(dialogoBorrar);
        renderizar();
        if (eliminado) {
          lanzarAviso(
            contenedor || documento.body,
            'Entrenamiento eliminado correctamente.',
            'success',
          );
        }
      } else {
        cerrarDialogo(dialogoBorrar);
      }
    });
  }

  renderizar();
}

// Iniciar automáticamente en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarListado());
  } else {
    iniciarListado();
  }
}

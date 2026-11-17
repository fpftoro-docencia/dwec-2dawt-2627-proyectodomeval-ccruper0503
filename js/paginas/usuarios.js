/**
 * Controlador de la página de administración de usuarios (usuarios.html).
 * Cumple con los Requisitos 7, 16 y 18:
 * - Protección exclusiva para administradores (protegerPaginaAdmin).
 * - Cabecera privada con datos del usuario activo.
 * - Listado renderizado desde <template> sin innerHTML ni estilos en línea.
 * - Buscador con debounce insensible a mayúsculas y tildes, y filtro por rol.
 * - Paginación compartida con sincronización en URL (?pagina=X).
 * - Cambio de roles con confirmación en <dialog> nativo y protección para que
 *   el administrador actual no pueda quitarse su propio rol ni dejar 0 admins.
 *
 * @module paginas/usuarios
 */

import { iniciarAvisos, lanzarAviso } from '../avisos.js';
import {
  ELEMENTOS_POR_PAGINA_DEFECTO,
  manejarClickPaginacion,
  obtenerPaginaDeUrl,
  paginar,
  reiniciarPaginaEnUrl,
  renderizarControlesPaginacion,
  sincronizarPaginaEnUrl,
} from '../paginacion.js';
import { protegerPaginaAdmin, configurarCabeceraPrivada, obtenerSesion } from '../sesion.js';
import { obtenerUsuarios, guardarUsuarios, ROL_ADMINISTRADOR, ROL_USUARIO } from '../usuarios.js';

export const RETRASO_BUSQUEDA_DEFECTO = 250;

/**
 * Normaliza una cadena eliminando tildes/diacríticos y pasándola a minúsculas.
 *
 * @param {string} texto Texto de entrada.
 * @returns {string} Texto normalizado para comparaciones.
 */
export function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra la lista de usuarios por término de búsqueda (nombre o correo) y rol.
 *
 * @param {Array<Object>} usuarios Lista completa de usuarios.
 * @param {Object} [filtros={}] Criterios de filtrado.
 * @param {string} [filtros.termino=''] Texto de búsqueda.
 * @param {string} [filtros.filtroRol='todos'] Rol seleccionado ('todos', 'administrador', 'usuario').
 * @returns {Array<Object>} Lista filtrada de usuarios.
 */
export function filtrarUsuarios(usuarios, { termino = '', filtroRol = 'todos' } = {}) {
  const lista = Array.isArray(usuarios) ? usuarios : [];
  const busqueda = normalizarTexto(termino);

  return lista.filter((usuario) => {
    if (filtroRol !== 'todos' && usuario.rol !== filtroRol) {
      return false;
    }

    if (!busqueda) {
      return true;
    }

    const nombreNormalizado = normalizarTexto(usuario.nombreUsuario);
    const correoNormalizado = normalizarTexto(usuario.correo);
    return nombreNormalizado.includes(busqueda) || correoNormalizado.includes(busqueda);
  });
}

/**
 * Formatea una fecha ISO en formato legible o devuelve '—' si no es válida.
 *
 * @param {string} fechaIso Cadena de fecha ISO.
 * @returns {string} Fecha formateada.
 */
function formatearFechaAlta(fechaIso) {
  if (!fechaIso) {
    return '—';
  }
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return '—';
  }
  return fecha.toLocaleDateString('es-ES');
}

/**
 * Crea una fila <tr> clonando <template id="plantilla-fila-usuario"> y rellenándola
 * de forma segura con textContent y atributos.
 *
 * @param {Document} documento Documento DOM.
 * @param {HTMLTemplateElement} plantilla Plantilla de fila de usuario.
 * @param {Object} usuario Datos del usuario.
 * @param {Object|null} sesion Sesión activa actual.
 * @returns {DocumentFragment} Fragmento con la fila lista para insertar.
 */
function crearFilaUsuario(documento, plantilla, usuario, sesion) {
  const trPlantilla = plantilla.content.querySelector('tr');
  const fragmento = trPlantilla ? trPlantilla.cloneNode(true) : plantilla.content.cloneNode(true);
  const esAdmin = usuario.rol === ROL_ADMINISTRADOR;
  const esElMismo =
    Boolean(sesion) &&
    sesion.nombreUsuario.toLowerCase() === String(usuario.nombreUsuario || '').toLowerCase();

  const avatar = fragmento.querySelector('.usuario-avatar-chico');
  if (avatar) {
    avatar.textContent = String(usuario.nombreUsuario || '?')
      .slice(0, 2)
      .toUpperCase();
    avatar.classList.add(esAdmin ? 'bg-warning' : 'bg-info', 'text-dark');
  }

  const nombre = fragmento.querySelector('.usuario-nombre');
  if (nombre) {
    nombre.textContent = usuario.nombreUsuario;
  }

  const tag = fragmento.querySelector('.usuario-tag');
  if (tag) {
    tag.textContent = esAdmin ? '👑 Administrador' : 'Atleta SportLog';
  }

  const correo = fragmento.querySelector('.usuario-correo');
  if (correo) {
    correo.textContent = usuario.correo;
  }

  const badge = fragmento.querySelector('.badge-rol');
  if (badge) {
    badge.className = `badge-rol ${esAdmin ? 'admin' : 'usuario'}`;
    badge.textContent = esAdmin ? 'Administrador' : 'Usuario';
  }

  const fecha = fragmento.querySelector('.usuario-fecha');
  if (fecha) {
    fecha.textContent = formatearFechaAlta(usuario.creadoEn);
  }

  const boton = fragmento.querySelector('.boton-accion-rol');
  const motivoBloqueo = fragmento.querySelector('.usuario-motivo-bloqueo');

  if (boton) {
    boton.dataset.usuario = usuario.nombreUsuario;

    if (esElMismo) {
      boton.disabled = true;
      boton.className = 'btn btn-outline-secondary btn-sm boton-accion-rol';
      boton.title = 'No puedes quitarte el rol de administrador a ti mismo';
      boton.textContent = 'Quitar rol (desactivado)';

      if (motivoBloqueo) {
        const idMotivo = `motivo-bloqueo-${normalizarTexto(usuario.nombreUsuario).replace(/[^a-z0-9_-]/g, '') || 'actual'}`;
        motivoBloqueo.id = idMotivo;
        motivoBloqueo.hidden = false;
        motivoBloqueo.textContent = '🔒 Tu usuario actual: no puedes quitarte el rol';
        boton.setAttribute('aria-describedby', idMotivo);
      }
    } else {
      boton.disabled = false;
      boton.className = esAdmin
        ? 'btn btn-outline-danger btn-sm boton-accion-rol'
        : 'btn btn-outline-warning btn-sm boton-accion-rol';
      boton.textContent = esAdmin ? 'Quitar Administrador' : 'Hacer Administrador';

      if (motivoBloqueo) {
        motivoBloqueo.hidden = true;
        motivoBloqueo.textContent = '';
      }
    }
  }

  return fragmento;
}

/**
 * Abre un elemento <dialog> de forma compatible con navegadores y entornos de test.
 *
 * @param {HTMLDialogElement} dialogo Elemento de diálogo nativo.
 */
function abrirDialogo(dialogo) {
  if (!dialogo) {
    return;
  }
  if (typeof dialogo.showModal === 'function') {
    dialogo.showModal();
  } else {
    dialogo.setAttribute('open', '');
  }
}

/**
 * Cierra un elemento <dialog> de forma compatible con navegadores y entornos de test.
 *
 * @param {HTMLDialogElement} dialogo Elemento de diálogo nativo.
 */
function cerrarDialogo(dialogo) {
  if (!dialogo) {
    return;
  }
  if (typeof dialogo.close === 'function') {
    dialogo.close();
  } else {
    dialogo.removeAttribute('open');
  }
}

/**
 * Ejecuta el cambio de rol de un usuario si cumple las reglas de seguridad.
 *
 * @param {Object} params Parámetros de actualización.
 * @param {string} params.nombreObjetivo Nombre del usuario a modificar.
 * @param {Storage} params.almacenUsuarios Almacén de usuarios.
 * @param {Storage} params.almacenSesion Almacén de sesión.
 * @param {HTMLElement} params.origenAviso Elemento desde el que lanzar el aviso.
 * @returns {boolean} Verdadero si el rol fue actualizado.
 */
function aplicarCambioRol({ nombreObjetivo, almacenUsuarios, almacenSesion, origenAviso }) {
  const sesion = obtenerSesion(almacenSesion);
  if (
    !sesion ||
    sesion.nombreUsuario.toLowerCase() === String(nombreObjetivo || '').toLowerCase()
  ) {
    return false;
  }

  const listaActual = obtenerUsuarios(almacenUsuarios);
  const objetivo = listaActual.find(
    (u) => u.nombreUsuario.toLowerCase() === String(nombreObjetivo || '').toLowerCase(),
  );

  if (!objetivo) {
    return false;
  }

  const totalAdmins = listaActual.filter((u) => u.rol === ROL_ADMINISTRADOR).length;
  if (objetivo.rol === ROL_ADMINISTRADOR && totalAdmins <= 1) {
    if (origenAviso) {
      lanzarAviso(
        origenAviso,
        'Debe permanecer al menos un administrador en la plataforma.',
        'warning',
      );
    }
    return false;
  }

  objetivo.rol = objetivo.rol === ROL_ADMINISTRADOR ? ROL_USUARIO : ROL_ADMINISTRADOR;
  guardarUsuarios(listaActual, almacenUsuarios);

  if (origenAviso) {
    lanzarAviso(
      origenAviso,
      `Rol de ${objetivo.nombreUsuario} actualizado a ${objetivo.rol}.`,
      'success',
    );
  }
  return true;
}

/**
 * Inicializa la página de administración de usuarios.
 *
 * @param {Object} [opciones={}] Dependencias inyectables.
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenUsuarios=localStorage] Almacén de usuarios.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén de sesión activa.
 * @param {Function} [opciones.navegar] Función de navegación.
 * @param {Location|null} [opciones.ubicacion] Objeto Location para leer/sincronizar URL.
 * @param {History|null} [opciones.historia] Objeto History para replaceState.
 * @param {number} [opciones.porPagina=ELEMENTOS_POR_PAGINA_DEFECTO] Usuarios por página.
 * @param {number} [opciones.retrasoDebounce=RETRASO_BUSQUEDA_DEFECTO] Retraso del buscador en ms.
 */
export function iniciarUsuarios({
  documento = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  navegar = (url) => location.replace(url),
  ubicacion = typeof window !== 'undefined' ? window.location : null,
  historia = typeof window !== 'undefined' ? window.history : null,
  porPagina = ELEMENTOS_POR_PAGINA_DEFECTO,
  retrasoDebounce = RETRASO_BUSQUEDA_DEFECTO,
} = {}) {
  iniciarAvisos(documento, almacenSesion);

  if (!protegerPaginaAdmin(almacenSesion, navegar)) {
    return;
  }

  configurarCabeceraPrivada(documento, almacenSesion, navegar);

  const cuerpoTabla = documento.getElementById('cuerpo-tabla-usuarios');
  const plantilla = documento.getElementById('plantilla-fila-usuario');
  const panelVacio = documento.getElementById('panel-vacio-usuarios');
  const contador = documento.getElementById('contador-usuarios');
  const elTotal = documento.getElementById('kpi-total-usuarios');
  const elAdmins = documento.getElementById('kpi-admins-usuarios');
  const campoBuscar = documento.getElementById('campo-buscar-usuarios');
  const contenedorFiltros = documento.getElementById('filtros-rol-usuarios');
  const pills = documento.querySelectorAll('.pill-filtro');
  const navPaginacion = documento.getElementById('paginacion-usuarios');
  const resumenPaginacion = documento.getElementById('resumen-paginacion-usuarios');
  const listaPaginacion = documento.getElementById('lista-paginacion-usuarios');
  const dialogoRol = documento.getElementById('dialogo-confirmar-rol');
  const descripcionDialogo = documento.getElementById('dialogo-rol-descripcion');
  const btnConfirmarRol = documento.getElementById('btn-confirmar-rol');
  const btnCancelarRol = documento.getElementById('btn-cancelar-rol');

  const estado = {
    termino: '',
    filtroRol: 'todos',
    paginaActual: obtenerPaginaDeUrl(ubicacion),
    usuarioPendiente: null,
    limpiarPaginacion: null,
  };

  /**
   * Renderiza KPIs, tabla paginada, estado vacío y controles de paginación.
   */
  const renderizarVista = () => {
    const sesion = obtenerSesion(almacenSesion);
    const usuarios = obtenerUsuarios(almacenUsuarios);

    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rol === ROL_ADMINISTRADOR).length;
    const deportistas = total - admins;

    if (elTotal) {
      elTotal.textContent = String(total);
    }
    if (elAdmins) {
      elAdmins.textContent = String(admins);
    }

    if (pills && pills.length >= 3) {
      pills[0].textContent = `Todos (${total})`;
      pills[1].textContent = `👑 Administradores (${admins})`;
      pills[2].textContent = `🏃 Deportistas (${deportistas})`;

      pills.forEach((pill) => {
        const activo = (pill.dataset.filtro || 'todos') === estado.filtroRol;
        pill.classList.toggle('activo', activo);
        pill.setAttribute('aria-pressed', String(activo));
      });
    }

    const filtrados = filtrarUsuarios(usuarios, {
      termino: estado.termino,
      filtroRol: estado.filtroRol,
    });

    const resultadoPaginacion = paginar(filtrados, estado.paginaActual, porPagina);
    estado.paginaActual = resultadoPaginacion.paginaCorregida;

    if (contador) {
      const totalFiltrados = filtrados.length;
      contador.textContent = `Mostrando ${totalFiltrados} deportista${totalFiltrados === 1 ? '' : 's'}`;
    }

    if (cuerpoTabla) {
      cuerpoTabla.replaceChildren();

      if (resultadoPaginacion.elementos.length > 0 && plantilla) {
        const fragmentoTabla = documento.createDocumentFragment();
        resultadoPaginacion.elementos.forEach((usuario) => {
          fragmentoTabla.appendChild(crearFilaUsuario(documento, plantilla, usuario, sesion));
        });
        cuerpoTabla.appendChild(fragmentoTabla);
      }
    }

    if (panelVacio) {
      panelVacio.hidden = filtrados.length > 0;
    }

    if (navPaginacion) {
      navPaginacion.hidden = filtrados.length === 0;
    }

    if (resumenPaginacion) {
      resumenPaginacion.textContent = `Página ${resultadoPaginacion.paginaCorregida} de ${resultadoPaginacion.totalPaginas} · Mostrando ${resultadoPaginacion.elementos.length} de ${filtrados.length} deportistas`;
    }

    if (listaPaginacion) {
      renderizarControlesPaginacion(listaPaginacion, {
        paginaActual: resultadoPaginacion.paginaCorregida,
        totalPaginas: resultadoPaginacion.totalPaginas,
        documento,
      });

      if (typeof estado.limpiarPaginacion === 'function') {
        estado.limpiarPaginacion();
      }

      estado.limpiarPaginacion = manejarClickPaginacion(
        listaPaginacion,
        (nuevaPagina) => {
          estado.paginaActual = nuevaPagina;
          sincronizarPaginaEnUrl(nuevaPagina, { historia, ubicacion });
          renderizarVista();
        },
        {
          paginaActual: resultadoPaginacion.paginaCorregida,
          totalPaginas: resultadoPaginacion.totalPaginas,
        },
      );
    }
  };

  // Buscador con debounce
  if (campoBuscar) {
    let temporizador = null;
    campoBuscar.addEventListener('input', () => {
      if (temporizador) {
        clearTimeout(temporizador);
      }
      temporizador = setTimeout(() => {
        estado.termino = campoBuscar.value;
        estado.paginaActual = 1;
        reiniciarPaginaEnUrl({ historia, ubicacion });
        renderizarVista();
      }, retrasoDebounce);
    });
  }

  // Filtros por rol mediante delegación de eventos
  if (contenedorFiltros) {
    contenedorFiltros.addEventListener('click', (evento) => {
      const pill = evento.target.closest('.pill-filtro');
      if (!pill) {
        return;
      }
      const nuevoFiltro = pill.dataset.filtro || 'todos';
      if (nuevoFiltro === estado.filtroRol) {
        return;
      }
      estado.filtroRol = nuevoFiltro;
      estado.paginaActual = 1;
      reiniciarPaginaEnUrl({ historia, ubicacion });
      renderizarVista();
    });
  }

  // Delegación de eventos para cambio de rol en la tabla
  if (cuerpoTabla) {
    cuerpoTabla.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.boton-accion-rol');
      if (!boton || boton.disabled) {
        return;
      }

      const nombreObjetivo = boton.dataset.usuario;
      if (!nombreObjetivo) {
        return;
      }

      const sesion = obtenerSesion(almacenSesion);
      if (sesion && sesion.nombreUsuario.toLowerCase() === nombreObjetivo.toLowerCase()) {
        return;
      }

      const listaActual = obtenerUsuarios(almacenUsuarios);
      const objetivo = listaActual.find(
        (u) => u.nombreUsuario.toLowerCase() === nombreObjetivo.toLowerCase(),
      );
      if (!objetivo) {
        return;
      }

      if (dialogoRol) {
        const nuevoRol = objetivo.rol === ROL_ADMINISTRADOR ? 'usuario estándar' : 'administrador';
        estado.usuarioPendiente = objetivo.nombreUsuario;
        if (descripcionDialogo) {
          descripcionDialogo.textContent = `¿Confirmas cambiar el rol de ${objetivo.nombreUsuario} a ${nuevoRol}?`;
        }
        abrirDialogo(dialogoRol);
      } else if (
        aplicarCambioRol({
          nombreObjetivo: objetivo.nombreUsuario,
          almacenUsuarios,
          almacenSesion,
          origenAviso: cuerpoTabla,
        })
      ) {
        renderizarVista();
      }
    });
  }

  // Botones del diálogo nativo de confirmación
  if (btnConfirmarRol && dialogoRol) {
    btnConfirmarRol.addEventListener('click', () => {
      const nombreObjetivo = estado.usuarioPendiente;
      estado.usuarioPendiente = null;
      cerrarDialogo(dialogoRol);

      if (
        nombreObjetivo &&
        aplicarCambioRol({
          nombreObjetivo,
          almacenUsuarios,
          almacenSesion,
          origenAviso: cuerpoTabla,
        })
      ) {
        renderizarVista();
      }
    });
  }

  if (btnCancelarRol && dialogoRol) {
    btnCancelarRol.addEventListener('click', () => {
      estado.usuarioPendiente = null;
      cerrarDialogo(dialogoRol);
    });
  }

  renderizarVista();
}

// Iniciar automáticamente en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarUsuarios());
  } else {
    iniciarUsuarios();
  }
}

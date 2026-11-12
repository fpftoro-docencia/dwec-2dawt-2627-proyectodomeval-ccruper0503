/**
 * Módulo para la gestión de la sesión activa y control de acceso en SportLog.
 * Implementa los Requisitos 3, 4 y 7 del Sprint 1 (Actividad S1-05).
 *
 * @module sesion
 */

import { guardarAvisoParaSiguientePagina } from './avisos.js';

export const CLAVE_ALMACEN_SESION = 'sportlog_sesion';
export const ROL_ADMINISTRADOR = 'administrador';
export const ROL_USUARIO = 'usuario';

/**
 * Obtiene los datos de la sesión activa desde el almacenamiento.
 * Resiliente a fallos: devuelve null si no hay sesión o si el JSON está corrupto.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento a consultar.
 * @returns {Object|null} Objeto con { nombreUsuario, rol } o null.
 */
export function obtenerSesion(almacen = sessionStorage) {
  try {
    const raw = almacen.getItem(CLAVE_ALMACEN_SESION);
    if (!raw) {
      return null;
    }
    const sesion = JSON.parse(raw);
    if (sesion && typeof sesion === 'object' && sesion.nombreUsuario && sesion.rol) {
      return sesion;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Inicia la sesión activa guardando el nombre de usuario y su rol.
 *
 * @param {Object} usuario Objeto con al menos { nombreUsuario, rol }.
 * @param {Storage} [almacen=sessionStorage] Almacenamiento donde guardar la sesión.
 */
export function iniciarSesion(usuario, almacen = sessionStorage) {
  const datos = {
    nombreUsuario: usuario.nombreUsuario,
    rol: usuario.rol,
  };
  almacen.setItem(CLAVE_ALMACEN_SESION, JSON.stringify(datos));
}

/**
 * Cierra la sesión activa eliminando los datos del almacenamiento.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento donde limpiar la sesión.
 */
export function cerrarSesion(almacen = sessionStorage) {
  almacen.removeItem(CLAVE_ALMACEN_SESION);
}

/**
 * Comprueba si hay una sesión válida iniciada actualmente.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento a consultar.
 * @returns {boolean} Verdadero si hay sesión.
 */
export function haySesion(almacen = sessionStorage) {
  return obtenerSesion(almacen) !== null;
}

/**
 * Comprueba si la sesión activa pertenece a un administrador.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento a consultar.
 * @returns {boolean} Verdadero si el usuario autenticado es administrador.
 */
export function esAdministrador(almacen = sessionStorage) {
  const sesion = obtenerSesion(almacen);
  return sesion?.rol === ROL_ADMINISTRADOR;
}

/**
 * Protege una página privada:
 * Si no hay sesión iniciada, redirige a index.html mediante location.replace.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento de sesión.
 * @param {Function} [navegar=(url) => location.replace(url)] Función de navegación.
 * @returns {boolean} Verdadero si el acceso está permitido, falso si redirigió.
 */
export function protegerPaginaPrivada(
  almacen = sessionStorage,
  navegar = (url) => location.replace(url),
) {
  if (!haySesion(almacen)) {
    navegar('index.html');
    return false;
  }
  return true;
}

/**
 * Protege una página de administración (usuarios.html):
 * 1. Si no hay sesión iniciada, redirige a index.html.
 * 2. Si hay sesión pero no es administrador, guarda un aviso de error y redirige a listado.html.
 *
 * @param {Storage} [almacen=sessionStorage] Almacenamiento de sesión.
 * @param {Function} [navegar=(url) => location.replace(url)] Función de navegación.
 * @returns {boolean} Verdadero si el acceso está permitido, falso si redirigió.
 */
export function protegerPaginaAdmin(
  almacen = sessionStorage,
  navegar = (url) => location.replace(url),
) {
  if (!haySesion(almacen)) {
    navegar('index.html');
    return false;
  }

  if (!esAdministrador(almacen)) {
    guardarAvisoParaSiguientePagina(
      'Acceso denegado: se requieren permisos de administrador.',
      'danger',
      almacen,
    );
    navegar('listado.html');
    return false;
  }

  return true;
}

/**
 * Configura los elementos visuales de la cabecera compartida en las páginas privadas:
 * - Inserta el nombre del deportista, avatar y rol.
 * - Muestra el enlace a 'Usuarios' si es administrador (removiendo el atributo hidden).
 * - Asocia el evento click al botón 'Cerrar sesión'.
 *
 * @param {Document} [documento=document] Documento actual.
 * @param {Storage} [almacen=sessionStorage] Almacenamiento de sesión.
 * @param {Function} [navegar=(url) => location.replace(url)] Función de navegación tras cerrar sesión.
 */
export function configurarCabeceraPrivada(
  documento = document,
  almacen = sessionStorage,
  navegar = (url) => location.replace(url),
) {
  const sesion = obtenerSesion(almacen);
  if (!sesion) {
    return;
  }

  const elUsuario = documento.getElementById('sesion-usuario');
  const elRol = documento.getElementById('sesion-rol');
  const elAvatar = documento.getElementById('sesion-avatar');
  const elMenuUsuarios = documento.getElementById('menu-usuarios');
  const botonCerrar = documento.getElementById('btn-cerrar-sesion');

  if (elUsuario) {
    elUsuario.textContent = sesion.nombreUsuario;
  }
  if (elRol) {
    elRol.textContent = sesion.rol;
  }
  if (elAvatar) {
    elAvatar.textContent = sesion.nombreUsuario.charAt(0).toUpperCase();
  }

  // El menú de gestión de usuarios solo es visible si tiene rol de administrador
  if (elMenuUsuarios) {
    elMenuUsuarios.hidden = sesion.rol !== ROL_ADMINISTRADOR;
  }

  // Oyente para el botón de cerrar sesión
  if (botonCerrar) {
    botonCerrar.addEventListener('click', () => {
      cerrarSesion(almacen);
      guardarAvisoParaSiguientePagina('Has cerrado sesión correctamente.', 'info', almacen);
      navegar('index.html');
    });
  }
}

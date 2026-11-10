/**
 * Controlador de la página principal de listado de entrenamientos (listado.html).
 * Sprint 1: Control de sesión, protección de ruta privada y cabecera de usuario.
 * Sprint 2: CRUD de entrenamientos, búsqueda con debounce, paginación y modal de borrado.
 *
 * @module paginas/listado
 */

import { iniciarAvisos } from '../avisos.js';
import { protegerPaginaPrivada, configurarCabeceraPrivada } from '../sesion.js';

/**
 * Inicializa la página del listado de entrenamientos.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén de sesión activa.
 * @param {Function} [opciones.navegar] Función de navegación.
 */
export function iniciarListado({
  documento = document,
  almacenSesion = sessionStorage,
  navegar = (url) => location.replace(url),
} = {}) {
  iniciarAvisos(documento, almacenSesion);

  if (!protegerPaginaPrivada(almacenSesion, navegar)) {
    return;
  }

  configurarCabeceraPrivada(documento, almacenSesion, navegar);
}

// Iniciar automáticamente en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarListado());
  } else {
    iniciarListado();
  }
}

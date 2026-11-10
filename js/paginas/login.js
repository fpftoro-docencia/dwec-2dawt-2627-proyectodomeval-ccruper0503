/**
 * Controlador de la página de inicio de sesión (index.html).
 * Cumple con el Requisito 6 del Sprint 1 (Actividad S1-07).
 *
 * @module paginas/login
 */

import { iniciarAvisos, lanzarAviso, guardarAvisoParaSiguientePagina } from '../avisos.js';
import { verificarCredenciales } from '../usuarios.js';
import { iniciarSesion, haySesion } from '../sesion.js';

/**
 * Inicializa la página de inicio de sesión.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenUsuarios=localStorage] Almacén de usuarios.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén de sesión activa.
 * @param {Function} [opciones.navegar] Función para redireccionar.
 */
export function iniciarLogin({
  documento = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  navegar = (url) => location.replace(url),
} = {}) {
  // Inicializamos el sistema de avisos para escuchar eventos y recuperar avisos pendientes
  iniciarAvisos(documento, almacenSesion);

  // Requisito: Si ya hay sesión abierta, va directamente al listado
  if (haySesion(almacenSesion)) {
    navegar('listado.html');
    return;
  }

  const formulario = documento.getElementById('formulario-login');
  if (!formulario) return;

  const campoUsuario = documento.getElementById('nombre-usuario');
  const campoClave = documento.getElementById('clave');
  const botonLogin = documento.getElementById('btn-login');

  // Bandera para evitar envíos duplicados (intro rápido o clics repetidos)
  let enviando = false;

  // Limpiar estilos de error al teclear
  campoUsuario?.addEventListener('input', () => {
    campoUsuario.classList.remove('is-invalid');
  });

  campoClave?.addEventListener('input', () => {
    campoClave.classList.remove('is-invalid');
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Requisito: mientras se calcula el resumen, un segundo envío (clic o Intro) NO hace nada
    if (enviando) {
      return;
    }

    const nombreUsuario = campoUsuario?.value.trim() ?? '';
    const clave = campoClave?.value ?? '';

    // Validar presencia de campos
    let hayError = false;

    if (!nombreUsuario) {
      campoUsuario?.classList.add('is-invalid');
      if (!hayError) campoUsuario?.focus();
      hayError = true;
    } else {
      campoUsuario?.classList.remove('is-invalid');
    }

    if (!clave) {
      campoClave?.classList.add('is-invalid');
      if (!hayError) campoClave?.focus();
      hayError = true;
    } else {
      campoClave?.classList.remove('is-invalid');
    }

    if (hayError) {
      return;
    }

    // Bloquear envíos concurrentes durante el hashing asíncrono
    enviando = true;
    if (botonLogin) {
      botonLogin.disabled = true;
    }

    try {
      const usuario = await verificarCredenciales(nombreUsuario, clave, almacenUsuarios);

      if (!usuario) {
        // Requisito: con la contraseña incorrecta, avisa, vacía la contraseña y le da el foco
        lanzarAviso(
          formulario,
          'Usuario o contraseña incorrectos. Revisa tus credenciales.',
          'danger',
        );
        if (campoClave) {
          campoClave.value = '';
          campoClave.classList.remove('is-valid');
          campoClave.focus();
        }
        enviando = false;
        if (botonLogin) {
          botonLogin.disabled = false;
        }
        return;
      }

      // Credenciales correctas: guardar sesión y redirigir
      iniciarSesion(usuario, almacenSesion);
      guardarAvisoParaSiguientePagina(
        `¡Bienvenido de nuevo, ${usuario.nombreUsuario}!`,
        'success',
        almacenSesion,
      );

      navegar('listado.html');
    } catch {
      lanzarAviso(
        formulario,
        'Ocurrió un error inesperado al procesar la autenticación.',
        'danger',
      );
      enviando = false;
      if (botonLogin) {
        botonLogin.disabled = false;
      }
    }
  });
}

// Auto-arranque si estamos en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  iniciarLogin();
}

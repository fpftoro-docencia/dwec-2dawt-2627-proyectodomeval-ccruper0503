/**
 * Controlador de la página de registro de usuarios (registro.html).
 * Cumple con el Requisito 5 del Sprint 1.
 *
 * @module paginas/registro
 */

import { iniciarAvisos, lanzarAviso, guardarAvisoParaSiguientePagina } from '../avisos.js';
import { existeUsuario, registrarUsuario } from '../usuarios.js';
import { iniciarSesion, obtenerSesion } from '../sesion.js';
import { validarNombreUsuario, comprobarRequisitosClave } from '../validadores.js';
import { iniciarValidacionFormulario } from '../validacion-formularios.js';

/**
 * Inicializa la página de registro.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenUsuarios=localStorage] Almacén para usuarios.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén para sesión.
 * @param {Function} [opciones.navegar] Función para redirigir.
 */
export function iniciarRegistro({
  documento = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  navegar = (url) => location.replace(url),
} = {}) {
  // Iniciar el sistema de avisos
  iniciarAvisos(documento, almacenSesion);

  const formulario = documento.getElementById('formulario-registro');
  if (!formulario) {
    return;
  }

  const campoUsuario = documento.getElementById('nombre-usuario');
  const campoCorreo = documento.getElementById('correo');
  const campoClave = documento.getElementById('clave');
  const botonRegistro = documento.getElementById('btn-registro');

  const reqLongitud = documento.getElementById('req-longitud');
  const reqMinuscula = documento.getElementById('req-minuscula');
  const reqMayuscula = documento.getElementById('req-mayuscula');
  const reqCifra = documento.getElementById('req-cifra');

  let enviando = false;

  // 1. Feedback visual en tiempo real de los requisitos de la contraseña
  function actualizarFeedbackClave() {
    const valor = campoClave?.value || '';
    const { tieneLongitud, tieneMinuscula, tieneMayuscula, tieneCifra } =
      comprobarRequisitosClave(valor);

    reqLongitud?.classList.toggle('cumplido', tieneLongitud);
    reqMinuscula?.classList.toggle('cumplido', tieneMinuscula);
    reqMayuscula?.classList.toggle('cumplido', tieneMayuscula);
    reqCifra?.classList.toggle('cumplido', tieneCifra);
  }

  campoClave?.addEventListener('input', actualizarFeedbackClave);

  // 2. Validación en tiempo real compartida (blur en captura, input/change y dependencia repetirClave)
  const validadorFormulario = iniciarValidacionFormulario(formulario, {
    validadores: {
      nombreUsuario: (valor) => {
        const res = validarNombreUsuario(valor);
        if (!res.valido) {
          return res;
        }
        if (existeUsuario(valor, almacenUsuarios)) {
          return {
            valido: false,
            error: 'Este nombre de usuario ya está ocupado.',
          };
        }
        return { valido: true };
      },
    },
    mensajeErrorFormulario: 'Por favor, corrige los errores del formulario.',
  });

  // 3. Envío del formulario
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Bloqueo de envíos múltiples
    if (enviando) {
      return;
    }

    if (!validadorFormulario?.validarFormulario()) {
      return;
    }

    // Estado de envío activado
    enviando = true;
    if (botonRegistro) {
      botonRegistro.disabled = true;
      botonRegistro.textContent = 'Creando cuenta...';
    }

    try {
      const nuevoUsuario = await registrarUsuario(
        {
          nombreUsuario: campoUsuario.value,
          correo: campoCorreo.value,
          clave: campoClave.value,
        },
        almacenUsuarios,
      );

      const sesionActual = obtenerSesion(almacenSesion);
      const eraAdmin = sesionActual?.rol === 'administrador';

      if (eraAdmin) {
        // Si un administrador da de alta a otro usuario, mantiene su sesión activa y vuelve a la gestión
        guardarAvisoParaSiguientePagina(
          `Nuevo deportista "${nuevoUsuario.nombreUsuario}" registrado con éxito.`,
          'success',
          almacenSesion,
        );
        navegar('usuarios.html');
      } else {
        // Iniciar sesión automáticamente
        iniciarSesion(nuevoUsuario, almacenSesion);

        // Guardar aviso de bienvenida para la página siguiente
        guardarAvisoParaSiguientePagina(
          `¡Bienvenido a SportLog, ${nuevoUsuario.nombreUsuario}! Tu cuenta ha sido creada con éxito.`,
          'success',
          almacenSesion,
        );

        // Redirigir al listado de entrenamientos
        navegar('listado.html');
      }
    } catch (error) {
      enviando = false;
      if (botonRegistro) {
        botonRegistro.disabled = false;
        botonRegistro.textContent = 'Crear cuenta de deportista';
      }
      lanzarAviso(formulario, error.message || 'Error al registrar el usuario.', 'danger');
    }
  });
}

// Iniciar automáticamente en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarRegistro());
  } else {
    iniciarRegistro();
  }
}

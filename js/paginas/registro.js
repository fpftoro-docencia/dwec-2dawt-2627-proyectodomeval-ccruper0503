/**
 * Controlador de la página de registro de usuarios (registro.html).
 * Cumple con el Requisito 5 del Sprint 1.
 *
 * @module paginas/registro
 */

import { iniciarAvisos, lanzarAviso, guardarAvisoParaSiguientePagina } from '../avisos.js';
import { existeUsuario, registrarUsuario } from '../usuarios.js';
import { iniciarSesion, haySesion } from '../sesion.js';
import {
  validarNombreUsuario,
  validarCorreo,
  comprobarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
} from '../validadores.js';

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

  // Si ya hay sesión iniciada, redirigir directo al listado
  if (haySesion(almacenSesion)) {
    navegar('listado.html');
    return;
  }

  const formulario = documento.getElementById('formulario-registro');
  if (!formulario) return;

  const campoUsuario = documento.getElementById('nombre-usuario');
  const campoCorreo = documento.getElementById('correo');
  const campoClave = documento.getElementById('clave');
  const campoRepetir = documento.getElementById('repetir-clave');
  const campoTerminos = documento.getElementById('terminos');
  const botonRegistro = documento.getElementById('btn-registro');

  const errorUsuario = documento.getElementById('error-usuario');
  const errorCorreo = documento.getElementById('error-correo');
  const errorClave = documento.getElementById('error-clave');
  const errorRepetir = documento.getElementById('error-repetir-clave');
  const errorTerminos = documento.getElementById('error-terminos');

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

  campoClave?.addEventListener('input', () => {
    actualizarFeedbackClave();
    if (campoClave.classList.contains('is-invalid')) {
      validarCampoClave();
    }
  });

  // Funciones de validación de campos
  function marcarCampo(campo, elementoError, resultado) {
    if (!campo || !elementoError) return resultado.valido;
    if (resultado.valido) {
      campo.classList.remove('is-invalid');
      campo.setAttribute('aria-invalid', 'false');
      elementoError.textContent = '';
    } else {
      campo.classList.add('is-invalid');
      campo.setAttribute('aria-invalid', 'true');
      elementoError.textContent = resultado.error || 'Valor no válido.';
    }
    return resultado.valido;
  }

  function validarCampoUsuario() {
    const valor = campoUsuario?.value || '';
    const res = validarNombreUsuario(valor);
    if (!res.valido) {
      return marcarCampo(campoUsuario, errorUsuario, res);
    }
    if (existeUsuario(valor, almacenUsuarios)) {
      return marcarCampo(campoUsuario, errorUsuario, {
        valido: false,
        error: 'Este nombre de usuario ya está ocupado.',
      });
    }
    return marcarCampo(campoUsuario, errorUsuario, { valido: true });
  }

  function validarCampoCorreo() {
    return marcarCampo(campoCorreo, errorCorreo, validarCorreo(campoCorreo?.value || ''));
  }

  function validarCampoClave() {
    return marcarCampo(campoClave, errorClave, validarClave(campoClave?.value || ''));
  }

  function validarCampoRepetir() {
    return marcarCampo(
      campoRepetir,
      errorRepetir,
      validarRepeticionClave(campoClave?.value || '', campoRepetir?.value || ''),
    );
  }

  function validarCampoTerminos() {
    return marcarCampo(
      campoTerminos,
      errorTerminos,
      validarTerminos(Boolean(campoTerminos?.checked)),
    );
  }

  // Validación al salir del campo (blur)
  campoUsuario?.addEventListener('blur', validarCampoUsuario);
  campoCorreo?.addEventListener('blur', validarCampoCorreo);
  campoClave?.addEventListener('blur', validarCampoClave);
  campoRepetir?.addEventListener('blur', validarCampoRepetir);
  campoTerminos?.addEventListener('change', validarCampoTerminos);

  // 2. Envío del formulario
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Bloqueo de envíos múltiples
    if (enviando) return;

    // Validar todos los campos
    const okUsuario = validarCampoUsuario();
    const okCorreo = validarCampoCorreo();
    const okClave = validarCampoClave();
    const okRepetir = validarCampoRepetir();
    const okTerminos = validarCampoTerminos();

    if (!okUsuario || !okCorreo || !okClave || !okRepetir || !okTerminos) {
      lanzarAviso(formulario, 'Por favor, corrige los errores del formulario.', 'danger');
      // Enfocar el primer campo inválido
      const primerInvalido = formulario.querySelector('.is-invalid');
      primerInvalido?.focus();
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

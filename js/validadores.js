/**
 * Funciones puras de validación para los formularios de SportLog.
 * Implementa las reglas del Requisito 5 y 10 del Sprint 1.
 *
 * @module validadores
 */

/**
 * Expresión regular para el nombre de usuario:
 * Entre 3 y 15 caracteres alfanuméricos y guiones bajos.
 */
export const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9_]{3,15}$/;

/**
 * Expresión regular básica para formato de correo electrónico.
 */
export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Expresiones regulares Unicode para los requisitos de contraseña segura.
 */
export const REGEX_MINUSCULA = /\p{Ll}/u;
export const REGEX_MAYUSCULA = /\p{Lu}/u;
export const REGEX_CIFRA = /\d/;

/**
 * Valida el formato del nombre de usuario.
 *
 * @param {string} nombre Nombre de usuario a validar.
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarNombreUsuario(nombre) {
  if (!nombre || typeof nombre !== 'string') {
    return { valido: false, error: 'El nombre de usuario es obligatorio.' };
  }
  const limpio = nombre.trim();
  if (limpio.length < 3 || limpio.length > 15) {
    return { valido: false, error: 'El nombre de usuario debe tener entre 3 y 15 caracteres.' };
  }
  if (!REGEX_NOMBRE_USUARIO.test(limpio)) {
    return {
      valido: false,
      error: 'El nombre de usuario solo puede contener letras, números y guiones bajos.',
    };
  }
  return { valido: true };
}

/**
 * Valida el formato del correo electrónico.
 *
 * @param {string} correo Correo electrónico a validar.
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarCorreo(correo) {
  if (!correo || typeof correo !== 'string') {
    return { valido: false, error: 'El correo electrónico es obligatorio.' };
  }
  const limpio = correo.trim();
  if (!REGEX_CORREO.test(limpio)) {
    return { valido: false, error: 'Introduce un correo electrónico válido.' };
  }
  return { valido: true };
}

/**
 * Comprueba individualmente cada uno de los requisitos de la contraseña.
 *
 * @param {string} clave Contraseña a evaluar.
 * @returns {{
 *   tieneLongitud: boolean,
 *   tieneMinuscula: boolean,
 *   tieneMayuscula: boolean,
 *   tieneCifra: boolean,
 *   esValida: boolean
 * }}
 */
export function comprobarRequisitosClave(clave = '') {
  const tieneLongitud = typeof clave === 'string' && clave.length >= 8;
  const tieneMinuscula = REGEX_MINUSCULA.test(clave);
  const tieneMayuscula = REGEX_MAYUSCULA.test(clave);
  const tieneCifra = REGEX_CIFRA.test(clave);
  const esValida = tieneLongitud && tieneMinuscula && tieneMayuscula && tieneCifra;

  return {
    tieneLongitud,
    tieneMinuscula,
    tieneMayuscula,
    tieneCifra,
    esValida,
  };
}

/**
 * Valida la contraseña completa para el formulario.
 *
 * @param {string} clave
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarClave(clave) {
  if (!clave || typeof clave !== 'string') {
    return { valido: false, error: 'La contraseña es obligatoria.' };
  }
  const { tieneLongitud, tieneMinuscula, tieneMayuscula, tieneCifra } =
    comprobarRequisitosClave(clave);

  if (!tieneLongitud) {
    return { valido: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!tieneMinuscula) {
    return { valido: false, error: 'La contraseña debe incluir al menos una letra minúscula.' };
  }
  if (!tieneMayuscula) {
    return { valido: false, error: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  if (!tieneCifra) {
    return { valido: false, error: 'La contraseña debe incluir al menos un número.' };
  }

  return { valido: true };
}

/**
 * Valida que la repetición de contraseña coincida con la original.
 *
 * @param {string} clave Contraseña original.
 * @param {string} repeticion Contraseña repetida.
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarRepeticionClave(clave, repeticion) {
  if (!repeticion) {
    return { valido: false, error: 'Debes repetir la contraseña.' };
  }
  if (clave !== repeticion) {
    return { valido: false, error: 'Las contraseñas no coinciden.' };
  }
  return { valido: true };
}

/**
 * Valida la aceptación de los términos y condiciones.
 *
 * @param {boolean} aceptado
 * @returns {{ valido: boolean, error?: string }}
 */
export function validarTerminos(aceptado) {
  if (!aceptado) {
    return { valido: false, error: 'Debes aceptar los términos y condiciones.' };
  }
  return { valido: true };
}

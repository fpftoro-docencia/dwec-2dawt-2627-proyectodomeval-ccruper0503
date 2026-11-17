/**
 * Módulo compartido de validación en tiempo real de formularios (S2-06 / Requisitos 19 y 20).
 *
 * Características:
 * - Primera validación de cada campo al salir de él (`blur` en fase de captura sobre el `<form>`).
 * - Revalidación continua en `input` y `change` una vez que el campo ha sido validado o marcado.
 * - Revalidación cruzada entre campos dependientes (`data-depende-de` o mapa `dependencias`).
 * - Selección de validadores mediante `data-validar` y uso nativo de `setCustomValidity` y `validity`.
 * - Actualización accesible de `aria-invalid`, `aria-describedby` y clases Bootstrap
 *   (`is-invalid`, `invalid-feedback`, `d-block`) sin usar JS de Bootstrap ni `innerHTML`.
 *
 * @module validacion-formularios
 */

import { lanzarAviso } from './avisos.js';
import {
  validarNombreUsuario,
  validarCorreo,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
} from './validadores.js';
import { validadoresEntidad } from './validadores-entidad.js';

const TIPOS_NO_VALIDABLES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const SELECTOR_CONTENEDOR_CAMPO =
  '.mb-3, .mb-4, .col-md-6, .col-md-7, .col-md-5, .col-sm-6, .form-check, .flex-grow-1';

/**
 * Busca un campo dentro del formulario por su `id` o `name`.
 *
 * @param {HTMLFormElement} formulario Formulario contenedor.
 * @param {string} identificador Valor de `id` o `name` del campo buscado.
 * @returns {HTMLElement|null}
 */
function buscarCampoRelacionado(formulario, identificador) {
  if (!formulario || !identificador) {
    return null;
  }

  const porId = formulario.ownerDocument?.getElementById(identificador);
  if (porId && formulario.contains(porId)) {
    return porId;
  }

  const elementos = Array.from(formulario.elements || []);
  return elementos.find((el) => el.id === identificador || el.name === identificador) || null;
}

/**
 * Mapa por defecto de validadores disponibles para el atributo `data-validar`.
 */
export const validadoresFormulario = {
  ...validadoresEntidad,
  nombreUsuario: (valor) => validarNombreUsuario(valor),
  correo: (valor) => validarCorreo(valor),
  clave: (valor) => validarClave(valor),
  repetirClave: (valor, campo, formulario) => {
    const idOrigen = campo.dataset.dependeDe;
    const campoOrigen = idOrigen
      ? buscarCampoRelacionado(formulario, idOrigen)
      : buscarCampoRelacionado(formulario, 'clave');
    return validarRepeticionClave(campoOrigen?.value ?? '', valor);
  },
  terminos: (_valor, campo) => validarTerminos(Boolean(campo.checked)),
};

/**
 * Comprueba si un elemento del formulario participa en la validación.
 *
 * @param {EventTarget|null} elemento Elemento a comprobar.
 * @returns {boolean}
 */
function esCampoValidable(elemento) {
  if (!elemento || typeof elemento.tagName !== 'string') {
    return false;
  }
  const etiqueta = elemento.tagName.toUpperCase();
  if (etiqueta !== 'INPUT' && etiqueta !== 'SELECT' && etiqueta !== 'TEXTAREA') {
    return false;
  }
  if (elemento.disabled) {
    return false;
  }
  if (etiqueta === 'INPUT' && TIPOS_NO_VALIDABLES.has(elemento.type)) {
    return false;
  }
  return true;
}

/**
 * Obtiene la caja de error asociada a un campo mediante `aria-describedby`
 * o buscando `.invalid-feedback` en su contenedor cercano.
 *
 * @param {HTMLElement} campo Campo del formulario.
 * @returns {HTMLElement|null}
 */
function obtenerCajaError(campo) {
  const doc = campo.ownerDocument;
  const descritoPor = campo.getAttribute('aria-describedby');

  if (descritoPor && doc) {
    const ids = descritoPor.trim().split(/\s+/);
    const elementos = ids.map((id) => doc.getElementById(id)).filter(Boolean);
    const cajaFeedback = elementos.find((el) => el.classList.contains('invalid-feedback'));
    if (cajaFeedback) {
      return cajaFeedback;
    }
  }

  const contenedor = campo.closest(SELECTOR_CONTENEDOR_CAMPO) || campo.parentElement;
  if (!contenedor) {
    return null;
  }

  return contenedor.querySelector('.invalid-feedback');
}

/**
 * Traduce el estado `ValidityState` de un campo a un mensaje claro en español.
 * Si el error proviene de `setCustomValidity`, devuelve directamente `validationMessage`.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campo Campo validado.
 * @returns {string}
 */
function obtenerMensajeValidity(campo) {
  const { validity } = campo;
  if (!validity || validity.valid) {
    return '';
  }
  if (validity.customError) {
    return campo.validationMessage;
  }
  if (validity.valueMissing) {
    if (campo.type === 'checkbox') {
      return 'Debes marcar esta casilla obligatoria.';
    }
    if (campo.tagName.toUpperCase() === 'SELECT') {
      return 'Selecciona una opción válida.';
    }
    return 'Este campo es obligatorio.';
  }
  if (validity.typeMismatch) {
    if (campo.type === 'email') {
      return 'Introduce un correo electrónico válido.';
    }
    return 'El formato introducido no es válido.';
  }
  if (validity.rangeUnderflow) {
    return `El valor mínimo permitido es ${campo.min}.`;
  }
  if (validity.rangeOverflow) {
    return `El valor máximo permitido es ${campo.max}.`;
  }
  if (validity.tooShort) {
    return `Debe tener al menos ${campo.minLength} caracteres.`;
  }
  if (validity.tooLong) {
    return `No puede superar los ${campo.maxLength} caracteres.`;
  }
  if (validity.patternMismatch) {
    return campo.title || 'El formato introducido no es válido.';
  }
  if (validity.stepMismatch) {
    return 'El valor introducido no cumple con el incremento permitido.';
  }
  if (validity.badInput) {
    return 'Introduce un valor válido.';
  }
  return campo.validationMessage || 'Valor no válido.';
}

/**
 * Inicializa la validación en tiempo real sobre un formulario `<form novalidate>`.
 *
 * @param {HTMLFormElement} formulario Elemento `<form>` a gestionar.
 * @param {Object} [opciones={}] Opciones de configuración.
 * @param {Object<string, Function>} [opciones.validadores={}] Validadores adicionales o sobrescritos por clave `data-validar`.
 * @param {Object<string, string|string[]>} [opciones.dependencias={}] Mapa de campo origen (`id` o `name`) a campo(s) dependiente(s).
 * @param {string} [opciones.mensajeErrorFormulario='Revisa los campos marcados antes de continuar.'] Aviso emitido al enviar con errores.
 * @returns {{
 *   validarCampo: (campo: HTMLElement) => boolean,
 *   validarFormulario: (opts?: { enfocar?: boolean, avisar?: boolean }) => boolean,
 *   limpiarErrores: () => void,
 *   destruir: () => void
 * }|null}
 */
export function iniciarValidacionFormulario(formulario, opciones = {}) {
  if (!formulario || typeof formulario.addEventListener !== 'function') {
    return null;
  }

  const {
    validadores = {},
    dependencias = {},
    mensajeErrorFormulario = 'Revisa los campos marcados antes de continuar.',
  } = opciones;

  formulario.noValidate = true;

  const mapaValidadores = {
    ...validadoresFormulario,
    ...validadores,
  };

  let camposTocados = new WeakSet();

  /**
   * Aplica o limpia el estado visual y accesible de un campo.
   *
   * @param {HTMLElement} campo Campo del formulario.
   * @param {boolean} esValido Resultado de la validación.
   * @param {string} mensaje Mensaje de error (vacío si es válido).
   */
  function actualizarEstadoVisual(campo, esValido, mensaje) {
    campo.classList.toggle('is-invalid', !esValido);
    campo.setAttribute('aria-invalid', esValido ? 'false' : 'true');

    const cajaError = obtenerCajaError(campo);
    if (!cajaError) {
      return;
    }

    cajaError.classList.add('invalid-feedback');
    cajaError.classList.toggle('d-block', !esValido);
    cajaError.textContent = esValido ? '' : mensaje;

    if (cajaError.id && !campo.hasAttribute('aria-describedby')) {
      campo.setAttribute('aria-describedby', cajaError.id);
    }
  }

  /**
   * Valida un único campo del formulario usando `data-validar`, `setCustomValidity` y `validity`.
   *
   * @param {HTMLElement} campo Campo a validar.
   * @returns {boolean} `true` si el campo es válido.
   */
  function validarCampo(campo) {
    if (!campo || typeof campo.setCustomValidity !== 'function') {
      return true;
    }

    campo.setCustomValidity('');

    if (!esCampoValidable(campo)) {
      campo.classList.remove('is-invalid');
      campo.removeAttribute('aria-invalid');
      const cajaError = obtenerCajaError(campo);
      if (cajaError) {
        cajaError.classList.remove('d-block');
        cajaError.textContent = '';
      }
      return true;
    }

    const nombreValidador = campo.dataset?.validar;
    if (nombreValidador && typeof mapaValidadores[nombreValidador] === 'function') {
      const esCheckbox = campo.type === 'checkbox';
      const valor = esCheckbox ? campo.checked : campo.value;
      const estaVacioOpcional =
        !esCheckbox && !campo.required && typeof valor === 'string' && valor.trim() === '';

      if (!estaVacioOpcional) {
        const resultado = mapaValidadores[nombreValidador](valor, campo, formulario);
        if (resultado && resultado.valido === false) {
          campo.setCustomValidity(resultado.error || 'Valor no válido.');
        }
      }
    }

    const esValido = campo.validity.valid;
    const mensaje = esValido ? '' : obtenerMensajeValidity(campo);
    actualizarEstadoVisual(campo, esValido, mensaje);
    return esValido;
  }

  /**
   * Revalida los campos que dependen del campo modificado si ya fueron tocados o tienen valor.
   *
   * @param {HTMLElement} campoOrigen Campo que ha cambiado.
   */
  function revalidarDependientes(campoOrigen) {
    if (!campoOrigen) {
      return;
    }

    const idsOrigen = new Set([campoOrigen.id, campoOrigen.name].filter(Boolean));
    const dependientes = new Set();

    // 1. Dependencias declaradas en HTML mediante data-depende-de
    for (const elemento of Array.from(formulario.elements || [])) {
      const dependeDe = elemento.dataset?.dependeDe;
      if (dependeDe && idsOrigen.has(dependeDe) && elemento !== campoOrigen) {
        dependientes.add(elemento);
      }
    }

    // 2. Dependencias declaradas por configuración JS
    for (const idOrigen of idsOrigen) {
      const destinos = dependencias[idOrigen];
      if (!destinos) {
        continue;
      }
      const lista = Array.isArray(destinos) ? destinos : [destinos];
      for (const destino of lista) {
        const campoDestino = buscarCampoRelacionado(formulario, destino);
        if (campoDestino && campoDestino !== campoOrigen) {
          dependientes.add(campoDestino);
        }
      }
    }

    for (const dependiente of dependientes) {
      if (!esCampoValidable(dependiente)) {
        continue;
      }
      const tieneContenido = dependiente.type !== 'checkbox' && dependiente.value !== '';
      if (camposTocados.has(dependiente) || tieneContenido) {
        camposTocados.add(dependiente);
        validarCampo(dependiente);
      }
    }
  }

  /**
   * Manejador en fase de captura para `blur` (que no burbujea).
   *
   * @param {FocusEvent} evento
   */
  function manejarBlur(evento) {
    const campo = evento.target;
    if (!esCampoValidable(campo)) {
      return;
    }
    camposTocados.add(campo);
    validarCampo(campo);
    revalidarDependientes(campo);
  }

  /**
   * Manejador delegado para `input` y `change` tras la primera validación.
   *
   * @param {Event} evento
   */
  function manejarCambio(evento) {
    const campo = evento.target;
    if (!esCampoValidable(campo)) {
      return;
    }
    if (camposTocados.has(campo) || campo.classList.contains('is-invalid')) {
      camposTocados.add(campo);
      validarCampo(campo);
    }
    revalidarDependientes(campo);
  }

  /**
   * Valida todos los campos del formulario, enfoca el primero con error y emite aviso.
   *
   * @param {Object} [opts={}]
   * @param {boolean} [opts.enfocar=true] Si debe mover el foco al primer campo inválido.
   * @param {boolean} [opts.avisar=true] Si debe lanzar un evento `aviso` de error.
   * @returns {boolean} `true` si todo el formulario es válido.
   */
  function validarFormulario({ enfocar = true, avisar = true } = {}) {
    let primerInvalido = null;

    for (const campo of Array.from(formulario.elements || [])) {
      if (!esCampoValidable(campo)) {
        continue;
      }
      camposTocados.add(campo);
      const esValido = validarCampo(campo);
      if (!esValido && !primerInvalido) {
        primerInvalido = campo;
      }
    }

    if (primerInvalido) {
      if (enfocar && typeof primerInvalido.focus === 'function') {
        primerInvalido.focus();
      }
      if (avisar) {
        lanzarAviso(formulario, mensajeErrorFormulario, 'danger');
      }
      return false;
    }

    return true;
  }

  /**
   * Restablece el estado de errores y campos tocados del formulario.
   */
  function limpiarErrores() {
    camposTocados = new WeakSet();
    for (const campo of Array.from(formulario.elements || [])) {
      if (typeof campo.setCustomValidity === 'function') {
        campo.setCustomValidity('');
      }
      campo.classList?.remove('is-invalid');
      campo.removeAttribute?.('aria-invalid');
      const cajaError = obtenerCajaError(campo);
      if (cajaError) {
        cajaError.classList.remove('d-block');
        cajaError.textContent = '';
      }
    }
  }

  /**
   * Elimina los oyentes de eventos registrados en el formulario.
   */
  function destruir() {
    formulario.removeEventListener('blur', manejarBlur, true);
    formulario.removeEventListener('input', manejarCambio);
    formulario.removeEventListener('change', manejarCambio);
  }

  // `blur` no burbujea: se escucha en fase de captura para cubrir campos estáticos y dinámicos
  formulario.addEventListener('blur', manejarBlur, true);
  formulario.addEventListener('input', manejarCambio);
  formulario.addEventListener('change', manejarCambio);

  return {
    validarCampo,
    validarFormulario,
    limpiarErrores,
    destruir,
  };
}

/**
 * Validadores específicos con expresiones regulares para la temática deportiva (SportLog).
 * Cumple con el Requisito 13 del Sprint 2:
 * - Al menos 3 validadores de formato propios de la entidad deportiva.
 * - Al menos uno combina expresión regular con comprobación en código de estructura o rango lógico.
 * - Objeto agrupador para integración con data-validar (Requisito 19).
 *
 * @module validadores-entidad
 */

/**
 * Expresión regular para el ritmo de carrera en formato mm:ss o m:ss (ej: '3:45', '04:15').
 */
export const REGEX_RITMO_CARRERA = /^(\d{1,2}):(\d{2})$/;

/**
 * Expresión regular para el formato de series y repeticiones, con carga opcional en kg
 * (ej: '4x12', '3 x 10', '5x5@100kg', '3x12 @ 80.5 kg').
 */
export const REGEX_SERIES_REPETICIONES =
  /^(\d{1,2})\s*[xX*]\s*(\d{1,3})(?:\s*@\s*(\d+(?:\.\d+)?)\s*(?:kg)?)?$/i;

/**
 * Expresión regular para la frecuencia cardíaca media en pulsaciones por minuto
 * (ej: '165', '165 bpm', '140 ppm').
 */
export const REGEX_FRECUENCIA_CARDIACA = /^(\d{2,3})(?:\s*(?:bpm|ppm))?$/i;

/**
 * Valida el ritmo de carrera combinando expresión regular con comprobación lógica:
 * 1. Comprueba formato mm:ss o m:ss con regex.
 * 2. Comprueba que los segundos sean estrictamente menores que 60.
 * 3. Comprueba que el ritmo total esté dentro de límites fisiológicos razonables
 *    (entre 2:00 min/km y 15:00 min/km).
 *
 * @param {string} valor Cadena con el ritmo a validar.
 * @returns {{
 *   valido: boolean,
 *   error?: string,
 *   minutos?: number,
 *   segundos?: number,
 *   totalSegundos?: number
 * }}
 */
export function validarRitmoCarrera(valor) {
  if (!valor || typeof valor !== 'string') {
    return { valido: false, error: 'Introduce el ritmo de carrera (ej: 4:30 min/km).' };
  }

  const limpio = valor.trim();
  const coincidencias = REGEX_RITMO_CARRERA.exec(limpio);

  if (!coincidencias) {
    return {
      valido: false,
      error: 'Formato de ritmo no válido. Usa el formato mm:ss (ej: 04:15 o 3:50).',
    };
  }

  const minutos = parseInt(coincidencias[1], 10);
  const segundos = parseInt(coincidencias[2], 10);

  // Comprobación lógica 1: los segundos no pueden ser 60 o más
  if (segundos >= 60) {
    return {
      valido: false,
      error: 'Los segundos del ritmo deben ser inferiores a 60 (ej: 4:59).',
    };
  }

  // Comprobación lógica 2: límites fisiológicos humanos por kilómetro
  const totalSegundos = minutos * 60 + segundos;
  const MINIMO_FISIOLOGICO = 120; // 2:00 min/km (velocidad máxima sprint extremo)
  const MAXIMO_FISIOLOGICO = 900; // 15:00 min/km (marcha lenta)

  if (totalSegundos < MINIMO_FISIOLOGICO) {
    return {
      valido: false,
      error: 'El ritmo es demasiado rápido (mínimo fisiológico: 02:00 min/km).',
    };
  }

  if (totalSegundos > MAXIMO_FISIOLOGICO) {
    return {
      valido: false,
      error: 'El ritmo es demasiado lento (máximo permitido: 15:00 min/km).',
    };
  }

  return {
    valido: true,
    minutos,
    segundos,
    totalSegundos,
  };
}

/**
 * Valida y extrae series, repeticiones y carga en un ejercicio de fuerza.
 * Formatos válidos: '4x12', '3x10', '5x5@100kg', '3x8 @ 50.5 kg'.
 *
 * @param {string} valor Cadena con la serie y repeticiones.
 * @returns {{
 *   valido: boolean,
 *   error?: string,
 *   series?: number,
 *   repeticiones?: number,
 *   cargaKg?: number|null
 * }}
 */
export function validarSeriesRepeticiones(valor) {
  if (!valor || typeof valor !== 'string') {
    return { valido: false, error: 'Indica las series y repeticiones (ej: 4x12 o 3x10@60kg).' };
  }

  const limpio = valor.trim();
  const coincidencias = REGEX_SERIES_REPETICIONES.exec(limpio);

  if (!coincidencias) {
    return {
      valido: false,
      error: 'Formato incorrecto. Usa formato Series x Repeticiones (ej: 4x12 o 3x10@80kg).',
    };
  }

  const series = parseInt(coincidencias[1], 10);
  const repeticiones = parseInt(coincidencias[2], 10);
  const cargaKg = coincidencias[3] ? parseFloat(coincidencias[3]) : null;

  if (series < 1 || series > 50) {
    return { valido: false, error: 'El número de series debe estar entre 1 y 50.' };
  }

  if (repeticiones < 1 || repeticiones > 200) {
    return { valido: false, error: 'Las repeticiones deben estar entre 1 y 200.' };
  }

  if (cargaKg !== null && (cargaKg < 0 || cargaKg > 500)) {
    return { valido: false, error: 'La carga debe estar entre 0 y 500 kg.' };
  }

  return {
    valido: true,
    series,
    repeticiones,
    cargaKg,
  };
}

/**
 * Valida la frecuencia cardíaca promedio y comprueba su rango cardiológico válido.
 * Rango admisible en actividad física: entre 40 y 240 bpm.
 *
 * @param {string|number} valor Valor en pulsaciones por minuto.
 * @returns {{
 *   valido: boolean,
 *   error?: string,
 *   bpm?: number
 * }}
 */
export function validarFrecuenciaCardiaca(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return { valido: false, error: 'Indica la frecuencia cardíaca (entre 40 y 240 bpm).' };
  }

  const texto = String(valor).trim();
  const coincidencias = REGEX_FRECUENCIA_CARDIACA.exec(texto);

  if (!coincidencias) {
    return {
      valido: false,
      error: 'Formato no válido. Introduce un número de pulsaciones (ej: 155 o 155 bpm).',
    };
  }

  const bpm = parseInt(coincidencias[1], 10);

  if (bpm < 40 || bpm > 240) {
    return {
      valido: false,
      error: 'La frecuencia cardíaca debe encontrarse en un rango válido entre 40 y 240 bpm.',
    };
  }

  return {
    valido: true,
    bpm,
  };
}

/**
 * Mapa agrupador de validadores de la entidad deportiva.
 * Permite seleccionar la validación correspondiente mediante el atributo data-validar (Requisito 19).
 */
export const validadoresEntidad = {
  ritmo: validarRitmoCarrera,
  ejercicioDetalle: validarSeriesRepeticiones,
  pulsaciones: validarFrecuenciaCardiaca,
};

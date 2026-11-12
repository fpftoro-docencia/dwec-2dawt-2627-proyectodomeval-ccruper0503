/**
 * Controlador de la página de alta y edición de entrenamientos (ficha.html).
 * Cumple con el Requisito 17 del Sprint 2:
 * - Modo alta (ficha.html) y modo edición (ficha.html?id=...).
 * - Protección de ruta privada y cabecera de usuario.
 * - Campo condicional: casilla ¿Competición oficial? activa/desactiva y muestra/oculta (hidden y disabled).
 * - Atributo dinámico de fecha max puesto por código (fecha de hoy).
 * - Lectura y normalización de datos con FormData.
 * - Al editar, rellenado automático del formulario con el registro.
 * - Redirección con aviso tras guardar o si el id solicitado no existe.
 *
 * @module paginas/ficha
 */

import { iniciarAvisos, guardarAvisoParaSiguientePagina } from '../avisos.js';
import { protegerPaginaPrivada, configurarCabeceraPrivada, obtenerSesion } from '../sesion.js';
import {
  obtenerEntrenamientoPorId,
  crearEntrenamiento,
  actualizarEntrenamiento,
} from '../entrenamientos.js';

const TEXTOS_RPE = {
  1: 'RPE 1 · Muy suave',
  2: 'RPE 2 · Fácil',
  3: 'RPE 3 · Moderado bajo',
  4: 'RPE 4 · Moderado',
  5: 'RPE 5 · Aeróbico cómodo',
  6: 'RPE 6 · Tempo constante',
  7: 'RPE 7 · Duro / Umbral',
  8: 'RPE 8 · Muy duro',
  9: 'RPE 9 · Esfuerzo extremo submáximo',
  10: 'RPE 10 · Esfuerzo Máximo absoluto',
};

/**
 * Inicializa el comportamiento de la página ficha.html.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Storage} [opciones.almacenEntrenamientos=localStorage]
 * @param {Function} [opciones.navegar]
 * @param {Location|Object} [opciones.ubicacion]
 */
export function iniciarFicha({
  documento = document,
  almacenSesion = sessionStorage,
  almacenEntrenamientos = localStorage,
  navegar = (url) => location.replace(url),
  ubicacion = typeof window !== 'undefined' ? window.location : null,
} = {}) {
  iniciarAvisos(documento, almacenSesion);

  if (!protegerPaginaPrivada(almacenSesion, navegar)) {
    return;
  }

  configurarCabeceraPrivada(documento, almacenSesion, navegar);
  const sesion = obtenerSesion(almacenSesion);
  const usuario = sesion?.nombreUsuario;

  const formulario = documento.getElementById('formulario-ficha');
  if (!formulario) {
    return;
  }

  const tituloFicha = documento.getElementById('titulo-ficha');
  const campoFecha = documento.getElementById('fecha');
  const checkCompeticion = documento.getElementById('es-competicion');
  const bloqueCondicional = documento.getElementById('campo-condicional-competicion');
  const campoNombreCompeticion = documento.getElementById('nombre-competicion');
  const campoDorsal = documento.getElementById('dorsal');
  const rpeInput = documento.getElementById('esfuerzo-rpe');
  const rpeValor = documento.getElementById('valor-rpe');
  const btnGuardar = documento.getElementById('btn-guardar-ficha');

  // 1. Limitar fecha máxima a hoy mediante código (Requisito 17)
  const hoy = new Date().toISOString().split('T')[0];
  if (campoFecha) {
    campoFecha.max = hoy;
  }

  // 2. Control del campo condicional (hidden y disabled)
  function actualizarCampoCondicional(activo) {
    if (bloqueCondicional) {
      bloqueCondicional.hidden = !activo;
    }
    if (campoNombreCompeticion) {
      campoNombreCompeticion.disabled = !activo;
      if (!activo) {
        campoNombreCompeticion.value = '';
      }
    }
    if (campoDorsal) {
      campoDorsal.disabled = !activo;
      if (!activo) {
        campoDorsal.value = '';
      }
    }
  }

  checkCompeticion?.addEventListener('change', () => {
    actualizarCampoCondicional(checkCompeticion.checked);
  });

  // 3. Feedback dinámico del deslizador RPE
  rpeInput?.addEventListener('input', () => {
    if (rpeValor) {
      rpeValor.textContent = TEXTOS_RPE[rpeInput.value] || `RPE ${rpeInput.value}`;
    }
  });

  // 4. Detección de modo (Alta vs Edición con ?id=...)
  let idEntrenamiento = null;
  if (ubicacion?.search) {
    const params = new URLSearchParams(ubicacion.search);
    idEntrenamiento = params.get('id');
  }

  let esEdicion = false;

  if (idEntrenamiento) {
    const registro = obtenerEntrenamientoPorId(usuario, idEntrenamiento, almacenEntrenamientos);

    // Con un id que no existe, se vuelve al listado con un aviso de error (Requisito 17)
    if (!registro) {
      guardarAvisoParaSiguientePagina(
        'El entrenamiento solicitado no existe o fue eliminado.',
        'danger',
        almacenSesion,
      );
      navegar('listado.html');
      return;
    }

    esEdicion = true;
    if (tituloFicha) {
      tituloFicha.textContent = 'Editar sesión deportiva';
    }
    if (btnGuardar) {
      btnGuardar.textContent = 'Guardar cambios';
    }

    // Rellenar formulario con los datos existentes
    const campoTitulo = documento.getElementById('titulo-sesion');
    const campoDisciplina = documento.getElementById('disciplina');
    const campoDuracion = documento.getElementById('duracion');
    const campoDistancia = documento.getElementById('distancia');
    const campoFrecuencia = documento.getElementById('frecuencia-cardiaca');
    const campoCalorias = documento.getElementById('calorias');
    const campoNotas = documento.getElementById('notas');

    if (campoTitulo) {
      campoTitulo.value = registro.titulo || '';
    }
    if (campoDisciplina) {
      campoDisciplina.value = registro.disciplina || '';
    }
    if (campoFecha) {
      campoFecha.value = registro.fecha || '';
    }
    if (campoDuracion && registro.duracion !== undefined) {
      campoDuracion.value = registro.duracion;
    }
    if (campoDistancia && registro.distancia !== undefined && registro.distancia !== null) {
      campoDistancia.value = registro.distancia;
    }
    if (
      campoFrecuencia &&
      registro.frecuenciaCardiaca !== undefined &&
      registro.frecuenciaCardiaca !== null
    ) {
      campoFrecuencia.value = registro.frecuenciaCardiaca;
    }
    if (campoCalorias && registro.calorias !== undefined && registro.calorias !== null) {
      campoCalorias.value = registro.calorias;
    }
    if (campoNotas) {
      campoNotas.value = registro.notas || '';
    }

    if (rpeInput && registro.esfuerzoRpe !== undefined) {
      rpeInput.value = registro.esfuerzoRpe;
      if (rpeValor) {
        rpeValor.textContent = TEXTOS_RPE[registro.esfuerzoRpe] || `RPE ${registro.esfuerzoRpe}`;
      }
    }

    const esComp = Boolean(registro.esCompeticion);
    if (checkCompeticion) {
      checkCompeticion.checked = esComp;
    }
    actualizarCampoCondicional(esComp);
    if (esComp) {
      if (campoNombreCompeticion) {
        campoNombreCompeticion.value = registro.nombreCompeticion || '';
      }
      if (campoDorsal) {
        campoDorsal.value = registro.dorsal || '';
      }
    }
  } else {
    // Modo alta inicial: campo condicional desactivado y oculto
    actualizarCampoCondicional(false);
  }

  // 5. Envío y guardado con FormData normalizado
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    if (!formulario.checkValidity()) {
      return;
    }

    const formData = new FormData(formulario);
    const esCompeticionActiva = checkCompeticion ? checkCompeticion.checked : false;

    const datos = {
      titulo: (formData.get('titulo') || '').trim(),
      disciplina: formData.get('disciplina'),
      fecha: formData.get('fecha'),
      duracion: parseFloat(formData.get('duracion')),
      distancia: formData.get('distancia') ? parseFloat(formData.get('distancia')) : null,
      frecuenciaCardiaca: formData.get('frecuenciaCardiaca')
        ? parseInt(formData.get('frecuenciaCardiaca'), 10)
        : null,
      calorias: formData.get('calorias') ? parseInt(formData.get('calorias'), 10) : null,
      esfuerzoRpe: formData.get('esfuerzoRpe') ? parseInt(formData.get('esfuerzoRpe'), 10) : 7,
      esCompeticion: esCompeticionActiva,
      nombreCompeticion: esCompeticionActiva
        ? (formData.get('nombreCompeticion') || '').trim()
        : null,
      dorsal: esCompeticionActiva ? (formData.get('dorsal') || '').trim() : null,
      notas: (formData.get('notas') || '').trim(),
    };

    if (esEdicion) {
      actualizarEntrenamiento(usuario, idEntrenamiento, datos, almacenEntrenamientos);
      guardarAvisoParaSiguientePagina(
        'Sesión de entrenamiento actualizada con éxito.',
        'success',
        almacenSesion,
      );
    } else {
      crearEntrenamiento(usuario, datos, almacenEntrenamientos);
      guardarAvisoParaSiguientePagina(
        'Nueva sesión de entrenamiento registrada con éxito.',
        'success',
        almacenSesion,
      );
    }

    navegar('listado.html');
  });
}

// Inicialización automática en navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarFicha());
  } else {
    iniciarFicha();
  }
}

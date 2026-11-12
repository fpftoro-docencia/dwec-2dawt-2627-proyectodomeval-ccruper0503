/**
 * Controlador de la página de alta y edición de entrenamientos (ficha.html).
 * Cumple con los Requisitos 13, 17 y 20 del Sprint 2:
 * - Modo alta (ficha.html) y modo edición (ficha.html?id=...).
 * - Protección de ruta privada y cabecera de usuario.
 * - Campo condicional: casilla ¿Competición oficial? activa/desactiva y muestra/oculta (hidden y disabled).
 * - Duración flexible: medición en horas y minutos con conversión matemática a minutos totales.
 * - Grupo dinámico de ejercicios desde <template>: ids únicos, etiquetas (htmlFor), cajas de error,
 *   límites mínimo (1) y máximo (5) con botones desactivados en extremos, y delegación de eventos (closest).
 * - Lectura y normalización de arrays de ejercicios con FormData.getAll().
 * - Atributo dinámico de fecha max puesto por código (fecha de hoy).
 * - Al editar, rellenado automático de todos los datos y ejercicios.
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

export const MIN_EJERCICIOS = 1;
export const MAX_EJERCICIOS = 5;

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
  const campoHoras = documento.getElementById('duracion-horas');
  const campoMinutos = documento.getElementById('duracion-minutos');
  const campoDuracion = documento.getElementById('duracion');
  const textoTotalDuracion = documento.getElementById('duracion-total-texto');
  const checkCompeticion = documento.getElementById('es-competicion');
  const bloqueCondicional = documento.getElementById('campo-condicional-competicion');
  const campoNombreCompeticion = documento.getElementById('nombre-competicion');
  const campoDorsal = documento.getElementById('dorsal');
  const rpeInput = documento.getElementById('esfuerzo-rpe');
  const rpeValor = documento.getElementById('valor-rpe');
  const btnAnadirEjercicio = documento.getElementById('btn-anadir-ejercicio');
  const contenedorEjercicios = documento.getElementById('contenedor-ejercicios');
  const plantillaEjercicio = documento.getElementById('plantilla-ejercicio');
  const btnGuardar = documento.getElementById('btn-guardar-ficha');

  // 1. Limitar fecha máxima a hoy mediante código (Requisito 17)
  const hoy = new Date().toISOString().split('T')[0];
  if (campoFecha) {
    campoFecha.max = hoy;
  }

  // 2. Control de duración en Horas y Minutos con conversión matemática a minutos totales
  function actualizarDuracionTotal() {
    const horas = parseInt(campoHoras?.value, 10) || 0;
    const minutos = parseInt(campoMinutos?.value, 10) || 0;
    const totalMinutos = horas * 60 + minutos;

    if (campoDuracion) {
      campoDuracion.value = totalMinutos;
    }
    if (textoTotalDuracion) {
      textoTotalDuracion.textContent = `Tiempo total: ${totalMinutos} min (${horas}h ${minutos}m)`;
    }
  }

  campoHoras?.addEventListener('input', actualizarDuracionTotal);
  campoMinutos?.addEventListener('input', actualizarDuracionTotal);

  // 3. Control del campo condicional (hidden y disabled)
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

  // 4. Feedback dinámico del deslizador RPE
  rpeInput?.addEventListener('input', () => {
    if (rpeValor) {
      rpeValor.textContent = TEXTOS_RPE[rpeInput.value] || `RPE ${rpeInput.value}`;
    }
  });

  // 5. Grupo dinámico de ejercicios desde <template> (Requisitos 13, 17 y 20)
  let contadorEjercicios = 0;

  function actualizarLimitesEjercicios() {
    if (!contenedorEjercicios) {
      return;
    }
    const botonesQuitar = contenedorEjercicios.querySelectorAll('.boton-quitar-ejercicio');
    const total = botonesQuitar.length;

    // Desactivar botones de quitar si estamos en el mínimo (1)
    botonesQuitar.forEach((btn) => {
      btn.disabled = total <= MIN_EJERCICIOS;
    });

    // Desactivar botón de añadir si alcanzamos el máximo (5)
    if (btnAnadirEjercicio) {
      btnAnadirEjercicio.disabled = total >= MAX_EJERCICIOS;
    }
  }

  function crearFilaEjercicio({ nombre = '', detalle = '' } = {}) {
    if (!plantillaEjercicio || !contenedorEjercicios) {
      return;
    }

    const fragmento = plantillaEjercicio.content.cloneNode(true);
    const fila = fragmento.querySelector('.fila-ejercicio') || fragmento.firstElementChild;

    contadorEjercicios += 1;
    const idNombre = `ejercicio-nombre-${contadorEjercicios}`;
    const idDetalle = `ejercicio-detalle-${contadorEjercicios}`;
    const idErrorNombre = `error-${idNombre}`;
    const idErrorDetalle = `error-${idDetalle}`;

    const inputNombre = fila.querySelector('.campo-ejercicio-nombre');
    const labelNombre = fila.querySelector('.etiqueta-ejercicio-nombre');
    const errorNombre = fila.querySelector('.caja-error-ejercicio-nombre');

    const inputDetalle = fila.querySelector('.campo-ejercicio-detalle');
    const labelDetalle = fila.querySelector('.etiqueta-ejercicio-detalle');
    const errorDetalle = fila.querySelector('.caja-error-ejercicio-detalle');

    if (inputNombre) {
      inputNombre.id = idNombre;
      inputNombre.value = nombre;
      if (labelNombre) {
        labelNombre.htmlFor = idNombre;
      }
      if (errorNombre) {
        errorNombre.id = idErrorNombre;
        inputNombre.setAttribute('aria-describedby', idErrorNombre);
      }
    }

    if (inputDetalle) {
      inputDetalle.id = idDetalle;
      inputDetalle.value = detalle;
      if (labelDetalle) {
        labelDetalle.htmlFor = idDetalle;
      }
      if (errorDetalle) {
        errorDetalle.id = idErrorDetalle;
        inputDetalle.setAttribute('aria-describedby', idErrorDetalle);
      }
    }

    contenedorEjercicios.appendChild(fila);
    actualizarLimitesEjercicios();
  }

  // Delegación de eventos en contenedor padre para eliminar filas (Requisito 20)
  contenedorEjercicios?.addEventListener('click', (evento) => {
    const btnQuitar = evento.target.closest('.boton-quitar-ejercicio');
    if (!btnQuitar || btnQuitar.disabled) {
      return;
    }

    const fila = btnQuitar.closest('.fila-ejercicio');
    const totalFilas = contenedorEjercicios.querySelectorAll('.boton-quitar-ejercicio').length;

    if (fila && totalFilas > MIN_EJERCICIOS) {
      fila.remove();
      actualizarLimitesEjercicios();
    }
  });

  // Botón añadir fila
  btnAnadirEjercicio?.addEventListener('click', () => {
    const totalFilas = contenedorEjercicios.querySelectorAll('.boton-quitar-ejercicio').length;
    if (totalFilas < MAX_EJERCICIOS) {
      crearFilaEjercicio();
    }
  });

  // 6. Detección de modo (Alta vs Edición con ?id=...)
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

    // Duración en horas y minutos
    const durTotal = registro.duracion || 0;
    const h =
      registro.duracionHoras !== undefined ? registro.duracionHoras : Math.floor(durTotal / 60);
    const m = registro.duracionMinutos !== undefined ? registro.duracionMinutos : durTotal % 60;

    if (campoHoras) {
      campoHoras.value = h;
    }
    if (campoMinutos) {
      campoMinutos.value = m;
    }
    actualizarDuracionTotal();

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

    // Reconstruir ejercicios existentes
    if (contenedorEjercicios) {
      contenedorEjercicios.replaceChildren();
      if (Array.isArray(registro.ejercicios) && registro.ejercicios.length > 0) {
        registro.ejercicios.forEach((ej) => crearFilaEjercicio(ej));
      } else {
        crearFilaEjercicio();
      }
    }
  } else {
    // Modo alta inicial: campo condicional desactivado y 1 fila de ejercicio inicial
    actualizarCampoCondicional(false);
    if (contenedorEjercicios && contenedorEjercicios.children.length === 0) {
      crearFilaEjercicio();
    }
    actualizarDuracionTotal();
  }

  // 7. Envío y guardado con FormData normalizado (getAll para grupo dinámico)
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    if (!formulario.checkValidity()) {
      return;
    }

    const formData = new FormData(formulario);
    const esCompeticionActiva = checkCompeticion ? checkCompeticion.checked : false;

    // Calcular duración total en minutos
    const horas = parseInt(formData.get('duracionHoras'), 10) || 0;
    const minutos = parseInt(formData.get('duracionMinutos'), 10) || 0;
    const totalMinutos = horas * 60 + minutos || parseFloat(formData.get('duracion')) || 0;

    // Leer grupo dinámico con FormData.getAll (Requisito 17)
    const nombresEjercicios = formData.getAll('ejercicioNombre[]');
    const detallesEjercicios = formData.getAll('ejercicioDetalle[]');

    const ejercicios = nombresEjercicios
      .map((nombre, idx) => ({
        nombre: (nombre || '').trim(),
        detalle: (detallesEjercicios[idx] || '').trim(),
      }))
      .filter((ej) => ej.nombre.length > 0);

    const datos = {
      titulo: (formData.get('titulo') || '').trim(),
      disciplina: formData.get('disciplina'),
      fecha: formData.get('fecha'),
      duracion: totalMinutos,
      duracionHoras: horas,
      duracionMinutos: minutos,
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
      ejercicios,
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

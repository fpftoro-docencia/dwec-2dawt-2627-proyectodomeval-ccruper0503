import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarFicha } from '../../js/paginas/ficha.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearEntrenamiento, obtenerEntrenamientos } from '../../js/entrenamientos.js';

describe('Integración: ficha.html (validación en vivo y guardado con FormData)', () => {
  let almacenSesion;
  let almacenEntrenamientos;
  let navegar;
  let ubicacion;

  beforeEach(() => {
    cargarPagina('ficha.html');
    almacenSesion = new AlmacenFalso();
    almacenEntrenamientos = new AlmacenFalso();
    navegar = vi.fn();
    ubicacion = {
      href: 'http://localhost:3901/ficha.html',
      search: '',
    };
    iniciarSesion({ nombreUsuario: 'ana', rol: 'usuario' }, almacenSesion);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function arrancarFicha(search = '') {
    ubicacion.search = search;
    ubicacion.href = `http://localhost:3901/ficha.html${search}`;
    iniciarFicha({
      documento: document,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
      ubicacion,
    });
  }

  it('valida al salir (blur en captura) y limpia el error al escribir en tiempo real', () => {
    arrancarFicha();

    const formulario = document.getElementById('formulario-ficha');
    const campoTitulo = document.getElementById('titulo-sesion');
    const errorTitulo = document.getElementById('error-titulo');

    expect(formulario.noValidate).toBe(true);
    expect(campoTitulo.classList.contains('is-invalid')).toBe(false);

    // 1. Al salir de un campo obligatorio vacío aparece el error accesible
    salir(campoTitulo);
    expect(campoTitulo.classList.contains('is-invalid')).toBe(true);
    expect(campoTitulo.getAttribute('aria-invalid')).toBe('true');
    expect(errorTitulo.textContent).toBe('Este campo es obligatorio.');

    // 2. Al escribir un valor válido, el error desaparece en tiempo real
    escribir(campoTitulo, 'Rodaje matinal 10K');
    expect(campoTitulo.classList.contains('is-invalid')).toBe(false);
    expect(campoTitulo.getAttribute('aria-invalid')).toBe('false');
    expect(errorTitulo.textContent).toBe('');

    // 3. Validador de entidad con regex en el grupo dinámico (series x reps)
    const campoDetalle = document.querySelector('.campo-ejercicio-detalle');
    const cajaErrorDetalle = document.querySelector('.caja-error-ejercicio-detalle');

    escribir(campoDetalle, 'formato-malo');
    salir(campoDetalle);
    expect(campoDetalle.classList.contains('is-invalid')).toBe(true);
    expect(cajaErrorDetalle.textContent).toContain('Series x Repeticiones');

    escribir(campoDetalle, '4x12@80kg');
    expect(campoDetalle.classList.contains('is-invalid')).toBe(false);
    expect(cajaErrorDetalle.textContent).toBe('');
  });

  it('al enviar con errores emite un aviso y lleva el foco al primer campo inválido', () => {
    arrancarFicha();

    const formulario = document.getElementById('formulario-ficha');
    const campoTitulo = document.getElementById('titulo-sesion');
    const contenedorAvisos = document.getElementById('contenedor-avisos');

    formulario.requestSubmit();

    expect(navegar).not.toHaveBeenCalled();
    expect(campoTitulo.classList.contains('is-invalid')).toBe(true);
    expect(document.activeElement).toBe(campoTitulo);
    expect(contenedorAvisos.textContent).toContain('Revisa los campos marcados');
  });

  it('envía datos válidos con campo condicional y grupo dinámico, guardándolos normalizados', () => {
    arrancarFicha();

    const formulario = document.getElementById('formulario-ficha');
    const campoTitulo = document.getElementById('titulo-sesion');
    const campoDisciplina = document.getElementById('disciplina');
    const campoFecha = document.getElementById('fecha');
    const campoHoras = document.getElementById('duracion-horas');
    const campoMinutos = document.getElementById('duracion-minutos');
    const campoDistancia = document.getElementById('distancia');
    const campoPulso = document.getElementById('frecuencia-cardiaca');
    const campoCalorias = document.getElementById('calorias');
    const campoRpe = document.getElementById('esfuerzo-rpe');
    const checkCompeticion = document.getElementById('es-competicion');
    const bloqueCondicional = document.getElementById('campo-condicional-competicion');
    const campoNombreCompeticion = document.getElementById('nombre-competicion');
    const campoDorsal = document.getElementById('dorsal');
    const btnAnadir = document.getElementById('btn-anadir-ejercicio');
    const campoNotas = document.getElementById('notas');

    const hoy = new Date().toISOString().split('T')[0];
    expect(campoFecha.max).toBe(hoy);
    expect(bloqueCondicional.hidden).toBe(true);
    expect(campoNombreCompeticion.disabled).toBe(true);

    // Rellenar datos principales y métricas
    escribir(campoTitulo, '  Media Maratón Nocturna  ');
    campoDisciplina.value = 'running';
    campoDisciplina.dispatchEvent(new Event('change', { bubbles: true }));
    escribir(campoFecha, hoy);
    escribir(campoHoras, '1');
    escribir(campoMinutos, '25');
    escribir(campoDistancia, '21.1');
    escribir(campoPulso, '168');
    escribir(campoCalorias, '1180');
    escribir(campoRpe, '9');

    // Activar campo condicional
    checkCompeticion.checked = true;
    checkCompeticion.dispatchEvent(new Event('change', { bubbles: true }));
    expect(bloqueCondicional.hidden).toBe(false);
    expect(campoNombreCompeticion.disabled).toBe(false);
    expect(campoDorsal.disabled).toBe(false);

    escribir(campoNombreCompeticion, '  Media de Málaga  ');
    escribir(campoDorsal, '  #412  ');

    // Añadir una segunda fila al grupo dinámico y rellenar ambas
    btnAnadir.click();
    const nombres = document.querySelectorAll('.campo-ejercicio-nombre');
    const detalles = document.querySelectorAll('.campo-ejercicio-detalle');
    expect(nombres).toHaveLength(2);

    escribir(nombres[0], '  Calentamiento progresivo  ');
    escribir(detalles[0], '2x10');
    escribir(nombres[1], '  Bloque ritmo umbral  ');
    escribir(detalles[1], '4x12@60kg');

    escribir(campoNotas, '  Sensaciones sólidas en el km 18  ');

    formulario.requestSubmit();

    const guardados = obtenerEntrenamientos('ana', almacenEntrenamientos);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({
      titulo: 'Media Maratón Nocturna',
      disciplina: 'running',
      fecha: hoy,
      duracion: 85,
      duracionHoras: 1,
      duracionMinutos: 25,
      distancia: 21.1,
      frecuenciaCardiaca: 168,
      calorias: 1180,
      esfuerzoRpe: 9,
      esCompeticion: true,
      nombreCompeticion: 'Media de Málaga',
      dorsal: '#412',
      ejercicios: [
        { nombre: 'Calentamiento progresivo', detalle: '2x10' },
        { nombre: 'Bloque ritmo umbral', detalle: '4x12@60kg' },
      ],
      notas: 'Sensaciones sólidas en el km 18',
    });

    const avisoPendiente = JSON.parse(almacenSesion.getItem('sportlog_aviso_pendiente'));
    expect(avisoPendiente).toEqual({
      mensaje: 'Nueva sesión de entrenamiento registrada con éxito.',
      tipo: 'success',
    });
    expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
  });

  it('en modo edición (?id=...) precarga el registro existente y guarda los cambios', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const existente = crearEntrenamiento(
      'ana',
      {
        titulo: 'Sesión inicial',
        disciplina: 'fuerza',
        fecha: hoy,
        duracion: 60,
        duracionHoras: 1,
        duracionMinutos: 0,
        esfuerzoRpe: 6,
        esCompeticion: false,
        ejercicios: [{ nombre: 'Sentadilla', detalle: '4x8@90kg' }],
        notas: 'Notas previas',
      },
      almacenEntrenamientos,
    );

    arrancarFicha(`?id=${encodeURIComponent(existente.id)}`);

    const campoTitulo = document.getElementById('titulo-sesion');
    const formulario = document.getElementById('formulario-ficha');
    expect(campoTitulo.value).toBe('Sesión inicial');

    escribir(campoTitulo, 'Sesión fuerza revisada');
    formulario.requestSubmit();

    const actualizados = obtenerEntrenamientos('ana', almacenEntrenamientos);
    expect(actualizados).toHaveLength(1);
    expect(actualizados[0].id).toBe(existente.id);
    expect(actualizados[0].titulo).toBe('Sesión fuerza revisada');
    expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
  });

  it('si el id de edición no existe, guarda aviso de error y vuelve al listado', () => {
    arrancarFicha('?id=no-existe');

    const aviso = JSON.parse(almacenSesion.getItem('sportlog_aviso_pendiente'));
    expect(aviso.tipo).toBe('danger');
    expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
  });
});

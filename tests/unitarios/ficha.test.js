import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarFicha, MIN_EJERCICIOS, MAX_EJERCICIOS } from '../../js/paginas/ficha.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearEntrenamiento, obtenerEntrenamientos } from '../../js/entrenamientos.js';

describe('Controlador de Ficha - Grupo dinámico y duración (S2-04 / S2-05 / Requisitos 13, 17, 20)', () => {
  let almacenSesion;
  let almacenEntrenamientos;
  let navegar;
  let doc;

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    almacenEntrenamientos = new AlmacenFalso();
    navegar = vi.fn();

    document.body.innerHTML = `
      <div id="contenedor-avisos" class="region-avisos"></div>
      <header>
        <span id="sesion-avatar"></span>
        <strong id="sesion-usuario"></strong>
        <span id="sesion-rol"></span>
        <button id="btn-cerrar-sesion"></button>
        <li id="menu-usuarios" hidden></li>
      </header>
      <h1 id="titulo-ficha">Ficha de entrenamiento</h1>
      <form id="formulario-ficha" novalidate>
        <input id="titulo-sesion" name="titulo" aria-describedby="error-titulo" required />
        <div class="invalid-feedback" id="error-titulo"></div>
        <select id="disciplina" name="disciplina" aria-describedby="error-disciplina" required>
          <option value="running">Running</option>
          <option value="ciclismo">Ciclismo</option>
        </select>
        <div class="invalid-feedback" id="error-disciplina"></div>
        <input type="date" id="fecha" name="fecha" aria-describedby="error-fecha" required />
        <div class="invalid-feedback" id="error-fecha"></div>
        
        <!-- Duración en Horas y Minutos -->
        <input type="number" id="duracion-horas" name="duracionHoras" min="0" max="24" value="0" aria-describedby="error-duracion" />
        <input type="number" id="duracion-minutos" name="duracionMinutos" min="0" max="59" value="45" aria-describedby="error-duracion" data-validar="duracionTotal" />
        <input type="hidden" id="duracion" name="duracion" value="45" />
        <div id="duracion-total-texto">Tiempo total: 45 min</div>
        <div class="invalid-feedback" id="error-duracion"></div>

        <input type="number" id="distancia" name="distancia" min="0" value="10" aria-describedby="error-distancia" />
        <div class="invalid-feedback" id="error-distancia"></div>
        <input type="number" id="frecuencia-cardiaca" name="frecuenciaCardiaca" min="40" max="230" value="150" aria-describedby="error-frecuencia" data-validar="pulsaciones" />
        <div class="invalid-feedback" id="error-frecuencia"></div>
        <input type="number" id="calorias" name="calorias" min="0" value="500" aria-describedby="error-calorias" />
        <div class="invalid-feedback" id="error-calorias"></div>
        <input type="range" id="esfuerzo-rpe" name="esfuerzoRpe" min="1" max="10" value="7" />
        <span id="valor-rpe">RPE 7 · Duro / Umbral</span>
        
        <!-- Campo condicional -->
        <input type="checkbox" id="es-competicion" name="esCompeticion" />
        <div id="campo-condicional-competicion" hidden>
          <input type="text" id="nombre-competicion" name="nombreCompeticion" aria-describedby="error-nombre-competicion" required disabled />
          <div class="invalid-feedback" id="error-nombre-competicion"></div>
          <input type="text" id="dorsal" name="dorsal" aria-describedby="error-dorsal" disabled />
          <div class="invalid-feedback" id="error-dorsal"></div>
        </div>

        <!-- Grupo dinámico de ejercicios -->
        <button type="button" id="btn-anadir-ejercicio">+ Añadir fila</button>
        <div id="contenedor-ejercicios"></div>

        <textarea id="notas" name="notas" aria-describedby="error-notas"></textarea>
        <div class="invalid-feedback" id="error-notas"></div>
        <button id="btn-guardar-ficha" type="submit">Guardar sesión</button>
      </form>

      <template id="plantilla-ejercicio">
        <div class="fila-ejercicio">
          <label class="etiqueta-ejercicio-nombre">Ejercicio</label>
          <input type="text" class="campo-ejercicio-nombre" name="ejercicioNombre[]" required />
          <div class="invalid-feedback caja-error-ejercicio-nombre">Error nombre</div>

          <label class="etiqueta-ejercicio-detalle">Detalle</label>
          <input type="text" class="campo-ejercicio-detalle" name="ejercicioDetalle[]" data-validar="ejercicioDetalle" />
          <div class="invalid-feedback caja-error-ejercicio-detalle">Error detalle</div>

          <button type="button" class="boton-quitar-ejercicio">✕</button>
        </div>
      </template>
    `;
    doc = document;
  });

  it('redirige a index.html si no hay sesión activa', () => {
    iniciarFicha({
      documento: doc,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
    });

    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  describe('Flujos con sesión iniciada', () => {
    beforeEach(() => {
      iniciarSesion({ nombreUsuario: 'atleta_pro', rol: 'usuario' }, almacenSesion);
    });

    it('asigna dinámicamente la fecha máxima a hoy y campo condicional oculto', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      const campoFecha = doc.getElementById('fecha');
      const hoy = new Date().toISOString().split('T')[0];
      expect(campoFecha.max).toBe(hoy);

      const bloque = doc.getElementById('campo-condicional-competicion');
      expect(bloque.hidden).toBe(true);
    });

    it('calcula la duración sumando horas y minutos (ej. maratón 3h 15m = 195 min)', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      const campoHoras = doc.getElementById('duracion-horas');
      const campoMinutos = doc.getElementById('duracion-minutos');
      const campoDuracionOculto = doc.getElementById('duracion');
      const textoTotal = doc.getElementById('duracion-total-texto');

      campoHoras.value = '3';
      campoMinutos.value = '15';
      campoHoras.dispatchEvent(new Event('input'));

      // 3 * 60 + 15 = 195 minutos
      expect(campoDuracionOculto.value).toBe('195');
      expect(textoTotal.textContent).toContain('195 min (3h 15m)');
    });

    describe('Grupo dinámico de ejercicios desde <template> (Requisitos 13, 17 y 20)', () => {
      it('inicializa con 1 fila y desactiva su botón de quitar (límite mínimo 1)', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const contenedor = doc.getElementById('contenedor-ejercicios');
        const filas = contenedor.querySelectorAll('.fila-ejercicio');
        expect(filas).toHaveLength(MIN_EJERCICIOS);

        const btnQuitar = contenedor.querySelector('.boton-quitar-ejercicio');
        expect(btnQuitar.disabled).toBe(true);
      });

      it('genera id único por campo, vinculando etiqueta (htmlFor) y aria-describedby', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const contenedor = doc.getElementById('contenedor-ejercicios');
        const inputNombre = contenedor.querySelector('.campo-ejercicio-nombre');
        const labelNombre = contenedor.querySelector('.etiqueta-ejercicio-nombre');
        const errorNombre = contenedor.querySelector('.caja-error-ejercicio-nombre');

        expect(inputNombre.id).toMatch(/^ejercicio-nombre-\d+$/);
        expect(labelNombre.htmlFor).toBe(inputNombre.id);
        expect(errorNombre.id).toBe(`error-${inputNombre.id}`);
        expect(inputNombre.getAttribute('aria-describedby')).toBe(errorNombre.id);
      });

      it('permite añadir filas hasta el límite máximo (5) y desactiva el botón de añadir', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const btnAnadir = doc.getElementById('btn-anadir-ejercicio');
        const contenedor = doc.getElementById('contenedor-ejercicios');

        // Partimos de 1, pulsamos 4 veces más para llegar a 5
        btnAnadir.click();
        btnAnadir.click();
        btnAnadir.click();
        btnAnadir.click();

        const filas = contenedor.querySelectorAll('.fila-ejercicio');
        expect(filas).toHaveLength(MAX_EJERCICIOS);
        expect(btnAnadir.disabled).toBe(true);

        // Los botones de eliminar deben estar habilitados
        const botonesQuitar = contenedor.querySelectorAll('.boton-quitar-ejercicio');
        botonesQuitar.forEach((btn) => expect(btn.disabled).toBe(false));

        // Un clic extra no añade más de 5
        btnAnadir.click();
        expect(contenedor.querySelectorAll('.fila-ejercicio')).toHaveLength(MAX_EJERCICIOS);
      });

      it('elimina filas usando delegación de eventos y reactiva el botón de añadir', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const btnAnadir = doc.getElementById('btn-anadir-ejercicio');
        const contenedor = doc.getElementById('contenedor-ejercicios');

        btnAnadir.click(); // 2 filas
        expect(contenedor.querySelectorAll('.fila-ejercicio')).toHaveLength(2);

        // Clic en el botón eliminar de la segunda fila
        const segundoBtnQuitar = contenedor.querySelectorAll('.boton-quitar-ejercicio')[1];
        segundoBtnQuitar.click();

        expect(contenedor.querySelectorAll('.fila-ejercicio')).toHaveLength(1);
        // Al quedar 1 fila, su botón de eliminar vuelve a quedar disabled
        expect(contenedor.querySelector('.boton-quitar-ejercicio').disabled).toBe(true);
      });
    });

    describe('Persistencia con FormData.getAll() y modo edición', () => {
      it('guarda los ejercicios y la duración en horas y minutos al enviar en modo alta', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        doc.getElementById('titulo-sesion').value = 'Maratón Sevilla';
        doc.getElementById('disciplina').value = 'running';
        doc.getElementById('fecha').value = '2026-11-12';
        doc.getElementById('duracion-horas').value = '3';
        doc.getElementById('duracion-minutos').value = '15';

        // Ejercicio 1
        const inputsNombre = doc.querySelectorAll('.campo-ejercicio-nombre');
        const inputsDetalle = doc.querySelectorAll('.campo-ejercicio-detalle');
        inputsNombre[0].value = 'Carrera continua 42.195km';
        inputsDetalle[0].value = '1x42';

        // Añadimos ejercicio 2
        doc.getElementById('btn-anadir-ejercicio').click();
        const inputsNombre2 = doc.querySelectorAll('.campo-ejercicio-nombre');
        const inputsDetalle2 = doc.querySelectorAll('.campo-ejercicio-detalle');
        inputsNombre2[1].value = 'Estiramientos y vuelta a la calma';
        inputsDetalle2[1].value = '1x15';

        const form = doc.getElementById('formulario-ficha');
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        expect(navegar).toHaveBeenCalledWith('listado.html');

        const guardados = obtenerEntrenamientos('atleta_pro', almacenEntrenamientos);
        expect(guardados).toHaveLength(1);
        expect(guardados[0].titulo).toBe('Maratón Sevilla');
        expect(guardados[0].duracion).toBe(195);
        expect(guardados[0].duracionHoras).toBe(3);
        expect(guardados[0].duracionMinutos).toBe(15);
        expect(guardados[0].ejercicios).toHaveLength(2);
        expect(guardados[0].ejercicios[0].nombre).toBe('Carrera continua 42.195km');
        expect(guardados[0].ejercicios[1].nombre).toBe('Estiramientos y vuelta a la calma');
      });

      it('al editar, reconstruye las filas dinámicas y desglosa horas y minutos', () => {
        const sesionExistente = crearEntrenamiento(
          'atleta_pro',
          {
            titulo: 'Gimnasio y Rodaje',
            disciplina: 'running',
            fecha: '2026-11-10',
            duracion: 130, // 2h 10m
            duracionHoras: 2,
            duracionMinutos: 10,
            ejercicios: [
              { nombre: 'Sentadillas', detalle: '4x10@80kg' },
              { nombre: 'Zancadas', detalle: '3x12@20kg' },
              { nombre: 'Sprint final', detalle: '5x100m' },
            ],
          },
          almacenEntrenamientos,
        );

        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
          ubicacion: { search: `?id=${sesionExistente.id}` },
        });

        // Comprobar duración desglosada
        expect(doc.getElementById('duracion-horas').value).toBe('2');
        expect(doc.getElementById('duracion-minutos').value).toBe('10');

        // Comprobar que se han creado las 3 filas
        const filas = doc.querySelectorAll('.fila-ejercicio');
        expect(filas).toHaveLength(3);

        const nombres = Array.from(doc.querySelectorAll('.campo-ejercicio-nombre')).map(
          (i) => i.value,
        );
        expect(nombres).toEqual(['Sentadillas', 'Zancadas', 'Sprint final']);
      });
    });

    describe('Validación en tiempo real (S2-06 / Requisito 19)', () => {
      it('valida campos estáticos en blur y revalida en input actualizando aria-invalid e is-invalid', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const campoTitulo = doc.getElementById('titulo-sesion');
        const errorTitulo = doc.getElementById('error-titulo');

        // Antes de blur no debe marcarse como inválido
        expect(campoTitulo.classList.contains('is-invalid')).toBe(false);

        // Blur con campo vacío -> marca error
        campoTitulo.dispatchEvent(new FocusEvent('blur'));
        expect(campoTitulo.classList.contains('is-invalid')).toBe(true);
        expect(campoTitulo.getAttribute('aria-invalid')).toBe('true');
        expect(errorTitulo.classList.contains('d-block')).toBe(true);
        expect(errorTitulo.textContent).not.toBe('');

        // Input con valor válido -> limpia error en tiempo real
        campoTitulo.value = 'Rodaje suave 8K';
        campoTitulo.dispatchEvent(new Event('input', { bubbles: true }));
        expect(campoTitulo.classList.contains('is-invalid')).toBe(false);
        expect(campoTitulo.getAttribute('aria-invalid')).toBe('false');
        expect(errorTitulo.classList.contains('d-block')).toBe(false);
        expect(errorTitulo.textContent).toBe('');

        // Validador de pulsaciones por data-validar="pulsaciones"
        const campoPulso = doc.getElementById('frecuencia-cardiaca');
        const errorPulso = doc.getElementById('error-frecuencia');
        campoPulso.value = '25';
        campoPulso.dispatchEvent(new FocusEvent('blur'));
        expect(campoPulso.classList.contains('is-invalid')).toBe(true);
        expect(campoPulso.getAttribute('aria-invalid')).toBe('true');
        expect(errorPulso.textContent).toContain('40 y 240');

        campoPulso.value = '155';
        campoPulso.dispatchEvent(new Event('input', { bubbles: true }));
        expect(campoPulso.classList.contains('is-invalid')).toBe(false);
        expect(campoPulso.getAttribute('aria-invalid')).toBe('false');
      });

      it('valida filas dinámicas de ejercicios (incluidas las añadidas después) con data-validar="ejercicioDetalle"', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        // Añadir segunda fila dinámica
        doc.getElementById('btn-anadir-ejercicio').click();
        const nombres = doc.querySelectorAll('.campo-ejercicio-nombre');
        const detalles = doc.querySelectorAll('.campo-ejercicio-detalle');
        const erroresDetalle = doc.querySelectorAll('.caja-error-ejercicio-detalle');

        expect(detalles[1].getAttribute('aria-describedby')).toBe(erroresDetalle[1].id);

        // Nombre requerido vacío en blur
        nombres[1].dispatchEvent(new FocusEvent('blur'));
        expect(nombres[1].classList.contains('is-invalid')).toBe(true);
        expect(nombres[1].getAttribute('aria-invalid')).toBe('true');

        // Detalle con formato incorrecto en blur
        detalles[1].value = 'formato incorrecto';
        detalles[1].dispatchEvent(new FocusEvent('blur'));
        expect(detalles[1].classList.contains('is-invalid')).toBe(true);
        expect(detalles[1].getAttribute('aria-invalid')).toBe('true');
        expect(erroresDetalle[1].classList.contains('d-block')).toBe(true);
        expect(erroresDetalle[1].textContent).toContain('Series x Repeticiones');

        // Corrección en input
        detalles[1].value = '4x12@80kg';
        detalles[1].dispatchEvent(new Event('input', { bubbles: true }));
        expect(detalles[1].classList.contains('is-invalid')).toBe(false);
        expect(detalles[1].getAttribute('aria-invalid')).toBe('false');
        expect(erroresDetalle[1].textContent).toBe('');
      });

      it('valida el campo condicional de competición solo cuando está activo y limpia errores al desactivarlo', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const checkCompeticion = doc.getElementById('es-competicion');
        const campoCompeticion = doc.getElementById('nombre-competicion');
        const errorCompeticion = doc.getElementById('error-nombre-competicion');

        // Rellenamos el resto de campos obligatorios válidos
        doc.getElementById('titulo-sesion').value = 'Carrera Popular';
        doc.getElementById('disciplina').value = 'running';
        doc.getElementById('fecha').value = '2026-11-12';
        doc.querySelector('.campo-ejercicio-nombre').value = 'Carrera 10K';

        // Activamos competición
        checkCompeticion.checked = true;
        checkCompeticion.dispatchEvent(new Event('change', { bubbles: true }));
        expect(campoCompeticion.disabled).toBe(false);

        // Blur con nombre de competición vacío -> error
        campoCompeticion.dispatchEvent(new FocusEvent('blur'));
        expect(campoCompeticion.classList.contains('is-invalid')).toBe(true);
        expect(campoCompeticion.getAttribute('aria-invalid')).toBe('true');
        expect(errorCompeticion.classList.contains('d-block')).toBe(true);

        // Desactivamos competición -> se limpia el error y queda disabled
        checkCompeticion.checked = false;
        checkCompeticion.dispatchEvent(new Event('change', { bubbles: true }));
        expect(campoCompeticion.disabled).toBe(true);
        expect(campoCompeticion.classList.contains('is-invalid')).toBe(false);
        expect(campoCompeticion.hasAttribute('aria-invalid')).toBe(false);
        expect(errorCompeticion.textContent).toBe('');

        // Al enviar con competición desactivada, no bloquea el guardado
        doc
          .getElementById('formulario-ficha')
          .dispatchEvent(new Event('submit', { cancelable: true }));
        expect(navegar).toHaveBeenCalledWith('listado.html');
      });

      it('al enviar con errores, avisa y mueve el foco al primer campo inválido', () => {
        iniciarFicha({
          documento: doc,
          almacenSesion,
          almacenEntrenamientos,
          navegar,
        });

        const form = doc.getElementById('formulario-ficha');
        const campoTitulo = doc.getElementById('titulo-sesion');
        const spyFocus = vi.spyOn(campoTitulo, 'focus');

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        expect(navegar).not.toHaveBeenCalled();
        expect(campoTitulo.classList.contains('is-invalid')).toBe(true);
        expect(campoTitulo.getAttribute('aria-invalid')).toBe('true');
        expect(spyFocus).toHaveBeenCalled();

        const avisos = doc.getElementById('contenedor-avisos');
        expect(avisos.textContent).toContain('Revisa los campos marcados');
      });
    });
  });
});

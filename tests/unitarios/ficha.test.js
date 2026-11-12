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
        <input id="titulo-sesion" name="titulo" required />
        <select id="disciplina" name="disciplina" required>
          <option value="running">Running</option>
          <option value="ciclismo">Ciclismo</option>
        </select>
        <input type="date" id="fecha" name="fecha" required />
        
        <!-- Duración en Horas y Minutos -->
        <input type="number" id="duracion-horas" name="duracionHoras" value="0" />
        <input type="number" id="duracion-minutos" name="duracionMinutos" value="45" />
        <input type="hidden" id="duracion" name="duracion" value="45" />
        <div id="duracion-total-texto">Tiempo total: 45 min</div>

        <input type="number" id="distancia" name="distancia" value="10" />
        <input type="number" id="frecuencia-cardiaca" name="frecuenciaCardiaca" value="150" />
        <input type="number" id="calorias" name="calorias" value="500" />
        <input type="range" id="esfuerzo-rpe" name="esfuerzoRpe" min="1" max="10" value="7" />
        <span id="valor-rpe">RPE 7 · Duro / Umbral</span>
        
        <!-- Campo condicional -->
        <input type="checkbox" id="es-competicion" name="esCompeticion" />
        <div id="campo-condicional-competicion" hidden>
          <input type="text" id="nombre-competicion" name="nombreCompeticion" disabled />
          <input type="text" id="dorsal" name="dorsal" disabled />
        </div>

        <!-- Grupo dinámico de ejercicios -->
        <button type="button" id="btn-anadir-ejercicio">+ Añadir fila</button>
        <div id="contenedor-ejercicios"></div>

        <textarea id="notas" name="notas"></textarea>
        <button id="btn-guardar-ficha" type="submit">Guardar sesión</button>
      </form>

      <template id="plantilla-ejercicio">
        <div class="fila-ejercicio">
          <label class="etiqueta-ejercicio-nombre">Ejercicio</label>
          <input type="text" class="campo-ejercicio-nombre" name="ejercicioNombre[]" required />
          <div class="invalid-feedback caja-error-ejercicio-nombre">Error nombre</div>

          <label class="etiqueta-ejercicio-detalle">Detalle</label>
          <input type="text" class="campo-ejercicio-detalle" name="ejercicioDetalle[]" />
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
        inputsDetalle[0].value = 'Ritmo medio 4:37 min/km';

        // Añadimos ejercicio 2
        doc.getElementById('btn-anadir-ejercicio').click();
        const inputsNombre2 = doc.querySelectorAll('.campo-ejercicio-nombre');
        const inputsDetalle2 = doc.querySelectorAll('.campo-ejercicio-detalle');
        inputsNombre2[1].value = 'Estiramientos y vuelta a la calma';
        inputsDetalle2[1].value = '15 min suaves';

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
  });
});

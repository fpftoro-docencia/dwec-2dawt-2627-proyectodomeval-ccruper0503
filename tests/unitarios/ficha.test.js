import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarFicha } from '../../js/paginas/ficha.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearEntrenamiento, obtenerEntrenamientos } from '../../js/entrenamientos.js';

describe('Controlador de Ficha - Alta y edición con campo condicional (S2-04 / Requisito 17)', () => {
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
        <input type="number" id="duracion" name="duracion" required value="45" />
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

        <textarea id="notas" name="notas"></textarea>
        <button id="btn-guardar-ficha" type="submit">Guardar sesión</button>
      </form>
    `;
    doc = document;
  });

  it('redirige a index.html si no hay sesión abierta (protección de ruta)', () => {
    iniciarFicha({
      documento: doc,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
    });

    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  describe('Página protegida con sesión activa', () => {
    beforeEach(() => {
      iniciarSesion({ nombreUsuario: 'atleta_pro', rol: 'usuario' }, almacenSesion);
    });

    it('asigna dinámicamente por código el atributo max de la fecha a hoy (Requisito 17)', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      const campoFecha = doc.getElementById('fecha');
      const hoy = new Date().toISOString().split('T')[0];
      expect(campoFecha.max).toBe(hoy);
    });

    it('gestiona el campo condicional: muestra/oculta y activa/desactiva con hidden y disabled', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      const check = doc.getElementById('es-competicion');
      const bloque = doc.getElementById('campo-condicional-competicion');
      const nombreComp = doc.getElementById('nombre-competicion');
      const dorsal = doc.getElementById('dorsal');

      // Estado inicial (no marcado): oculto y desactivado
      expect(bloque.hidden).toBe(true);
      expect(nombreComp.disabled).toBe(true);
      expect(dorsal.disabled).toBe(true);

      // El usuario marca la casilla
      check.checked = true;
      check.dispatchEvent(new Event('change'));

      expect(bloque.hidden).toBe(false);
      expect(nombreComp.disabled).toBe(false);
      expect(dorsal.disabled).toBe(false);

      // Si el usuario escribe y luego desmarca, se vacía y se vuelve a deshabilitar
      nombreComp.value = 'Maratón de Valencia';
      dorsal.value = 'Dorsal #205';

      check.checked = false;
      check.dispatchEvent(new Event('change'));

      expect(bloque.hidden).toBe(true);
      expect(nombreComp.disabled).toBe(true);
      expect(dorsal.disabled).toBe(true);
      expect(nombreComp.value).toBe('');
      expect(dorsal.value).toBe('');
    });

    it('actualiza el texto de esfuerzo RPE al mover el deslizador', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      const rpeInput = doc.getElementById('esfuerzo-rpe');
      const rpeValor = doc.getElementById('valor-rpe');

      rpeInput.value = '10';
      rpeInput.dispatchEvent(new Event('input'));
      expect(rpeValor.textContent).toContain('Esfuerzo Máximo');

      rpeInput.value = '1';
      rpeInput.dispatchEvent(new Event('input'));
      expect(rpeValor.textContent).toContain('Muy suave');
    });

    it('modo alta: registra nuevo entrenamiento y redirige a listado.html con aviso', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
      });

      doc.getElementById('titulo-sesion').value = 'Rodaje matutino';
      doc.getElementById('disciplina').value = 'running';
      doc.getElementById('fecha').value = '2026-11-12';
      doc.getElementById('duracion').value = '55';

      const form = doc.getElementById('formulario-ficha');
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(navegar).toHaveBeenCalledWith('listado.html');

      const guardados = obtenerEntrenamientos('atleta_pro', almacenEntrenamientos);
      expect(guardados).toHaveLength(1);
      expect(guardados[0].titulo).toBe('Rodaje matutino');
      expect(guardados[0].duracion).toBe(55);
      expect(guardados[0].esCompeticion).toBe(false);
    });

    it('modo edición: redirige al listado con aviso de error si el id no existe', () => {
      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion: { search: '?id=id-inexistente' },
      });

      expect(navegar).toHaveBeenCalledWith('listado.html');
      const avisoGuardado = almacenSesion.getItem('sportlog_aviso_pendiente');
      expect(avisoGuardado).toContain('no existe o fue eliminado');
    });

    it('modo edición: rellena el formulario y actualiza el registro existente', () => {
      const original = crearEntrenamiento(
        'atleta_pro',
        {
          titulo: 'Entrenamiento previo',
          disciplina: 'ciclismo',
          fecha: '2026-11-10',
          duracion: 90,
          esCompeticion: true,
          nombreCompeticion: 'Copa Regional',
          dorsal: '12',
        },
        almacenEntrenamientos,
      );

      iniciarFicha({
        documento: doc,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion: { search: `?id=${original.id}` },
      });

      // Comprobar que los campos se han rellenado
      expect(doc.getElementById('titulo-sesion').value).toBe('Entrenamiento previo');
      expect(doc.getElementById('disciplina').value).toBe('ciclismo');
      expect(doc.getElementById('es-competicion').checked).toBe(true);
      expect(doc.getElementById('nombre-competicion').value).toBe('Copa Regional');
      expect(doc.getElementById('nombre-competicion').disabled).toBe(false);
      expect(doc.getElementById('campo-condicional-competicion').hidden).toBe(false);
      expect(doc.getElementById('titulo-ficha').textContent).toBe('Editar sesión deportiva');

      // Modificamos un dato y guardamos
      doc.getElementById('titulo-sesion').value = 'Entrenamiento previo (ajustado)';
      const form = doc.getElementById('formulario-ficha');
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(navegar).toHaveBeenCalledWith('listado.html');

      const entrenamientos = obtenerEntrenamientos('atleta_pro', almacenEntrenamientos);
      expect(entrenamientos).toHaveLength(1);
      expect(entrenamientos[0].titulo).toBe('Entrenamiento previo (ajustado)');
      expect(entrenamientos[0].id).toBe(original.id);
    });
  });
});

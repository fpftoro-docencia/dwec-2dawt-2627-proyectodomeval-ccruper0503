import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  iniciarValidacionFormulario,
  validadoresFormulario,
} from '../../js/validacion-formularios.js';

describe('Módulo compartido de validación de formularios (S2-06 / Requisitos 19 y 20)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function crearFormularioRegistro() {
    document.body.innerHTML = `
      <div id="contenedor-avisos"></div>
      <form id="form-prueba">
        <div class="mb-3">
          <input
            id="nombre-usuario"
            name="nombreUsuario"
            class="form-control"
            data-validar="nombreUsuario"
            aria-describedby="error-usuario"
            required
          />
          <div id="error-usuario" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input
            id="correo"
            name="correo"
            type="email"
            class="form-control"
            data-validar="correo"
            aria-describedby="error-correo"
            required
          />
          <div id="error-correo" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input
            id="clave"
            name="clave"
            type="password"
            class="form-control"
            data-validar="clave"
            aria-describedby="error-clave"
            required
          />
          <div id="error-clave" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input
            id="repetir-clave"
            name="repetirClave"
            type="password"
            class="form-control"
            data-validar="repetirClave"
            data-depende-de="clave"
            aria-describedby="error-repetir"
            required
          />
          <div id="error-repetir" class="invalid-feedback"></div>
        </div>
        <div class="form-check">
          <input
            id="terminos"
            name="terminos"
            type="checkbox"
            class="form-check-input"
            data-validar="terminos"
            aria-describedby="error-terminos"
            required
          />
          <div id="error-terminos" class="invalid-feedback"></div>
        </div>
        <button type="submit">Enviar</button>
      </form>
    `;
    return document.getElementById('form-prueba');
  }

  it('devuelve null si no recibe un formulario válido y activa novalidate cuando sí existe', () => {
    expect(iniciarValidacionFormulario(null)).toBeNull();

    const formulario = crearFormularioRegistro();
    expect(formulario.noValidate).toBe(false);

    const controlador = iniciarValidacionFormulario(formulario);
    expect(controlador).not.toBeNull();
    expect(formulario.noValidate).toBe(true);
  });

  it('no valida en input antes del primer blur, pero sí valida al hacer blur y en cada input posterior', () => {
    const formulario = crearFormularioRegistro();
    iniciarValidacionFormulario(formulario);

    const usuario = document.getElementById('nombre-usuario');
    const errorUsuario = document.getElementById('error-usuario');

    // Escribir valor inválido antes de blur: no debe marcar error todavía
    usuario.value = 'ab';
    usuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(usuario.classList.contains('is-invalid')).toBe(false);
    expect(errorUsuario.textContent).toBe('');

    // Al salir del campo (blur en fase de captura): se valida por primera vez
    usuario.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(usuario.classList.contains('is-invalid')).toBe(true);
    expect(usuario.getAttribute('aria-invalid')).toBe('true');
    expect(usuario.validity.customError).toBe(true);
    expect(errorUsuario.textContent).toContain('entre 3 y 15');
    expect(errorUsuario.classList.contains('d-block')).toBe(true);

    // A partir del primer blur, cada input revalida inmediatamente
    usuario.value = 'atleta_pro';
    usuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(usuario.classList.contains('is-invalid')).toBe(false);
    expect(usuario.getAttribute('aria-invalid')).toBe('false');
    expect(usuario.validity.valid).toBe(true);
    expect(errorUsuario.textContent).toBe('');
    expect(errorUsuario.classList.contains('d-block')).toBe(false);
  });

  it('valida campos añadidos dinámicamente al formulario gracias a la captura de blur y delegación', () => {
    const formulario = crearFormularioRegistro();
    iniciarValidacionFormulario(formulario);

    const contenedor = document.createElement('div');
    contenedor.className = 'mb-3';

    const campoDinamico = document.createElement('input');
    campoDinamico.id = 'detalle-dinamico';
    campoDinamico.className = 'form-control';
    campoDinamico.dataset.validar = 'ejercicioDetalle';

    const cajaError = document.createElement('div');
    cajaError.id = 'error-dinamico';
    cajaError.className = 'invalid-feedback';

    contenedor.appendChild(campoDinamico);
    contenedor.appendChild(cajaError);
    formulario.appendChild(contenedor);

    // Campo opcional vacío es válido
    campoDinamico.value = '';
    campoDinamico.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(campoDinamico.classList.contains('is-invalid')).toBe(false);

    // Con formato incorrecto muestra error y enlaza aria-describedby
    campoDinamico.value = 'formato invalido';
    campoDinamico.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoDinamico.classList.contains('is-invalid')).toBe(true);
    expect(campoDinamico.getAttribute('aria-describedby')).toBe('error-dinamico');
    expect(cajaError.textContent).toContain('Series x Repeticiones');
  });

  it('revalida campos dependientes (repetir contraseña) cuando cambia el campo origen', () => {
    const formulario = crearFormularioRegistro();
    iniciarValidacionFormulario(formulario);

    const clave = document.getElementById('clave');
    const repetir = document.getElementById('repetir-clave');
    const errorRepetir = document.getElementById('error-repetir');

    // Mientras repetir-clave esté vacío y sin tocar, cambiar clave no muestra error en repetir
    clave.value = 'Deporte2026';
    clave.dispatchEvent(new Event('input', { bubbles: true }));
    expect(repetir.classList.contains('is-invalid')).toBe(false);

    // El usuario rellena repetir correctamente y sale del campo
    repetir.value = 'Deporte2026';
    repetir.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(repetir.classList.contains('is-invalid')).toBe(false);

    // Ahora cambia la contraseña original: repetir debe revalidarse automáticamente
    clave.value = 'OtraClave2026';
    clave.dispatchEvent(new Event('input', { bubbles: true }));
    expect(repetir.classList.contains('is-invalid')).toBe(true);
    expect(repetir.getAttribute('aria-invalid')).toBe('true');
    expect(errorRepetir.textContent).toContain('no coinciden');

    // Si vuelve a coincidir, el error de repetir desaparece automáticamente
    clave.value = 'Deporte2026';
    clave.dispatchEvent(new Event('input', { bubbles: true }));
    expect(repetir.classList.contains('is-invalid')).toBe(false);
    expect(errorRepetir.textContent).toBe('');
  });

  it('soporta dependencias configuradas por opciones JS y validadores personalizados', () => {
    document.body.innerHTML = `
      <form id="form-custom">
        <div class="mb-3">
          <input id="campo-a" name="campoA" class="form-control" required />
          <div id="error-a" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input id="campo-b" name="campoB" class="form-control" data-validar="noIgualA" />
          <div id="error-b" class="invalid-feedback"></div>
        </div>
      </form>
    `;
    const formulario = document.getElementById('form-custom');
    const campoA = document.getElementById('campo-a');
    const campoB = document.getElementById('campo-b');

    iniciarValidacionFormulario(formulario, {
      dependencias: { campoA: ['campoB'] },
      validadores: {
        noIgualA: (valor) => {
          if (valor === campoA.value) {
            return { valido: false, error: 'No puede ser igual al campo A.' };
          }
          return { valido: true };
        },
      },
    });

    campoA.value = '10';
    campoB.value = '20';
    campoB.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(campoB.classList.contains('is-invalid')).toBe(false);

    campoA.value = '20';
    campoA.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoB.classList.contains('is-invalid')).toBe(true);
    expect(document.getElementById('error-b').textContent).toBe('No puede ser igual al campo A.');
  });

  it('valida restricciones nativas HTML5 (required, min, max, select) e ignora campos disabled o hidden', () => {
    document.body.innerHTML = `
      <form id="form-nativo">
        <div class="mb-3">
          <select id="disciplina" name="disciplina" class="form-select" required>
            <option value="">Elige...</option>
            <option value="running">Running</option>
          </select>
          <div id="error-disciplina" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input id="distancia" name="distancia" type="number" min="1" max="300" />
          <div id="error-distancia" class="invalid-feedback"></div>
        </div>
        <div class="mb-3">
          <input id="condicional" name="condicional" required disabled />
          <div id="error-condicional" class="invalid-feedback"></div>
        </div>
        <input id="oculto" type="hidden" required />
      </form>
    `;
    const formulario = document.getElementById('form-nativo');
    const controlador = iniciarValidacionFormulario(formulario);

    const disciplina = document.getElementById('disciplina');
    const distancia = document.getElementById('distancia');
    const condicional = document.getElementById('condicional');

    disciplina.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(disciplina.classList.contains('is-invalid')).toBe(true);
    expect(document.getElementById('error-disciplina').textContent).toContain('Selecciona');

    disciplina.value = 'running';
    disciplina.dispatchEvent(new Event('change', { bubbles: true }));
    expect(disciplina.classList.contains('is-invalid')).toBe(false);

    distancia.value = '0';
    distancia.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(distancia.classList.contains('is-invalid')).toBe(true);
    expect(document.getElementById('error-distancia').textContent).toContain('mínimo');

    distancia.value = '42';
    distancia.dispatchEvent(new Event('input', { bubbles: true }));
    expect(controlador.validarFormulario()).toBe(true);
    expect(condicional.classList.contains('is-invalid')).toBe(false);
  });

  it('validarFormulario enfoca el primer campo inválido y lanza evento aviso', () => {
    const formulario = crearFormularioRegistro();
    const controlador = iniciarValidacionFormulario(formulario, {
      mensajeErrorFormulario: 'Corrige los errores del formulario.',
    });

    const usuario = document.getElementById('nombre-usuario');
    const spyFocus = vi.spyOn(usuario, 'focus');
    const avisosRecibidos = [];
    document.addEventListener('aviso', (ev) => avisosRecibidos.push(ev.detail));

    const esValido = controlador.validarFormulario();

    expect(esValido).toBe(false);
    expect(spyFocus).toHaveBeenCalledTimes(1);
    expect(avisosRecibidos).toHaveLength(1);
    expect(avisosRecibidos[0]).toEqual({
      mensaje: 'Corrige los errores del formulario.',
      tipo: 'danger',
    });
  });

  it('limpiarErrores restablece clases, atributos ARIA y mensajes, y destruir elimina oyentes', () => {
    const formulario = crearFormularioRegistro();
    const controlador = iniciarValidacionFormulario(formulario);

    const usuario = document.getElementById('nombre-usuario');
    const errorUsuario = document.getElementById('error-usuario');

    expect(controlador.validarFormulario({ avisar: false })).toBe(false);
    expect(usuario.classList.contains('is-invalid')).toBe(true);

    controlador.limpiarErrores();
    expect(usuario.classList.contains('is-invalid')).toBe(false);
    expect(usuario.hasAttribute('aria-invalid')).toBe(false);
    expect(errorUsuario.textContent).toBe('');
    expect(errorUsuario.classList.contains('d-block')).toBe(false);

    controlador.destruir();
    usuario.value = 'x';
    usuario.dispatchEvent(new FocusEvent('blur', { bubbles: false }));
    expect(usuario.classList.contains('is-invalid')).toBe(false);
  });

  it('exporta los validadores de entidad y de usuario en validadoresFormulario', () => {
    expect(typeof validadoresFormulario.ritmo).toBe('function');
    expect(typeof validadoresFormulario.ejercicioDetalle).toBe('function');
    expect(typeof validadoresFormulario.pulsaciones).toBe('function');
    expect(typeof validadoresFormulario.nombreUsuario).toBe('function');
    expect(typeof validadoresFormulario.correo).toBe('function');
    expect(typeof validadoresFormulario.clave).toBe('function');
    expect(typeof validadoresFormulario.repetirClave).toBe('function');
    expect(typeof validadoresFormulario.terminos).toBe('function');
  });
});

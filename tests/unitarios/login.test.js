import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarLogin } from '../../js/paginas/login.js';
import { registrarUsuario } from '../../js/usuarios.js';
import { iniciarSesion, CLAVE_ALMACEN_SESION } from '../../js/sesion.js';

describe('Controlador de Login (S1-07)', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;
  let doc;

  beforeEach(() => {
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();

    document.body.innerHTML = `
      <div id="contenedor-avisos" class="region-avisos"></div>
      <form id="formulario-login" novalidate>
        <div class="mb-3">
          <input
            id="nombre-usuario"
            name="nombreUsuario"
            data-validar="identificador"
            aria-describedby="error-nombre-usuario"
            required
          />
          <div id="error-nombre-usuario" class="invalid-feedback"></div>
        </div>
        <div class="mb-4">
          <input
            id="clave"
            name="clave"
            type="password"
            aria-describedby="error-clave"
            required
          />
          <div id="error-clave" class="invalid-feedback"></div>
        </div>
        <button id="btn-login" type="submit">Entrar</button>
      </form>
    `;
    doc = document;
  });

  it('si ya hay sesión iniciada, redirige directamente al listado sin interactuar con el formulario', () => {
    iniciarSesion({ nombreUsuario: 'carlos', rol: 'usuario' }, almacenSesion);

    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    expect(navegar).toHaveBeenCalledWith('listado.html');
  });

  it('marca los campos como inválidos, actualiza aria-invalid y enfoca el primero si se envían vacíos', () => {
    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const form = doc.getElementById('formulario-login');
    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');
    const errorUsuario = doc.getElementById('error-nombre-usuario');
    const errorClave = doc.getElementById('error-clave');
    const focusSpy = vi.spyOn(campoUsuario, 'focus');

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('true');
    expect(errorUsuario.classList.contains('d-block')).toBe(true);
    expect(errorUsuario.textContent).not.toBe('');

    expect(campoClave.classList.contains('is-invalid')).toBe(true);
    expect(campoClave.getAttribute('aria-invalid')).toBe('true');
    expect(errorClave.classList.contains('d-block')).toBe(true);
    expect(errorClave.textContent).not.toBe('');

    expect(focusSpy).toHaveBeenCalled();
    expect(doc.getElementById('contenedor-avisos').textContent).toContain(
      'Revisa los campos marcados antes de continuar.',
    );
    expect(navegar).not.toHaveBeenCalled();
  });

  it('enfoca la contraseña al enviar si solo falta la contraseña', () => {
    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const form = doc.getElementById('formulario-login');
    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');
    const focusClaveSpy = vi.spyOn(campoClave, 'focus');

    campoUsuario.value = 'elena';
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('false');
    expect(campoClave.classList.contains('is-invalid')).toBe(true);
    expect(campoClave.getAttribute('aria-invalid')).toBe('true');
    expect(focusClaveSpy).toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('valida por primera vez en blur y revalida en input hasta corregir el campo', () => {
    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const errorUsuario = doc.getElementById('error-nombre-usuario');

    // Antes de blur, input no debe marcar error
    campoUsuario.value = '   ';
    campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);
    expect(campoUsuario.hasAttribute('aria-invalid')).toBe(false);

    // Al salir (blur), valida y marca error (espacios en blanco no son válidos)
    campoUsuario.dispatchEvent(new Event('blur'));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('true');
    expect(errorUsuario.classList.contains('d-block')).toBe(true);
    expect(errorUsuario.textContent).toContain('Introduce tu nombre de usuario o correo.');

    // Desde entonces, input revalida en tiempo real y limpia el error al corregir
    campoUsuario.value = 'elena@test.es';
    campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('false');
    expect(errorUsuario.classList.contains('d-block')).toBe(false);
    expect(errorUsuario.textContent).toBe('');
  });

  it('con contraseña incorrecta, emite aviso, limpia la contraseña y le otorga el foco', async () => {
    await registrarUsuario(
      { nombreUsuario: 'marcos', correo: 'marcos@test.es', clave: 'Password123' },
      almacenUsuarios,
    );

    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');
    const form = doc.getElementById('formulario-login');

    campoUsuario.value = 'marcos';
    campoClave.value = 'ClaveEquivocada999';

    const focusSpy = vi.spyOn(campoClave, 'focus');

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Esperar a la resolución de las promesas del evento submit
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(campoClave.value).toBe('');
    expect(focusSpy).toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
    expect(almacenSesion.getItem(CLAVE_ALMACEN_SESION)).toBeNull();

    // Comprobar que en el contenedor de avisos se renderizó la alerta
    const contenedorAvisos = doc.getElementById('contenedor-avisos');
    expect(contenedorAvisos.textContent).toContain('Usuario o contraseña incorrectos');
  });

  it('con credenciales correctas, inicia sesión en sessionStorage y redirige al listado', async () => {
    await registrarUsuario(
      { nombreUsuario: 'elena', correo: 'elena@test.es', clave: 'Password123' },
      almacenUsuarios,
    );

    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');
    const form = doc.getElementById('formulario-login');

    campoUsuario.value = 'elena';
    campoClave.value = 'Password123';

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(navegar).toHaveBeenCalledWith('listado.html');
    const sesion = JSON.parse(almacenSesion.getItem(CLAVE_ALMACEN_SESION));
    expect(sesion.nombreUsuario).toBe('elena');
  });

  it('bloquea envíos duplicados mientras se está verificando la autenticación', async () => {
    await registrarUsuario(
      { nombreUsuario: 'david', correo: 'david@test.es', clave: 'Password123' },
      almacenUsuarios,
    );

    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');
    const form = doc.getElementById('formulario-login');
    const botonLogin = doc.getElementById('btn-login');

    campoUsuario.value = 'david';
    campoClave.value = 'Password123';

    // Primer envío
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(botonLogin.disabled).toBe(true);

    // Segundo envío inmediato concurrente
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Debe haber navegado una sola vez
    expect(navegar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith('listado.html');
  });
});

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
      <form id="formulario-login">
        <input id="nombre-usuario" name="nombreUsuario" />
        <input id="clave" name="clave" type="password" />
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

  it('marca los campos como inválidos si se envían vacíos', () => {
    iniciarLogin({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const form = doc.getElementById('formulario-login');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoClave = doc.getElementById('clave');

    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoClave.classList.contains('is-invalid')).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
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

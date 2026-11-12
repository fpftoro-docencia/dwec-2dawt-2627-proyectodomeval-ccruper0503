import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarRegistro } from '../../js/paginas/registro.js';
import { iniciarSesion, CLAVE_ALMACEN_SESION } from '../../js/sesion.js';
import { CLAVE_ALMACEN_USUARIOS } from '../../js/usuarios.js';

describe('Controlador de Registro (S1-06 / S1-09)', () => {
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
      <form id="formulario-registro">
        <input id="nombre-usuario" name="nombreUsuario" />
        <div id="error-usuario" class="invalid-feedback"></div>

        <input id="correo" name="correo" type="email" />
        <div id="error-correo" class="invalid-feedback"></div>

        <input id="clave" name="clave" type="password" />
        <div id="error-clave" class="invalid-feedback"></div>

        <input id="repetir-clave" name="repetirClave" type="password" />
        <div id="error-repetir-clave" class="invalid-feedback"></div>

        <input id="terminos" name="terminos" type="checkbox" />
        <div id="error-terminos" class="invalid-feedback"></div>

        <span id="req-longitud"></span>
        <span id="req-minuscula"></span>
        <span id="req-mayuscula"></span>
        <span id="req-cifra"></span>

        <button id="btn-registro" type="submit">Crear cuenta</button>
      </form>
    `;
    doc = document;
  });

  it('permite acceder al formulario de registro aunque haya sesión iniciada (p. ej. administrador)', () => {
    iniciarSesion({ nombreUsuario: 'admin', rol: 'administrador' }, almacenSesion);

    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    expect(navegar).not.toHaveBeenCalled();
  });

  it('si un administrador registra otro usuario, mantiene la sesión de admin y redirige a usuarios.html', async () => {
    iniciarSesion({ nombreUsuario: 'admin', rol: 'administrador' }, almacenSesion);

    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoCorreo = doc.getElementById('correo');
    const campoClave = doc.getElementById('clave');
    const campoRepetir = doc.getElementById('repetir-clave');
    const campoTerminos = doc.getElementById('terminos');
    const form = doc.getElementById('formulario-registro');

    campoUsuario.value = 'nuevo_atleta';
    campoCorreo.value = 'atleta@sportlog.es';
    campoClave.value = 'Deporte2026';
    campoRepetir.value = 'Deporte2026';
    campoTerminos.checked = true;

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(navegar).toHaveBeenCalledWith('usuarios.html');

    const sesion = JSON.parse(almacenSesion.getItem(CLAVE_ALMACEN_SESION));
    expect(sesion.nombreUsuario).toBe('admin');
    expect(sesion.rol).toBe('administrador');
  });

  it('actualiza dinámicamente las clases de requisitos de contraseña al teclear', () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoClave = doc.getElementById('clave');
    const reqLong = doc.getElementById('req-longitud');
    const reqMin = doc.getElementById('req-minuscula');
    const reqMay = doc.getElementById('req-mayuscula');
    const reqCifra = doc.getElementById('req-cifra');

    // Inicialmente ninguno cumplido
    expect(reqLong.classList.contains('cumplido')).toBe(false);

    // Escribimos una minúscula
    campoClave.value = 'a';
    campoClave.dispatchEvent(new Event('input'));
    expect(reqMin.classList.contains('cumplido')).toBe(true);
    expect(reqMay.classList.contains('cumplido')).toBe(false);

    // Añadimos mayúscula
    campoClave.value = 'aB';
    campoClave.dispatchEvent(new Event('input'));
    expect(reqMay.classList.contains('cumplido')).toBe(true);

    // Añadimos número (cifra)
    campoClave.value = 'aB3';
    campoClave.dispatchEvent(new Event('input'));
    expect(reqCifra.classList.contains('cumplido')).toBe(true);
    expect(reqLong.classList.contains('cumplido')).toBe(false);

    // Completamos 8 caracteres
    campoClave.value = 'aB345678';
    campoClave.dispatchEvent(new Event('input'));
    expect(reqLong.classList.contains('cumplido')).toBe(true);
  });

  it('valida campos en el envío y muestra errores si son incorrectos', () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const form = doc.getElementById('formulario-registro');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoCorreo = doc.getElementById('correo');
    const campoClave = doc.getElementById('clave');
    const campoRepetir = doc.getElementById('repetir-clave');
    const campoTerminos = doc.getElementById('terminos');

    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoCorreo.classList.contains('is-invalid')).toBe(true);
    expect(campoClave.classList.contains('is-invalid')).toBe(true);
    expect(campoRepetir.classList.contains('is-invalid')).toBe(true);
    expect(campoTerminos.classList.contains('is-invalid')).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
  });

  it('registra correctamente un nuevo usuario, inicia sesión y redirige a listado.html', async () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoCorreo = doc.getElementById('correo');
    const campoClave = doc.getElementById('clave');
    const campoRepetir = doc.getElementById('repetir-clave');
    const campoTerminos = doc.getElementById('terminos');
    const form = doc.getElementById('formulario-registro');

    campoUsuario.value = 'nuevo_atleta';
    campoCorreo.value = 'atleta@sportlog.es';
    campoClave.value = 'Deporte2026';
    campoRepetir.value = 'Deporte2026';
    campoTerminos.checked = true;

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(navegar).toHaveBeenCalledWith('listado.html');

    // Verificar sesión iniciada
    const sesion = JSON.parse(almacenSesion.getItem(CLAVE_ALMACEN_SESION));
    expect(sesion.nombreUsuario).toBe('nuevo_atleta');

    // Verificar usuario guardado en almacenamiento de usuarios
    const usuarios = JSON.parse(almacenUsuarios.getItem(CLAVE_ALMACEN_USUARIOS));
    expect(usuarios).toHaveLength(1);
    expect(usuarios[0].nombreUsuario).toBe('nuevo_atleta');
  });

  it('bloquea envíos concurrentes mientras se computa el resumen SHA-256', async () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoCorreo = doc.getElementById('correo');
    const campoClave = doc.getElementById('clave');
    const campoRepetir = doc.getElementById('repetir-clave');
    const campoTerminos = doc.getElementById('terminos');
    const form = doc.getElementById('formulario-registro');
    const botonRegistro = doc.getElementById('btn-registro');

    campoUsuario.value = 'maratoniano';
    campoCorreo.value = 'maraton@sportlog.es';
    campoClave.value = 'Maraton2026';
    campoRepetir.value = 'Maraton2026';
    campoTerminos.checked = true;

    // Primer envío
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(botonRegistro.disabled).toBe(true);

    // Segundo envío concurrente inmediato
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(navegar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith('listado.html');
  });
});

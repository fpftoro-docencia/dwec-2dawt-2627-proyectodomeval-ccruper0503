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
      <form id="formulario-registro" novalidate>
        <input id="nombre-usuario" name="nombreUsuario" data-validar="nombreUsuario" aria-describedby="error-usuario" required />
        <div id="error-usuario" class="invalid-feedback"></div>

        <input id="correo" name="correo" type="email" data-validar="correo" aria-describedby="error-correo" required />
        <div id="error-correo" class="invalid-feedback"></div>

        <input id="clave" name="clave" type="password" data-validar="clave" aria-describedby="error-clave" required />
        <div id="error-clave" class="invalid-feedback"></div>

        <input id="repetir-clave" name="repetirClave" type="password" data-validar="repetirClave" data-depende-de="clave" aria-describedby="error-repetir-clave" required />
        <div id="error-repetir-clave" class="invalid-feedback"></div>

        <input id="terminos" name="terminos" type="checkbox" data-validar="terminos" aria-describedby="error-terminos" required />
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

  it('valida cada campo al salir (blur) y desde entonces en cada input, incluyendo unicidad de usuario', () => {
    almacenUsuarios.setItem(
      CLAVE_ALMACEN_USUARIOS,
      JSON.stringify([{ nombreUsuario: 'atleta_ocupado', correo: 'x@sportlog.es' }]),
    );

    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const errorUsuario = doc.getElementById('error-usuario');

    // Antes del primer blur, escribir no muestra error todavía
    campoUsuario.value = 'ab';
    campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);
    expect(campoUsuario.hasAttribute('aria-invalid')).toBe(false);

    // Al salir (blur), se valida por primera vez y marca error
    campoUsuario.dispatchEvent(new Event('blur'));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('true');
    expect(errorUsuario.classList.contains('d-block')).toBe(true);
    expect(errorUsuario.textContent).not.toBe('');

    // Desde entonces revalida en input: si el nombre ya existe, muestra error de unicidad
    campoUsuario.value = 'atleta_ocupado';
    campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(true);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('true');
    expect(errorUsuario.textContent).toContain('ocupado');

    // Al corregir con un nombre válido y libre, limpia el error en input
    campoUsuario.value = 'atleta_libre';
    campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoUsuario.classList.contains('is-invalid')).toBe(false);
    expect(campoUsuario.getAttribute('aria-invalid')).toBe('false');
    expect(errorUsuario.classList.contains('d-block')).toBe(false);
    expect(errorUsuario.textContent).toBe('');
  });

  it('revalida repetir-clave automáticamente cuando cambia clave', () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoClave = doc.getElementById('clave');
    const campoRepetir = doc.getElementById('repetir-clave');
    const errorRepetir = doc.getElementById('error-repetir-clave');

    campoClave.value = 'Deporte2026';
    campoClave.dispatchEvent(new Event('input', { bubbles: true }));
    campoClave.dispatchEvent(new Event('blur'));

    campoRepetir.value = 'Deporte2026';
    campoRepetir.dispatchEvent(new Event('blur'));
    expect(campoRepetir.classList.contains('is-invalid')).toBe(false);
    expect(campoRepetir.getAttribute('aria-invalid')).toBe('false');

    // Al modificar la contraseña principal, repetir-clave se revalida y pasa a ser inválido
    campoClave.value = 'Deporte2027';
    campoClave.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoRepetir.classList.contains('is-invalid')).toBe(true);
    expect(campoRepetir.getAttribute('aria-invalid')).toBe('true');
    expect(errorRepetir.classList.contains('d-block')).toBe(true);
    expect(errorRepetir.textContent).not.toBe('');

    // Al volver a hacerlas coincidir desde clave, repetir-clave vuelve a ser válido
    campoClave.value = 'Deporte2026';
    campoClave.dispatchEvent(new Event('input', { bubbles: true }));
    expect(campoRepetir.classList.contains('is-invalid')).toBe(false);
    expect(campoRepetir.getAttribute('aria-invalid')).toBe('false');
    expect(errorRepetir.textContent).toBe('');
  });

  it('al enviar con errores enfoca el primer campo inválido, marca aria-invalid y muestra aviso', () => {
    iniciarRegistro({
      documento: doc,
      almacenUsuarios,
      almacenSesion,
      navegar,
    });

    const campoUsuario = doc.getElementById('nombre-usuario');
    const campoCorreo = doc.getElementById('correo');
    const form = doc.getElementById('formulario-registro');
    const contenedorAvisos = doc.getElementById('contenedor-avisos');

    // Usuario válido, correo inválido -> el foco debe ir al correo
    campoUsuario.value = 'atleta_valido';
    campoCorreo.value = 'correo-invalido';

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(campoUsuario.getAttribute('aria-invalid')).toBe('false');
    expect(campoCorreo.classList.contains('is-invalid')).toBe(true);
    expect(campoCorreo.getAttribute('aria-invalid')).toBe('true');
    expect(doc.activeElement).toBe(campoCorreo);
    expect(contenedorAvisos.textContent).toContain(
      'Por favor, corrige los errores del formulario.',
    );
    expect(navegar).not.toHaveBeenCalled();
  });
});

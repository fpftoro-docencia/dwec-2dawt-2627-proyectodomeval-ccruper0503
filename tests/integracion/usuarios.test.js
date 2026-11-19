import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarUsuarios } from '../../js/paginas/usuarios.js';
import { iniciarSesion } from '../../js/sesion.js';
import {
  guardarUsuarios,
  obtenerUsuarios,
  ROL_ADMINISTRADOR,
  ROL_USUARIO,
} from '../../js/usuarios.js';

describe('Integración: usuarios.html (protección por rol y administración)', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;
  let ubicacion;
  let historia;

  beforeEach(() => {
    cargarPagina('usuarios.html');
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();
    ubicacion = {
      href: 'http://localhost:3901/usuarios.html',
      search: '',
    };
    historia = {
      replaceState: vi.fn(),
    };

    guardarUsuarios(
      [
        {
          nombreUsuario: 'admin1',
          correo: 'admin@sportlog.es',
          clave: 'hash',
          rol: ROL_ADMINISTRADOR,
          creadoEn: '2026-11-10T10:00:00.000Z',
        },
        {
          nombreUsuario: 'deportista1',
          correo: 'deportista@sportlog.es',
          clave: 'hash',
          rol: ROL_USUARIO,
          creadoEn: '2026-11-11T10:00:00.000Z',
        },
      ],
      almacenUsuarios,
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('expulsa con aviso de error a un usuario estándar que intenta cargar usuarios.html', () => {
    iniciarSesion({ nombreUsuario: 'deportista1', rol: ROL_USUARIO }, almacenSesion);

    iniciarUsuarios({
      documento: document,
      almacenUsuarios,
      almacenSesion,
      navegar,
      ubicacion,
      historia,
    });

    expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
    const aviso = JSON.parse(almacenSesion.getItem('sportlog_aviso_pendiente'));
    expect(aviso).toEqual({
      mensaje: 'Acceso denegado: se requieren permisos de administrador.',
      tipo: 'danger',
    });
    expect(document.getElementById('cuerpo-tabla-usuarios').children).toHaveLength(0);
  });

  it('redirige a index.html cuando no hay sesión activa', () => {
    iniciarUsuarios({
      documento: document,
      almacenUsuarios,
      almacenSesion,
      navegar,
      ubicacion,
      historia,
    });

    expect(navegar).toHaveBeenCalledExactlyOnceWith('index.html');
  });

  it('permite al administrador ver el listado, bloquea su propio botón y cambia el rol de otro usuario', () => {
    iniciarSesion({ nombreUsuario: 'admin1', rol: ROL_ADMINISTRADOR }, almacenSesion);

    iniciarUsuarios({
      documento: document,
      almacenUsuarios,
      almacenSesion,
      navegar,
      ubicacion,
      historia,
    });

    expect(navegar).not.toHaveBeenCalled();

    const filas = document.querySelectorAll('#cuerpo-tabla-usuarios tr');
    expect(filas).toHaveLength(2);

    const botonAdmin = filas[0].querySelector('.boton-accion-rol');
    const motivoAdmin = filas[0].querySelector('.usuario-motivo-bloqueo');
    expect(botonAdmin.disabled).toBe(true);
    expect(motivoAdmin.hidden).toBe(false);

    // Cambiar el rol del segundo usuario mediante el diálogo nativo
    const botonDeportista = filas[1].querySelector('.boton-accion-rol');
    expect(botonDeportista.disabled).toBe(false);
    botonDeportista.click();

    const dialogo = document.getElementById('dialogo-confirmar-rol');
    expect(dialogo.hasAttribute('open')).toBe(true);
    document.getElementById('btn-confirmar-rol').click();

    const actualizados = obtenerUsuarios(almacenUsuarios);
    expect(actualizados[1].rol).toBe(ROL_ADMINISTRADOR);
    expect(document.getElementById('contenedor-avisos').textContent).toContain(
      'Rol de deportista1 actualizado a administrador.',
    );
  });
});

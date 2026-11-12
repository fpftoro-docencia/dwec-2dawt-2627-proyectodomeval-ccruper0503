import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerSesion,
  iniciarSesion,
  cerrarSesion,
  haySesion,
  esAdministrador,
  protegerPaginaPrivada,
  protegerPaginaAdmin,
  configurarCabeceraPrivada,
  CLAVE_ALMACEN_SESION,
} from '../../js/sesion.js';

describe('Módulo de sesión y control de acceso (S1-05)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('Gestión básica de sesión y resiliencia', () => {
    it('devuelve null y haySesion es false si no hay sesión iniciada', () => {
      expect(obtenerSesion(almacen)).toBeNull();
      expect(haySesion(almacen)).toBe(false);
    });

    it('inicia sesión guardando usuario y rol en el almacenamiento', () => {
      iniciarSesion({ nombreUsuario: 'carlos', rol: 'usuario' }, almacen);

      expect(haySesion(almacen)).toBe(true);
      expect(obtenerSesion(almacen)).toEqual({ nombreUsuario: 'carlos', rol: 'usuario' });
      expect(esAdministrador(almacen)).toBe(false);
    });

    it('identifica correctamente cuando la sesión activa es de administrador', () => {
      iniciarSesion({ nombreUsuario: 'admin', rol: 'administrador' }, almacen);

      expect(haySesion(almacen)).toBe(true);
      expect(esAdministrador(almacen)).toBe(true);
    });

    it('cierra la sesión eliminando los datos del almacenamiento', () => {
      iniciarSesion({ nombreUsuario: 'carlos', rol: 'usuario' }, almacen);
      cerrarSesion(almacen);

      expect(haySesion(almacen)).toBe(false);
      expect(obtenerSesion(almacen)).toBeNull();
    });

    it('devuelve null de forma segura ante JSON corrupto en el almacenamiento', () => {
      almacen.setItem(CLAVE_ALMACEN_SESION, '{json_roto_invalido}');

      expect(obtenerSesion(almacen)).toBeNull();
      expect(haySesion(almacen)).toBe(false);
    });
  });

  describe('Control de acceso y protección de páginas', () => {
    it('protegerPaginaPrivada redirige a index.html si no hay sesión iniciada', () => {
      const navegar = vi.fn();
      const permitido = protegerPaginaPrivada(almacen, navegar);

      expect(permitido).toBe(false);
      expect(navegar).toHaveBeenCalledWith('index.html');
    });

    it('protegerPaginaPrivada permite el acceso si hay sesión activa', () => {
      iniciarSesion({ nombreUsuario: 'atleta', rol: 'usuario' }, almacen);
      const navegar = vi.fn();
      const permitido = protegerPaginaPrivada(almacen, navegar);

      expect(permitido).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('protegerPaginaAdmin redirige a index.html si no hay sesión iniciada', () => {
      const navegar = vi.fn();
      const permitido = protegerPaginaAdmin(almacen, navegar);

      expect(permitido).toBe(false);
      expect(navegar).toHaveBeenCalledWith('index.html');
    });

    it('protegerPaginaAdmin redirige a listado.html y deja aviso si el rol es usuario normal', () => {
      iniciarSesion({ nombreUsuario: 'atleta', rol: 'usuario' }, almacen);
      const navegar = vi.fn();
      const permitido = protegerPaginaAdmin(almacen, navegar);

      expect(permitido).toBe(false);
      expect(navegar).toHaveBeenCalledWith('listado.html');

      // Verifica que dejó guardado el aviso de acceso denegado
      const avisoPendiente = JSON.parse(almacen.getItem('sportlog_aviso_pendiente') || '{}');
      expect(avisoPendiente.tipo).toBe('danger');
      expect(avisoPendiente.mensaje).toContain('permisos de administrador');
    });

    it('protegerPaginaAdmin permite el acceso si la sesión es de administrador', () => {
      iniciarSesion({ nombreUsuario: 'admin', rol: 'administrador' }, almacen);
      const navegar = vi.fn();
      const permitido = protegerPaginaAdmin(almacen, navegar);

      expect(permitido).toBe(true);
      expect(navegar).not.toHaveBeenCalled();
    });
  });

  describe('Configuración visual de la cabecera privada', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="sesion-avatar"></div>
        <div id="sesion-usuario"></div>
        <div id="sesion-rol"></div>
        <li id="menu-usuarios" hidden></li>
        <button id="btn-cerrar-sesion"></button>
      `;
    });

    it('muestra los datos del usuario y mantiene oculto Usuarios si es usuario normal', () => {
      iniciarSesion({ nombreUsuario: 'lucas', rol: 'usuario' }, almacen);
      configurarCabeceraPrivada(document, almacen);

      expect(document.getElementById('sesion-usuario')?.textContent).toBe('lucas');
      expect(document.getElementById('sesion-rol')?.textContent).toBe('usuario');
      expect(document.getElementById('sesion-avatar')?.textContent).toBe('L');
      expect(document.getElementById('menu-usuarios')?.hidden).toBe(true);
    });

    it('desoculta el menú Usuarios si el usuario es administrador', () => {
      iniciarSesion({ nombreUsuario: 'jefa', rol: 'administrador' }, almacen);
      configurarCabeceraPrivada(document, almacen);

      expect(document.getElementById('menu-usuarios')?.hidden).toBe(false);
    });

    it('al pulsar Cerrar sesión, limpia la sesión y redirige a index.html', () => {
      iniciarSesion({ nombreUsuario: 'lucas', rol: 'usuario' }, almacen);
      const navegar = vi.fn();
      configurarCabeceraPrivada(document, almacen, navegar);

      const botonCerrar = document.getElementById('btn-cerrar-sesion');
      botonCerrar?.click();

      expect(haySesion(almacen)).toBe(false);
      expect(navegar).toHaveBeenCalledWith('index.html');
      expect(almacen.getItem('sportlog_aviso_pendiente')).toContain('cerrado sesión');
    });
  });
});

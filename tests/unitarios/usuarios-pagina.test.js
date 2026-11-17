import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarUsuarios, filtrarUsuarios, normalizarTexto } from '../../js/paginas/usuarios.js';
import { iniciarSesion } from '../../js/sesion.js';
import {
  guardarUsuarios,
  obtenerUsuarios,
  ROL_ADMINISTRADOR,
  ROL_USUARIO,
} from '../../js/usuarios.js';

/**
 * Construye el DOM mínimo necesario de usuarios.html para los tests unitarios.
 */
function prepararDomUsuarios() {
  document.body.innerHTML = `
    <header>
      <li id="menu-usuarios" hidden></li>
      <span id="sesion-avatar"></span>
      <strong id="sesion-usuario"></strong>
      <span id="sesion-rol"></span>
      <button id="btn-cerrar-sesion" type="button">Cerrar sesión</button>
    </header>
    <main>
      <div id="contenedor-avisos" role="status" aria-live="polite"></div>

      <span id="kpi-total-usuarios">0</span>
      <span id="kpi-admins-usuarios">0</span>

      <input type="search" id="campo-buscar-usuarios" aria-label="Buscar usuarios" />

      <div id="filtros-rol-usuarios" role="group">
        <button type="button" class="pill-filtro activo" data-filtro="todos" aria-pressed="true">Todos (0)</button>
        <button type="button" class="pill-filtro" data-filtro="administrador" aria-pressed="false">Admins (0)</button>
        <button type="button" class="pill-filtro" data-filtro="usuario" aria-pressed="false">Deportistas (0)</button>
      </div>

      <span id="contador-usuarios">Mostrando 0 deportistas</span>

      <table>
        <tbody id="cuerpo-tabla-usuarios"></tbody>
      </table>

      <section id="panel-vacio-usuarios" hidden>
        <h2>No hay usuarios que coincidan con la búsqueda</h2>
      </section>

      <nav id="paginacion-usuarios" hidden>
        <div id="resumen-paginacion-usuarios"></div>
        <ul class="paginacion-lista" id="lista-paginacion-usuarios"></ul>
      </nav>

      <dialog id="dialogo-confirmar-rol" class="dialogo-modal">
        <h2 id="dialogo-rol-titulo">Confirmar cambio de rol</h2>
        <p id="dialogo-rol-descripcion"></p>
        <button type="button" id="btn-cancelar-rol">Cancelar</button>
        <button type="button" id="btn-confirmar-rol">Confirmar cambio</button>
      </dialog>

      <template id="plantilla-fila-usuario">
        <table>
          <tbody>
            <tr>
              <td>
                <div class="usuario-celda">
                  <div class="usuario-avatar-chico"></div>
                  <div>
                    <div class="usuario-nombre"></div>
                    <div class="usuario-tag"></div>
                  </div>
                </div>
              </td>
              <td class="usuario-correo"></td>
              <td><span class="badge-rol"></span></td>
              <td class="usuario-fecha"></td>
              <td>
                <div class="usuario-acciones">
                  <button type="button" class="boton-accion-rol"></button>
                  <span class="usuario-motivo-bloqueo" hidden></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </main>
  `;
}

describe('Controlador de Administración de Usuarios (S2-08 / Requisitos 7, 16, 18)', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;
  let historia;
  let ubicacion;

  beforeEach(() => {
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();
    historia = { replaceState: vi.fn() };
    ubicacion = {
      href: 'http://localhost:3901/usuarios.html',
      search: '',
    };
    prepararDomUsuarios();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Funciones puras de normalización y filtrado', () => {
    it('normaliza texto eliminando tildes y mayúsculas', () => {
      expect(normalizarTexto('  Ángel Pérez  ')).toBe('angel perez');
      expect(normalizarTexto(null)).toBe('');
    });

    it('filtra usuarios por término (nombre o correo) sin distinguir tildes y por rol', () => {
      const lista = [
        { nombreUsuario: 'Ángel', correo: 'angel@sportlog.test', rol: ROL_ADMINISTRADOR },
        { nombreUsuario: 'Lucía', correo: 'lucia@sportlog.test', rol: ROL_USUARIO },
        { nombreUsuario: 'Mateo', correo: 'mateo@correo.test', rol: ROL_USUARIO },
      ];

      expect(filtrarUsuarios(lista, { termino: 'angel' })).toHaveLength(1);
      expect(filtrarUsuarios(lista, { termino: 'LUCIA' })).toHaveLength(1);
      expect(filtrarUsuarios(lista, { termino: 'sportlog', filtroRol: ROL_USUARIO })).toHaveLength(
        1,
      );
      expect(filtrarUsuarios(lista, { filtroRol: ROL_ADMINISTRADOR })).toHaveLength(1);
    });
  });

  describe('Control de acceso estricto (protegerPaginaAdmin)', () => {
    it('redirige a index.html si no hay sesión activa', () => {
      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      expect(navegar).toHaveBeenCalledWith('index.html');
    });

    it('redirige a listado.html con aviso si el usuario no es administrador', () => {
      iniciarSesion({ nombreUsuario: 'atleta1', rol: ROL_USUARIO }, almacenSesion);

      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      expect(navegar).toHaveBeenCalledWith('listado.html');
      expect(almacenSesion.getItem('sportlog_aviso_pendiente')).toContain('Acceso denegado');
    });
  });

  describe('Flujos de administración con sesión de administrador', () => {
    beforeEach(() => {
      iniciarSesion({ nombreUsuario: 'admin_principal', rol: ROL_ADMINISTRADOR }, almacenSesion);
      guardarUsuarios(
        [
          {
            nombreUsuario: 'admin_principal',
            correo: 'admin@sportlog.test',
            clave: 'hash',
            rol: ROL_ADMINISTRADOR,
            creadoEn: '2026-11-10T10:00:00.000Z',
          },
          {
            nombreUsuario: 'carla_run',
            correo: 'carla@sportlog.test',
            clave: 'hash',
            rol: ROL_USUARIO,
            creadoEn: '2026-11-11T10:00:00.000Z',
          },
          {
            nombreUsuario: 'diego_bici',
            correo: 'diego@sportlog.test',
            clave: 'hash',
            rol: ROL_ADMINISTRADOR,
            creadoEn: '2026-11-12T10:00:00.000Z',
          },
        ],
        almacenUsuarios,
      );
    });

    it('renderiza usuarios desde <template>, actualiza KPIs y evita XSS en datos', () => {
      const listaConXss = [
        ...obtenerUsuarios(almacenUsuarios),
        {
          nombreUsuario: '<img src=x onerror=alert(1)>',
          correo: '<script>evil()</script>',
          clave: 'hash',
          rol: ROL_USUARIO,
          creadoEn: '2026-11-13T10:00:00.000Z',
        },
      ];
      guardarUsuarios(listaConXss, almacenUsuarios);

      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      expect(document.getElementById('kpi-total-usuarios').textContent).toBe('4');
      expect(document.getElementById('kpi-admins-usuarios').textContent).toBe('2');
      expect(document.getElementById('contador-usuarios').textContent).toBe(
        'Mostrando 4 deportistas',
      );

      const filas = document.querySelectorAll('#cuerpo-tabla-usuarios tr');
      expect(filas).toHaveLength(4);
      expect(filas[3].querySelector('.usuario-nombre').textContent).toBe(
        '<img src=x onerror=alert(1)>',
      );
      expect(filas[3].querySelector('img')).toBeNull();
      expect(filas[3].querySelector('script')).toBeNull();
    });

    it('desactiva el botón del administrador actual y explica el motivo accesible', () => {
      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      const primeraFila = document.querySelector('#cuerpo-tabla-usuarios tr');
      const botonPropio = primeraFila.querySelector('.boton-accion-rol');
      const motivo = primeraFila.querySelector('.usuario-motivo-bloqueo');

      expect(botonPropio.disabled).toBe(true);
      expect(botonPropio.title).toContain('No puedes quitarte el rol');
      expect(motivo.hidden).toBe(false);
      expect(motivo.textContent).toContain('no puedes quitarte el rol');
      expect(botonPropio.getAttribute('aria-describedby')).toBe(motivo.id);

      botonPropio.click();
      const adminGuardado = obtenerUsuarios(almacenUsuarios).find(
        (u) => u.nombreUsuario === 'admin_principal',
      );
      expect(adminGuardado.rol).toBe(ROL_ADMINISTRADOR);
    });

    it('permite promover y degradar a otros usuarios previa confirmación en <dialog> y lanza aviso', () => {
      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      const dialogo = document.getElementById('dialogo-confirmar-rol');
      const filas = document.querySelectorAll('#cuerpo-tabla-usuarios tr');
      const botonCarla = filas[1].querySelector('.boton-accion-rol');

      // 1. Abrir diálogo y cancelar -> no cambia el rol
      botonCarla.click();
      expect(dialogo.hasAttribute('open') || dialogo.open).toBe(true);
      expect(document.getElementById('dialogo-rol-descripcion').textContent).toContain('carla_run');

      document.getElementById('btn-cancelar-rol').click();
      expect(
        obtenerUsuarios(almacenUsuarios).find((u) => u.nombreUsuario === 'carla_run').rol,
      ).toBe(ROL_USUARIO);

      // 2. Abrir diálogo y confirmar -> promueve a administrador
      botonCarla.click();
      document.getElementById('btn-confirmar-rol').click();

      expect(
        obtenerUsuarios(almacenUsuarios).find((u) => u.nombreUsuario === 'carla_run').rol,
      ).toBe(ROL_ADMINISTRADOR);
      expect(document.getElementById('kpi-admins-usuarios').textContent).toBe('3');
      expect(document.getElementById('contenedor-avisos').textContent).toContain(
        'Rol de carla_run actualizado a administrador',
      );

      // 3. Degradar de nuevo a carla_run
      const botonCarlaActualizado = document
        .querySelectorAll('#cuerpo-tabla-usuarios tr')[1]
        .querySelector('.boton-accion-rol');
      botonCarlaActualizado.click();
      document.getElementById('btn-confirmar-rol').click();

      expect(
        obtenerUsuarios(almacenUsuarios).find((u) => u.nombreUsuario === 'carla_run').rol,
      ).toBe(ROL_USUARIO);
      expect(document.getElementById('kpi-admins-usuarios').textContent).toBe('2');
    });

    it('filtra con buscador con debounce (sin tildes ni mayúsculas) y muestra panel vacío', () => {
      vi.useFakeTimers();

      const lista = [
        ...obtenerUsuarios(almacenUsuarios),
        {
          nombreUsuario: 'Mónica_Atleta',
          correo: 'monica@sportlog.test',
          clave: 'hash',
          rol: ROL_USUARIO,
        },
      ];
      guardarUsuarios(lista, almacenUsuarios);

      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
        retrasoDebounce: 200,
      });

      const buscador = document.getElementById('campo-buscar-usuarios');
      buscador.value = 'monica';
      buscador.dispatchEvent(new Event('input'));

      // Antes del debounce sigue mostrando los 4
      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')).toHaveLength(4);

      vi.advanceTimersByTime(200);

      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')).toHaveLength(1);
      expect(document.querySelector('.usuario-nombre').textContent).toBe('Mónica_Atleta');
      expect(historia.replaceState).toHaveBeenCalled();

      // Búsqueda sin resultados
      buscador.value = 'inexistente_xyz';
      buscador.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')).toHaveLength(0);
      expect(document.getElementById('panel-vacio-usuarios').hidden).toBe(false);
      expect(document.getElementById('paginacion-usuarios').hidden).toBe(true);
    });

    it('filtra por rol al pulsar los botones pill y actualiza aria-pressed', () => {
      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
      });

      const pillUsuarios = document.querySelector('[data-filtro="usuario"]');
      pillUsuarios.click();

      expect(pillUsuarios.classList.contains('activo')).toBe(true);
      expect(pillUsuarios.getAttribute('aria-pressed')).toBe('true');
      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')).toHaveLength(1);
      expect(document.querySelector('.usuario-nombre').textContent).toBe('carla_run');
    });

    it('pagina resultados, sincroniza ?pagina= en la URL y vuelve a página 1 al buscar', () => {
      vi.useFakeTimers();

      const muchos = [];
      for (let i = 1; i <= 5; i++) {
        muchos.push({
          nombreUsuario: i === 1 ? 'admin_principal' : `deportista_${i}`,
          correo: `u${i}@sportlog.test`,
          clave: 'hash',
          rol: i === 1 ? ROL_ADMINISTRADOR : ROL_USUARIO,
        });
      }
      guardarUsuarios(muchos, almacenUsuarios);

      iniciarUsuarios({
        documento: document,
        almacenUsuarios,
        almacenSesion,
        navegar,
        ubicacion,
        historia,
        porPagina: 2,
        retrasoDebounce: 100,
      });

      // Página 1 de 3 (2 elementos)
      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')).toHaveLength(2);
      expect(document.getElementById('resumen-paginacion-usuarios').textContent).toContain(
        'Página 1 de 3',
      );
      expect(document.querySelector('[aria-current="page"]').textContent).toBe('1');

      // Pulsar "Siguiente" -> Página 2
      document.querySelector('[data-accion="siguiente"]').click();
      expect(historia.replaceState).toHaveBeenLastCalledWith(
        {},
        '',
        'http://localhost:3901/usuarios.html?pagina=2',
      );
      expect(document.getElementById('resumen-paginacion-usuarios').textContent).toContain(
        'Página 2 de 3',
      );
      expect(document.querySelectorAll('#cuerpo-tabla-usuarios tr')[0].textContent).toContain(
        'deportista_3',
      );

      // Al buscar, vuelve a página 1
      const buscador = document.getElementById('campo-buscar-usuarios');
      buscador.value = 'deportista';
      buscador.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(100);

      expect(historia.replaceState).toHaveBeenLastCalledWith(
        {},
        '',
        'http://localhost:3901/usuarios.html',
      );
      expect(document.getElementById('resumen-paginacion-usuarios').textContent).toContain(
        'Página 1 de 2',
      );
    });
  });
});

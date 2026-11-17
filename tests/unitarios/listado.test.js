import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  iniciarListado,
  normalizarTexto,
  formatearDuracion,
  ordenarEntrenamientos,
  filtrarEntrenamientos,
  calcularKpis,
} from '../../js/paginas/listado.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearEntrenamiento, obtenerEntrenamientos } from '../../js/entrenamientos.js';

function montarDomListado() {
  document.body.innerHTML = `
    <header>
      <span id="sesion-avatar"></span>
      <strong id="sesion-usuario"></strong>
      <span id="sesion-rol"></span>
      <button id="btn-cerrar-sesion"></button>
      <li id="menu-usuarios" hidden></li>
    </header>
    <main>
      <div id="contenedor-avisos" class="region-avisos" role="status" aria-live="polite"></div>
      <section>
        <span id="kpi-sesiones">0</span>
        <span id="kpi-tiempo">0h 0m</span>
        <span id="kpi-distancia">0.0 <small>km</small></span>
        <span id="kpi-calorias">0 <small>kcal</small></span>
      </section>
      <section>
        <input type="search" id="campo-buscar" />
        <div class="pills-disciplinas" id="filtros-disciplinas">
          <button type="button" class="pill-filtro activo" data-disciplina="todas">Todos (0)</button>
        </div>
        <span id="contador-resultados">Mostrando 0 entrenamientos</span>
      </section>
      <section class="rejilla-entrenamientos" id="contenedor-entrenamientos" hidden></section>
      <section class="panel panel-vacio" id="panel-vacio">
        <h2 id="panel-vacio-titulo">Aún no hay entrenamientos guardados</h2>
        <p id="panel-vacio-texto">Registra tu primera sesión.</p>
      </section>
      <nav id="paginacion-entrenamientos" hidden>
        <div id="resumen-paginacion"></div>
        <ul class="paginacion-lista" id="lista-paginacion"></ul>
      </nav>
      <template id="plantilla-entrenamiento">
        <article class="tarjeta-entrenamiento">
          <div>
            <div class="tarjeta-header">
              <span class="badge-disciplina"></span>
              <span class="tarjeta-fecha"></span>
            </div>
            <h3 class="tarjeta-titulo"></h3>
            <p class="tarjeta-sensaciones"></p>
            <div class="tarjeta-metricas-grid">
              <div class="t-metrica"><span class="distancia-num"></span></div>
              <div class="t-metrica"><span class="duracion-num"></span></div>
              <div class="t-metrica"><span class="ritmo-num"></span></div>
            </div>
          </div>
          <div class="tarjeta-acciones">
            <span class="badge-rpe"></span>
            <a class="enlace-editar">Editar</a>
            <button type="button" class="boton-borrar">Borrar</button>
          </div>
        </article>
      </template>
      <dialog id="dialogo-borrar">
        <h2 id="dialogo-borrar-titulo">¿Eliminar entrenamiento?</h2>
        <p id="dialogo-borrar-nombre" hidden></p>
        <button type="button" id="btn-cancelar-borrado">Cancelar</button>
        <button type="button" id="btn-confirmar-borrado">Sí, eliminar</button>
      </dialog>
    </main>
  `;
}

describe('Controlador de Listado de entrenamientos (S2-07 / Requisitos 15, 16, 20)', () => {
  let almacenSesion;
  let almacenEntrenamientos;
  let navegar;
  let ubicacion;
  let historia;

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    almacenEntrenamientos = new AlmacenFalso();
    navegar = vi.fn();
    ubicacion = {
      href: 'http://localhost/listado.html',
      search: '',
    };
    historia = {
      replaceState: vi.fn((_estado, _titulo, nuevaUrl) => {
        const parsed = new URL(nuevaUrl);
        ubicacion.href = parsed.href;
        ubicacion.search = parsed.search;
      }),
    };
    montarDomListado();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Funciones puras auxiliares', () => {
    it('normaliza texto eliminando tildes y mayúsculas', () => {
      expect(normalizarTexto('  Maratón de Málaga  ')).toBe('maraton de malaga');
      expect(normalizarTexto('NATACIÓN')).toBe('natacion');
    });

    it('formatea duraciones en minutos y horas', () => {
      expect(formatearDuracion(45)).toBe('45 min');
      expect(formatearDuracion(90)).toBe('1h 30m');
      expect(formatearDuracion(0)).toBe('0 min');
    });

    it('calcula los KPIs totales correctamente', () => {
      const kpis = calcularKpis([
        { duracion: 75, distancia: 12.5, calorias: 600 },
        { duracion: 60, distancia: 10, calorias: 500 },
      ]);
      expect(kpis).toEqual({
        totalSesiones: 2,
        horasActivas: 2,
        minutosRestantes: 15,
        distanciaTotal: 22.5,
        caloriasTotales: 1100,
      });
    });

    it('filtra por término sin tildes ni mayúsculas y por disciplina', () => {
      const lista = [
        { titulo: 'Maratón de Sevilla', disciplina: 'running', notas: 'Genial' },
        { titulo: 'Rodaje en bici', disciplina: 'ciclismo', notas: 'Puerto duro' },
      ];
      expect(filtrarEntrenamientos(lista, 'maraton', 'todas')).toHaveLength(1);
      expect(filtrarEntrenamientos(lista, '', 'ciclismo')).toHaveLength(1);
      expect(filtrarEntrenamientos(lista, 'sevilla', 'ciclismo')).toHaveLength(0);
    });

    it('ordena por fecha descendente', () => {
      const ordenados = ordenarEntrenamientos([
        { id: '1', fecha: '2026-11-01' },
        { id: '2', fecha: '2026-11-10' },
      ]);
      expect(ordenados.map((e) => e.id)).toEqual(['2', '1']);
    });
  });

  it('redirige a index.html si no hay sesión iniciada', () => {
    iniciarListado({
      documento: document,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
      ubicacion,
      historia,
    });

    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  describe('Con sesión activa', () => {
    beforeEach(() => {
      iniciarSesion({ nombreUsuario: 'atleta_pro', rol: 'usuario' }, almacenSesion);
    });

    it('muestra el estado vacío y KPIs a cero cuando no hay entrenamientos', () => {
      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
      });

      expect(document.getElementById('panel-vacio').hidden).toBe(false);
      expect(document.getElementById('contenedor-entrenamientos').hidden).toBe(true);
      expect(document.getElementById('kpi-sesiones').textContent).toBe('0');
      expect(document.getElementById('contador-resultados').textContent).toBe(
        'Mostrando 0 entrenamientos',
      );
      expect(document.getElementById('paginacion-entrenamientos').hidden).toBe(true);
    });

    it('renderiza tarjetas desde <template> de forma segura contra XSS, calcula KPIs y aísla por usuario', () => {
      const xssTitulo = '<img src=x onerror=alert(1)> Series 1000m';
      const creado = crearEntrenamiento(
        'atleta_pro',
        {
          titulo: xssTitulo,
          disciplina: 'running',
          fecha: '2026-11-12',
          duracion: 75,
          distancia: 12.5,
          frecuenciaCardiaca: 162,
          calorias: 750,
          esfuerzoRpe: 8,
          notas: 'Muy buenas sensaciones',
        },
        almacenEntrenamientos,
      );
      // Entrenamiento de otro usuario que NO debe verse
      crearEntrenamiento(
        'otro_atleta',
        {
          titulo: 'Sesión ajena',
          disciplina: 'ciclismo',
          fecha: '2026-11-15',
          duracion: 90,
        },
        almacenEntrenamientos,
      );

      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
      });

      const contenedor = document.getElementById('contenedor-entrenamientos');
      const tarjetas = contenedor.querySelectorAll('.tarjeta-entrenamiento');

      expect(contenedor.hidden).toBe(false);
      expect(document.getElementById('panel-vacio').hidden).toBe(true);
      expect(tarjetas).toHaveLength(1);

      const tituloEl = tarjetas[0].querySelector('.tarjeta-titulo');
      expect(tituloEl.textContent).toBe(xssTitulo);
      expect(tituloEl.querySelector('img')).toBeNull();

      expect(tarjetas[0].querySelector('.enlace-editar').getAttribute('href')).toBe(
        `ficha.html?id=${encodeURIComponent(creado.id)}`,
      );
      expect(tarjetas[0].querySelector('.duracion-num').textContent).toBe('1h 15m');
      expect(tarjetas[0].querySelector('.distancia-num').textContent).toBe('12.5 km');
      expect(tarjetas[0].querySelector('.ritmo-num').textContent).toBe('162 ppm');
      expect(document.getElementById('kpi-sesiones').textContent).toBe('1');
      expect(document.getElementById('kpi-tiempo').textContent).toBe('1h 15m');
      expect(document.getElementById('kpi-distancia').textContent).toContain('12.5');
      expect(document.getElementById('kpi-calorias').textContent).toContain('750');
    });

    it('filtra con buscador usando debounce (sin distinguir mayúsculas/tildes) y reinicia a página 1', () => {
      vi.useFakeTimers();

      for (let i = 1; i <= 4; i++) {
        crearEntrenamiento(
          'atleta_pro',
          {
            titulo: i === 1 ? 'Maratón de Valencia' : `Rodaje suave ${i}`,
            disciplina: 'running',
            fecha: `2026-11-0${i}`,
            duracion: 45,
          },
          almacenEntrenamientos,
        );
      }

      ubicacion.href = 'http://localhost/listado.html?pagina=2';
      ubicacion.search = '?pagina=2';

      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
        porPagina: 2,
        retrasoDebounce: 250,
      });

      const campoBuscar = document.getElementById('campo-buscar');
      campoBuscar.value = 'maraton';
      campoBuscar.dispatchEvent(new Event('input'));

      // Antes del debounce sigue mostrando los 2 elementos de la página 2
      expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(2);

      vi.advanceTimersByTime(250);

      // Tras el debounce filtra y reinicia a página 1
      const tarjetas = document.querySelectorAll('.tarjeta-entrenamiento');
      expect(tarjetas).toHaveLength(1);
      expect(tarjetas[0].querySelector('.tarjeta-titulo').textContent).toBe('Maratón de Valencia');
      expect(historia.replaceState).toHaveBeenCalled();
      expect(ubicacion.search).toBe('');
    });

    it('filtra por disciplina mediante delegación en las píldoras', () => {
      crearEntrenamiento(
        'atleta_pro',
        { titulo: 'Carrera 10k', disciplina: 'running', fecha: '2026-11-10', duracion: 50 },
        almacenEntrenamientos,
      );
      crearEntrenamiento(
        'atleta_pro',
        { titulo: 'Piscina 2000m', disciplina: 'natacion', fecha: '2026-11-11', duracion: 45 },
        almacenEntrenamientos,
      );

      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
      });

      const btnNatacion = document.querySelector('.pill-filtro[data-disciplina="natacion"]');
      expect(btnNatacion).not.toBeNull();
      btnNatacion.click();

      const tarjetas = document.querySelectorAll('.tarjeta-entrenamiento');
      expect(tarjetas).toHaveLength(1);
      expect(tarjetas[0].querySelector('.tarjeta-titulo').textContent).toBe('Piscina 2000m');
    });

    it('pagina los resultados, sincroniza ?pagina=X en URL y corrige páginas fuera de límites', () => {
      for (let i = 1; i <= 5; i++) {
        crearEntrenamiento(
          'atleta_pro',
          {
            titulo: `Sesión ${i}`,
            disciplina: 'running',
            fecha: `2026-11-0${i}`,
            duracion: 30,
          },
          almacenEntrenamientos,
        );
      }

      ubicacion.href = 'http://localhost/listado.html?pagina=99';
      ubicacion.search = '?pagina=99';

      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
        porPagina: 2,
      });

      // 5 elementos con porPagina=2 -> 3 páginas; ?pagina=99 se corrige a 3 (1 elemento)
      expect(document.getElementById('paginacion-entrenamientos').hidden).toBe(false);
      expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(1);
      expect(ubicacion.search).toBe('?pagina=3');

      // Pulsar botón de página 2
      const btnPagina2 = document.querySelector('.btn-pagina[data-pagina="2"]');
      btnPagina2.click();
      expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(2);
      expect(ubicacion.search).toBe('?pagina=2');
    });

    it('abre el <dialog> al pulsar Borrar, cancela sin borrar y confirma eliminando con aviso', () => {
      const sesion1 = crearEntrenamiento(
        'atleta_pro',
        { titulo: 'Fartlek 8km', disciplina: 'running', fecha: '2026-11-12', duracion: 40 },
        almacenEntrenamientos,
      );

      const dialogo = document.getElementById('dialogo-borrar');
      const espiaShowModal = vi.fn(() => dialogo.setAttribute('open', ''));
      const espiaClose = vi.fn(() => dialogo.removeAttribute('open'));
      dialogo.showModal = espiaShowModal;
      dialogo.close = espiaClose;

      iniciarListado({
        documento: document,
        almacenSesion,
        almacenEntrenamientos,
        navegar,
        ubicacion,
        historia,
      });

      // 1. Click en Borrar (delegado)
      const btnBorrar = document.querySelector('.boton-borrar');
      btnBorrar.click();

      expect(espiaShowModal).toHaveBeenCalledTimes(1);
      expect(document.getElementById('dialogo-borrar-nombre').textContent).toBe('Fartlek 8km');

      // 2. Cancelar borrado
      document.getElementById('btn-cancelar-borrado').click();
      expect(espiaClose).toHaveBeenCalledTimes(1);
      expect(obtenerEntrenamientos('atleta_pro', almacenEntrenamientos)).toHaveLength(1);

      // 3. Reabrir y confirmar borrado
      document.querySelector('.boton-borrar').click();
      document.getElementById('btn-confirmar-borrado').click();

      expect(obtenerEntrenamientos('atleta_pro', almacenEntrenamientos)).toHaveLength(0);
      expect(sesion1.id).toBeTruthy();
      expect(document.getElementById('panel-vacio').hidden).toBe(false);
      expect(document.getElementById('contenedor-avisos').textContent).toContain(
        'Entrenamiento eliminado correctamente.',
      );
    });
  });
});

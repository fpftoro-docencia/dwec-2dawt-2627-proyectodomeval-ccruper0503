import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarListado, RETRASO_DEBOUNCE_DEFECTO } from '../../js/paginas/listado.js';
import { iniciarSesion } from '../../js/sesion.js';
import { crearEntrenamiento, obtenerEntrenamientos } from '../../js/entrenamientos.js';

describe('Integración: listado.html (búsqueda con debounce, paginación y borrado)', () => {
  let almacenSesion;
  let almacenEntrenamientos;
  let navegar;
  let ubicacion;
  let historia;

  beforeEach(() => {
    cargarPagina('listado.html');
    almacenSesion = new AlmacenFalso();
    almacenEntrenamientos = new AlmacenFalso();
    navegar = vi.fn();
    ubicacion = {
      href: 'http://localhost:3901/listado.html',
      search: '',
    };
    historia = {
      replaceState: vi.fn((_estado, _titulo, nuevaUrl) => {
        const parsed = new URL(nuevaUrl);
        ubicacion.href = parsed.href;
        ubicacion.search = parsed.search;
      }),
    };
    iniciarSesion({ nombreUsuario: 'ana', rol: 'usuario' }, almacenSesion);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function poblarEntrenamientos() {
    const lista = [
      { titulo: 'Maratón de Málaga', disciplina: 'running', fecha: '2026-11-08', duracion: 185 },
      { titulo: 'Series en pista', disciplina: 'running', fecha: '2026-11-07', duracion: 50 },
      { titulo: 'Puerto de montaña', disciplina: 'ciclismo', fecha: '2026-11-06', duracion: 120 },
      { titulo: 'Fuerza tren inferior', disciplina: 'fuerza', fecha: '2026-11-05', duracion: 65 },
      { titulo: 'Natación técnica', disciplina: 'natacion', fecha: '2026-11-04', duracion: 45 },
      { titulo: 'HIIT metabólico', disciplina: 'hiit', fecha: '2026-11-03', duracion: 35 },
      { titulo: 'Trail sierra norte', disciplina: 'trail', fecha: '2026-11-02', duracion: 95 },
      { titulo: 'Rodaje regenerativo', disciplina: 'running', fecha: '2026-11-01', duracion: 40 },
    ];

    lista.forEach((datos) => crearEntrenamiento('ana', datos, almacenEntrenamientos));
  }

  it('filtra tras el debounce con temporizadores falsos (insensible a tildes) y reinicia a página 1', () => {
    vi.useFakeTimers();
    poblarEntrenamientos();

    iniciarListado({
      documento: document,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
      ubicacion,
      historia,
    });

    const campoBuscar = document.getElementById('campo-buscar');
    const contador = document.getElementById('contador-resultados');

    // Estado inicial: 6 tarjetas en página 1 de 8 totales
    expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(6);
    expect(contador.textContent).toBe('Mostrando 6 de 8 entrenamientos');

    // Ir a página 2 antes de buscar
    document.querySelector('#lista-paginacion [data-pagina="2"]').click();
    expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(2);
    expect(ubicacion.search).toBe('?pagina=2');

    // Escribir sin tildes: antes de cumplirse el debounce no debe haberse filtrado
    escribir(campoBuscar, 'malaga');
    vi.advanceTimersByTime(RETRASO_DEBOUNCE_DEFECTO - 1);
    expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(2);

    // Al cumplirse el debounce, filtra y vuelve a la página 1
    vi.advanceTimersByTime(1);
    const tarjetas = document.querySelectorAll('.tarjeta-entrenamiento');
    expect(tarjetas).toHaveLength(1);
    expect(tarjetas[0].querySelector('.tarjeta-titulo').textContent).toBe('Maratón de Málaga');
    expect(contador.textContent).toBe('Mostrando 1 de 1 entrenamiento');
    expect(ubicacion.search).toBe('');
  });

  it('permite cambiar de página desde los controles y sincroniza la URL con replaceState', () => {
    poblarEntrenamientos();

    iniciarListado({
      documento: document,
      almacenSesion,
      almacenEntrenamientos,
      navegar,
      ubicacion,
      historia,
    });

    const listaPaginacion = document.getElementById('lista-paginacion');
    expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(6);
    expect(listaPaginacion.querySelector('[data-pagina="1"]').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(listaPaginacion.querySelector('[data-accion="anterior"]').disabled).toBe(true);

    // Pulsar «Siguiente» para avanzar a página 2
    listaPaginacion.querySelector('[data-accion="siguiente"]').click();

    expect(document.querySelectorAll('.tarjeta-entrenamiento')).toHaveLength(2);
    expect(listaPaginacion.querySelector('[data-pagina="2"]').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(listaPaginacion.querySelector('[data-accion="siguiente"]').disabled).toBe(true);
    expect(historia.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'http://localhost:3901/listado.html?pagina=2',
    );
  });

  it('pide confirmación en <dialog> al pulsar Borrar y elimina solo si se confirma', () => {
    crearEntrenamiento(
      'ana',
      { titulo: 'Sesión para borrar', disciplina: 'running', fecha: '2026-11-10', duracion: 45 },
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

    const dialogo = document.getElementById('dialogo-borrar');
    const btnCancelar = document.getElementById('btn-cancelar-borrado');
    const btnConfirmar = document.getElementById('btn-confirmar-borrado');
    const contenedorAvisos = document.getElementById('contenedor-avisos');

    // Abrir diálogo y cancelar: el registro sigue intacto
    document.querySelector('.boton-borrar').click();
    expect(dialogo.hasAttribute('open')).toBe(true);
    btnCancelar.click();
    expect(dialogo.hasAttribute('open')).toBe(false);
    expect(obtenerEntrenamientos('ana', almacenEntrenamientos)).toHaveLength(1);

    // Abrir de nuevo y confirmar: se elimina y emite aviso
    document.querySelector('.boton-borrar').click();
    btnConfirmar.click();
    expect(dialogo.hasAttribute('open')).toBe(false);
    expect(obtenerEntrenamientos('ana', almacenEntrenamientos)).toHaveLength(0);
    expect(document.getElementById('panel-vacio').hidden).toBe(false);
    expect(contenedorAvisos.textContent).toContain('Entrenamiento eliminado correctamente.');
  });
});

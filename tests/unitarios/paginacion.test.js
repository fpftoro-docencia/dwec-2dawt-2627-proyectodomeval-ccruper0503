import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  paginar,
  obtenerPaginaDeUrl,
  sincronizarPaginaEnUrl,
  reiniciarPaginaEnUrl,
  renderizarControlesPaginacion,
  manejarClickPaginacion,
  ELEMENTOS_POR_PAGINA_DEFECTO,
} from '../../js/paginacion.js';

describe('Módulo de paginación pura (S2-03 / Requisitos 16 y 21)', () => {
  const elementosPrueba = Array.from({ length: 25 }, (_, i) => `Elemento ${i + 1}`);

  describe('Función pura paginar() - Requisitos mínimos del Enunciado (Requisito 21)', () => {
    it('obtiene la primera página correctamente', () => {
      const res = paginar(elementosPrueba, 1, 10);
      expect(res.paginaCorregida).toBe(1);
      expect(res.totalPaginas).toBe(3);
      expect(res.totalElementos).toBe(25);
      expect(res.elementos).toHaveLength(10);
      expect(res.elementos[0]).toBe('Elemento 1');
      expect(res.elementos[9]).toBe('Elemento 10');
    });

    it('obtiene la última página correctamente con los elementos restantes', () => {
      const res = paginar(elementosPrueba, 3, 10);
      expect(res.paginaCorregida).toBe(3);
      expect(res.totalPaginas).toBe(3);
      expect(res.elementos).toHaveLength(5);
      expect(res.elementos[0]).toBe('Elemento 21');
      expect(res.elementos[4]).toBe('Elemento 25');
    });

    it('corrige una página que no existe (superior) a la última válida', () => {
      const res = paginar(elementosPrueba, 999, 10);
      expect(res.paginaCorregida).toBe(3);
      expect(res.totalPaginas).toBe(3);
      expect(res.elementos).toHaveLength(5);
      expect(res.elementos[0]).toBe('Elemento 21');
    });

    it('corrige una página que no existe (inferior o negativa) a la primera válida', () => {
      const resCero = paginar(elementosPrueba, 0, 10);
      expect(resCero.paginaCorregida).toBe(1);
      expect(resCero.elementos[0]).toBe('Elemento 1');

      const resNegativa = paginar(elementosPrueba, -5, 10);
      expect(resNegativa.paginaCorregida).toBe(1);
    });

    it('maneja una lista vacía devolviendo 0 elementos y página 1', () => {
      const res = paginar([], 1, 10);
      expect(res.elementos).toEqual([]);
      expect(res.paginaCorregida).toBe(1);
      expect(res.totalPaginas).toBe(1);
      expect(res.totalElementos).toBe(0);
    });

    it('maneja entradas inválidas como null o undefined usando valores por defecto', () => {
      const resNull = paginar(null, 'abc', 0);
      expect(resNull.elementos).toEqual([]);
      expect(resNull.paginaCorregida).toBe(1);
      expect(resNull.totalPaginas).toBe(1);
      expect(resNull.porPagina).toBe(ELEMENTOS_POR_PAGINA_DEFECTO);
    });
  });

  describe('Navegación y sincronización en URL (URLSearchParams / replaceState)', () => {
    it('obtiene el número de página de la URL si existe el parámetro', () => {
      const ubicacion = { search: '?pagina=4&filtro=running' };
      expect(obtenerPaginaDeUrl(ubicacion)).toBe(4);
    });

    it('devuelve página 1 si no hay parámetro o es inválido', () => {
      expect(obtenerPaginaDeUrl({ search: '' })).toBe(1);
      expect(obtenerPaginaDeUrl({ search: '?pagina=invalido' })).toBe(1);
      expect(obtenerPaginaDeUrl(null)).toBe(1);
    });

    it('sincroniza en la URL una página mayor que 1 con replaceState', () => {
      const historia = { replaceState: vi.fn() };
      const ubicacion = { href: 'http://localhost:3000/listado.html?buscar=rodaje' };

      sincronizarPaginaEnUrl(3, { historia, ubicacion });

      expect(historia.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/listado.html?buscar=rodaje&pagina=3',
      );
    });

    it('elimina el parámetro de la URL si la página es 1', () => {
      const historia = { replaceState: vi.fn() };
      const ubicacion = { href: 'http://localhost:3000/listado.html?pagina=3' };

      sincronizarPaginaEnUrl(1, { historia, ubicacion });

      expect(historia.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/listado.html',
      );
    });

    it('reinicia la página a 1 en la URL con reiniciarPaginaEnUrl()', () => {
      const historia = { replaceState: vi.fn() };
      const ubicacion = { href: 'http://localhost:3000/usuarios.html?pagina=5' };

      reiniciarPaginaEnUrl({ historia, ubicacion });

      expect(historia.replaceState).toHaveBeenCalledWith(
        {},
        '',
        'http://localhost:3000/usuarios.html',
      );
    });
  });

  describe('Renderizado de controles accesibles en el DOM', () => {
    let contenedor;

    beforeEach(() => {
      contenedor = document.createElement('ul');
      contenedor.className = 'paginacion-lista';
    });

    it('genera los botones Anterior, números y Siguiente con accesibilidad', () => {
      renderizarControlesPaginacion(contenedor, {
        paginaActual: 2,
        totalPaginas: 3,
        documento: document,
      });

      const botones = contenedor.querySelectorAll('.btn-pagina');
      // 1 Anterior + 3 números + 1 Siguiente = 5 botones
      expect(botones).toHaveLength(5);

      const btnAnterior = contenedor.querySelector('[data-accion="anterior"]');
      const btnSiguiente = contenedor.querySelector('[data-accion="siguiente"]');
      const btnActivo = contenedor.querySelector('.btn-pagina.activo');

      expect(btnAnterior.disabled).toBe(false);
      expect(btnSiguiente.disabled).toBe(false);
      expect(btnActivo.textContent).toBe('2');
      expect(btnActivo.getAttribute('aria-current')).toBe('page');
    });

    it('desactiva el botón Anterior en la primera página', () => {
      renderizarControlesPaginacion(contenedor, {
        paginaActual: 1,
        totalPaginas: 4,
        documento: document,
      });

      const btnAnterior = contenedor.querySelector('[data-accion="anterior"]');
      const btnSiguiente = contenedor.querySelector('[data-accion="siguiente"]');

      expect(btnAnterior.disabled).toBe(true);
      expect(btnSiguiente.disabled).toBe(false);
    });

    it('desactiva el botón Siguiente en la última página', () => {
      renderizarControlesPaginacion(contenedor, {
        paginaActual: 4,
        totalPaginas: 4,
        documento: document,
      });

      const btnAnterior = contenedor.querySelector('[data-accion="anterior"]');
      const btnSiguiente = contenedor.querySelector('[data-accion="siguiente"]');

      expect(btnAnterior.disabled).toBe(false);
      expect(btnSiguiente.disabled).toBe(true);
    });

    it('gestiona la delegación de eventos al pulsar sobre un número o Anterior/Siguiente', () => {
      renderizarControlesPaginacion(contenedor, {
        paginaActual: 2,
        totalPaginas: 4,
        documento: document,
      });

      const onCambiar = vi.fn();
      manejarClickPaginacion(contenedor, onCambiar, { paginaActual: 2, totalPaginas: 4 });

      // Clic en página 4
      const btn4 = contenedor.querySelector('[data-pagina="4"]');
      btn4.click();
      expect(onCambiar).toHaveBeenCalledWith(4);

      // Clic en Anterior (2 - 1 = 1)
      const btnAnterior = contenedor.querySelector('[data-accion="anterior"]');
      btnAnterior.click();
      expect(onCambiar).toHaveBeenCalledWith(1);

      // Clic en Siguiente (2 + 1 = 3)
      const btnSiguiente = contenedor.querySelector('[data-accion="siguiente"]');
      btnSiguiente.click();
      expect(onCambiar).toHaveBeenCalledWith(3);
    });
  });
});

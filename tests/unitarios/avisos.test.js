import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { lanzarAviso, guardarAvisoParaSiguientePagina, iniciarAvisos } from '../../js/avisos.js';

describe('Módulo de avisos', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
    document.body.innerHTML = '<div id="contenedor-avisos" role="status"></div>';
  });

  it('lanzarAviso dispara un CustomEvent con burbuja y detalle', () => {
    let capturado = null;
    document.addEventListener('aviso', (evento) => {
      capturado = evento.detail;
    });

    const boton = document.createElement('button');
    document.body.appendChild(boton);

    lanzarAviso(boton, 'Entrenamiento registrado', 'success');

    expect(capturado).toEqual({
      mensaje: 'Entrenamiento registrado',
      tipo: 'success',
    });
  });

  it('iniciarAvisos muestra y limpia un aviso pendiente guardado en la sesión', () => {
    guardarAvisoParaSiguientePagina('Te has registrado con éxito', 'success', almacen);

    iniciarAvisos(document, almacen);

    const contenedor = document.getElementById('contenedor-avisos');
    expect(contenedor?.textContent).toContain('Te has registrado con éxito');
    expect(contenedor?.querySelector('.alert-success')).not.toBeNull();

    // Comprobar que se ha limpiado de la sesión
    expect(almacen.getItem('sportlog_aviso_pendiente')).toBeNull();
  });

  it('iniciarAvisos reacciona a nuevos eventos de aviso pintándolos en el contenedor', () => {
    iniciarAvisos(document, almacen);

    lanzarAviso(document.body, 'Contraseña incorrecta', 'danger');

    const contenedor = document.getElementById('contenedor-avisos');
    expect(contenedor?.textContent).toContain('Contraseña incorrecta');
    expect(contenedor?.querySelector('.alert-danger')).not.toBeNull();
  });
});

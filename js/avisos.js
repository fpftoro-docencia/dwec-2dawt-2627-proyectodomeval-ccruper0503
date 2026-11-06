/**
 * Sistema y módulo de avisos accesibles para la aplicación SportLog.
 * Implementa el Requisito 8 del Sprint 1.
 *
 * @module avisos
 */

const CLAVE_AVISO_PENDIENTE = 'sportlog_aviso_pendiente';

/**
 * Lanza un aviso personalizado en el elemento especificado que sube mediante burbuja.
 *
 * @param {HTMLElement} elemento Elemento desde donde se dispara el evento.
 * @param {string} mensaje Texto descriptivo del aviso.
 * @param {'success' | 'danger' | 'warning' | 'info'} [tipo='info'] Tipo de alerta de Bootstrap.
 */
export function lanzarAviso(elemento, mensaje, tipo = 'info') {
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo },
  });
  elemento.dispatchEvent(evento);
}

/**
 * Guarda un aviso en el almacenamiento de sesión para mostrarlo tras navegar a otra página.
 *
 * @param {string} mensaje Texto del aviso.
 * @param {'success' | 'danger' | 'warning' | 'info'} [tipo='info'] Tipo de alerta.
 * @param {Storage} [almacen=sessionStorage] Objeto de almacenamiento a utilizar.
 */
export function guardarAvisoParaSiguientePagina(mensaje, tipo = 'info', almacen = sessionStorage) {
  almacen.setItem(CLAVE_AVISO_PENDIENTE, JSON.stringify({ mensaje, tipo }));
}

/**
 * Muestra visualmente un aviso en la región con role="status".
 *
 * @param {string} mensaje Mensaje a mostrar.
 * @param {string} tipo Tipo de alerta Bootstrap.
 * @param {HTMLElement} contenedor Elemento contenedor donde pintar la alerta.
 */
function renderizarAlerta(mensaje, tipo, contenedor) {
  contenedor.replaceChildren();

  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
  alerta.setAttribute('role', 'alert');

  const texto = document.createElement('span');
  texto.textContent = mensaje;
  alerta.appendChild(texto);

  const botonCerrar = document.createElement('button');
  botonCerrar.type = 'button';
  botonCerrar.className = 'btn-close';
  botonCerrar.setAttribute('aria-label', 'Cerrar aviso');
  botonCerrar.addEventListener('click', () => alerta.remove());
  alerta.appendChild(botonCerrar);

  contenedor.appendChild(alerta);
}

/**
 * Inicia el sistema de avisos:
 * 1. Registra un único oyente global en document para el evento 'aviso'.
 * 2. Comprueba si había un aviso guardado de la página anterior y lo muestra.
 *
 * @param {Document} [documento=document] Documento en el que escuchar los eventos.
 * @param {Storage} [almacen=sessionStorage] Almacenamiento donde consultar avisos pendientes.
 */
export function iniciarAvisos(documento = document, almacen = sessionStorage) {
  const contenedor = documento.getElementById('contenedor-avisos');
  if (!contenedor) return;

  // 1. Mostrar aviso pendiente si lo hubiere
  try {
    const guardado = almacen.getItem(CLAVE_AVISO_PENDIENTE);
    if (guardado) {
      almacen.removeItem(CLAVE_AVISO_PENDIENTE);
      const datos = JSON.parse(guardado);
      if (datos && datos.mensaje) {
        renderizarAlerta(datos.mensaje, datos.tipo || 'info', contenedor);
      }
    }
  } catch {
    almacen.removeItem(CLAVE_AVISO_PENDIENTE);
  }

  // 2. Oyente único para CustomEvent 'aviso'
  documento.addEventListener('aviso', (evento) => {
    const { mensaje, tipo } = evento.detail || {};
    if (mensaje) {
      renderizarAlerta(mensaje, tipo || 'info', contenedor);
    }
  });
}

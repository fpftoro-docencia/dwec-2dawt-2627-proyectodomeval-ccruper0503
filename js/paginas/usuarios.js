/**
 * Controlador de la página de administración de usuarios (usuarios.html).
 * Cumple con los Requisitos 7 y 18:
 * - Protección exclusiva para administradores.
 * - Cabecera privada con datos del usuario activo.
 * - Renderizado de la lista real de usuarios desde localStorage.
 * - Cambio de roles con protección: un admin no puede quitarse su propio rol.
 *
 * @module paginas/usuarios
 */

import { iniciarAvisos, lanzarAviso } from '../avisos.js';
import { protegerPaginaAdmin, configurarCabeceraPrivada, obtenerSesion } from '../sesion.js';
import { obtenerUsuarios, guardarUsuarios, ROL_ADMINISTRADOR, ROL_USUARIO } from '../usuarios.js';

/**
 * Renderiza la lista de usuarios y actualiza los indicadores.
 *
 * @param {Object} ctx Contexto con documento y almacenes.
 */
function renderizarUsuarios(ctx) {
  const { documento, almacenUsuarios, almacenSesion } = ctx;
  const sesion = obtenerSesion(almacenSesion);
  const usuarios = obtenerUsuarios(almacenUsuarios);

  const cuerpoTabla = documento.getElementById('cuerpo-tabla-usuarios');
  const panelVacio = documento.getElementById('panel-vacio-usuarios');
  const contador = documento.getElementById('contador-usuarios');
  const elTotal = documento.getElementById('kpi-total-usuarios');
  const elAdmins = documento.getElementById('kpi-admins-usuarios');
  const pills = documento.querySelectorAll('.pill-filtro');

  const total = usuarios.length;
  const admins = usuarios.filter((u) => u.rol === ROL_ADMINISTRADOR).length;
  const deportistas = total - admins;

  if (elTotal) {
    elTotal.textContent = String(total);
  }
  if (elAdmins) {
    elAdmins.textContent = String(admins);
  }
  if (contador) {
    contador.textContent = `Mostrando ${total} deportista${total === 1 ? '' : 's'}`;
  }

  // Actualizar contadores en las pills
  if (pills && pills.length >= 3) {
    pills[0].textContent = `Todos (${total})`;
    pills[1].textContent = `👑 Administradores (${admins})`;
    pills[2].textContent = `🏃 Deportistas (${deportistas})`;
  }

  if (!cuerpoTabla) {
    return;
  }

  cuerpoTabla.replaceChildren();

  if (total === 0) {
    if (panelVacio) {
      panelVacio.style.display = 'block';
    }
    return;
  }

  if (panelVacio) {
    panelVacio.style.display = 'none';
  }

  usuarios.forEach((usuario) => {
    const tr = documento.createElement('tr');

    // 1. Columna Usuario
    const tdUsuario = documento.createElement('td');
    const celda = documento.createElement('div');
    celda.className = 'usuario-celda';

    const avatar = documento.createElement('div');
    avatar.className = 'usuario-avatar-chico';
    const esAdmin = usuario.rol === ROL_ADMINISTRADOR;
    avatar.style.background = esAdmin
      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
      : 'linear-gradient(135deg, #06b6d4, #0284c7)';
    avatar.textContent = usuario.nombreUsuario.slice(0, 2).toUpperCase();

    const info = documento.createElement('div');
    const nombre = documento.createElement('div');
    nombre.className = 'fw-bold text-white';
    nombre.textContent = usuario.nombreUsuario;

    const tag = documento.createElement('div');
    tag.className = 'text-secondary small';
    tag.style.fontSize = '0.72rem';
    tag.textContent = esAdmin ? '👑 Administrador' : 'Atleta SportLog';

    info.appendChild(nombre);
    info.appendChild(tag);
    celda.appendChild(avatar);
    celda.appendChild(info);
    tdUsuario.appendChild(celda);
    tr.appendChild(tdUsuario);

    // 2. Columna Correo
    const tdCorreo = documento.createElement('td');
    tdCorreo.className = 'text-secondary font-monospace small';
    tdCorreo.textContent = usuario.correo;
    tr.appendChild(tdCorreo);

    // 3. Columna Rol
    const tdRol = documento.createElement('td');
    const badge = documento.createElement('span');
    badge.className = `badge-rol ${esAdmin ? 'admin' : 'usuario'}`;
    badge.textContent = esAdmin ? 'Administrador' : 'Usuario';
    tdRol.appendChild(badge);
    tr.appendChild(tdRol);

    // 4. Columna Fecha de Alta
    const tdFecha = documento.createElement('td');
    tdFecha.className = 'text-secondary small';
    if (usuario.creadoEn) {
      try {
        tdFecha.textContent = new Date(usuario.creadoEn).toLocaleDateString();
      } catch {
        tdFecha.textContent = '—';
      }
    } else {
      tdFecha.textContent = '—';
    }
    tr.appendChild(tdFecha);

    // 5. Columna Acción
    const tdAccion = documento.createElement('td');
    tdAccion.className = 'text-end';

    const esElMismo =
      sesion && sesion.nombreUsuario.toLowerCase() === usuario.nombreUsuario.toLowerCase();

    if (esElMismo) {
      const wrapper = documento.createElement('div');
      wrapper.className = 'd-inline-flex flex-column align-items-end';

      const boton = documento.createElement('button');
      boton.type = 'button';
      boton.className = 'btn btn-outline-secondary btn-sm';
      boton.disabled = true;
      boton.title = 'No puedes quitarte el rol de administrador a ti mismo';
      boton.textContent = 'Quitar rol (desactivado)';

      const aviso = documento.createElement('span');
      aviso.className = 'text-secondary mt-1';
      aviso.style.fontSize = '0.68rem';
      aviso.textContent = '🔒 Tu usuario actual';

      wrapper.appendChild(boton);
      wrapper.appendChild(aviso);
      tdAccion.appendChild(wrapper);
    } else {
      const boton = documento.createElement('button');
      boton.type = 'button';
      boton.className = esAdmin
        ? 'btn btn-outline-danger btn-sm'
        : 'btn btn-outline-warning btn-sm';
      boton.textContent = esAdmin ? 'Quitar Administrador' : 'Hacer Administrador';

      boton.addEventListener('click', () => {
        const listaActual = obtenerUsuarios(almacenUsuarios);
        const target = listaActual.find(
          (u) => u.nombreUsuario.toLowerCase() === usuario.nombreUsuario.toLowerCase(),
        );
        if (target) {
          target.rol = target.rol === ROL_ADMINISTRADOR ? ROL_USUARIO : ROL_ADMINISTRADOR;
          guardarUsuarios(listaActual, almacenUsuarios);
          lanzarAviso(
            cuerpoTabla,
            `Rol de ${target.nombreUsuario} actualizado a ${target.rol}.`,
            'info',
          );
          renderizarUsuarios(ctx);
        }
      });

      tdAccion.appendChild(boton);
    }

    tr.appendChild(tdAccion);
    cuerpoTabla.appendChild(tr);
  });
}

/**
 * Inicializa la página de administración de usuarios.
 *
 * @param {Object} [opciones={}]
 * @param {Document} [opciones.documento=document] Documento DOM.
 * @param {Storage} [opciones.almacenUsuarios=localStorage] Almacén de usuarios.
 * @param {Storage} [opciones.almacenSesion=sessionStorage] Almacén de sesión activa.
 * @param {Function} [opciones.navegar] Función de navegación.
 */
export function iniciarUsuarios({
  documento = document,
  almacenUsuarios = localStorage,
  almacenSesion = sessionStorage,
  navegar = (url) => location.replace(url),
} = {}) {
  iniciarAvisos(documento, almacenSesion);

  if (!protegerPaginaAdmin(almacenSesion, navegar)) {
    return;
  }

  configurarCabeceraPrivada(documento, almacenSesion, navegar);

  renderizarUsuarios({ documento, almacenUsuarios, almacenSesion });
}

// Iniciar automáticamente en el navegador
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => iniciarUsuarios());
  } else {
    iniciarUsuarios();
  }
}

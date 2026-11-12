/**
 * Módulo para la gestión y persistencia de usuarios en SportLog.
 * Cumple los Requisitos 3 y 4 del Sprint 1.
 *
 * @module usuarios
 */

import { resumirClave } from './clave.js';

export const CLAVE_ALMACEN_USUARIOS = 'sportlog_usuarios';
export const ROL_ADMINISTRADOR = 'administrador';
export const ROL_USUARIO = 'usuario';

/**
 * Obtiene la lista completa de usuarios registrados en el almacenamiento.
 * Si el almacén está vacío o los datos guardados están estropeados (JSON corrupto),
 * devuelve un array vacío [] de forma segura.
 *
 * @param {Storage} [almacen=localStorage] Almacenamiento a consultar (por defecto localStorage).
 * @returns {Array<Object>} Lista de usuarios registrados.
 */
export function obtenerUsuarios(almacen = localStorage) {
  try {
    const raw = almacen.getItem(CLAVE_ALMACEN_USUARIOS);
    if (!raw) {
      return [];
    }
    const datos = JSON.parse(raw);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

/**
 * Guarda la lista de usuarios en el almacenamiento serializada en JSON.
 *
 * @param {Array<Object>} usuarios Lista de usuarios a guardar.
 * @param {Storage} [almacen=localStorage] Almacenamiento donde persistir.
 */
export function guardarUsuarios(usuarios, almacen = localStorage) {
  almacen.setItem(CLAVE_ALMACEN_USUARIOS, JSON.stringify(usuarios));
}

/**
 * Busca un usuario por su nombre de usuario (sin distinguir mayúsculas ni minúsculas).
 *
 * @param {string} nombreUsuario Nombre a buscar.
 * @param {Storage} [almacen=localStorage] Almacenamiento a consultar.
 * @returns {Object|null} El usuario encontrado o null si no existe.
 */
export function buscarUsuarioPorNombre(nombreUsuario, almacen = localStorage) {
  if (!nombreUsuario) {
    return null;
  }
  const lista = obtenerUsuarios(almacen);
  const busqueda = nombreUsuario.trim().toLowerCase();
  return lista.find((u) => u.nombreUsuario.toLowerCase() === busqueda) || null;
}

/**
 * Comprueba si un nombre de usuario ya está registrado en el sistema.
 *
 * @param {string} nombreUsuario Nombre a comprobar.
 * @param {Storage} [almacen=localStorage] Almacenamiento a consultar.
 * @returns {boolean} Verdadero si ya está ocupado.
 */
export function existeUsuario(nombreUsuario, almacen = localStorage) {
  return buscarUsuarioPorNombre(nombreUsuario, almacen) !== null;
}

/**
 * Registra un nuevo deportista en el sistema:
 * - El primer usuario registrado recibe automáticamente el rol de 'administrador'.
 * - Los usuarios posteriores reciben el rol de 'usuario'.
 * - La contraseña se guarda ÚNICAMENTE como su resumen SHA-256 (mediante resumirClave).
 *
 * @param {Object} datos
 * @param {string} datos.nombreUsuario Nombre de usuario único.
 * @param {string} datos.correo Correo electrónico.
 * @param {string} datos.clave Contraseña en texto plano.
 * @param {Storage} [almacen=localStorage] Almacenamiento donde guardar.
 * @returns {Promise<Object>} El usuario registrado con su hash y rol.
 * @throws {Error} Si el nombre de usuario ya existe.
 */
export async function registrarUsuario({ nombreUsuario, correo, clave }, almacen = localStorage) {
  if (existeUsuario(nombreUsuario, almacen)) {
    throw new Error('El nombre de usuario ya está ocupado.');
  }

  const usuarios = obtenerUsuarios(almacen);
  // Regla del enunciado: el primer usuario registrado es administrador
  const rol = usuarios.length === 0 ? ROL_ADMINISTRADOR : ROL_USUARIO;

  // Calculamos el hash asíncrono de la contraseña
  const hashClave = await resumirClave(clave);

  const nuevoUsuario = {
    nombreUsuario: nombreUsuario.trim(),
    correo: correo.trim().toLowerCase(),
    clave: hashClave,
    rol,
    creadoEn: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  guardarUsuarios(usuarios, almacen);

  return nuevoUsuario;
}

/**
 * Verifica las credenciales de inicio de sesión:
 * Permite identificarse con el nombre de usuario o con el correo electrónico.
 * Compara el hash de la clave introducida con el hash guardado.
 *
 * @param {string} identificador Nombre de usuario o correo.
 * @param {string} clave Contraseña en texto plano.
 * @param {Storage} [almacen=localStorage] Almacenamiento a consultar.
 * @returns {Promise<Object|null>} El usuario autenticado (sin su hash) o null si falla.
 */
export async function verificarCredenciales(identificador, clave, almacen = localStorage) {
  if (!identificador || !clave) {
    return null;
  }

  const usuarios = obtenerUsuarios(almacen);
  const idLimpio = identificador.trim().toLowerCase();

  const usuario = usuarios.find(
    (u) => u.nombreUsuario.toLowerCase() === idLimpio || u.correo.toLowerCase() === idLimpio,
  );

  if (!usuario) {
    return null;
  }

  const hashClave = await resumirClave(clave);
  if (hashClave === usuario.clave) {
    return {
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }

  return null;
}

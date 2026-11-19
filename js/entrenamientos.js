/**
 * Módulo para la gestión y persistencia de entrenamientos en SportLog.
 * Cumple con el Requisito 14 del Sprint 2:
 * - Aislamiento de datos por usuario en localStorage (sportlog_entrenamientos_<nombreUsuario>).
 * - Identificador único por registro mediante crypto.randomUUID().
 * - Resiliencia y tolerancia a fallos ante JSON ausente o dañado.
 * - Operaciones CRUD puras con inyección de dependencias para tests.
 *
 * @module entrenamientos
 */

export const PREFIJO_ALMACEN_ENTRENAMIENTOS = 'sportlog_entrenamientos_';

/**
 * Genera la clave de almacenamiento normalizada para un usuario específico.
 *
 * @param {string} nombreUsuario Nombre del usuario propietario.
 * @returns {string} Clave en el almacenamiento.
 */
export function obtenerClaveEntrenamientos(nombreUsuario) {
  const normalizado = (nombreUsuario || '').trim().toLowerCase();
  return `${PREFIJO_ALMACEN_ENTRENAMIENTOS}${normalizado}`;
}

/**
 * Obtiene la lista completa de entrenamientos de un usuario.
 * Si el almacén está vacío o el JSON almacenado está dañado, devuelve [].
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {Storage} [almacen=localStorage] Almacén a consultar.
 * @returns {Array<Object>} Lista de entrenamientos del usuario.
 */
export function obtenerEntrenamientos(nombreUsuario, almacen = localStorage) {
  if (!nombreUsuario) {
    return [];
  }
  const clave = obtenerClaveEntrenamientos(nombreUsuario);
  try {
    const raw = almacen.getItem(clave);
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
 * Guarda la colección de entrenamientos de un usuario en el almacenamiento.
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {Array<Object>} entrenamientos Lista de sesiones a guardar.
 * @param {Storage} [almacen=localStorage] Almacén donde persistir.
 */
export function guardarEntrenamientos(nombreUsuario, entrenamientos, almacen = localStorage) {
  if (!nombreUsuario) {
    return;
  }
  const clave = obtenerClaveEntrenamientos(nombreUsuario);
  almacen.setItem(clave, JSON.stringify(entrenamientos));
}

/**
 * Busca una sesión de entrenamiento por su identificador único.
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {string} id Identificador único del entrenamiento.
 * @param {Storage} [almacen=localStorage] Almacén a consultar.
 * @returns {Object|null} El entrenamiento encontrado o null si no existe.
 */
export function obtenerEntrenamientoPorId(nombreUsuario, id, almacen = localStorage) {
  if (!nombreUsuario || !id) {
    return null;
  }
  const lista = obtenerEntrenamientos(nombreUsuario, almacen);
  return lista.find((item) => item.id === id) || null;
}

// Alias para compatibilidad con nomenclaturas cortas
export const obtenerPorId = obtenerEntrenamientoPorId;

/**
 * Crea un nuevo registro de entrenamiento para el usuario, asignándole un id único
 * y marca de tiempo de creación.
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {Object} datosEntrenamiento Datos de la sesión deportiva.
 * @param {Storage} [almacen=localStorage] Almacén donde persistir.
 * @returns {Object} El entrenamiento creado con su id y fechas.
 */
export function crearEntrenamiento(nombreUsuario, datosEntrenamiento, almacen = localStorage) {
  if (!nombreUsuario) {
    throw new Error('El nombre de usuario es obligatorio para registrar un entrenamiento');
  }

  const lista = obtenerEntrenamientos(nombreUsuario, almacen);
  const ahora = new Date().toISOString();
  const nuevo = {
    ...datosEntrenamiento,
    id: crypto.randomUUID(),
    creadoEn: ahora,
    fechaCreacion: ahora,
  };

  lista.push(nuevo);
  guardarEntrenamientos(nombreUsuario, lista, almacen);
  return nuevo;
}

/**
 * Actualiza un entrenamiento existente conservando su id y fecha de creación original.
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {string} id Identificador único del entrenamiento a actualizar.
 * @param {Object} datosActualizados Campos actualizados del entrenamiento.
 * @param {Storage} [almacen=localStorage] Almacén donde persistir.
 * @returns {Object|null} El entrenamiento actualizado o null si no se encuentra.
 */
export function actualizarEntrenamiento(
  nombreUsuario,
  id,
  datosActualizados,
  almacen = localStorage,
) {
  if (!nombreUsuario || !id) {
    return null;
  }

  const lista = obtenerEntrenamientos(nombreUsuario, almacen);
  const indice = lista.findIndex((item) => item.id === id);
  if (indice === -1) {
    return null;
  }

  const anterior = lista[indice];
  const ahora = new Date().toISOString();
  const actualizado = {
    ...anterior,
    ...datosActualizados,
    id: anterior.id,
    creadoEn: anterior.creadoEn || anterior.fechaCreacion || ahora,
    fechaCreacion: anterior.fechaCreacion || anterior.creadoEn || ahora,
    modificadoEn: ahora,
  };

  lista[indice] = actualizado;
  guardarEntrenamientos(nombreUsuario, lista, almacen);
  return actualizado;
}

/**
 * Elimina un entrenamiento de la lista del usuario.
 *
 * @param {string} nombreUsuario Nombre del usuario.
 * @param {string} id Identificador único del entrenamiento a eliminar.
 * @param {Storage} [almacen=localStorage] Almacén donde persistir.
 * @returns {boolean} True si se encontró y eliminó, false en caso contrario.
 */
export function borrarEntrenamiento(nombreUsuario, id, almacen = localStorage) {
  if (!nombreUsuario || !id) {
    return false;
  }

  const lista = obtenerEntrenamientos(nombreUsuario, almacen);
  const longitudOriginal = lista.length;
  const filtrados = lista.filter((item) => item.id !== id);

  if (filtrados.length === longitudOriginal) {
    return false;
  }

  guardarEntrenamientos(nombreUsuario, filtrados, almacen);
  return true;
}

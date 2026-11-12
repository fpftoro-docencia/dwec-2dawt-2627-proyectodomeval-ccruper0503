import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerClaveEntrenamientos,
  obtenerEntrenamientos,
  guardarEntrenamientos,
  obtenerEntrenamientoPorId,
  crearEntrenamiento,
  actualizarEntrenamiento,
  borrarEntrenamiento,
  PREFIJO_ALMACEN_ENTRENAMIENTOS,
} from '../../js/entrenamientos.js';

describe('Módulo de datos: entrenamientos (S2-01 / Requisito 14)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('Generación de claves y aislamiento por usuario', () => {
    it('genera la clave con el prefijo y el nombre en minúsculas y sin espacios', () => {
      expect(obtenerClaveEntrenamientos('CarlosRunner')).toBe(
        `${PREFIJO_ALMACEN_ENTRENAMIENTOS}carlosrunner`,
      );
      expect(obtenerClaveEntrenamientos('  AnaTriatlon  ')).toBe(
        `${PREFIJO_ALMACEN_ENTRENAMIENTOS}anatriatlon`,
      );
    });

    it('aísla estrictamente los entrenamientos entre diferentes usuarios', () => {
      crearEntrenamiento('atleta1', { titulo: 'Series 1000m' }, almacen);
      crearEntrenamiento('atleta2', { titulo: 'Rodaje 10km' }, almacen);

      const lista1 = obtenerEntrenamientos('atleta1', almacen);
      const lista2 = obtenerEntrenamientos('atleta2', almacen);

      expect(lista1).toHaveLength(1);
      expect(lista1[0].titulo).toBe('Series 1000m');

      expect(lista2).toHaveLength(1);
      expect(lista2[0].titulo).toBe('Rodaje 10km');
    });
  });

  describe('Lectura, guardado y tolerancia a fallos', () => {
    it('devuelve array vacío si el almacenamiento no tiene datos o el usuario es nulo', () => {
      expect(obtenerEntrenamientos('nadador', almacen)).toEqual([]);
      expect(obtenerEntrenamientos('', almacen)).toEqual([]);
      expect(obtenerEntrenamientos(null, almacen)).toEqual([]);
    });

    it('guarda y lee entrenamientos en formato JSON correctamente', () => {
      const sesiones = [{ id: '1', titulo: 'Natación suave' }];
      guardarEntrenamientos('nadador', sesiones, almacen);
      expect(obtenerEntrenamientos('nadador', almacen)).toEqual(sesiones);
    });

    it('devuelve array vacío si el contenido almacenado es JSON corrupto o no es array', () => {
      const clave = obtenerClaveEntrenamientos('ciclista');
      almacen.setItem(clave, '{json_roto_invalido}');
      expect(obtenerEntrenamientos('ciclista', almacen)).toEqual([]);

      almacen.setItem(clave, '"texto plano sin formato"');
      expect(obtenerEntrenamientos('ciclista', almacen)).toEqual([]);

      almacen.setItem(clave, '12345');
      expect(obtenerEntrenamientos('ciclista', almacen)).toEqual([]);
    });

    it('no realiza acciones si guardarEntrenamientos se llama sin nombre de usuario', () => {
      guardarEntrenamientos('', [{ id: '1' }], almacen);
      expect(almacen.length).toBe(0);
    });
  });

  describe('Creación de entrenamientos (crearEntrenamiento)', () => {
    it('genera un id único en formato UUID y asigna fecha de creación', () => {
      const datos = {
        titulo: 'Fuerza Pierna',
        disciplina: 'fuerza',
        duracion: 60,
      };

      const creado = crearEntrenamiento('pesas', datos, almacen);

      expect(creado.id).toBeDefined();
      expect(typeof creado.id).toBe('string');
      // Comprobar formato UUID v4
      expect(creado.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(creado.creadoEn).toBeDefined();
      expect(creado.fechaCreacion).toBeDefined();
      expect(creado.titulo).toBe('Fuerza Pierna');

      const guardados = obtenerEntrenamientos('pesas', almacen);
      expect(guardados).toHaveLength(1);
      expect(guardados[0].id).toBe(creado.id);
    });

    it('lanza un error si no se indica el nombre de usuario', () => {
      expect(() => {
        crearEntrenamiento('', { titulo: 'Sin usuario' }, almacen);
      }).toThrow('El nombre de usuario es obligatorio para registrar un entrenamiento');
    });
  });

  describe('Consulta por id (obtenerEntrenamientoPorId)', () => {
    it('encuentra el entrenamiento por su id', () => {
      const creado = crearEntrenamiento('nadador', { titulo: 'Aguas abiertas' }, almacen);
      const encontrado = obtenerEntrenamientoPorId('nadador', creado.id, almacen);

      expect(encontrado).not.toBeNull();
      expect(encontrado.id).toBe(creado.id);
      expect(encontrado.titulo).toBe('Aguas abiertas');
    });

    it('devuelve null si no existe el id o si los parámetros son inválidos', () => {
      expect(obtenerEntrenamientoPorId('nadador', 'id-inexistente', almacen)).toBeNull();
      expect(obtenerEntrenamientoPorId('', 'algun-id', almacen)).toBeNull();
      expect(obtenerEntrenamientoPorId('nadador', '', almacen)).toBeNull();
    });
  });

  describe('Actualización de entrenamientos (actualizarEntrenamiento)', () => {
    it('actualiza campos y mantiene id y fecha de creación inmutables', () => {
      const original = crearEntrenamiento(
        'runner',
        { titulo: 'Tirada larga 21k', duracion: 105 },
        almacen,
      );

      const actualizado = actualizarEntrenamiento(
        'runner',
        original.id,
        { titulo: 'Tirada larga 25k (ajustada)', duracion: 125 },
        almacen,
      );

      expect(actualizado).not.toBeNull();
      expect(actualizado.id).toBe(original.id);
      expect(actualizado.creadoEn).toBe(original.creadoEn);
      expect(actualizado.titulo).toBe('Tirada larga 25k (ajustada)');
      expect(actualizado.duracion).toBe(125);
      expect(actualizado.modificadoEn).toBeDefined();

      const persistido = obtenerEntrenamientoPorId('runner', original.id, almacen);
      expect(persistido.titulo).toBe('Tirada larga 25k (ajustada)');
    });

    it('devuelve null si el id no existe o si faltan parámetros', () => {
      expect(
        actualizarEntrenamiento('runner', 'id-inexistente', { duracion: 90 }, almacen),
      ).toBeNull();
      expect(actualizarEntrenamiento('', 'id', { duracion: 90 }, almacen)).toBeNull();
      expect(actualizarEntrenamiento('runner', '', { duracion: 90 }, almacen)).toBeNull();
    });
  });

  describe('Borrado de entrenamientos (borrarEntrenamiento)', () => {
    it('elimina el entrenamiento indicado y devuelve true', () => {
      const s1 = crearEntrenamiento('boxer', { titulo: 'Sparring' }, almacen);
      const s2 = crearEntrenamiento('boxer', { titulo: 'Saco pesado' }, almacen);

      expect(obtenerEntrenamientos('boxer', almacen)).toHaveLength(2);

      const borrado = borrarEntrenamiento('boxer', s1.id, almacen);
      expect(borrado).toBe(true);

      const restantes = obtenerEntrenamientos('boxer', almacen);
      expect(restantes).toHaveLength(1);
      expect(restantes[0].id).toBe(s2.id);
      expect(obtenerEntrenamientoPorId('boxer', s1.id, almacen)).toBeNull();
    });

    it('devuelve false si el id no existe o si faltan parámetros', () => {
      expect(borrarEntrenamiento('boxer', 'no-existe', almacen)).toBe(false);
      expect(borrarEntrenamiento('', 'id', almacen)).toBe(false);
      expect(borrarEntrenamiento('boxer', '', almacen)).toBe(false);
    });
  });
});

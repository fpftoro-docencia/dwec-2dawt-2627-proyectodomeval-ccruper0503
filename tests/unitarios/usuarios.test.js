import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerUsuarios,
  guardarUsuarios,
  buscarUsuarioPorNombre,
  existeUsuario,
  registrarUsuario,
  verificarCredenciales,
  ROL_ADMINISTRADOR,
  ROL_USUARIO,
  CLAVE_ALMACEN_USUARIOS,
} from '../../js/usuarios.js';

describe('Módulo de datos: usuarios (S1-04)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('Lectura, guardado y tolerancia a fallos', () => {
    it('devuelve array vacío si el almacenamiento no tiene datos', () => {
      expect(obtenerUsuarios(almacen)).toEqual([]);
    });

    it('guarda y lee usuarios en formato JSON correctamente', () => {
      const usuarios = [{ nombreUsuario: 'nadador', rol: 'usuario' }];
      guardarUsuarios(usuarios, almacen);
      expect(obtenerUsuarios(almacen)).toEqual(usuarios);
    });

    it('devuelve array vacío si el contenido almacenado es JSON corrupto o no es array', () => {
      almacen.setItem(CLAVE_ALMACEN_USUARIOS, '{json_roto_invalido}');
      expect(obtenerUsuarios(almacen)).toEqual([]);

      almacen.setItem(CLAVE_ALMACEN_USUARIOS, '"un texto plano"');
      expect(obtenerUsuarios(almacen)).toEqual([]);
    });
  });

  describe('Registro de usuarios y asignación de roles', () => {
    it('el primer usuario registrado se convierte en administrador', async () => {
      const admin = await registrarUsuario(
        { nombreUsuario: 'admin', correo: 'admin@sportlog.es', clave: 'Clave1234' },
        almacen,
      );

      expect(admin.rol).toBe(ROL_ADMINISTRADOR);
      expect(admin.clave).not.toBe('Clave1234'); // La contraseña se guarda hasheada
      expect(obtenerUsuarios(almacen)).toHaveLength(1);
    });

    it('los siguientes usuarios registrados reciben el rol de usuario estándar', async () => {
      await registrarUsuario(
        { nombreUsuario: 'admin', correo: 'admin@sportlog.es', clave: 'Clave1234' },
        almacen,
      );

      const segundo = await registrarUsuario(
        { nombreUsuario: 'runner', correo: 'runner@sportlog.es', clave: 'Clave1234' },
        almacen,
      );

      expect(segundo.rol).toBe(ROL_USUARIO);
      expect(obtenerUsuarios(almacen)).toHaveLength(2);
    });

    it('impide registrar un nombre de usuario repetido', async () => {
      await registrarUsuario(
        { nombreUsuario: 'ciclista', correo: 'ciclista@sportlog.es', clave: 'Clave1234' },
        almacen,
      );

      await expect(
        registrarUsuario(
          { nombreUsuario: 'Ciclista', correo: 'otro@sportlog.es', clave: 'Clave1234' },
          almacen,
        ),
      ).rejects.toThrow('El nombre de usuario ya está ocupado.');
    });

    it('existeUsuario detecta coincidencias sin importar mayúsculas o minúsculas', async () => {
      await registrarUsuario(
        { nombreUsuario: 'triatleta', correo: 'tri@sportlog.es', clave: 'Clave1234' },
        almacen,
      );

      expect(existeUsuario('TRIATLETA', almacen)).toBe(true);
      expect(existeUsuario('futbolista', almacen)).toBe(false);
      expect(buscarUsuarioPorNombre('Triatleta', almacen)?.nombreUsuario).toBe('triatleta');
    });
  });

  describe('Verificación de credenciales (login)', () => {
    beforeEach(async () => {
      await registrarUsuario(
        { nombreUsuario: 'atleta1', correo: 'atleta1@sportlog.es', clave: 'MiContraseñaSegura1' },
        almacen,
      );
    });

    it('permite iniciar sesión con nombre de usuario y contraseña correcta', async () => {
      const usuario = await verificarCredenciales('atleta1', 'MiContraseñaSegura1', almacen);
      expect(usuario).not.toBeNull();
      expect(usuario?.nombreUsuario).toBe('atleta1');
      expect(usuario?.rol).toBe(ROL_ADMINISTRADOR);
    });

    it('permite iniciar sesión con correo electrónico y contraseña correcta', async () => {
      const usuario = await verificarCredenciales(
        'atleta1@sportlog.es',
        'MiContraseñaSegura1',
        almacen,
      );
      expect(usuario).not.toBeNull();
      expect(usuario?.nombreUsuario).toBe('atleta1');
    });

    it('devuelve null si la contraseña es incorrecta', async () => {
      const usuario = await verificarCredenciales('atleta1', 'ClaveEquivocada', almacen);
      expect(usuario).toBeNull();
    });

    it('devuelve null si el usuario o correo no existe', async () => {
      const usuario = await verificarCredenciales('inexistente', 'MiContraseñaSegura1', almacen);
      expect(usuario).toBeNull();
    });
  });
});

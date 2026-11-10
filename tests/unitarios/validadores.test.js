import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarCorreo,
  comprobarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
} from '../../js/validadores.js';

describe('Validadores de registro con it.each (Requisito 10)', () => {
  describe('validarNombreUsuario', () => {
    it.each([
      ['ana', true, 'límite inferior válido (3 caracteres)'],
      ['atleta_12345678', true, 'límite superior válido (15 caracteres)'],
      ['runner_pro', true, 'caso alfanumérico estándar'],
    ])('caso válido: «%s» (%s)', (usuario, esperado) => {
      expect(validarNombreUsuario(usuario).valido).toBe(esperado);
    });

    it.each([
      ['', false, 'cadena vacía'],
      ['al', false, 'menos de 3 caracteres (2 caracteres)'],
      ['atleta_demasiado_largo', false, 'más de 15 caracteres'],
      ['usuario con espacio', false, 'contiene espacios'],
      ['usuario@correo', false, 'contiene caracteres no permitidos (@)'],
      ['nadador!', false, 'contiene signos de puntuación'],
    ])('caso no válido: «%s» -> motivo: %s', (usuario, esperado, motivo) => {
      const resultado = validarNombreUsuario(usuario);
      expect(resultado.valido).toBe(esperado);
      expect(resultado.error).toBeDefined();
      expect(motivo).toBeTruthy();
    });
  });

  describe('validarCorreo', () => {
    it.each([
      ['deportista@sportlog.es', true, 'dominio estándar'],
      ['a@b.co', true, 'límite corto'],
      ['usuario.nombre+test@sub.dominio.org', true, 'con puntos y subdominios'],
    ])('correo válido: «%s»', (correo, esperado) => {
      expect(validarCorreo(correo).valido).toBe(esperado);
    });

    it.each([
      ['', false, 'campo vacío'],
      ['sin_arroba.es', false, 'falta el símbolo arroba'],
      ['usuario@', false, 'falta el dominio tras la arroba'],
      ['@dominio.com', false, 'falta el nombre de usuario'],
      ['correo con espacios@dominio.com', false, 'contiene espacios'],
      ['usuario@dominio', false, 'falta la extensión del dominio'],
    ])('correo inválido: «%s» -> motivo: %s', (correo, esperado, motivo) => {
      const resultado = validarCorreo(correo);
      expect(resultado.valido).toBe(esperado);
      expect(resultado.error).toBeDefined();
      expect(motivo).toBeTruthy();
    });
  });

  describe('comprobarRequisitosClave y validarClave', () => {
    it.each([
      ['Clave123', true, 'exactamente 8 caracteres con mayúscula, minúscula y cifra'],
      ['SuperDeportista2026', true, 'más de 8 caracteres con todos los requisitos'],
      ['Contraseña99', true, 'con caracteres Unicode'],
    ])('clave válida: «%s»', (clave, esperado) => {
      expect(validarClave(clave).valido).toBe(esperado);
      expect(comprobarRequisitosClave(clave).esValida).toBe(true);
    });

    it.each([
      ['', false, 'campo vacío'],
      ['Clave1', false, 'menos de 8 caracteres (6 caracteres)'],
      ['CLAVE1234', false, 'falta letra minúscula'],
      ['clave1234', false, 'falta letra mayúscula'],
      ['ClaveSinNumeros', false, 'falta número o cifra'],
    ])('clave inválida: «%s» -> motivo: %s', (clave, esperado, motivo) => {
      const resultado = validarClave(clave);
      expect(resultado.valido).toBe(esperado);
      expect(resultado.error).toBeDefined();
      expect(motivo).toBeTruthy();
    });
  });

  describe('validarRepeticionClave', () => {
    it('es válida cuando coincide con la clave original', () => {
      expect(validarRepeticionClave('Secreta1', 'Secreta1').valido).toBe(true);
    });

    it.each([
      ['Secreta1', '', 'repetición vacía'],
      ['Secreta1', 'Secreta2', 'difiere en un carácter'],
      ['Secreta1', 'secreta1', 'difiere en mayúsculas/minúsculas'],
    ])('repetición inválida con «%s» frente a «%s» -> motivo: %s', (clave, repeticion, motivo) => {
      const resultado = validarRepeticionClave(clave, repeticion);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBeDefined();
      expect(motivo).toBeTruthy();
    });
  });

  describe('validarTerminos', () => {
    it('es válido si está marcado (true)', () => {
      expect(validarTerminos(true).valido).toBe(true);
    });

    it('es inválido si no está marcado (false)', () => {
      const resultado = validarTerminos(false);
      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  validarRitmoCarrera,
  validarSeriesRepeticiones,
  validarFrecuenciaCardiaca,
  validadoresEntidad,
} from '../../js/validadores-entidad.js';

describe('Validadores de la entidad deportiva con it.each (S2-02 / Requisitos 13 y 21)', () => {
  describe('validarRitmoCarrera (combina regex y comprobación en código)', () => {
    it.each([
      ['03:45', true, 3, 45, 225, 'ritmo estándar 3:45'],
      ['4:12', true, 4, 12, 252, 'sin cero inicial en minutos'],
      ['02:00', true, 2, 0, 120, 'límite inferior fisiológico (2:00 min/km)'],
      ['15:00', true, 15, 0, 900, 'límite superior fisiológico (15:00 min/km)'],
      ['  5:30  ', true, 5, 30, 330, 'con espacios en los extremos'],
    ])('ritmo válido: «%s» -> %s (%s)', (valor, esperado, min, seg, total) => {
      const res = validarRitmoCarrera(valor);
      expect(res.valido).toBe(esperado);
      expect(res.minutos).toBe(min);
      expect(res.segundos).toBe(seg);
      expect(res.totalSegundos).toBe(total);
    });

    it.each([
      ['', 'cadena vacía'],
      [null, 'valor nulo'],
      ['04:60', 'segundos iguales a 60 (físicamente inválido)'],
      ['03:75', 'segundos superiores a 59 (75 segundos)'],
      ['01:59', 'por debajo del límite fisiológico (menos de 2 min/km)'],
      ['15:01', 'por encima del límite fisiológico (más de 15 min/km)'],
      ['4.30', 'uso de punto en lugar de dos puntos'],
      ['4 min/km', 'texto en vez de formato mm:ss'],
      ['100:00', 'más de 2 dígitos en minutos'],
      ['4:5', 'un solo dígito en segundos (debe ser ss)'],
    ])('ritmo no válido: «%s» -> motivo: %s', (valor) => {
      const res = validarRitmoCarrera(valor);
      expect(res.valido).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('validarSeriesRepeticiones (fuerza y ejercicios dinámicos)', () => {
    it.each([
      ['4x12', true, 4, 12, null, 'formato estándar 4x12'],
      ['3X10', true, 3, 10, null, 'con X mayúscula'],
      ['5*5', true, 5, 5, null, 'con asterisco como multiplicador'],
      ['4 x 15', true, 4, 15, null, 'con espacios alrededor de la x'],
      ['3x10@80kg', true, 3, 10, 80, 'con carga en kg pegada'],
      ['3x10 @ 80.5 kg', true, 3, 10, 80.5, 'con carga decimal y espacios'],
      ['1x1', true, 1, 1, null, 'límites inferiores mínimos'],
      ['50x200@500kg', true, 50, 200, 500, 'límites superiores máximos'],
    ])('formato válido: «%s» -> %s (%s)', (valor, esperado, series, reps, carga) => {
      const res = validarSeriesRepeticiones(valor);
      expect(res.valido).toBe(esperado);
      expect(res.series).toBe(series);
      expect(res.repeticiones).toBe(reps);
      expect(res.cargaKg).toBe(carga);
    });

    it.each([
      ['', 'cadena vacía'],
      [null, 'valor nulo'],
      ['cuatro series de diez', 'texto sin formato numérico'],
      ['0x10', 'cero series'],
      ['51x10', 'más de 50 series'],
      ['4x0', 'cero repeticiones'],
      ['4x201', 'más de 200 repeticiones'],
      ['4x12@-10kg', 'carga negativa'],
      ['4x12@501kg', 'carga superior a 500 kg'],
      ['4x', 'faltan repeticiones'],
      ['x12', 'faltan series'],
    ])('formato no válido: «%s» -> motivo: %s', (valor) => {
      const res = validarSeriesRepeticiones(valor);
      expect(res.valido).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('validarFrecuenciaCardiaca (rango fisiológico entre 40 y 240 bpm)', () => {
    it.each([
      ['155', true, 155, 'número simple en string'],
      [160, true, 160, 'número nativo'],
      ['155 bpm', true, 155, 'con sufijo bpm'],
      ['140bpm', true, 140, 'bpm sin espacio'],
      ['150 PPM', true, 150, 'con ppm en mayúsculas'],
      ['40', true, 40, 'límite inferior válido (40 bpm)'],
      ['240', true, 240, 'límite superior válido (240 bpm)'],
    ])('pulsaciones válidas: «%s» -> %s (%s)', (valor, esperado, bpm) => {
      const res = validarFrecuenciaCardiaca(valor);
      expect(res.valido).toBe(esperado);
      expect(res.bpm).toBe(bpm);
    });

    it.each([
      ['', 'cadena vacía'],
      [null, 'valor nulo'],
      [undefined, 'valor indefinido'],
      ['39', 'por debajo del rango fisiológico (39 bpm)'],
      ['241', 'por encima del rango fisiológico (241 bpm)'],
      ['0', 'cero pulsaciones'],
      ['-150', 'valor negativo'],
      ['cien', 'texto'],
      ['155 pulsaciones', 'unidad no admitida'],
    ])('pulsaciones no válidas: «%s» -> motivo: %s', (valor) => {
      const res = validarFrecuenciaCardiaca(valor);
      expect(res.valido).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('Mapa agrupador validadoresEntidad (Requisito 19)', () => {
    it('contiene las 3 funciones asociadas a sus claves de data-validar', () => {
      expect(typeof validadoresEntidad.ritmo).toBe('function');
      expect(typeof validadoresEntidad.ejercicioDetalle).toBe('function');
      expect(typeof validadoresEntidad.pulsaciones).toBe('function');
    });

    it('ejecuta correctamente la función mapeada', () => {
      expect(validadoresEntidad.ritmo('4:30').valido).toBe(true);
      expect(validadoresEntidad.ejercicioDetalle('3x10').valido).toBe(true);
      expect(validadoresEntidad.pulsaciones('150').valido).toBe(true);
    });
  });
});

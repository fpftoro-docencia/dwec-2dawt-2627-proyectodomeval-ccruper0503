import { expect } from '@playwright/test';

/**
 * Registra un nuevo usuario desde /registro.html y espera la redirección a /listado.html.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ nombreUsuario: string, correo: string, clave: string }} datos
 */
export async function registrarUsuario(page, { nombreUsuario, correo, clave }) {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre de usuario').fill(nombreUsuario);
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByLabel('Repite la contraseña').fill(clave);
  await page.getByLabel(/Acepto los términos/i).check();
  await page.getByRole('button', { name: 'Crear cuenta de deportista' }).click();
  await expect(page).toHaveURL(/\/listado\.html/);
}

/**
 * Inicia sesión desde /index.html y espera la redirección a /listado.html.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ identificador: string, clave: string }} credenciales
 */
export async function iniciarSesion(page, { identificador, clave }) {
  await page.goto('/index.html');
  await page.getByLabel('Usuario o Correo').fill(identificador);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Entrar al panel deportivo' }).click();
  await expect(page).toHaveURL(/\/listado\.html/);
}

/**
 * Cierra la sesión activa desde el botón de la cabecera privada.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function cerrarSesion(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/index\.html/);
}

/**
 * Da de alta un nuevo entrenamiento desde el botón «Nuevo entrenamiento» de listado.html.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} datos
 */
export async function crearEntrenamientoDesdeFicha(page, datos) {
  const hoy = new Date().toISOString().split('T')[0];

  await page.getByRole('link', { name: 'Nuevo entrenamiento' }).click();
  await expect(page).toHaveURL(/\/ficha\.html/);

  await page.getByLabel(/Título del entrenamiento/i).fill(datos.titulo);
  await page.getByLabel(/Disciplina deportiva/i).selectOption(datos.disciplina);
  await page.getByLabel(/Fecha del entrenamiento/i).fill(datos.fecha ?? hoy);
  await page.getByLabel('Horas de entrenamiento').fill(String(datos.horas ?? 0));
  await page.getByLabel('Minutos de entrenamiento').fill(String(datos.minutos ?? 45));

  if (datos.distancia !== undefined) {
    await page.getByLabel('Distancia (km)').fill(String(datos.distancia));
  }
  if (datos.frecuenciaCardiaca !== undefined) {
    await page.getByLabel('Pulso Medio (ppm)').fill(String(datos.frecuenciaCardiaca));
  }
  if (datos.calorias !== undefined) {
    await page.getByLabel('Calorías (kcal)').fill(String(datos.calorias));
  }

  if (datos.esCompeticion) {
    await page.getByLabel(/Esta sesión fue una competición/i).check();
    await page.getByLabel(/Nombre del Evento/i).fill(datos.nombreCompeticion);
    if (datos.dorsal) {
      await page.getByLabel('Dorsal / Posición').fill(datos.dorsal);
    }
  }

  await page
    .getByLabel(/Ejercicio \*/i)
    .first()
    .fill(datos.ejercicioNombre ?? 'Bloque principal');

  if (datos.ejercicioDetalle) {
    await page
      .getByLabel(/Series x Reps/i)
      .first()
      .fill(datos.ejercicioDetalle);
  }

  if (datos.notas) {
    await page.getByLabel('Notas del atleta').fill(datos.notas);
  }

  await page.getByRole('button', { name: 'Guardar entrenamiento' }).click();
  await expect(page).toHaveURL(/\/listado\.html/);
}

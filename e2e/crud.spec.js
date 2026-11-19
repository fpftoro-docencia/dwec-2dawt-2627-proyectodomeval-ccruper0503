import { test, expect } from '@playwright/test';
import { registrarUsuario, crearEntrenamientoDesdeFicha } from './ayudas.js';

test('CRUD completo: crear entrenamiento, recargar, editar y borrar con confirmación', async ({
  page,
}) => {
  await registrarUsuario(page, {
    nombreUsuario: 'atleta_crud',
    correo: 'atleta_crud@sportlog.es',
    clave: 'Password123',
  });

  // 1. Alta de un entrenamiento desde ficha.html (incluyendo campo condicional)
  await crearEntrenamientoDesdeFicha(page, {
    titulo: 'Media Maratón Primavera',
    disciplina: 'running',
    horas: 1,
    minutos: 35,
    distancia: '21.1',
    frecuenciaCardiaca: '164',
    calorias: '1150',
    esCompeticion: true,
    nombreCompeticion: 'Media Maratón Ciudad',
    dorsal: '#204',
    ejercicioNombre: 'Rodaje ritmo objetivo',
    ejercicioDetalle: '3x5@70kg',
    notas: 'Buenas sensaciones en el tramo final',
  });

  await expect(page.getByRole('status')).toContainText(
    'Nueva sesión de entrenamiento registrada con éxito.',
  );
  await expect(page.getByRole('heading', { name: 'Media Maratón Primavera' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Listado de entrenamientos' }).getByText('21.1 km'),
  ).toBeVisible();

  // 2. Comprobar persistencia tras recargar la página
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Media Maratón Primavera' })).toBeVisible();

  // 3. Edición del registro existente
  await page.getByRole('link', { name: 'Editar' }).click();
  await expect(page).toHaveURL(/\/ficha\.html\?id=/);
  await expect(page.getByLabel(/Título del entrenamiento/i)).toHaveValue('Media Maratón Primavera');

  await page.getByLabel(/Título del entrenamiento/i).fill('Media Maratón Editada');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page).toHaveURL(/\/listado\.html/);
  await expect(page.getByRole('status')).toContainText(
    'Sesión de entrenamiento actualizada con éxito.',
  );
  await expect(page.getByRole('heading', { name: 'Media Maratón Editada' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Media Maratón Editada' })).toBeVisible();

  // 4. Borrado con <dialog>: cancelar mantiene el registro; confirmar lo elimina
  await page.getByRole('button', { name: 'Borrar entrenamiento Media Maratón Editada' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Media Maratón Editada' })).toBeVisible();

  await page.getByRole('button', { name: 'Borrar entrenamiento Media Maratón Editada' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();

  await expect(page.getByRole('status')).toContainText('Entrenamiento eliminado correctamente.');
  await expect(page.getByText('Aún no hay entrenamientos guardados')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Aún no hay entrenamientos guardados')).toBeVisible();
});

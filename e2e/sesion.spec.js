import { test, expect } from '@playwright/test';
import { registrarUsuario, iniciarSesion, cerrarSesion } from './ayudas.js';

test('sesión y roles: registrarse como primer usuario (admin), cerrar sesión y volver a entrar', async ({
  page,
}) => {
  const credenciales = {
    nombreUsuario: 'admin_e2e',
    correo: 'admin_e2e@sportlog.es',
    clave: 'Password123',
  };

  // 1. El primer usuario registrado en un contexto limpio obtiene rol administrador
  await registrarUsuario(page, credenciales);
  await expect(page.getByRole('status')).toContainText('¡Bienvenido a SportLog, admin_e2e!');

  // 2. El menú muestra el enlace «Usuarios» reservado a administradores
  const enlaceUsuarios = page.getByRole('link', { name: 'Usuarios' });
  await expect(enlaceUsuarios).toBeVisible();

  await enlaceUsuarios.click();
  await expect(page).toHaveURL(/\/usuarios\.html/);
  await expect(page.getByRole('heading', { name: 'Gestión de usuarios y roles' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar rol (desactivado)' })).toBeDisabled();

  // 3. Cerrar sesión vuelve a index.html con aviso informativo
  await cerrarSesion(page);
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Has cerrado sesión correctamente.');

  // 4. Volver a iniciar sesión recupera el acceso completo de administrador
  await iniciarSesion(page, {
    identificador: credenciales.nombreUsuario,
    clave: credenciales.clave,
  });
  await expect(page.getByRole('status')).toContainText('¡Bienvenido de nuevo, admin_e2e!');
  await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
});

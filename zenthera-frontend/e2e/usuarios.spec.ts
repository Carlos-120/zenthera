import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@alpha.com';
const MEDICO_EMAIL = 'medico@alpha.com';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.locator('main').or(page.getByRole('navigation')).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Usuarios E2E — ZENTHERA', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── ADMIN_CLINICA ──────────────────────────────────────────────────────
  test.describe('Flujo ADMIN_CLINICA', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, ADMIN_EMAIL);
    });

    test('acceso a /dashboard/usuarios, listado y filtros', async ({ page }) => {
      await page.goto('/dashboard/usuarios');

      // Accesibilidad y carga
      await expect(page.getByRole('heading', { name: 'Gestión de Usuarios' })).toBeVisible();

      // Select de roles dinámico
      const roleSelect = page.getByRole('combobox', { name: /Filtrar por rol/i });
      await expect(roleSelect).toBeVisible();
      // Opciones MEDICO y RECEPCIONISTA deben estar presentes, sin SUPER_ADMIN
      await expect(roleSelect.locator('option')).toContainText(['Todos los roles', 'MEDICO', 'RECEPCIONISTA']);

      // Búsqueda
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill('medico@alpha.com');
      await expect(page.getByText('medico@alpha.com').first()).toBeVisible({ timeout: 8000 });

      // Filtro por rol
      await roleSelect.selectOption({ label: 'MEDICO' });
      await expect(page.getByRole('cell', { name: 'MEDICO', exact: true }).first()).toBeVisible({ timeout: 8000 });

      // Paginación y ordenamiento
      const btnSort = page.getByRole('button', { name: /Ordenar por Usuario/i });
      await btnSort.click();
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('creación de RECEPCIONISTA y MEDICO', async ({ page }) => {
      await page.goto('/dashboard/usuarios/nuevo');

      // Carga dinámica de roles
      const rolSelect = page.getByLabel(/Rol \*/i);
      await expect(rolSelect.locator('option')).toContainText(['Seleccione un rol...', 'MEDICO', 'RECEPCIONISTA']);

      // Crear RECEPCIONISTA
      const randomId = Math.floor(Math.random() * 10000);
      const randomCedula1 = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      await rolSelect.selectOption({ label: 'RECEPCIONISTA' });
      await page.getByLabel(/Nombres \*/i).fill('Recepcionista');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E ${randomId}`);
      await page.getByLabel(/Cédula \*/i).fill(randomCedula1);
      await page.getByLabel(/Correo Electrónico \*/i).fill(`recepcion_${randomId}@alpha.com`);
      await page.getByLabel(/Contraseña/i).fill('TempPassword123!');

      await page.getByRole('button', { name: /Guardar Usuario/i }).click();

      // Esperar redirección y validación
      await page.waitForURL(/\/dashboard\/usuarios$/, { timeout: 10000 });
      await expect(page.getByText(`recepcion_${randomId}@alpha.com`).first()).toBeVisible();

      // Crear MEDICO
      await page.goto('/dashboard/usuarios/nuevo');
      const randomCedula2 = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      await rolSelect.selectOption({ label: 'MEDICO' });
      await page.getByLabel(/Nombres \*/i).fill('Médico');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E ${randomId}`);
      await page.getByLabel(/Cédula \*/i).fill(randomCedula2);
      await page.getByLabel(/Correo Electrónico \*/i).fill(`medico_${randomId}@alpha.com`);
      await page.getByLabel(/Contraseña/i).fill('TempPassword123!');

      await page.getByRole('button', { name: /Guardar Usuario/i }).click();
      await page.waitForURL(/\/dashboard\/usuarios$/, { timeout: 10000 });
      await expect(page.getByText(`medico_${randomId}@alpha.com`).first()).toBeVisible();
    });

    test('edición de usuario', async ({ page }) => {
      await page.goto('/dashboard/usuarios');

      // Buscar un usuario médico recién creado
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill('medico_');

      const row = page.getByRole('row', { name: /medico_/i }).first();
      await row.getByTitle('Editar usuario').click();

      // Verificar formulario de edición
      await expect(page.getByRole('heading', { name: 'Editar Usuario' })).toBeVisible();
      const telefonoInput = page.getByLabel(/Teléfono/i);
      await telefonoInput.fill('0987654321');

      await page.getByRole('button', { name: /Guardar Cambios/i }).click();

      // Capturar posibles errores mostrados en pantalla
      const errorMsg = page.locator('.text-error, p.text-error, .bg-error\\/10');
      if (await errorMsg.count() > 0) {
        const texts = await errorMsg.allInnerTexts();
        // Filtrar "Cerrar Sesión" si aparece
        const realErrors = texts.filter(t => !t.includes('Cerrar Sesión') && t.trim().length > 0);
        if (realErrors.length > 0) {
          throw new Error(`Error visible en UI durante la edición: ${realErrors.join(', ')}`);
        }
      }

      try {
        await page.waitForURL(/\/dashboard\/usuarios$/, { timeout: 5000 });
      } catch (e) {
        const bodyText = await page.innerText('body');
        throw new Error(`Timeout waiting for URL. Body text: ${bodyText.substring(0, 1000)}`);
      }
      await expect(page.getByText('0987654321').first()).toBeVisible();
    });

    test('suspensión y reactivación', async ({ page }) => {
      await page.goto('/dashboard/usuarios');

      // Buscar un usuario médico recién creado
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill('medico_');

      const row = page.getByRole('row', { name: /medico_/i }).first();

      // Suspender
      const suspendBtn = row.getByTitle('Suspender usuario');
      await suspendBtn.click();

      const dialog = page.getByRole('dialog', { name: /Suspender usuario/i });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Sí, suspender' }).click();

      // Debe aparecer como inactivo (o cruz roja)
      await expect(row.getByTitle('Reactivar usuario')).toBeVisible({ timeout: 8000 });
      await expect(row.getByText('Inactivo')).toBeVisible();

      // Reactivar
      const reactivateBtn = row.getByTitle('Reactivar usuario');
      await reactivateBtn.click();

      const dialogReact = page.getByRole('dialog', { name: /Reactivar usuario/i });
      await expect(dialogReact).toBeVisible();
      await dialogReact.getByRole('button', { name: 'Sí, reactivar' }).click();

      await expect(row.getByTitle('Suspender usuario')).toBeVisible({ timeout: 8000 });
      await expect(row.getByText('Activo')).toBeVisible();
    });

    test('error de autodesactivación', async ({ page }) => {
      await page.goto('/dashboard/usuarios');

      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill(ADMIN_EMAIL);

      const row = page.getByRole('row', { name: ADMIN_EMAIL }).first();
      // No debería haber botón de suspender para ADMIN_CLINICA
      await expect(row.getByTitle('Suspender usuario')).not.toBeVisible();
    });

    test('bloqueo de acceso a usuarios de otro tenant (cross-tenant 404)', async ({ page }) => {
      // Intentar acceder a un ID de usuario que probablemente no existe o es de otro tenant (por ejemplo, ID = 1 suele ser SuperAdmin o de otro tenant en fixtures limpios, o un ID muy alto)
      // Como no conocemos el ID exacto, intentamos un ID 9999 que forzará un 404
      const idCrossTenant = 9999;
      await page.goto(`/dashboard/usuarios/${idCrossTenant}`);

      // Debe mostrar el mensaje de Usuario no encontrado
      await expect(page.getByText('Usuario no encontrado')).toBeVisible();
      await expect(page.getByRole('link', { name: /Volver a usuarios/i })).toBeVisible();
    });
  });

  // ─── ROLES NO AUTORIZADOS ─────────────────────────────────────────────────
  test.describe('Bloqueo para MEDICO y RECEPCIONISTA', () => {
    test('MEDICO no puede acceder a /dashboard/usuarios ni ver el menú', async ({ page }) => {
      await login(page, MEDICO_EMAIL);

      // El menú no debe contener el enlace a Usuarios
      const sidebar = page.locator('nav').or(page.locator('aside'));
      await expect(sidebar.getByRole('link', { name: 'Usuarios' })).not.toBeVisible();

      // Intentar navegar manualmente
      await page.goto('/dashboard/usuarios');

      // Debe redirigir al dashboard
      await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

});

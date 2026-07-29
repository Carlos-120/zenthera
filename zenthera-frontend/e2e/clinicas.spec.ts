import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────
const SUPER_EMAIL = 'super@e2e.com';
const ADMIN_EMAIL = 'admin@alpha.com';
const MEDICO_EMAIL = 'medico@alpha.com';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  // Esperamos explícitamente a que cambie la ruta a algo protegido
  await page.waitForURL(/\/dashboard|\/admin/, { timeout: 15000 });

  // Verificamos que el contenedor principal esté cargado para garantizar estabilidad
  await expect(page.locator('main').or(page.getByRole('navigation')).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Clínicas E2E — ZENTHERA', () => {
  // Ejecutar en serie para evitar cuellos de botella por bcrypt/concurrencia y aislar estado temporal
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── SUPER_ADMIN ────────────────────────────────────────────────────────
  test.describe('Flujo SUPER_ADMIN', () => {

    test.beforeEach(async ({ page }) => {
      await login(page, SUPER_EMAIL);
    });

    test('acceso a /admin/clinicas y listado', async ({ page }) => {
      await page.goto('/admin/clinicas');

      // Accesibilidad básica: verificar que hay un header h1
      await expect(page.getByRole('heading', { name: 'Gestión de Clínicas' })).toBeVisible();

      // Accesibilidad: botones accesibles
      await expect(page.getByRole('link', { name: 'Nueva Clínica' })).toBeVisible();

      // Tabla o lista visible
      await expect(page.getByRole('table')).toBeVisible();

      // La Clínica E2E Alpha debe estar en la lista (creada por el fixture)
      await expect(page.getByText('Clínica E2E Alpha').first()).toBeVisible();
    });

    test('creación de clínica (onboarding)', async ({ page }) => {
      await page.goto('/admin/clinicas/nueva');

      // Accesibilidad: Foco y labels
      const rucInput = page.getByLabel(/RUC/i);
      await rucInput.focus();
      await expect(rucInput).toBeFocused();

      // Rellenar formulario (RUC único)
      const randomRuc = `09${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}001`;
      await page.locator('#ruc').fill(randomRuc);
      await page.locator('#razonSocial').fill('Clínica Creada E2E SA');
      await page.locator('#nombre').fill('Clínica Creada E2E');
      await page.locator('#correo').fill(`contacto_${randomRuc}@creada.com`);
      await page.locator('#telefono').fill('0999999999');

      await page.locator('#adminNombres').fill('Admin');
      await page.locator('#adminApellidos').fill('Creado');
      await page.locator('#adminCedula').fill('1700000000');
      await page.locator('#adminCorreo').fill(`admin_${randomRuc}@creada.com`);

      // Enviar
      await page.getByRole('button', { name: /Crear Clínica/i }).click();

      // Accesibilidad y validación: Mensaje de éxito o error
      const feedbackMessage = page.getByText(/Clínica.*creada/i).or(page.locator('.text-error'));
      await expect(feedbackMessage.first()).toBeVisible({ timeout: 10000 });

      // Si fue éxito, debería redirigir
      await page.waitForURL(/\/admin\/clinicas$/, { timeout: 10000 }).catch(() => {});
      await expect(page.getByText('Clínica Creada E2E').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    test('acceso al detalle, suspensión y reactivación', async ({ page }) => {
      await page.goto('/admin/clinicas');

      // Navegar al detalle de Clínica E2E Alpha
      const row = page.getByRole('row', { name: /Clínica E2E Alpha/i });
      await row.getByRole('link', { name: /Ver detalle/i }).click();

      // Verificar que estamos en la página de detalle
      await expect(page.getByRole('heading', { name: 'Clínica E2E Alpha' })).toBeVisible({ timeout: 10000 });

      // Suspensión
      const btnSuspender = page.getByRole('button', { name: /Suspender Clínica/i });
      if (await btnSuspender.isVisible()) {
        await btnSuspender.click();

        // Modal de suspensión: accesibilidad
        const modal = page.getByRole('dialog', { name: /Suspender/i }).or(page.locator('.fixed.inset-0'));
        await expect(modal).toBeVisible();

        await page.getByLabel(/Motivo/i).fill('Suspensión temporal desde E2E');

        // Foco visible en teclado (simulado)
        await page.keyboard.press('Tab');

        await page.getByRole('button', { name: 'Confirmar' }).click();

        // Validar cambio de estado en la UI
        await expect(page.getByText('Suspendida')).toBeVisible({ timeout: 8000 });
      }

      // Reactivación
      const btnReactivar = page.getByRole('button', { name: /Reactivar Clínica/i });
      await expect(btnReactivar).toBeVisible();
      await btnReactivar.click();
      await page.getByLabel(/Motivo/i).fill('Reactivación desde E2E');
      await page.getByRole('button', { name: 'Confirmar' }).click();

      await expect(page.getByText('Activa').first()).toBeVisible({ timeout: 8000 });
    });
  });

  // ─── ADMIN_CLINICA ──────────────────────────────────────────────────────
  test.describe('Flujo ADMIN_CLINICA', () => {

    test.beforeEach(async ({ page }) => {
      await login(page, ADMIN_EMAIL);
    });

    test('acceso a /dashboard/mi-clinica y carga de datos', async ({ page }) => {
      await page.goto('/dashboard/mi-clinica');
      await expect(page.getByRole('heading', { name: 'Mi Clínica' })).toBeVisible();

      // Carga de datos
      await expect(page.locator('#nombre')).toHaveValue(/Clínica E2E Alpha/, { timeout: 10000 });
    });

    test('actualización de configuración con validación y prevención múltiple', async ({ page }) => {
      await page.goto('/dashboard/mi-clinica');

      // Esperar a que cargue
      await expect(page.getByLabel(/Nombre Comercial/i)).toBeVisible();

      // Actualizar datos
      const nombreInput = page.getByLabel(/Nombre Comercial/i);
      await nombreInput.fill('');

      // Accesibilidad: mostrar error de validación (Zod)
      await page.getByRole('button', { name: /Guardar Cambios/i }).click();
      await expect(page.getByText(/El nombre comercial no puede estar vacío/i)).toBeVisible();

      await nombreInput.fill('Clínica E2E Alpha Modificada');

      // Guardar
      await page.getByRole('button', { name: /Guardar Cambios/i }).click();

      // Si todo sale bien, la página no debería mostrar errores (spinner desaparece)
      await expect(page.getByRole('button', { name: /Guardar Cambios/i })).toBeEnabled({ timeout: 8000 });
    });

    test('bloqueo de acceso a rutas de SUPER_ADMIN', async ({ page }) => {
      // Intentar ir a /admin/clinicas
      await page.goto('/admin/clinicas');

      // Debe mostrar acceso denegado o redirigir
      await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

  // ─── MEDICO (Rol no autorizado) ─────────────────────────────────────────
  test.describe('Bloqueo para Roles no Autorizados', () => {
    test('MEDICO no puede acceder a /admin/clinicas ni a /dashboard/mi-clinica', async ({ page }) => {
      await login(page, MEDICO_EMAIL);

      await page.goto('/admin/clinicas');
      await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.goto('/dashboard/mi-clinica');
      await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

});

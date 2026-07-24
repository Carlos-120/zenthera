import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ALPHA_EMAIL = 'medico@alpha.com';
const BETA_EMAIL  = 'medico@beta.com';
const PASSWORD    = process.env.E2E_PASSWORD ?? '';

async function login(page: Page, email: string, pwd: string) {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(pwd);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
}

async function loginSuccess(page: Page, email = ALPHA_EMAIL) {
  await login(page, email, PASSWORD);
  await page.waitForURL('/dashboard', { timeout: 10_000 });
}

// ─── Suite ──────────────────────────────────────────────────────────────────

test.describe('Auth E2E — ZENTHERA', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // 1. Credenciales incorrectas
  test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
    await login(page, ALPHA_EMAIL, 'contraseña_erronea');

    const alert = page
      .getByRole('alert')
      .filter({ hasText: /Credenciales incorrectas o acceso denegado/i });

    await expect(alert).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL('/login');
  });

  // 2. Login correcto → dashboard
  test('login correcto redirige al dashboard y muestra la clínica', async ({ page }) => {
    await loginSuccess(page);
    await expect(page.getByText('Clínica E2E Alpha')).toBeVisible({ timeout: 8_000 });
  });

  // 3. Ruta protegida redirige si no hay sesión
  test('ruta protegida /dashboard redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  // 4. Recarga y recuperación de sesión via refresh token
  test('recarga de página reanuda sesión via refresh token', async ({ page }) => {
    await loginSuccess(page);
    await expect(page.getByText('Clínica E2E Alpha')).toBeVisible({ timeout: 8_000 });

    // F5
    await page.reload();

    // AuthProvider debe recuperar sesión silenciosamente
    await expect(page).toHaveURL('/dashboard', { timeout: 12_000 });
    await expect(page.getByText('Clínica E2E Alpha')).toBeVisible({ timeout: 8_000 });
  });

  // 5. Aislamiento multi-tenant: Beta no ve datos de Alpha
  test('usuario Beta ve Clínica E2E Beta, no Alpha', async ({ page }) => {
    await loginSuccess(page, BETA_EMAIL);

    await expect(page.getByText('Clínica E2E Beta')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Clínica E2E Alpha')).not.toBeVisible();
  });

  // 6. Logout completo
  test('logout limpia la sesión y bloquea el regreso al dashboard', async ({ page }) => {
    await loginSuccess(page);

    // Botón de cerrar sesión
    await page.getByRole('button', { name: /Cerrar Sesión/i }).click();
    await page.waitForURL('/login', { timeout: 10_000 });
    await expect(page).toHaveURL('/login');

    // Intento de volver al dashboard tras logout
    await page.goto('/dashboard');
    await page.waitForURL('/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

});

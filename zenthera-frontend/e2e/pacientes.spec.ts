import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@alpha.com';
const MEDICO_EMAIL = 'medico@alpha.com';
const RECEPCIONISTA_EMAIL = 'recepcionista@alpha.com';
const SUPER_ADMIN_EMAIL = 'super@e2e.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'TempPassword123!';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.locator('main').or(page.getByRole('navigation')).first()).toBeVisible({ timeout: 10000 });
}

test.describe('Pacientes E2E — ZENTHERA', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── ADMIN_CLINICA ──────────────────────────────────────────────────────
  test.describe('Flujo ADMIN_CLINICA', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, ADMIN_EMAIL);
    });

    test('acceso a /dashboard/pacientes, listado, filtros y ordenamiento', async ({ page }) => {
      await page.goto('/dashboard/pacientes');

      // Accesibilidad y carga
      await expect(page.getByRole('heading', { name: 'Directorio de Pacientes' })).toBeVisible();

      // Filtro de activos/inactivos
      const btnFiltro = page.getByRole('button', { name: /Todos los estados/i });
      await expect(btnFiltro).toBeVisible();

      // Búsqueda
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill('paciente_e2e_inexistente_123'); // Para forzar empty state
      await expect(page.getByText('No se encontraron pacientes')).toBeVisible({ timeout: 8000 });

      // Reinicio de búsqueda
      await searchInput.fill('');

      // Paginación y ordenamiento
      const btnSort = page.getByRole('button', { name: /Ordenar por Paciente/i });
      await btnSort.click();
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('creación de Paciente, validaciones de Zod y conflicto 409', async ({ page }) => {
      await page.goto('/dashboard/pacientes/nuevo');

      // Enviar formulario vacío para disparar validaciones
      await page.getByRole('button', { name: /Crear Paciente/i }).click();

      // Comprobar mensajes de Zod
      await expect(page.getByText('Los nombres deben tener al menos 2 caracteres')).toBeVisible();
      await expect(page.getByText('La cédula debe tener exactamente 10 dígitos')).toBeVisible();

      // Rellenar con cédula inválida
      await page.getByLabel(/Cédula/i).fill('123');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();
      await expect(page.getByText('La cédula debe tener exactamente 10 dígitos')).toBeVisible();

      // Llenar formulario con datos correctos
      const randomId = Math.floor(Math.random() * 10000);
      const randomCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      await page.getByLabel(/Nombres \*/i).fill('Paciente');
      await page.getByLabel(/Apellidos \*/i).fill(`Alpha ${randomId}`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByLabel(/Sexo/i).selectOption('MASCULINO');
      // Campos opcionales vacíos se envían correctamente (ej. teléfono, correo)

      await page.getByRole('button', { name: /Crear Paciente/i }).click();

      // Debe redirigir al detalle
      try {
        await page.waitForURL(/\/dashboard\/pacientes\/\d+/, { timeout: 10000 });
      } catch (e) {
        const bodyText = await page.innerText('body');
        throw new Error(`Timeout waiting for URL. Body text: ${bodyText.substring(0, 1000)}`);
      }
      try {
        await expect(page.getByRole('heading', { name: 'Detalle del Paciente' })).toBeVisible({ timeout: 10000 });
      } catch (e) {
        const bodyText = await page.innerText('body');
        throw new Error(`Detalle no cargó. Body text: ${bodyText.substring(0, 1000)}`);
      }

      // Volver a la creación para probar 409 con la misma cédula
      await page.goto('/dashboard/pacientes/nuevo');
      await page.getByLabel(/Nombres \*/i).fill('Paciente Duplicado');
      await page.getByLabel(/Apellidos \*/i).fill(`Beta ${randomId}`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();

      // Capturar el error visual de duplicado (sin alert)
      const errorMsg = page.locator('.bg-error\\/10');
      await expect(errorMsg).toBeVisible({ timeout: 8000 });
      // El backend debe responder con conflicto y el frontend debe mostrarlo.
    });

    test('edición de Paciente, botón deshabilitado si no hay cambios', async ({ page }) => {
      // Necesitamos un paciente primero
      await page.goto('/dashboard/pacientes/nuevo');
      const randomId = Math.floor(Math.random() * 10000);
      const randomCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      await page.getByLabel(/Nombres \*/i).fill('Paciente Edit');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E ${randomId}`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();
      await page.waitForURL(/\/dashboard\/pacientes\/\d+/, { timeout: 10000 });

      // Verificamos el botón "Guardar Cambios" deshabilitado inicialmente (isDirty = false)
      const btnGuardar = page.getByRole('button', { name: /Guardar Cambios/i });
      await expect(btnGuardar).toBeDisabled();

      // Modificamos un campo
      const telefonoInput = page.getByLabel(/Teléfono de Emergencia/i);
      await telefonoInput.fill('0999999999');

      // Botón debe estar habilitado
      await expect(btnGuardar).toBeEnabled();
      await btnGuardar.click();

      // Debe redirigir al listado tras éxito
      await page.waitForURL(/\/dashboard\/pacientes$/, { timeout: 10000 });

      // Buscamos el editado
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill(randomCedula);
      await expect(page.getByRole('cell', { name: randomCedula }).first()).toBeVisible({ timeout: 8000 });
    });

    test('suspensión y reactivación (PATCH de estado)', async ({ page }) => {
      // Crear un paciente específico para esta prueba
      await page.goto('/dashboard/pacientes/nuevo');
      const randomCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      await page.getByLabel(/Nombres \*/i).fill('Paciente Estado');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();
      await page.waitForURL(/\/dashboard\/pacientes\/\d+/, { timeout: 10000 });

      // Ir al listado y buscarlo
      await page.goto('/dashboard/pacientes');
      const searchInput = page.getByPlaceholder(/Buscar/i);
      await searchInput.fill(randomCedula);
      const row = page.getByRole('row', { name: randomCedula }).first();

      // Suspender
      const suspendBtn = row.getByTitle('Suspender paciente');
      await suspendBtn.click();

      const dialog = page.getByRole('dialog', { name: /Suspender paciente/i });
      await expect(dialog).toBeVisible();
      // Validar Escape cierra
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();

      // Reabrir y confirmar
      await suspendBtn.click();
      await page.getByRole('dialog').getByRole('button', { name: 'Sí, suspender' }).click();

      // Debe aparecer como inactivo
      await expect(row.getByTitle('Reactivar paciente')).toBeVisible({ timeout: 8000 });
      await expect(row.getByText('Inactivo')).toBeVisible();

      // Reactivar
      const reactivateBtn = row.getByTitle('Reactivar paciente');
      await reactivateBtn.click();

      const dialogReact = page.getByRole('dialog', { name: /Reactivar paciente/i });
      await expect(dialogReact).toBeVisible();
      await dialogReact.getByRole('button', { name: 'Sí, reactivar' }).click();

      await expect(row.getByTitle('Suspender paciente')).toBeVisible({ timeout: 8000 });
      await expect(row.getByText('Activo')).toBeVisible();
    });

    test('seguridad cross-tenant (404 amigable)', async ({ page, request }) => {
      // 1. Iniciar sesión como MEDICO_BETA (Clínica B) por API para crear un paciente real
      const MEDICO_BETA_EMAIL = 'medico@beta.com';
      const loginBetaRes = await request.post('http://localhost:8080/api/v1/auth/login', {
        headers: {
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: { correo: MEDICO_BETA_EMAIL, password: PASSWORD }
      });
      const betaAuth = await loginBetaRes.json();
      if (!betaAuth.success) console.log('BETA AUTH ERROR:', betaAuth);
      const tokenBeta = betaAuth.data.accessToken;

      // 2. Crear paciente real en Clínica B
      const betaCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      const createBetaRes = await request.post('http://localhost:8080/api/v1/clinica/pacientes', {
        headers: {
          Authorization: `Bearer ${tokenBeta}`,
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
          nombres: 'Paciente de',
          apellidos: 'Clínica Beta',
          cedula: betaCedula,
          fechaNacimiento: '1985-05-20',
          sexo: 'MASCULINO',
          correo: 'paciente@beta.com',
          telefono: '0999999999'
        }
      });
      const pacienteBeta = await createBetaRes.json();
      const idCrossTenant = pacienteBeta.data.id;

      // Verificar existencia real en Clínica B
      const verifyBetaRes = await request.get(`http://localhost:8080/api/v1/clinica/pacientes/${idCrossTenant}`, {
        headers: {
          Authorization: `Bearer ${tokenBeta}`,
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      expect(verifyBetaRes.status()).toBe(200);

      // 3. Probar aislamiento desde Clínica A (usuario actual en test: ADMIN_CLINICA)
      const loginAlphaRes = await request.post('http://localhost:8080/api/v1/auth/login', {
        headers: {
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: { correo: ADMIN_EMAIL, password: PASSWORD }
      });
      const alphaAuth = await loginAlphaRes.json();
      const tokenAlpha = alphaAuth.data.accessToken;

      // GET debe responder 404
      const getRes = await request.get(`http://localhost:8080/api/v1/clinica/pacientes/${idCrossTenant}`, {
        headers: {
          Authorization: `Bearer ${tokenAlpha}`,
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      expect(getRes.status()).toBe(404);

      // PUT debe responder 404
      const putRes = await request.put(`http://localhost:8080/api/v1/clinica/pacientes/${idCrossTenant}`, {
        headers: {
          Authorization: `Bearer ${tokenAlpha}`,
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: {
          nombres: 'Intento',
          apellidos: 'Hacking',
          cedula: betaCedula,
          fechaNacimiento: '1985-05-20',
          sexo: 'MASCULINO'
        }
      });
      expect(putRes.status()).toBe(404);

      // PATCH debe responder 404
      const patchRes = await request.patch(`http://localhost:8080/api/v1/clinica/pacientes/${idCrossTenant}/estado`, {
        headers: {
          Authorization: `Bearer ${tokenAlpha}`,
          Origin: 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest'
        },
        data: { activo: false }
      });
      expect(patchRes.status()).toBe(404);

      // 4. Verificar aislamiento en UI
      await page.goto(`/dashboard/pacientes/${idCrossTenant}`);

      // Debe mostrar 404
      await expect(page.getByText('Paciente no encontrado')).toBeVisible();
      await expect(page.getByRole('link', { name: /Volver al directorio/i })).toBeVisible();
    });
  });

  // ─── MEDICO ─────────────────────────────────────────────────────────────
  test.describe('Flujo MEDICO', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, MEDICO_EMAIL);
    });

    test('MEDICO puede crear y editar, pero NO cambiar estado', async ({ page }) => {
      await page.goto('/dashboard/pacientes');

      // Listado accesible
      await expect(page.getByRole('heading', { name: 'Directorio de Pacientes' })).toBeVisible();

      // Comprobar que no existe el botón Suspender/Reactivar
      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await expect(rows.first().getByTitle('Suspender paciente')).not.toBeVisible();
        await expect(rows.first().getByTitle('Reactivar paciente')).not.toBeVisible();
      }

      // Crear paciente como MEDICO
      await page.goto('/dashboard/pacientes/nuevo');
      const randomId = Math.floor(Math.random() * 10000);
      const randomCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      await page.getByLabel(/Nombres \*/i).fill('Paciente Médico');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E ${randomId}`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();

      // Debe redirigir al detalle
      await page.waitForURL(/\/dashboard\/pacientes\/\d+/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Detalle del Paciente' })).toBeVisible();

      // Editar
      const correoInput = page.getByLabel(/Correo Electrónico/i);
      await correoInput.fill(`correo_${randomId}@test.com`);
      await page.getByRole('button', { name: /Guardar Cambios/i }).click();
      await page.waitForURL(/\/dashboard\/pacientes$/, { timeout: 10000 });
    });
  });

  // ─── RECEPCIONISTA ──────────────────────────────────────────────────────
  test.describe('Flujo RECEPCIONISTA', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, RECEPCIONISTA_EMAIL);
    });

    test('RECEPCIONISTA puede crear y editar, pero NO cambiar estado', async ({ page }) => {
      await page.goto('/dashboard/pacientes');

      await expect(page.getByRole('heading', { name: 'Directorio de Pacientes' })).toBeVisible();

      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        await expect(rows.first().getByTitle('Suspender paciente')).not.toBeVisible();
        await expect(rows.first().getByTitle('Reactivar paciente')).not.toBeVisible();
      }

      // Crear paciente como RECEPCIONISTA
      await page.goto('/dashboard/pacientes/nuevo');
      const randomId = Math.floor(Math.random() * 10000);
      const randomCedula = `17${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

      await page.getByLabel(/Nombres \*/i).fill('Paciente Recep');
      await page.getByLabel(/Apellidos \*/i).fill(`E2E ${randomId}`);
      await page.getByLabel(/Cédula/i).fill(randomCedula);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-05-15');
      await page.getByRole('button', { name: /Crear Paciente/i }).click();

      await page.waitForURL(/\/dashboard\/pacientes\/\d+/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: 'Detalle del Paciente' })).toBeVisible();
    });
  });

  // ─── ROLES NO AUTORIZADOS ─────────────────────────────────────────────────
  test.describe('Bloqueo para SUPER_ADMIN', () => {
    test('SUPER_ADMIN no debe tener acceso a clínica', async ({ page }) => {
      await login(page, SUPER_ADMIN_EMAIL);

      await page.goto('/dashboard/pacientes');

      // Debe redirigir al dashboard base o admin (fuera del contexto de clínica)
      // Wait for it to settle and ensure it's not the pacientes page.
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/\/dashboard\/pacientes$/);
    });
  });

});

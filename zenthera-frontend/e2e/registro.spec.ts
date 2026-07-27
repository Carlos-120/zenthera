import { expect, Page, test } from '@playwright/test';
import { randomBytes } from 'crypto';
import {
  consumeActivationToken,
  expectActivationTokenAlreadyConsumed,
} from './helpers/activationToken';
import { cleanupRegisteredClinic } from './helpers/database';

const API_URL = 'http://localhost:8080';
const E2E_TOKEN_CONSUME_URL =
  'http://127.0.0.1:8080/api/v1/e2e/activation-token/consume';

type RegistrationIdentity = {
  runMarker: string;
  ruc: string;
  razonSocial: string;
  nombre: string;
  correo: string;
  telefono: string;
  adminNombres: string;
  adminApellidos: string;
  adminCedula: string;
  adminCorreo: string;
};

function requiredEnvironmentVariable(
  name: 'E2E_TEST_KEY' | 'E2E_DATABASE_URL' | 'E2E_DATABASE_SCHEMA' | 'E2E_PASSWORD',
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(name);
  }

  return value;
}

function requiredEnvironment(): { password: string } {
  requiredEnvironmentVariable('E2E_TEST_KEY');
  requiredEnvironmentVariable('E2E_DATABASE_URL');
  requiredEnvironmentVariable('E2E_DATABASE_SCHEMA');

  return { password: requiredEnvironmentVariable('E2E_PASSWORD') };
}

function createRegistrationIdentity(): RegistrationIdentity {
  const timestamp = Date.now().toString(36).slice(-6);
  const random = randomBytes(3).toString('hex');
  const suffix = `${timestamp}${random}`;

  return {
    runMarker: suffix,
    ruc: `9${timestamp}${random}`.slice(0, 13),
    razonSocial: `E2E ${suffix}`,
    nombre: `E2E ${suffix}`,
    correo: `clinic-${suffix}@e2e.invalid`,
    telefono: `09${timestamp}${random}`.slice(0, 20),
    adminNombres: 'Registro',
    adminApellidos: 'E2E',
    adminCedula: `1${timestamp}${random}`.slice(0, 20),
    adminCorreo: `admin-${suffix}@e2e.invalid`,
  };
}

async function submitLogin(page: Page, correo: string, password: string) {
  await page.getByLabel('Correo Electr\u00f3nico').fill(correo);
  await page.getByLabel('Contrase\u00f1a').fill(password);
  await page.getByRole('button', { name: 'Iniciar Sesi\u00f3n' }).click();
}

test.describe('Registro p\u00fablico de cl\u00ednica E2E', () => {
  test.beforeAll(() => {
    requiredEnvironment();
  });

  test('registra, activa y autentica un ADMIN_CLINICA sin dejar datos residuales', async ({ page, request }) => {
    const { password } = requiredEnvironment();
    const identity = createRegistrationIdentity();
    let token: string | undefined;
    let mainFailure = false;

    try {
      await page.goto('/registro');
      await expect(page.getByRole('heading', { name: 'Registra tu cl\u00ednica' })).toBeVisible();

      await page.getByLabel('RUC').fill(identity.ruc);
      await page.getByLabel('Raz\u00f3n social').fill(identity.razonSocial);
      await page.getByLabel('Nombre de la cl\u00ednica').fill(identity.nombre);
      await page.getByLabel('Correo de la cl\u00ednica').fill(identity.correo);
      await page.getByLabel('Tel\u00e9fono').fill(identity.telefono);
      await page.getByLabel('Nombres').fill(identity.adminNombres);
      await page.getByLabel('Apellidos').fill(identity.adminApellidos);
      await page.getByLabel('C\u00e9dula del administrador').fill(identity.adminCedula);
      await page.getByLabel('Correo del administrador').fill(identity.adminCorreo);
      await page.getByLabel(/^Contrase\u00f1a$/).fill(password);
      await page.getByLabel('Confirmar contrase\u00f1a').fill(password);

      await Promise.all([
        page.waitForURL('/login?registered=1'),
        page.getByRole('button', { name: 'Registrar cl\u00ednica' }).click(),
      ]);
      await expect(page.getByRole('status')).toContainText('Cl\u00ednica registrada correctamente');

      let preActivationMeCalled = false;
      const capturePreActivationMe = (request: { url(): string }) => {
        if (request.url().endsWith('/api/v1/auth/me')) {
          preActivationMeCalled = true;
        }
      };
      page.on('request', capturePreActivationMe);
      try {
        await submitLogin(page, identity.adminCorreo, password);
        await expect(
          page.getByRole('alert').filter({ hasText: 'Credenciales incorrectas o acceso denegado.' }),
        ).toContainText('Credenciales incorrectas o acceso denegado.');
        await expect(page).toHaveURL('/login?registered=1');
        await expect(page).not.toHaveURL(/\/dashboard(?:\/|$)/);
        expect(preActivationMeCalled).toBe(false);
        expect((await page.context().cookies()).some((cookie) => cookie.name === 'refreshToken')).toBe(false);
      } finally {
        page.off('request', capturePreActivationMe);
      }

      const unauthorizedTokenResponse = await request.post(E2E_TOKEN_CONSUME_URL, {
        data: { adminCorreo: identity.adminCorreo },
      });
      expect(unauthorizedTokenResponse.status()).toBe(403);

      token = await consumeActivationToken(request, identity.adminCorreo);
      await page.goto(`/activate?token=${encodeURIComponent(token)}`);
      await expect(page.getByRole('heading', { name: 'Activar Cuenta' })).toBeVisible();
      await page.getByLabel('Nueva Contrase\u00f1a').fill(password);
      await page.getByRole('textbox', { name: 'Confirmar Contrase\u00f1a' }).fill(password);
      await page.getByRole('button', { name: 'Activar Cuenta' }).click();
      await expect(page.getByRole('heading', { name: '\u00a1Cuenta Activada!' })).toBeVisible();

      await expectActivationTokenAlreadyConsumed(request, identity.adminCorreo);
      token = undefined;

      await page.goto('/login');
      const loginResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST'
          && response.url() === `${API_URL}/api/v1/auth/login`
          && response.status() === 200,
      );
      await Promise.all([
        page.waitForURL('/dashboard'),
        submitLogin(page, identity.adminCorreo, password),
      ]);
      const loginBody: unknown = await (await loginResponse).json();
      const accessToken =
        typeof loginBody === 'object' && loginBody !== null && 'data' in loginBody
          ? (loginBody as { data?: { accessToken?: unknown } }).data?.accessToken
          : undefined;
      expect(typeof accessToken).toBe('string');

      await expect(page.getByText('Panel de control principal de la cl\u00ednica')).toBeVisible();
      const meResponse = await page.context().request.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(meResponse.status()).toBe(200);
      const meBody: unknown = await meResponse.json();
      const profile =
        typeof meBody === 'object' && meBody !== null && 'data' in meBody
          ? (meBody as { data?: { rol?: unknown; clinicaNombre?: unknown } }).data
          : undefined;
      expect(profile?.rol).toBe('ADMIN_CLINICA');
      expect(profile?.clinicaNombre).toBe(identity.nombre);

      await Promise.all([
        page.waitForURL('/login'),
        page.getByRole('button', { name: 'Cerrar Sesi\u00f3n' }).click(),
      ]);
    } catch (error) {
      mainFailure = true;
      throw error;
    } finally {
      token = undefined;
      try {
        await cleanupRegisteredClinic({
          adminCorreo: identity.adminCorreo,
          clinicaRuc: identity.ruc,
          clinicaCorreo: identity.correo,
          clinicaNombre: identity.nombre,
          runMarker: identity.runMarker,
        });
      } catch {
        if (!mainFailure) {
          throw new Error('Registered clinic cleanup failed.');
        }
        test.info().annotations.push({ type: 'cleanup', description: 'failed' });
      }
    }
  });
});

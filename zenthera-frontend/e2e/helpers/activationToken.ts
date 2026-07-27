import { APIRequestContext } from '@playwright/test';

const ACTIVATION_TOKEN_CONSUME_URL =
  'http://127.0.0.1:8080/api/v1/e2e/activation-token/consume';

function requiredEnvironmentVariable(name: 'E2E_TEST_KEY'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(name);
  }

  return value;
}

export async function consumeActivationToken(
  request: APIRequestContext,
  adminCorreo: string,
): Promise<string> {
  const response = await request.post(ACTIVATION_TOKEN_CONSUME_URL, {
    headers: {
      'X-E2E-Test-Key': requiredEnvironmentVariable('E2E_TEST_KEY'),
    },
    data: { adminCorreo },
  });

  if (response.status() !== 200) {
    throw new Error('Activation token consumption failed.');
  }

  const body: unknown = await response.json();
  const token =
    typeof body === 'object' && body !== null && 'token' in body
      ? (body as { token?: unknown }).token
      : undefined;

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Activation token response was invalid.');
  }

  return token;
}

export async function expectActivationTokenAlreadyConsumed(
  request: APIRequestContext,
  adminCorreo: string,
): Promise<void> {
  const response = await request.post(ACTIVATION_TOKEN_CONSUME_URL, {
    headers: {
      'X-E2E-Test-Key': requiredEnvironmentVariable('E2E_TEST_KEY'),
    },
    data: { adminCorreo },
  });

  if (response.status() !== 404) {
    throw new Error('Activation token was not consumed exactly once.');
  }
}

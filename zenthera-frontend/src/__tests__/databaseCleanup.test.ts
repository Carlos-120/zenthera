import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  cleanupRegisteredClinic,
  setDatabaseClientConstructorForTests,
  type RegisteredClinicCleanupIdentity,
} from '../../e2e/helpers/database';

type QueryResult = { rows: Record<string, unknown>[]; rowCount: number | null };

const identity: RegisteredClinicCleanupIdentity = {
  adminCorreo: 'admin-run-123@e2e.invalid',
  clinicaRuc: 'E2E-RUN-123',
  clinicaCorreo: 'clinic-run-123@e2e.invalid',
  clinicaNombre: 'E2E run-123',
  runMarker: 'run-123',
};

const result = (rows: Record<string, unknown>[] = [], rowCount: number | null = rows.length): QueryResult => ({
  rows,
  rowCount,
});

const user = { id: 101, clinica_id: 202, correo: identity.adminCorreo };
const clinic = {
  id: 202,
  ruc: identity.clinicaRuc,
  correo: identity.clinicaCorreo,
  nombre: identity.clinicaNombre,
};
const relatedData = {
  pacientes: 0,
  medicos: 0,
  citas: 0,
  auditorias: 0,
  activation_tokens: 1,
  refresh_tokens: 1,
};

class FakeClient {
  static nextResponses: Array<QueryResult | Error> = [];
  static instances: FakeClient[] = [];

  queries: Array<{ sql: string; values?: unknown[] }> = [];
  connect = vi.fn(async () => undefined);
  end = vi.fn(async () => undefined);

  constructor(_config: { connectionString: string }) {
    FakeClient.instances.push(this);
  }

  async query(sql: string, values?: unknown[]): Promise<QueryResult> {
    this.queries.push({ sql, values });
    const response = FakeClient.nextResponses.shift();
    if (response instanceof Error) {
      throw response;
    }
    return response ?? result();
  }
}

function successResponses(overrides: {
  user?: Record<string, unknown>;
  clinic?: Record<string, unknown>;
  clinicUsers?: Record<string, unknown>[];
  related?: Record<string, unknown>;
  deletedActivationTokens?: number;
  deletedRefreshTokens?: number;
  deletedUser?: number;
  deletedClinic?: number;
} = {}): QueryResult[] {
  const currentUser = { ...user, ...overrides.user };
  const currentClinic = { ...clinic, ...overrides.clinic };
  const clinicUsers = overrides.clinicUsers ?? [currentUser];
  const related = { ...relatedData, ...overrides.related };

  return [
    result(),
    result(),
    result([currentUser]),
    result([currentClinic]),
    result(clinicUsers),
    result([related]),
    result([], overrides.deletedActivationTokens ?? Number(related.activation_tokens)),
    result([], overrides.deletedRefreshTokens ?? Number(related.refresh_tokens)),
    result([], overrides.deletedUser ?? 1),
    result([], overrides.deletedClinic ?? 1),
    result(),
  ];
}

function prepare(responses: Array<QueryResult | Error>): void {
  FakeClient.instances = [];
  FakeClient.nextResponses = [...responses];
  setDatabaseClientConstructorForTests(FakeClient);
}

function latestClient(): FakeClient {
  const client = FakeClient.instances.at(-1);
  if (!client) throw new Error('fake client was not created');
  return client;
}

function deleteQueries(): string[] {
  return latestClient().queries.map(({ sql }) => sql).filter((sql) => /^DELETE/i.test(sql.trim()));
}

describe('cleanupRegisteredClinic', () => {
  beforeEach(() => {
    process.env.E2E_DATABASE_URL = 'postgresql://e2e-test';
    process.env.E2E_DATABASE_SCHEMA = 'e2e_clean_11';
  });

  afterEach(() => {
    setDatabaseClientConstructorForTests(undefined);
    vi.restoreAllMocks();
  });

  it('cleans only a valid exclusive registration and verifies row counts', async () => {
    prepare(successResponses());

    await expect(cleanupRegisteredClinic(identity)).resolves.toBe('cleaned');

    const client = latestClient();
    expect(deleteQueries()).toHaveLength(4);
    expect(client.queries.at(-1)?.sql).toBe('COMMIT');
    expect(client.end).toHaveBeenCalledOnce();
  });

  it('returns already-clean without DELETE when the dynamic user does not exist', async () => {
    prepare([result(), result(), result([]), result()]);

    await expect(cleanupRegisteredClinic(identity)).resolves.toBe('already-clean');

    expect(deleteQueries()).toHaveLength(0);
    expect(latestClient().end).toHaveBeenCalledOnce();
  });

  it.each([
    ['different RUC', successResponses({ clinic: { ruc: 'unexpected' } })],
    ['different clinic email', successResponses({ clinic: { correo: 'unexpected@e2e.invalid' } })],
    ['more than one clinic user', successResponses({ clinicUsers: [user, { ...user, id: 102 }] })],
    ['patients', successResponses({ related: { pacientes: 1 } })],
    ['medicos', successResponses({ related: { medicos: 1 } })],
    ['citas', successResponses({ related: { citas: 1 } })],
    ['administrative audit data', successResponses({ related: { auditorias: 1 } })],
  ])('rejects %s, rolls back, and does not execute DELETE', async (_caseName, responses) => {
    prepare(responses);

    await expect(cleanupRegisteredClinic(identity)).rejects.toThrow('E2E cleanup ownership validation failed');

    const client = latestClient();
    expect(deleteQueries()).toHaveLength(0);
    expect(client.queries.some(({ sql }) => sql === 'ROLLBACK')).toBe(true);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it('rejects a run marker mismatch before opening a database client', async () => {
    prepare(successResponses());

    await expect(cleanupRegisteredClinic({ ...identity, runMarker: 'other-run' }))
      .rejects.toThrow('E2E cleanup ownership validation failed');

    expect(FakeClient.instances).toHaveLength(0);
  });

  it.each(['E2E-ALPHA-001', 'E2E-BETA-001'])('rejects the protected fixture RUC without DELETE', async (fixtureRuc) => {
    prepare(successResponses({ clinic: { ruc: fixtureRuc } }));

    await expect(cleanupRegisteredClinic({ ...identity, clinicaRuc: fixtureRuc }))
      .rejects.toThrow('E2E cleanup ownership validation failed');

    const client = latestClient();
    expect(deleteQueries()).toHaveLength(0);
    expect(client.queries.some(({ sql }) => sql === 'ROLLBACK')).toBe(true);
  });

  it.each([
    ['activation token', { deletedActivationTokens: 0 }],
    ['refresh token', { deletedRefreshTokens: 0 }],
    ['user', { deletedUser: 0 }],
    ['clinic', { deletedClinic: 0 }],
  ])('rolls back when the %s DELETE row count is unexpected', async (_caseName, overrides) => {
    prepare(successResponses(overrides));

    await expect(cleanupRegisteredClinic(identity)).rejects.toThrow('E2E cleanup ownership validation failed');

    const client = latestClient();
    expect(client.queries.some(({ sql }) => sql === 'ROLLBACK')).toBe(true);
    expect(client.end).toHaveBeenCalledOnce();
  });

  it('keeps all data values parameterized and never uses TRUNCATE or DELETE without WHERE', async () => {
    prepare(successResponses());
    await cleanupRegisteredClinic(identity);

    const source = readFileSync(resolve(process.cwd(), 'e2e/helpers/database.ts'), 'utf8');
    expect(source).not.toMatch(/\bTRUNCATE\b/i);
    const deleteStatements = source.match(/DELETE\s+FROM[\s\S]*?`/gi) ?? [];
    expect(deleteStatements.every((statement) => /\bWHERE\b/i.test(statement))).toBe(true);
    for (const query of latestClient().queries.filter(({ values }) => values && values.length > 0)) {
      expect(query.sql).toMatch(/\$\d+/);
    }
  });
});

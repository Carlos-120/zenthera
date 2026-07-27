type QueryResult<Row> = {
  rows: Row[];
  rowCount: number | null;
};

type DatabaseClient = {
  connect(): Promise<void>;
  query<Row = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<QueryResult<Row>>;
  end(): Promise<void>;
};

type DatabaseClientConstructor = new (config: { connectionString: string }) => DatabaseClient;

const { Client: PgClient } = require('pg') as { Client: DatabaseClientConstructor };

const ALLOWED_E2E_SCHEMAS = new Set(['e2e_clean_11']);
const FIXTURE_RUCS = new Set(['E2E-ALPHA-001', 'E2E-BETA-001']);
const OWNERSHIP_FAILURE = 'E2E cleanup ownership validation failed';

let ClientConstructor: DatabaseClientConstructor = PgClient;

type DatabaseConfig = {
  connectionString: string;
  schema: string;
};

export type RegisteredClinicCleanupIdentity = {
  adminCorreo: string;
  clinicaRuc: string;
  clinicaCorreo: string;
  clinicaNombre: string;
  runMarker: string;
};

export type RegisteredClinicCleanupResult = 'cleaned' | 'already-clean';

type UserRow = {
  id: number;
  clinica_id: number;
  correo: string;
};

type ClinicRow = {
  id: number;
  ruc: string;
  correo: string;
  nombre: string;
};

type RelatedDataRow = {
  pacientes: number | string;
  medicos: number | string;
  citas: number | string;
  auditorias: number | string;
  activation_tokens: number | string;
  refresh_tokens: number | string;
};

function requiredEnvironmentVariable(name: 'E2E_DATABASE_URL' | 'E2E_DATABASE_SCHEMA'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(name);
  }

  return value;
}

function getDatabaseConfig(): DatabaseConfig {
  const connectionString = requiredEnvironmentVariable('E2E_DATABASE_URL');
  const schema = requiredEnvironmentVariable('E2E_DATABASE_SCHEMA');

  if (!ALLOWED_E2E_SCHEMAS.has(schema)) {
    throw new Error('E2E_DATABASE_SCHEMA');
  }

  return { connectionString, schema };
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function expectedSingleRow<Row>(result: QueryResult<Row>): Row {
  if (result.rows.length !== 1) {
    throw new Error(OWNERSHIP_FAILURE);
  }

  return result.rows[0];
}

function asCount(value: number | string): number {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(OWNERSHIP_FAILURE);
  }

  return count;
}

function validateIdentity(identity: RegisteredClinicCleanupIdentity): void {
  const values = [
    identity.adminCorreo,
    identity.clinicaRuc,
    identity.clinicaCorreo,
    identity.clinicaNombre,
    identity.runMarker,
  ];

  if (values.some((value) => !value || value.trim().length === 0)) {
    throw new Error(OWNERSHIP_FAILURE);
  }

  if (
    !identity.adminCorreo.includes(identity.runMarker)
    || !identity.clinicaCorreo.includes(identity.runMarker)
    || !identity.clinicaNombre.includes(identity.runMarker)
  ) {
    throw new Error(OWNERSHIP_FAILURE);
  }
}

export async function cleanupRegisteredClinic(
  identity: RegisteredClinicCleanupIdentity,
): Promise<RegisteredClinicCleanupResult> {
  validateIdentity(identity);

  const { connectionString, schema } = getDatabaseConfig();
  const qualifiedSchema = quoteIdentifier(schema);
  const client = new ClientConstructor({ connectionString });
  let transactionOpen = false;

  try {
    await client.connect();
    await client.query('BEGIN');
    transactionOpen = true;
    await client.query(`SET LOCAL search_path TO ${qualifiedSchema}`);

    const expectedAdminCorreo = normalized(identity.adminCorreo);
    const expectedClinicCorreo = normalized(identity.clinicaCorreo);
    const userResult = await client.query<UserRow>(
      `SELECT id, clinica_id, correo
       FROM ${qualifiedSchema}.usuarios
       WHERE LOWER(BTRIM(correo)) = $1
       FOR UPDATE`,
      [expectedAdminCorreo],
    );

    if (userResult.rows.length === 0) {
      await client.query('COMMIT');
      transactionOpen = false;
      return 'already-clean';
    }

    const user = expectedSingleRow(userResult);
    if (normalized(user.correo) !== expectedAdminCorreo) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const clinic = expectedSingleRow(await client.query<ClinicRow>(
      `SELECT id, ruc, correo, nombre
       FROM ${qualifiedSchema}.clinicas
       WHERE id = $1
       FOR UPDATE`,
      [user.clinica_id],
    ));

    if (
      clinic.id !== user.clinica_id
      || clinic.ruc !== identity.clinicaRuc
      || normalized(clinic.correo) !== expectedClinicCorreo
      || clinic.nombre !== identity.clinicaNombre
      || FIXTURE_RUCS.has(clinic.ruc)
      || !user.correo.includes(identity.runMarker)
      || !clinic.correo.includes(identity.runMarker)
      || !clinic.nombre.includes(identity.runMarker)
    ) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const clinicUsers = await client.query<UserRow>(
      `SELECT id, clinica_id, correo
       FROM ${qualifiedSchema}.usuarios
       WHERE clinica_id = $1
       FOR UPDATE`,
      [clinic.id],
    );
    const soleUser = expectedSingleRow(clinicUsers);
    if (
      soleUser.id !== user.id
      || soleUser.clinica_id !== clinic.id
      || normalized(soleUser.correo) !== expectedAdminCorreo
    ) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const relatedData = expectedSingleRow(await client.query<RelatedDataRow>(
      `SELECT
        (SELECT COUNT(*) FROM ${qualifiedSchema}.pacientes WHERE clinica_id = $1) AS pacientes,
        (SELECT COUNT(*) FROM ${qualifiedSchema}.medicos WHERE clinica_id = $1) AS medicos,
        (SELECT COUNT(*) FROM ${qualifiedSchema}.citas WHERE clinica_id = $1) AS citas,
        (SELECT COUNT(*) FROM ${qualifiedSchema}.auditoria_estado_clinicas WHERE clinica_id = $1 OR usuario_id = $2) AS auditorias,
        (SELECT COUNT(*) FROM ${qualifiedSchema}.activation_tokens WHERE usuario_id = $2) AS activation_tokens,
        (SELECT COUNT(*) FROM ${qualifiedSchema}.refresh_tokens WHERE usuario_id = $2) AS refresh_tokens`,
      [clinic.id, user.id],
    ));

    const pacientes = asCount(relatedData.pacientes);
    const medicos = asCount(relatedData.medicos);
    const citas = asCount(relatedData.citas);
    const auditorias = asCount(relatedData.auditorias);
    const activationTokens = asCount(relatedData.activation_tokens);
    const refreshTokens = asCount(relatedData.refresh_tokens);
    if (pacientes !== 0 || medicos !== 0 || citas !== 0 || auditorias !== 0) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const deletedActivationTokens = await client.query(
      `DELETE FROM ${qualifiedSchema}.activation_tokens WHERE usuario_id = $1`,
      [user.id],
    );
    if (deletedActivationTokens.rowCount !== activationTokens) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const deletedRefreshTokens = await client.query(
      `DELETE FROM ${qualifiedSchema}.refresh_tokens WHERE usuario_id = $1`,
      [user.id],
    );
    if (deletedRefreshTokens.rowCount !== refreshTokens) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const deletedUser = await client.query(
      `DELETE FROM ${qualifiedSchema}.usuarios
       WHERE id = $1 AND clinica_id = $2 AND LOWER(BTRIM(correo)) = $3`,
      [user.id, clinic.id, expectedAdminCorreo],
    );
    if (deletedUser.rowCount !== 1) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    const deletedClinic = await client.query(
      `DELETE FROM ${qualifiedSchema}.clinicas
       WHERE id = $1 AND ruc = $2 AND LOWER(BTRIM(correo)) = $3 AND nombre = $4`,
      [clinic.id, identity.clinicaRuc, expectedClinicCorreo, identity.clinicaNombre],
    );
    if (deletedClinic.rowCount !== 1) {
      throw new Error(OWNERSHIP_FAILURE);
    }

    await client.query('COMMIT');
    transactionOpen = false;
    return 'cleaned';
  } catch {
    if (transactionOpen) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw new Error(OWNERSHIP_FAILURE);
  } finally {
    await client.end();
  }
}

export function setDatabaseClientConstructorForTests(
  constructor: DatabaseClientConstructor | undefined,
): void {
  ClientConstructor = constructor ?? PgClient;
}

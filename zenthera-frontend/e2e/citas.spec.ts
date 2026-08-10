import { expect, test, APIRequestContext, Page, TestInfo } from '@playwright/test';
import { Client } from 'pg';

const API_URL = 'http://localhost:8080';
const PASSWORD = process.env.E2E_PASSWORD;
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
const E2E_MARKER = 'QA-CITAS-';

if (!PASSWORD) {
  throw new Error('E2E_PASSWORD es obligatoria para ejecutar e2e/citas.spec.ts. No existe contraseña fallback.');
}

if (!E2E_DATABASE_URL) {
  throw new Error('E2E_DATABASE_URL es obligatoria para la limpieza selectiva de e2e/citas.spec.ts.');
}

const USERS = {
  adminAlpha: 'admin@alpha.com',
  recepcionistaAlpha: 'recepcionista@alpha.com',
  medicoAlpha: 'medico@alpha.com',
  adminBeta: 'admin@beta.com',
  medicoBeta: 'medico@beta.com',
  superAdmin: 'super@e2e.com',
} as const;

type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'EN_ATENCION' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

type Persona = { id: number; cedula: string; nombres: string; apellidos: string };
type Cita = {
  id: number;
  paciente: { id: number; nombres: string; apellidos: string };
  medico: { id: number; nombres: string; apellidos: string };
  fechaHoraInicio: string;
  fechaHoraFin: string;
  duracionMinutos: number;
  estado: EstadoCita;
  motivo: string;
  observaciones?: string;
};

type TenantData = {
  token: string;
  pacientes: Persona[];
  medicos: Persona[];
};

const headers = (token?: string) => ({
  Origin: 'http://localhost:3000',
  'X-Requested-With': 'XMLHttpRequest',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function bodyOf(response: { json(): Promise<unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.json() as Promise<any>;
}

async function expectStatus(response: { status(): number; json(): Promise<unknown> }, status: number) {
  const body = await bodyOf(response);
  expect(response.status(), JSON.stringify(body)).toBe(status);
  return body;
}

function e2eMotivo(motivo: string) {
  return motivo.startsWith(E2E_MARKER) ? motivo : `${E2E_MARKER}${motivo}`;
}

async function cleanupQaCitas() {
  if (process.env.SPRING_PROFILES_ACTIVE !== 'e2e') {
    throw new Error('Cleanup QA-CITAS requiere SPRING_PROFILES_ACTIVE=e2e.');
  }
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    const scope = await client.query('SELECT current_database() AS database, current_schema() AS schema');
    const { database, schema } = scope.rows[0];
    if (database !== 'zenthera_e2e' || schema !== 'e2e_clean_11') {
      throw new Error(`Cleanup QA-CITAS rechazado fuera de alcance: ${database}.${schema}`);
    }
    const result = await client.query('DELETE FROM citas WHERE motivo LIKE $1', [`${E2E_MARKER}%`]);
    const secondResult = await client.query('DELETE FROM citas WHERE motivo LIKE $1', [`${E2E_MARKER}%`]);
    expect(secondResult.rowCount).toBe(0);
    return result.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

async function apiLogin(request: APIRequestContext, correo: string) {
  const response = await request.post(`${API_URL}/api/v1/auth/login`, {
    headers: headers(),
    data: { correo, password: PASSWORD },
  });
  const body = await expectStatus(response, 200);
  expect(body.data.accessToken).toEqual(expect.any(String));
  return body.data.accessToken as string;
}

async function uiLogin(page: Page, correo: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD!);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15_000 });
}

async function tenantData(request: APIRequestContext, correo: string): Promise<TenantData> {
  const token = await apiLogin(request, correo);
  const pacientesResponse = await request.get(`${API_URL}/api/pacientes`, { headers: headers(token) });
  const pacientes = await expectStatus(pacientesResponse, 200) as Persona[];
  const medicosResponse = await request.get(`${API_URL}/api/medicos`, { headers: headers(token) });
  const medicosBody = await expectStatus(medicosResponse, 200);
  const medicos = medicosBody.data as Persona[];
  expect(pacientes.length).toBeGreaterThan(0);
  expect(medicos.length).toBeGreaterThan(0);
  return { token, pacientes, medicos };
}

function uniqueStart(testInfo: TestInfo, extraMinutes = 0) {
  const titleHash = [...testInfo.titlePath.join('|')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const randomMinutes = Math.floor(Math.random() * 20_000);
  const date = new Date(Date.now() + (60 * 24 * 60 + titleHash + randomMinutes + extraMinutes) * 60_000);
  date.setUTCSeconds(0, 0);
  return date.toISOString();
}

async function getAllCitas(
  request: APIRequestContext,
  token: string,
  params: Record<string, string | number>,
) {
  const citas: Cita[] = [];
  let totalPages = 0;
  for (let page = 0; page === 0 || page < totalPages; page += 1) {
    const response = await request.get(`${API_URL}/api/v1/clinica/citas`, {
      headers: headers(token),
      params: { ...params, page, size: 50, sort: 'fechaHoraInicio', direction: 'asc' },
    });
    const body = await expectStatus(response, 200);
    totalPages = body.data.totalPages;
    citas.push(...body.data.content);
  }
  return citas as Cita[];
}

async function findFreeInterval(
  request: APIRequestContext,
  token: string,
  pacienteId: number,
  medicoId: number,
  initialStart: string,
  duracionMinutos = 30,
  excludedCitaId?: number,
) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const inicio = new Date(new Date(initialStart).getTime() + attempt * 24 * 60 * 60_000).toISOString();
    const fin = new Date(new Date(inicio).getTime() + duracionMinutos * 60_000).toISOString();
    const desde = new Date(new Date(inicio).getTime() - 8 * 60 * 60_000).toISOString();
    const [medicoCitas, pacienteCitas] = await Promise.all([
      getAllCitas(request, token, { medicoId, fechaDesde: desde, fechaHasta: fin }),
      getAllCitas(request, token, { pacienteId, fechaDesde: desde, fechaHasta: fin }),
    ]);
    const hasOverlap = [...medicoCitas, ...pacienteCitas].some((cita) =>
      cita.id !== excludedCitaId
      && new Date(cita.fechaHoraInicio).getTime() < new Date(fin).getTime()
      && new Date(cita.fechaHoraFin).getTime() > new Date(inicio).getTime()
    );
    if (!hasOverlap) return inicio;
  }
  throw new Error('No se encontró un intervalo UI E2E libre después de 30 intentos reales.');
}

async function createCita(
  request: APIRequestContext,
  token: string,
  pacienteId: number,
  medicoId: number,
  inicio: string,
  motivo: string,
  duracionMinutos = 30,
  observaciones = 'Observación E2E',
  retryOnConflict = true,
) {
  for (let attempt = 0; attempt < (retryOnConflict ? 30 : 1); attempt += 1) {
    const candidate = new Date(new Date(inicio).getTime() + attempt * 24 * 60 * 60_000).toISOString();
    const payload = { pacienteId, medicoId, fechaHoraInicio: candidate, duracionMinutos, motivo: e2eMotivo(motivo), observaciones };
    expect(payload).not.toHaveProperty('clinicaId');
    expect(candidate).toMatch(/Z$/);
    const response = await request.post(`${API_URL}/api/v1/clinica/citas`, {
      headers: headers(token),
      data: payload,
    });
    if (response.status() === 409 && retryOnConflict) continue;
    const body = await expectStatus(response, 201);
    expect(body.data.estado).toBe('PROGRAMADA');
    return body.data as Cita;
  }
  throw new Error('No se encontró un intervalo E2E libre después de 30 intentos reales.');
}

async function submitCitaAndWaitForDetail(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/v1/clinica/citas'));
  const navigationPromise = page.waitForURL(/\/dashboard\/citas\/\d+$/);
  await page.getByRole('button', { name: 'Agendar Cita' }).click();
  const response = await responsePromise;
  const body = await bodyOf(response);
  expect(response.status(), JSON.stringify(body)).toBe(201);
  await navigationPromise;
  return body.data as Cita;
}

async function getCita(request: APIRequestContext, token: string, id: number) {
  const response = await request.get(`${API_URL}/api/v1/clinica/citas/${id}`, { headers: headers(token) });
  return { response, body: await bodyOf(response) };
}

async function updateCita(request: APIRequestContext, token: string, cita: Cita, overrides: Record<string, unknown> = {}) {
  const payload = {
    pacienteId: cita.paciente.id,
    medicoId: cita.medico.id,
    fechaHoraInicio: cita.fechaHoraInicio,
    duracionMinutos: cita.duracionMinutos,
    motivo: cita.motivo,
    observaciones: cita.observaciones ?? null,
    ...overrides,
  };
  expect(payload).not.toHaveProperty('clinicaId');
  return request.put(`${API_URL}/api/v1/clinica/citas/${cita.id}`, { headers: headers(token), data: payload });
}

async function changeState(request: APIRequestContext, token: string, id: number, estado: EstadoCita, motivoCancelacion?: string) {
  const data = { estado, ...(motivoCancelacion ? { motivoCancelacion } : {}) };
  return request.patch(`${API_URL}/api/v1/clinica/citas/${id}/estado`, { headers: headers(token), data });
}

async function availableTemporalMedico(request: APIRequestContext, token: string, medicos: Persona[]) {
  const candidates = medicos.filter((medico) => medico.cedula.startsWith('E2ETEMP0'));
  for (const medico of candidates) {
    const from = new Date(Date.now() - 60 * 60_000).toISOString();
    const until = new Date(Date.now() + 60 * 60_000).toISOString();
    const citas = await getAllCitas(request, token, { medicoId: medico.id, fechaDesde: from, fechaHasta: until });
    if (citas.length === 0) return medico;
  }
  throw new Error('No existe un médico temporal E2E libre para validar reglas dependientes del reloj.');
}

async function availableTemporalPaciente(request: APIRequestContext, token: string, pacientes: Persona[]) {
  const candidates = pacientes.filter((paciente) => paciente.cedula.startsWith('E2EPT000'));
  for (const paciente of candidates) {
    const from = new Date(Date.now() - 60 * 60_000).toISOString();
    const until = new Date(Date.now() + 60 * 60_000).toISOString();
    const citas = await getAllCitas(request, token, { pacienteId: paciente.id, fechaDesde: from, fechaHasta: until });
    if (citas.length === 0) return paciente;
  }
  throw new Error('No existe un paciente temporal E2E libre para validar reglas dependientes del reloj.');
}

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

test.describe('QA-CITAS-001 — backend y frontend reales', () => {
  test.describe.configure({ mode: 'parallel', retries: 0 });

  test.beforeAll(async () => {
    await cleanupQaCitas();
  });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test.afterEach(async () => {
    await cleanupQaCitas();
  });

  test('autorización: ADMIN, RECEPCIONISTA y MEDICO acceden; SUPER_ADMIN y anónimo son bloqueados', async ({ browser }) => {
    for (const correo of [USERS.adminAlpha, USERS.recepcionistaAlpha, USERS.medicoAlpha]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await uiLogin(page, correo);
      await page.goto('/dashboard/citas');
      await expect(page.getByRole('heading', { name: 'Gestión de Citas' })).toBeVisible();
      await context.close();
    }

    const superContext = await browser.newContext();
    const superPage = await superContext.newPage();
    await uiLogin(superPage, USERS.superAdmin);
    await superPage.goto('/dashboard/citas');
    await expect(superPage).not.toHaveURL(/\/dashboard\/citas$/);
    await superContext.close();

    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto('/dashboard/citas');
    await anonPage.waitForURL(/\/login/);
    await anonContext.close();
  });

  test('MEDICO solo lista y consulta sus propias citas y no puede crear', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const medicoPropio = alpha.medicos.find((m) => m.cedula === 'E2E0000001')!;
    const medicoAjeno = alpha.medicos.find((m) => m.cedula === 'E2E0000013')!;
    const propia = await createCita(request, alpha.token, alpha.pacientes[0].id, medicoPropio.id, uniqueStart(testInfo), `Propia ${Date.now()}`);
    const ajena = await createCita(request, alpha.token, alpha.pacientes[1].id, medicoAjeno.id, uniqueStart(testInfo, 90), `Ajena ${Date.now()}`);
    const tokenMedico = await apiLogin(request, USERS.medicoAlpha);

    const pageSize = 50;
    const listedIds: number[] = [];
    let totalPages = 0;
    for (let pageNumber = 0; pageNumber === 0 || pageNumber < totalPages; pageNumber += 1) {
      const listResponse = await request.get(`${API_URL}/api/v1/clinica/citas`, {
        headers: headers(tokenMedico),
        params: { page: pageNumber, size: pageSize, sort: 'fechaHoraInicio', direction: 'desc' },
      });
      const listBody = await expectStatus(listResponse, 200);
      expect(listBody.success).toBe(true);
      expect(listBody).toHaveProperty('data');
      expect(listBody.data).toHaveProperty('content');
      expect(listBody).not.toHaveProperty('content');
      expect(listBody.data.size).toBe(pageSize);
      totalPages = listBody.data.totalPages;
      listedIds.push(...listBody.data.content.map((c: Cita) => c.id));
      expect(listBody.data.content.every((c: Cita) => c.medico.id === medicoPropio.id)).toBe(true);
    }
    expect(listedIds).toContain(propia.id);
    expect(listedIds).not.toContain(ajena.id);
    expect((await getCita(request, tokenMedico, ajena.id)).response.status()).toBe(404);
    const createResponse = await request.post(`${API_URL}/api/v1/clinica/citas`, {
      headers: headers(tokenMedico),
      data: { pacienteId: alpha.pacientes[0].id, medicoId: medicoPropio.id, fechaHoraInicio: uniqueStart(testInfo, 180), duracionMinutos: 30, motivo: 'Prohibida' },
    });
    expect(createResponse.status()).toBe(403);

    await uiLogin(page, USERS.medicoAlpha);
    await page.goto('/dashboard/citas/nuevo');
    await expect(page.getByRole('button', { name: 'Agendar Cita' })).not.toBeVisible();
  });

  test('listado: carga, vacío, error, búsqueda, filtros, fechas, limpieza, orden y paginación', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const medico = alpha.medicos.find((m) => m.cedula === 'E2E0000001')!;
    const base = uniqueStart(testInfo);
    let firstCreated: Cita | undefined;
    for (let index = 0; index < 11; index += 1) {
      const inicio = new Date(new Date(base).getTime() + index * 60 * 60_000).toISOString();
      const created = await createCita(request, alpha.token, alpha.pacientes[index % alpha.pacientes.length].id, medico.id, inicio, `Listado-${testInfo.workerIndex}-${Date.now()}-${index}`);
      firstCreated ??= created;
    }

    await uiLogin(page, USERS.adminAlpha);
    let releaseListRequest!: () => void;
    const listRequestReleased = new Promise<void>((resolve) => { releaseListRequest = resolve; });
    await page.route('**/api/v1/clinica/citas?**', async (route) => {
      await listRequestReleased;
      await route.continue();
    });
    const navigation = page.goto('/dashboard/citas');
    await expect(page.locator('tbody .animate-pulse').first()).toBeVisible();
    releaseListRequest();
    await navigation;
    await page.unroute('**/api/v1/clinica/citas?**');
    await expect(page.getByRole('table', { name: 'Tabla de Citas' })).toBeVisible();

    const uniqueMissing = `sin-resultados-${Date.now()}`;
    await page.getByPlaceholder('Buscar por motivo...').fill(uniqueMissing);
    await expect(page.getByText('No se encontraron citas')).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar' }).click();

    await page.getByLabel('Filtro Paciente').selectOption(String(alpha.pacientes[0].id));
    await page.getByLabel('Filtro Médico').selectOption(String(medico.id));
    await page.getByLabel('Filtro Estado').selectOption('PROGRAMADA');
    const localDay = toDatetimeLocal(firstCreated!.fechaHoraInicio).slice(0, 10);
    await page.getByLabel('Desde:').fill(localDay);
    await page.getByLabel('Hasta:').fill(localDay);
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(page.getByLabel('Filtro Estado')).toHaveValue('');

    await expect(page.locator('tbody tr').filter({ has: page.getByRole('link', { name: /Ver detalles/ }) }).first()).toBeVisible();
    const next = page.getByRole('button', { name: 'Página siguiente' });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText(/Mostrando página 2 de/)).toBeVisible();
    await page.getByRole('button', { name: 'Página anterior' }).click();
    await expect(page.getByText(/Mostrando página 1 de/)).toBeVisible();

    for (const [button, header] of [['Inicio', 'Inicio'], ['Fin', 'Fin'], ['Estado', 'Estado'], ['Registro', 'Registro']] as const) {
      await page.getByRole('button', { name: `Ordenar por ${button}` }).click();
      await expect(page.getByRole('columnheader', { name: new RegExp(header) })).toHaveAttribute('aria-sort', 'ascending');
      await page.getByRole('button', { name: `Ordenar por ${button}` }).click();
      await expect(page.getByRole('columnheader', { name: new RegExp(header) })).toHaveAttribute('aria-sort', 'descending');
    }

    await page.getByLabel('Desde:').fill('2099-12-31');
    await page.getByLabel('Hasta:').fill('2099-01-01');
    await expect(page.getByRole('alert').getByText('Error al cargar citas')).toBeVisible();
  });

  test('creación UI por ADMIN usa entidades reales, UTC Z, sin clinicaId y persiste', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const paciente = alpha.pacientes[0];
    const medico = alpha.medicos.find((m) => m.cedula === 'E2E0000001')!;
    const start = await findFreeInterval(request, alpha.token, paciente.id, medico.id, uniqueStart(testInfo));
    const motivo = e2eMotivo(`UI Admin ${Date.now()}`);

    await uiLogin(page, USERS.adminAlpha);
    await page.goto('/dashboard/citas/nuevo');
    await page.getByRole('button', { name: 'Agendar Cita' }).click();
    await expect(page.getByText('La fecha y hora de inicio es obligatoria')).toBeVisible();
    await page.getByLabel(/Paciente \*/).selectOption(String(paciente.id));
    await page.getByLabel(/Médico \*/).selectOption(String(medico.id));
    await page.getByLabel(/Fecha y Hora \*/).fill(toDatetimeLocal(start));
    await page.getByLabel(/Duración/).fill('30');
    await page.getByLabel(/Motivo de Consulta/).fill(motivo);

    const cita = await submitCitaAndWaitForDetail(page);
    expect(cita.motivo).toBe(motivo);
    expect(cita.fechaHoraInicio).toMatch(/Z$/);
    expect(cita.duracionMinutos).toBeGreaterThanOrEqual(15);
    expect(cita.duracionMinutos).toBeLessThanOrEqual(480);
    await expect(page.getByText(motivo)).toBeVisible();
    await page.reload();
    await expect(page.getByText(motivo)).toBeVisible();
    await expect(page.getByText('PROGRAMADA', { exact: true }).first()).toBeVisible();
  });

  test('RECEPCIONISTA crea una cita válida por UI', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const paciente = alpha.pacientes[1];
    const medico = alpha.medicos[0];
    const start = await findFreeInterval(request, alpha.token, paciente.id, medico.id, uniqueStart(testInfo), 45);
    const motivo = e2eMotivo(`UI Recepción ${Date.now()}`);
    await uiLogin(page, USERS.recepcionistaAlpha);
    await page.goto('/dashboard/citas/nuevo');
    await page.getByLabel(/Paciente \*/).selectOption(String(paciente.id));
    await page.getByLabel(/Médico \*/).selectOption(String(medico.id));
    await page.getByLabel(/Fecha y Hora \*/).fill(toDatetimeLocal(start));
    await page.getByLabel(/Duración/).fill('45');
    await page.getByLabel(/Motivo de Consulta/).fill(motivo);
    const cita = await submitCitaAndWaitForDetail(page);
    expect(cita.motivo).toBe(motivo);
    expect(new Date(cita.fechaHoraInicio).getTime()).toBe(new Date(start).getTime());
    await expect(page.getByText('PROGRAMADA', { exact: true }).first()).toBeVisible();
  });

  test('solapamientos: médico, paciente, contiguas, cancelada libera y edición no colisiona consigo misma', async ({ request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const [pacienteA, pacienteB] = alpha.pacientes;
    const [medicoA] = alpha.medicos;
    const base = await createCita(request, alpha.token, pacienteA.id, medicoA.id, uniqueStart(testInfo), `Base overlap ${Date.now()}`, 30);
    const start = base.fechaHoraInicio;
    const end = base.fechaHoraFin;

    let medicoB: Persona | undefined;
    for (const candidate of alpha.medicos.filter((medico) => medico.id !== medicoA.id)) {
      const citas = await getAllCitas(request, alpha.token, {
        medicoId: candidate.id,
        fechaDesde: new Date(new Date(start).getTime() - 8 * 60 * 60_000).toISOString(),
        fechaHasta: end,
      });
      const hasOverlap = citas.some((cita) =>
        new Date(cita.fechaHoraInicio).getTime() < new Date(end).getTime()
        && new Date(cita.fechaHoraFin).getTime() > new Date(start).getTime()
      );
      if (!hasOverlap) {
        medicoB = candidate;
        break;
      }
    }
    expect(medicoB, 'Debe existir un segundo médico libre para aislar el conflicto del paciente').toBeDefined();

    const medicoConflict = await request.post(`${API_URL}/api/v1/clinica/citas`, {
      headers: headers(alpha.token), data: { pacienteId: pacienteB.id, medicoId: medicoA.id, fechaHoraInicio: start, duracionMinutos: 30, motivo: 'Conflicto médico' },
    });
    expect((await expectStatus(medicoConflict, 409)).message).toBe('MEDICO_HORARIO_OCUPADO');

    const pacienteConflict = await request.post(`${API_URL}/api/v1/clinica/citas`, {
      headers: headers(alpha.token), data: { pacienteId: pacienteA.id, medicoId: medicoB!.id, fechaHoraInicio: start, duracionMinutos: 30, motivo: 'Conflicto paciente' },
    });
    expect((await expectStatus(pacienteConflict, 409)).message).toBe('PACIENTE_HORARIO_OCUPADO');

    const contiguous = new Date(new Date(start).getTime() + 30 * 60_000).toISOString();
    await createCita(request, alpha.token, pacienteB.id, medicoA.id, contiguous, 'Cita contigua', 30);
    expect((await expectStatus(await updateCita(request, alpha.token, base), 200)).data.id).toBe(base.id);
    await expectStatus(await changeState(request, alpha.token, base.id, 'CANCELADA', 'Liberar horario E2E'), 200);
    await createCita(request, alpha.token, pacienteA.id, medicoA.id, start, 'Horario liberado', 30);
  });

  test('UI muestra el mensaje de negocio de un solapamiento y conserva el formulario', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const base = await createCita(request, alpha.token, alpha.pacientes[0].id, alpha.medicos[0].id, uniqueStart(testInfo), 'Base UI overlap');
    const start = base.fechaHoraInicio;
    await uiLogin(page, USERS.adminAlpha);
    await page.goto('/dashboard/citas/nuevo');
    await page.getByLabel(/Paciente \*/).selectOption(String(alpha.pacientes[1].id));
    await page.getByLabel(/Médico \*/).selectOption(String(alpha.medicos[0].id));
    await page.getByLabel(/Fecha y Hora \*/).fill(toDatetimeLocal(start));
    await page.getByLabel(/Duración/).fill('30');
    await page.getByLabel(/Motivo de Consulta/).fill('Conflicto UI');
    await page.getByRole('button', { name: 'Agendar Cita' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Conflicto o error al agendar' })).toContainText('MEDICO_HORARIO_OCUPADO');
    await expect(page.getByRole('button', { name: 'Agendar Cita' })).toBeVisible();
  });

  test('edición, reprogramación y restricciones por estado/rol persisten', async ({ request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const start = uniqueStart(testInfo);
    const medicoPropio = alpha.medicos.find((m) => m.cedula === 'E2E0000001')!;
    let cita = await createCita(request, alpha.token, alpha.pacientes[0].id, medicoPropio.id, start, 'Editar E2E');
    await expectStatus(await changeState(request, alpha.token, cita.id, 'CONFIRMADA'), 200);
    let reprogramada = new Date(new Date(cita.fechaHoraInicio).getTime() + 120 * 60_000).toISOString();
    let reprogramResponse = await updateCita(request, alpha.token, cita, { fechaHoraInicio: reprogramada, motivo: e2eMotivo('Reprogramada E2E') });
    for (let attempt = 1; reprogramResponse.status() === 409 && attempt <= 30; attempt += 1) {
      reprogramada = new Date(new Date(cita.fechaHoraInicio).getTime() + (120 + attempt * 24 * 60) * 60_000).toISOString();
      reprogramResponse = await updateCita(request, alpha.token, cita, { fechaHoraInicio: reprogramada, motivo: e2eMotivo('Reprogramada E2E') });
    }
    let body = await expectStatus(reprogramResponse, 200);
    expect(body.data.estado).toBe('PROGRAMADA');
    expect(new Date(body.data.fechaHoraInicio).getTime()).toBe(new Date(reprogramada).getTime());
    cita = body.data;

    const tokenRecepcionista = await apiLogin(request, USERS.recepcionistaAlpha);
    expect((await updateCita(request, tokenRecepcionista, cita, { observaciones: 'Clínica prohibida' })).status()).toBe(403);
    const tokenMedico = await apiLogin(request, USERS.medicoAlpha);
    body = await expectStatus(await updateCita(request, tokenMedico, cita, { fechaHoraInicio: uniqueStart(testInfo, 360), motivo: 'No debe cambiar', observaciones: 'Observación médica permitida' }), 200);
    expect(new Date(body.data.fechaHoraInicio).getTime()).toBe(new Date(reprogramada).getTime());
    expect(body.data.motivo).toBe(e2eMotivo('Reprogramada E2E'));
    expect(body.data.observaciones).toBe('Observación médica permitida');

    await expectStatus(await changeState(request, alpha.token, cita.id, 'CANCELADA', 'Final E2E'), 200);
    expect((await updateCita(request, alpha.token, cita, { motivo: 'Mutación final' })).status()).toBe(409);
  });

  test('máquina de estados válida, temporal, cancelación obligatoria e inmutabilidad', async ({ request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const p = alpha.pacientes[0].id;
    const m = alpha.medicos[0].id;

    const confirmada = await createCita(request, alpha.token, p, m, uniqueStart(testInfo), 'Confirmar');
    expect((await expectStatus(await changeState(request, alpha.token, confirmada.id, 'CONFIRMADA'), 200)).data.estado).toBe('CONFIRMADA');
    expect((await changeState(request, alpha.token, confirmada.id, 'COMPLETADA')).status()).toBe(409);

    const cancelable = await createCita(request, alpha.token, p, m, uniqueStart(testInfo, 90), 'Cancelar');
    expect((await expectStatus(await changeState(request, alpha.token, cancelable.id, 'CANCELADA'), 400)).message).toBe('MOTIVO_CANCELACION_REQUERIDO');
    await expectStatus(await changeState(request, alpha.token, cancelable.id, 'CANCELADA', 'Motivo requerido'), 200);
    expect((await changeState(request, alpha.token, cancelable.id, 'CONFIRMADA')).status()).toBe(409);

    const early = await createCita(request, alpha.token, p, m, uniqueStart(testInfo, 180), 'Temporal');
    expect((await expectStatus(await changeState(request, alpha.token, early.id, 'EN_ATENCION'), 409)).message).toBe('ATENCION_ANTES_DE_HORA');
    expect((await expectStatus(await changeState(request, alpha.token, early.id, 'NO_ASISTIO'), 409)).message).toBe('NO_ASISTIO_ANTES_DE_HORA');

    const temporalMedico = await availableTemporalMedico(request, alpha.token, alpha.medicos);
    const temporalPaciente = await availableTemporalPaciente(request, alpha.token, alpha.pacientes);
    const imminentStart = new Date(Date.now() + 3_000).toISOString();
    const attention = await createCita(request, alpha.token, temporalPaciente.id, temporalMedico.id, imminentStart, 'Atención real', 30, 'Observación E2E', false);
    await expect.poll(async () => (await changeState(request, alpha.token, attention.id, 'EN_ATENCION')).status(), { timeout: 10_000 }).toBe(200);
    expect((await expectStatus(await changeState(request, alpha.token, attention.id, 'COMPLETADA'), 200)).data.estado).toBe('COMPLETADA');
  });

  test('permisos RECEPCIONISTA y MEDICO se aplican por operación y pertenencia', async ({ request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const medicoPropio = alpha.medicos.find((m) => m.cedula === 'E2E0000001')!;
    const medicoAjeno = alpha.medicos.find((m) => m.cedula === 'E2E0000013')!;
    const propia = await createCita(request, alpha.token, alpha.pacientes[0].id, medicoPropio.id, uniqueStart(testInfo), 'Permisos propia');
    const ajena = await createCita(request, alpha.token, alpha.pacientes[1].id, medicoAjeno.id, uniqueStart(testInfo, 90), 'Permisos ajena');
    const recep = await apiLogin(request, USERS.recepcionistaAlpha);
    const medico = await apiLogin(request, USERS.medicoAlpha);

    expect((await changeState(request, recep, propia.id, 'EN_ATENCION')).status()).toBe(403);
    expect((await changeState(request, recep, propia.id, 'COMPLETADA')).status()).toBe(403);
    expect((await changeState(request, medico, propia.id, 'CANCELADA', 'No permitido')).status()).toBe(403);
    expect((await updateCita(request, medico, ajena, { observaciones: 'Ajena' })).status()).toBe(404);
    expect((await getCita(request, medico, ajena.id)).response.status()).toBe(404);
  });

  test('aislamiento multi-tenant usa una cita Beta real para GET, PUT y PATCH', async ({ request }, testInfo) => {
    const beta = await tenantData(request, USERS.adminBeta);
    const alphaToken = await apiLogin(request, USERS.adminAlpha);
    const citaBeta = await createCita(request, beta.token, beta.pacientes[0].id, beta.medicos[0].id, uniqueStart(testInfo), `Beta real ${Date.now()}`);
    expect((await getCita(request, beta.token, citaBeta.id)).response.status()).toBe(200);

    expect((await getCita(request, alphaToken, citaBeta.id)).response.status()).toBe(404);
    expect((await updateCita(request, alphaToken, citaBeta)).status()).toBe(404);
    expect((await changeState(request, alphaToken, citaBeta.id, 'CANCELADA', 'Cross tenant')).status()).toBe(404);
  });

  test('UTC: datetime-local viaja como Z, detalle localiza una vez y edición conserva el instante', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const requestedStart = uniqueStart(testInfo);
    const cita = await createCita(request, alpha.token, alpha.pacientes[0].id, alpha.medicos[0].id, requestedStart, 'UTC E2E');
    const persistedStart = cita.fechaHoraInicio;
    await uiLogin(page, USERS.adminAlpha);
    await page.goto(`/dashboard/citas/${cita.id}`);
    const expectedLocal = await page.evaluate((iso) => new Date(iso).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }), persistedStart);
    await expect(page.getByText(expectedLocal, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Editar Cita' }).click();
    await expect(page.getByLabel(/Fecha y Hora \*/)).toHaveValue(toDatetimeLocal(persistedStart));
    const responsePromise = page.waitForResponse((res) => res.request().method() === 'PUT' && res.url().includes(`/citas/${cita.id}`));
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    expect((await responsePromise).status()).toBe(200);
    expect(new Date((await getCita(request, alpha.token, cita.id)).body.data.fechaHoraInicio).getTime()).toBe(new Date(persistedStart).getTime());
  });

  test('accesibilidad: labels, teclado, tabla, modal, Escape, foco y error persistente', async ({ page, request }, testInfo) => {
    const alpha = await tenantData(request, USERS.adminAlpha);
    const cita = await createCita(request, alpha.token, alpha.pacientes[0].id, alpha.medicos[0].id, uniqueStart(testInfo), 'A11y E2E');
    await uiLogin(page, USERS.adminAlpha);
    await page.goto('/dashboard/citas');
    await expect(page.getByRole('table', { name: 'Tabla de Citas' })).toBeVisible();
    const search = page.getByPlaceholder('Buscar por motivo...');
    await search.focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Filtro Paciente')).toBeFocused();
    await expect(page.getByLabel('Filtro Paciente')).toHaveClass(/focus:ring-2/);
    await page.goto(`/dashboard/citas/${cita.id}`);
    const activator = page.getByRole('button', { name: 'Cambiar Estado' });
    await activator.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Cambiar Estado' });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'modal-state-title');
    await expect(page.locator('#modal-state-title')).toHaveText('Cambiar Estado');
    await expect(page.getByLabel('Nuevo Estado')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(activator).toBeFocused();

    await activator.click();
    await page.getByLabel('Nuevo Estado').selectOption('EN_ATENCION');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toContainText('ATENCION_ANTES_DE_HORA');
  });
});

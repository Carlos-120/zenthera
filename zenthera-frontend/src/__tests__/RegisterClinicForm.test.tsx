import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterClinicForm from '@/components/auth/RegisterClinicForm';
import LoginPage from '@/app/login/page';
import { registerClinic } from '@/lib/api/auth';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  registerClinic: vi.fn(),
}));

const mockPush = vi.fn();
const registerClinicMock = vi.mocked(registerClinic);
const mockRouter = {
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
};

const validValues = {
  nombre: ' Cl\u00ednica Prueba ',
  adminNombres: ' Ana ',
  adminApellidos: ' P\u00e9rez ',
  adminCorreo: ' ADMIN@PRUEBA.COM ',
  password: 'RegistroSeguro123!',
  confirmPassword: 'RegistroSeguro123!',
  terminosAceptados: true,
};

function renderWithQuery(component: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

function fillValidForm() {
  Object.entries(validValues).forEach(([name, value]) => {
    if (name === 'terminosAceptados') {
      const checkbox = screen.getByLabelText(new RegExp(labelFor(name), 'i')) as HTMLInputElement;
      if (!checkbox.checked) fireEvent.click(checkbox);
    } else {
      fireEvent.change(screen.getByLabelText(new RegExp(labelFor(name), 'i')), {
        target: { value },
      });
    }
  });
}

function labelFor(name: string) {
  const labels: Record<string, string> = {
    nombre: 'Nombre de la cl\u00ednica',
    adminNombres: 'Nombres',
    adminApellidos: 'Apellidos',
    adminCorreo: 'Correo del administrador',
    password: '^Contrase\u00f1a$',
    confirmPassword: 'Confirmar contrase\u00f1a',
    terminosAceptados: 'Acepto los t\u00e9rminos y condiciones del servicio',
  };

  return labels[name];
}

function submitRegistration() {
  fireEvent.submit(screen.getByRole('button', { name: /Registrar cl\u00ednica/i }).closest('form')!);
}

function apiError(status?: number, errors?: string[], network = false) {
  return {
    isAxiosError: true,
    ...(network ? { request: {} } : { response: { status, data: { errors } } }),
  };
}

describe('RegisterClinicForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>
    );
  });

  it('renderiza las secciones de cl\u00ednica y administrador', () => {
    renderWithQuery(<RegisterClinicForm />);

    expect(screen.getByRole('heading', { name: 'Datos de la cl\u00ednica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Administrador principal' })).toBeInTheDocument();
  });

  it('asocia todos los campos con labels accesibles', () => {
    renderWithQuery(<RegisterClinicForm />);

    Object.keys(validValues).forEach((name) => {
      expect(screen.getByLabelText(new RegExp(labelFor(name), 'i'))).toBeInTheDocument();
    });
  });

  it('muestra los errores de campos obligatorios y t\u00e9rminos', async () => {
    renderWithQuery(<RegisterClinicForm />);
    submitRegistration();

    expect(await screen.findByText('El nombre de la clínica es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contrase\u00f1a es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('Debes aceptar los t\u00e9rminos y condiciones')).toBeInTheDocument();
  });



  it('valida un correo del administrador inv\u00e1lido', async () => {
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Correo del administrador'), { target: { value: 'correo-invalido' } });
    submitRegistration();

    expect(await screen.findByText('Correo del administrador inv\u00e1lido')).toBeInTheDocument();
  });

  it('valida una confirmaci\u00f3n de contrase\u00f1a distinta', async () => {
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText('Confirmar contrase\u00f1a'), { target: { value: 'OtraPassword123!' } });
    submitRegistration();

    expect(await screen.findByText('Las contrase\u00f1as no coinciden')).toBeInTheDocument();
  });

  it('env\u00eda el request correcto, normalizado y sin confirmPassword', async () => {
    registerClinicMock.mockResolvedValue({ adminCorreo: 'admin@prueba.com', estado: 'PENDIENTE_ACTIVACION' });
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    await waitFor(() => {
      expect(registerClinicMock.mock.calls[0][0]).toEqual({
        nombre: 'Cl\u00ednica Prueba',
        adminNombres: 'Ana',
        adminApellidos: 'P\u00e9rez',
        adminCorreo: 'admin@prueba.com',
        password: validValues.password,
        terminosAceptados: true,
      });
    });
    expect(Object.keys(registerClinicMock.mock.calls[0][0])).not.toContain('confirmPassword');
  });

  it('redirige al login con la confirmaci\u00f3n segura tras una respuesta 201', async () => {
    registerClinicMock.mockResolvedValue({ adminCorreo: 'admin@prueba.com', estado: 'PENDIENTE_ACTIVACION' });
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login?registered=1'));
    expect(mockPush.mock.calls[0][0]).not.toContain('admin@prueba.com');
    expect(mockPush.mock.calls[0][0]).not.toContain(validValues.password);
  });

  it('bloquea el bot\u00f3n durante el env\u00edo', async () => {
    registerClinicMock.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    expect(await screen.findByRole('button', { name: 'Registrando cl\u00ednica...' })).toBeDisabled();
  });

  it('impide el doble env\u00edo', async () => {
    registerClinicMock.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();
    submitRegistration();

    await waitFor(() => expect(registerClinicMock).toHaveBeenCalledTimes(1));
  });

  it('muestra un mensaje controlado ante un 400 sin campo conocido', async () => {
    registerClinicMock.mockRejectedValue(apiError(400, ['Formato no reconocido']));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa la informaci\u00f3n ingresada e int\u00e9ntalo nuevamente.');
  });

  it('asocia un error 400 conocido a su campo', async () => {
    registerClinicMock.mockRejectedValue(apiError(400, ['Correo del administrador inv\u00e1lido']));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    expect(await screen.findByText('Correo del administrador inv\u00e1lido')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo del administrador')).toHaveAttribute('aria-invalid', 'true');
  });



  it('muestra un mensaje gen\u00e9rico ante datos duplicados', async () => {
    registerClinicMock.mockRejectedValue(apiError(409));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible completar el registro porque algunos datos ya est\u00e1n registrados.');
  });

  it('muestra un mensaje controlado ante un error de red', async () => {
    registerClinicMock.mockRejectedValue(apiError(undefined, undefined, true));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible conectar con Zenthera. Comprueba tu conexi\u00f3n e int\u00e9ntalo nuevamente.');
  });

  it('muestra un error inesperado seguro sin exponer datos enviados', async () => {
    registerClinicMock.mockRejectedValue(new Error('Error interno en http://localhost:8080 con detalle t\u00e9cnico'));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No fue posible completar el registro. Int\u00e9ntalo nuevamente m\u00e1s tarde.');
    expect(alert).not.toHaveTextContent('http://localhost:8080');
    expect(alert).not.toHaveTextContent(validValues.password);
  });

  it('limpia las contrase\u00f1as despu\u00e9s de un fallo sin mostrarlas en el mensaje', async () => {
    registerClinicMock.mockRejectedValue(apiError(409));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    await screen.findByRole('alert');
    expect(screen.getByLabelText(/^Contrase\u00f1a$/)).toHaveValue('');
    expect(screen.getByLabelText('Confirmar contrase\u00f1a')).toHaveValue('');
    expect(screen.getByRole('alert')).not.toHaveTextContent(validValues.password);
  });

  it('no registra la contrase\u00f1a en consola durante un fallo', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    registerClinicMock.mockRejectedValue(apiError(409));
    renderWithQuery(<RegisterClinicForm />);
    fillValidForm();
    submitRegistration();

    await screen.findByRole('alert');
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain(validValues.password);
    consoleErrorSpy.mockRestore();
  });

  it('permite mostrar y ocultar ambas contrase\u00f1as mediante controles accesibles', () => {
    renderWithQuery(<RegisterClinicForm />);
    const password = screen.getByLabelText(/^Contrase\u00f1a$/);
    const confirmPassword = screen.getByLabelText('Confirmar contrase\u00f1a');
    const togglePassword = screen.getByRole('button', { name: 'Mostrar contrase\u00f1a' });
    const toggleConfirmPassword = screen.getByRole('button', {
      name: 'Mostrar confirmaci\u00f3n de contrase\u00f1a',
    });

    expect(password).toHaveAttribute('type', 'password');
    expect(confirmPassword).toHaveAttribute('type', 'password');

    fireEvent.click(togglePassword);
    fireEvent.click(toggleConfirmPassword);

    expect(password).toHaveAttribute('type', 'text');
    expect(confirmPassword).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contrase\u00f1a' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ocultar confirmaci\u00f3n de contrase\u00f1a' })
    ).toBeInTheDocument();
  });

  it('incluye un enlace hacia el inicio de sesi\u00f3n', () => {
    renderWithQuery(<RegisterClinicForm />);

    expect(screen.getByRole('link', { name: 'Inicia sesi\u00f3n' })).toHaveAttribute('href', '/login');
  });
});

describe('LoginPage registration confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  it('muestra la confirmaci\u00f3n solamente con registered=1', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('registered=1') as ReturnType<typeof useSearchParams>
    );
    renderWithQuery(<LoginPage />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Cl\u00ednica registrada correctamente. Ya puedes iniciar sesi\u00f3n con las credenciales que creaste.'
    );
  });

  it('conserva el comportamiento normal sin el par\u00e1metro', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>
    );
    renderWithQuery(<LoginPage />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeInTheDocument();
    expect(screen.getByText('Inicia sesi\u00f3n para acceder al panel de tu cl\u00ednica.')).toBeInTheDocument();
    expect(screen.getAllByText('ZENTHERA')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Iniciar Sesi\u00f3n' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reg\u00edstrala aqu\u00ed' })).toHaveAttribute('href', '/registro');
  });

  it('ignora valores distintos de registered=1', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('registered=mensaje-arbitrario') as ReturnType<typeof useSearchParams>
    );
    renderWithQuery(<LoginPage />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesi\u00f3n' })).toBeInTheDocument();
  });

  it('permite mostrar y ocultar la contraseña de login con un nombre accesible único', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof useSearchParams>
    );
    renderWithQuery(<LoginPage />);

    const password = screen.getByLabelText('Contraseña', { exact: true });
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument();
  });
});

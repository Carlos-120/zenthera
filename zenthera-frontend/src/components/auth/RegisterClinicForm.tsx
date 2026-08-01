'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type FieldPath } from 'react-hook-form';
import axios from 'axios';
import { AlertCircle, Building2, Eye, EyeOff, Loader2, UserRound } from 'lucide-react';
import { registerClinic } from '@/lib/api/auth';
import {
  PublicClinicRegistrationSchema,
  toPublicClinicRegistrationRequest,
  type PublicClinicRegistrationFormValues,
} from '@/lib/validations/auth.schema';
import type { ApiResponse } from '@/lib/api/types';

const unknownValidationMessage = 'Revisa la informaci\u00f3n ingresada e int\u00e9ntalo nuevamente.';
const duplicateMessage =
  'No fue posible completar el registro porque algunos datos ya est\u00e1n registrados.';
const networkMessage =
  'No fue posible conectar con Zenthera. Comprueba tu conexi\u00f3n e int\u00e9ntalo nuevamente.';
const unexpectedMessage = 'No fue posible completar el registro. Int\u00e9ntalo nuevamente m\u00e1s tarde.';

type RegistrationErrorResponse = ApiResponse<never>;

const backendFieldForMessage = (message: string): FieldPath<PublicClinicRegistrationFormValues> | null => {
  const normalized = message.toLocaleLowerCase('es');

  if (normalized.includes('nombre de la cl\u00ednica')) return 'nombre';
  if (normalized.includes('nombres del administrador')) return 'adminNombres';
  if (normalized.includes('apellidos del administrador')) return 'adminApellidos';
  if (normalized.includes('correo del administrador')) return 'adminCorreo';
  if (normalized.includes('contrase\u00f1a')) return 'password';

  return null;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1 text-sm text-error">
      {message}
    </p>
  ) : null;
}

export default function RegisterClinicForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const submittingRef = useRef(false);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    resetField,
    formState: { errors },
  } = useForm<PublicClinicRegistrationFormValues>({
    resolver: zodResolver(PublicClinicRegistrationSchema),
    defaultValues: {
      nombre: '',
      adminNombres: '',
      adminApellidos: '',
      adminCorreo: '',
      password: '',
      confirmPassword: '',
      terminosAceptados: false,
    },
  });

  const registrationMutation = useMutation({ mutationFn: registerClinic });

  const handleRegistrationError = (error: unknown) => {
    if (!axios.isAxiosError<RegistrationErrorResponse>(error)) {
      setSubmitError(unexpectedMessage);
      return;
    }

    if (error.response?.status === 409) {
      setSubmitError(duplicateMessage);
      return;
    }

    if (error.response?.status === 400) {
      const backendErrors = error.response.data?.errors ?? [];
      let knownFieldError = false;

      backendErrors.forEach((message) => {
        const field = backendFieldForMessage(message);
        if (field) {
          knownFieldError = true;
          setFieldError(field, { type: 'server', message });
        }
      });

      if (!knownFieldError) {
        setSubmitError(unknownValidationMessage);
      }
      return;
    }

    if (error.request && !error.response) {
      setSubmitError(networkMessage);
      return;
    }

    setSubmitError(unexpectedMessage);
  };

  const onSubmit = async (data: PublicClinicRegistrationFormValues) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitError(null);

    try {
      await registrationMutation.mutateAsync(toPublicClinicRegistrationRequest(data));
      router.push('/login?registered=1');
    } catch (error) {
      handleRegistrationError(error);
      resetField('password');
      resetField('confirmPassword');
    } finally {
      submittingRef.current = false;
    }
  };

  const fieldClassName = (hasError: boolean) =>
    `w-full rounded-xl border bg-surface/70 px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70 ${
      hasError ? 'border-error' : 'border-border'
    }`;

  return (
    <div className="glass w-full max-w-4xl rounded-2xl p-6 shadow-2xl sm:p-8">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Building2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Registra tu clínica</h1>
        <p className="mt-2 text-sm text-foreground/65">
          Crea la cuenta de tu clínica y designa a su administrador principal.
        </p>
      </header>

      {submitError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4 text-error"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-7" noValidate>
        <section aria-labelledby="clinic-details-heading">
          <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="clinic-details-heading" className="text-lg font-semibold">
                Datos de la clínica
              </h2>
              <p className="text-sm text-foreground/60">Información del establecimiento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="nombre" className="mb-1 block text-sm font-medium">Nombre de la clínica</label>
              <input id="nombre" autoComplete="organization" {...register('nombre')} aria-invalid={Boolean(errors.nombre)} aria-describedby={errors.nombre ? 'nombre-error' : undefined} className={fieldClassName(Boolean(errors.nombre))} />
              <FieldError id="nombre-error" message={errors.nombre?.message} />
            </div>
          </div>
        </section>

        <section aria-labelledby="admin-details-heading">
          <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="rounded-lg border border-success/20 bg-success/10 p-2 text-success">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="admin-details-heading" className="text-lg font-semibold">
                Administrador principal
              </h2>
              <p className="text-sm text-foreground/60">La cuenta se activará desde el correo enviado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="adminNombres" className="mb-1 block text-sm font-medium">Nombres</label>
              <input id="adminNombres" autoComplete="given-name" {...register('adminNombres')} aria-invalid={Boolean(errors.adminNombres)} aria-describedby={errors.adminNombres ? 'adminNombres-error' : undefined} className={fieldClassName(Boolean(errors.adminNombres))} />
              <FieldError id="adminNombres-error" message={errors.adminNombres?.message} />
            </div>
            <div>
              <label htmlFor="adminApellidos" className="mb-1 block text-sm font-medium">Apellidos</label>
              <input id="adminApellidos" autoComplete="family-name" {...register('adminApellidos')} aria-invalid={Boolean(errors.adminApellidos)} aria-describedby={errors.adminApellidos ? 'adminApellidos-error' : undefined} className={fieldClassName(Boolean(errors.adminApellidos))} />
              <FieldError id="adminApellidos-error" message={errors.adminApellidos?.message} />
            </div>
            <div>
              <label htmlFor="adminCorreo" className="mb-1 block text-sm font-medium">Correo del administrador</label>
              <input id="adminCorreo" type="email" autoComplete="email" {...register('adminCorreo')} aria-invalid={Boolean(errors.adminCorreo)} aria-describedby={errors.adminCorreo ? 'adminCorreo-error' : undefined} className={fieldClassName(Boolean(errors.adminCorreo))} />
              <FieldError id="adminCorreo-error" message={errors.adminCorreo?.message} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">Contraseña</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} className={`${fieldClassName(Boolean(errors.password))} pr-12`} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contrase\u00f1a' : 'Mostrar contrase\u00f1a'} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/55 hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <FieldError id="password-error" message={errors.password?.message} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">Confirmar contraseña</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword')} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} className={`${fieldClassName(Boolean(errors.confirmPassword))} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Ocultar confirmaci\u00f3n de contrase\u00f1a' : 'Mostrar confirmaci\u00f3n de contrase\u00f1a'} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/55 hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <FieldError id="confirmPassword-error" message={errors.confirmPassword?.message} />
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-foreground/75">
          <p>
            La cuenta registrada será el administrador principal de la clínica.<br />
            Podrá configurar usuarios, médicos, servicios y permisos después de activar su cuenta.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-3" htmlFor="terminosAceptados">
            <div className="flex h-5 items-center">
              <input
                id="terminosAceptados"
                type="checkbox"
                {...register('terminosAceptados')}
                aria-invalid={Boolean(errors.terminosAceptados)}
                aria-describedby={errors.terminosAceptados ? 'terminosAceptados-error' : undefined}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>
            <span className="text-sm text-foreground/80">
              Acepto los términos y condiciones del servicio
            </span>
          </label>
          <FieldError id="terminosAceptados-error" message={errors.terminosAceptados?.message} />
        </div>

        <button
          type="submit"
          disabled={registrationMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {registrationMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {registrationMutation.isPending ? 'Registrando clínica...' : 'Registrar clínica'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/65">
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

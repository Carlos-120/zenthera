package com.zenthera.bootstrap.initializer;

import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Paciente;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.enums.Sexo;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile("e2e")
@Order(10) // Ejecutar después de DataInitializer (que tiene prioridad por defecto)
public class E2eFixtureInitializer implements ApplicationRunner {

    // Constantes de fixture — nunca toca datos de producción
    private static final String CLINICA_ALPHA_RUC    = "E2E-ALPHA-001";
    private static final String CLINICA_BETA_RUC     = "E2E-BETA-001";
    private static final String USUARIO_ALPHA_CORREO = "medico@alpha.com";
    private static final String USUARIO_ALPHA_CEDULA = "E2E0000001";
    private static final String USUARIO_BETA_CORREO  = "medico@beta.com";
    private static final String USUARIO_BETA_CEDULA  = "E2E0000002";
    private static final String SISTEMA_RUC          = "9999999999001";

    private final ClinicaRepository clinicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;
    private final PasswordEncoder passwordEncoder;

    public E2eFixtureInitializer(ClinicaRepository clinicaRepository,
                                 UsuarioRepository usuarioRepository,
                                 RolRepository rolRepository,
                                 MedicoRepository medicoRepository,
                                 PacienteRepository pacienteRepository,
                                 PasswordEncoder passwordEncoder) {
        this.clinicaRepository = clinicaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.medicoRepository = medicoRepository;
        this.pacienteRepository = pacienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String e2ePassword = System.getenv("E2E_PASSWORD");
        if (e2ePassword == null || e2ePassword.isBlank()) {
            System.err.println("⚠ [E2E] E2E_PASSWORD no configurado. Fixture E2E omitida.");
            return;
        }

        System.out.println("===================================");
        System.out.println("   ZENTHERA E2E FIXTURE INIT       ");
        System.out.println("===================================");

        // 1. Roles creados por RolInitializer dentro de DataInitializer.
        Rol rolAdmin = requireRol(RolNombre.ADMIN_CLINICA);
        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO)
                .orElseThrow(() -> new IllegalStateException(
                        "[E2E] Rol MEDICO no encontrado — asegúrate de que DataInitializer se ejecutó primero."));
        Rol rolRecepcionista = requireRol(RolNombre.RECEPCIONISTA);
        Rol rolSuperAdmin = requireRol(RolNombre.SUPER_ADMIN);

        // 2. Clínicas
        Clinica alpha = getOrCreateClinica("Clínica E2E Alpha", CLINICA_ALPHA_RUC, "alpha@e2e.com");
        Clinica beta  = getOrCreateClinica("Clínica E2E Beta",  CLINICA_BETA_RUC,  "beta@e2e.com");

        // 3. Usuarios reproducibles por rol.
        upsertUsuario("admin@alpha.com", "E2E0000011",
                "Admin", "Alpha", e2ePassword, alpha, rolAdmin);
        upsertUsuario("recepcionista@alpha.com", "E2E0000012",
                "Recepcionista", "Alpha", e2ePassword, alpha, rolRecepcionista);
        upsertUsuario(USUARIO_ALPHA_CORREO, USUARIO_ALPHA_CEDULA,
                "Médico Alpha", "E2E", e2ePassword, alpha, rolMedico);

        upsertUsuario("admin@beta.com", "E2E0000021",
                "Admin", "Beta", e2ePassword, beta, rolAdmin);
        upsertUsuario(USUARIO_BETA_CORREO, USUARIO_BETA_CEDULA,
                "Médico Beta", "E2E", e2ePassword, beta, rolMedico);

        Clinica sistema = clinicaRepository.findByRuc(SISTEMA_RUC)
                .orElseThrow(() -> new IllegalStateException("[E2E] Clínica del sistema no encontrada."));
        upsertUsuario("super@e2e.com", "E2E0000099",
                "Super", "E2E", e2ePassword, sistema, rolSuperAdmin);

        // 4. La autorización MEDICO se resuelve por (tenant, cédula).
        upsertMedico(alpha, USUARIO_ALPHA_CEDULA, "Médico", "Alpha", "medico@alpha.com", "E2E-RP-ALPHA");
        upsertMedico(alpha, "E2E0000013", "Médica", "Alterna Alpha", "medica.alterna@alpha.invalid", "E2E-RP-ALT-A");
        for (int index = 1; index <= 12; index++) {
            String suffix = String.format("%02d", index);
            upsertMedico(alpha, "E2ETEMP0" + suffix, "Médico", "Temporal " + suffix,
                    "medico.temporal." + suffix + "@alpha.invalid", "E2E-TEMP-" + suffix);
        }
        upsertMedico(beta, USUARIO_BETA_CEDULA, "Médico", "Beta", "medico@beta.com", "E2E-RP-BETA");

        // 5. Pacientes estables. Playwright descubre sus IDs mediante la API real.
        upsertPaciente(alpha, "E2EPA00001", "Ana", "Agenda Alpha", Sexo.FEMENINO);
        upsertPaciente(alpha, "E2EPA00002", "Bruno", "Agenda Alpha", Sexo.MASCULINO);
        upsertPaciente(alpha, "E2EPA00003", "Carla", "Solapamiento Alpha", Sexo.FEMENINO);
        for (int index = 1; index <= 12; index++) {
            String suffix = String.format("%02d", index);
            upsertPaciente(alpha, "E2EPT000" + suffix, "Paciente", "Temporal " + suffix, Sexo.OTRO);
        }
        upsertPaciente(beta, "E2EPB00001", "Beatriz", "Agenda Beta", Sexo.FEMENINO);

        System.out.println("✔ [E2E] Fixture E2E creada exitosamente.");
        System.out.println("✔ [E2E] Usuario Alpha disponible: " + USUARIO_ALPHA_CORREO);
        System.out.println("✔ [E2E] Usuario Beta  disponible: " + USUARIO_BETA_CORREO);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Rol requireRol(RolNombre nombre) {
        return rolRepository.findByNombre(nombre)
                .orElseThrow(() -> new IllegalStateException("[E2E] Rol no encontrado: " + nombre));
    }

    private Clinica getOrCreateClinica(String nombre, String ruc, String correo) {
        return clinicaRepository.findByRuc(ruc).orElseGet(() -> {
            Clinica c = new Clinica();
            c.setRuc(ruc);
            c.setNombre(nombre);
            c.setRazonSocial(nombre);
            c.setZonaHoraria("America/Guayaquil");
            c.setTelefono("0999999999");
            c.setCorreo(correo);
            c.setDireccion("E2E Street 123");
            c.setCiudad("E2E City");
            c.setProvincia("E2E Province");
            c.setPais("Ecuador");
            c.setActiva(true);
            Clinica saved = clinicaRepository.save(c);
            System.out.println("✔ [E2E] Clínica creada: " + nombre);
            return saved;
        });
    }

    /**
     * Upsert idempotente: crea el usuario si no existe; si existe, actualiza
     * todos los campos críticos para garantizar un estado limpio antes de cada E2E run.
     */
    private void upsertUsuario(String correo, String cedula, String nombres, String apellidos,
                                String password, Clinica clinica, Rol rol) {

        Usuario u = usuarioRepository.findByCorreo(correo)
                .orElseGet(() -> {
                    Usuario nuevo = new Usuario();
                    nuevo.setCorreo(correo);
                    return nuevo;
                });

        u.setNombres(nombres);
        u.setApellidos(apellidos);
        u.setCedula(cedula);
        u.setPassword(passwordEncoder.encode(password));
        u.setClinica(clinica);
        u.setRol(rol);
        u.setActivo(true);
        u.setBloqueado(false);
        u.setCambiarPassword(false);

        usuarioRepository.save(u);
        System.out.println("✔ [E2E] Usuario upserted: " + correo + " (cédula: " + cedula + ")");
    }

    private void upsertMedico(Clinica clinica, String cedula, String nombres, String apellidos,
                              String correo, String registroProfesional) {
        Medico medico = medicoRepository.findAll().stream()
                .filter(m -> m.getClinica().getId().equals(clinica.getId()) && cedula.equals(m.getCedula()))
                .findFirst()
                .orElseGet(Medico::new);

        medico.setClinica(clinica);
        medico.setCedula(cedula);
        medico.setNombres(nombres);
        medico.setApellidos(apellidos);
        medico.setCorreo(correo);
        medico.setTelefono("0990000000");
        medico.setDireccion("Dirección E2E");
        medico.setEspecialidad("Medicina General");
        medico.setRegistroProfesional(registroProfesional);
        medico.setActivo(true);
        medicoRepository.save(medico);
    }

    private void upsertPaciente(Clinica clinica, String cedula, String nombres, String apellidos, Sexo sexo) {
        Paciente paciente = pacienteRepository.findByClinicaIdAndCedula(clinica.getId(), cedula)
                .orElseGet(Paciente::new);

        paciente.setClinica(clinica);
        paciente.setCedula(cedula);
        paciente.setNombres(nombres);
        paciente.setApellidos(apellidos);
        paciente.setFechaNacimiento(LocalDate.of(1990, 1, 15));
        paciente.setSexo(sexo);
        paciente.setTelefono("0980000000");
        paciente.setCorreo(cedula.toLowerCase() + "@e2e.invalid");
        paciente.setDireccion("Dirección E2E");
        paciente.setActivo(true);
        pacienteRepository.save(paciente);
    }
}

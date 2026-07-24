package com.zenthera.clinica;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.entity.*;
import com.zenthera.enums.RolNombre;
import com.zenthera.enums.Sexo;
import com.zenthera.repository.*;
import com.zenthera.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClinicaCitaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken1;
    private String medicoToken1;
    private String medicoToken2;
    private Clinica clinica1;
    private Clinica clinica2;
    private Paciente pacienteC1;
    private Medico medico1C1;
    private Medico medico2C1;
    private Cita citaM1C1;
    private Cita citaM2C1;
    private Cita citaC2;
    private String recepcionistaToken1;
    private String superAdminToken;
    private String medicoSinPerfilToken;
    private String medicoInactivoToken;

    @BeforeEach
    void setUp() {
        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        Rol rolRecepcionista = rolRepository.findByNombre(RolNombre.RECEPCIONISTA).orElseThrow();
        Rol rolSuperAdmin = rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseThrow();

        // Clinica 1
        clinica1 = new Clinica();
        clinica1.setNombre("Clinica Citas 1");
        clinica1.setRazonSocial("Citas 1 S.A.");
        clinica1.setRuc("4444444444001");
        clinica1 = clinicaRepository.save(clinica1);

        // Usuarios Clinica 1
        Usuario admin1 = new Usuario();
        admin1.setNombres("Admin Cita");
        admin1.setApellidos("Uno");
        admin1.setCedula("8888888881");
        admin1.setCorreo("adminc1@uno.com");
        admin1.setPassword(passwordEncoder.encode("Password123!"));
        admin1.setClinica(clinica1);
        admin1.setRol(rolAdmin);
        admin1.setActivo(true);
        usuarioRepository.save(admin1);
        adminToken1 = jwtService.generateToken(admin1.getCorreo());

        Usuario uMedico1 = new Usuario();
        uMedico1.setNombres("Medico");
        uMedico1.setApellidos("Uno");
        uMedico1.setCedula("8888888882");
        uMedico1.setCorreo("medicoc1@uno.com");
        uMedico1.setPassword(passwordEncoder.encode("Password123!"));
        uMedico1.setClinica(clinica1);
        uMedico1.setRol(rolMedico);
        uMedico1.setActivo(true);
        usuarioRepository.save(uMedico1);
        medicoToken1 = jwtService.generateToken(uMedico1.getCorreo());

        Usuario uMedico2 = new Usuario();
        uMedico2.setNombres("Medico");
        uMedico2.setApellidos("Dos");
        uMedico2.setCedula("8888888883");
        uMedico2.setCorreo("medico2c1@uno.com");
        uMedico2.setPassword(passwordEncoder.encode("Password123!"));
        uMedico2.setClinica(clinica1);
        uMedico2.setRol(rolMedico);
        uMedico2.setActivo(true);
        usuarioRepository.save(uMedico2);
        medicoToken2 = jwtService.generateToken(uMedico2.getCorreo());

        Usuario uRecepcionista = new Usuario();
        uRecepcionista.setNombres("Recep");
        uRecepcionista.setApellidos("Uno");
        uRecepcionista.setCedula("8888888884");
        uRecepcionista.setCorreo("recepcion@uno.com");
        uRecepcionista.setPassword(passwordEncoder.encode("Password123!"));
        uRecepcionista.setClinica(clinica1);
        uRecepcionista.setRol(rolRecepcionista);
        uRecepcionista.setActivo(true);
        usuarioRepository.save(uRecepcionista);
        recepcionistaToken1 = jwtService.generateToken(uRecepcionista.getCorreo());

        Usuario uSuperAdmin = new Usuario();
        uSuperAdmin.setNombres("Super");
        uSuperAdmin.setApellidos("Admin");
        uSuperAdmin.setCedula("8888888885");
        uSuperAdmin.setCorreo("super@admin.com");
        uSuperAdmin.setPassword(passwordEncoder.encode("Password123!"));
        uSuperAdmin.setClinica(clinica1); // super_admin usually can be attached to any, or a default
        uSuperAdmin.setRol(rolSuperAdmin);
        uSuperAdmin.setActivo(true);
        usuarioRepository.save(uSuperAdmin);
        superAdminToken = jwtService.generateToken(uSuperAdmin.getCorreo());

        Usuario uMedicoSinPerfil = new Usuario();
        uMedicoSinPerfil.setNombres("Medico Sin");
        uMedicoSinPerfil.setApellidos("Perfil");
        uMedicoSinPerfil.setCedula("8888888886");
        uMedicoSinPerfil.setCorreo("medicosinperfil@uno.com");
        uMedicoSinPerfil.setPassword(passwordEncoder.encode("Password123!"));
        uMedicoSinPerfil.setClinica(clinica1);
        uMedicoSinPerfil.setRol(rolMedico);
        uMedicoSinPerfil.setActivo(true);
        usuarioRepository.save(uMedicoSinPerfil);
        medicoSinPerfilToken = jwtService.generateToken(uMedicoSinPerfil.getCorreo());

        Usuario uMedicoInactivo = new Usuario();
        uMedicoInactivo.setNombres("Medico");
        uMedicoInactivo.setApellidos("Inactivo");
        uMedicoInactivo.setCedula("8888888887");
        uMedicoInactivo.setCorreo("medicoinactivo@uno.com");
        uMedicoInactivo.setPassword(passwordEncoder.encode("Password123!"));
        uMedicoInactivo.setClinica(clinica1);
        uMedicoInactivo.setRol(rolMedico);
        uMedicoInactivo.setActivo(true);
        usuarioRepository.save(uMedicoInactivo);
        medicoInactivoToken = jwtService.generateToken(uMedicoInactivo.getCorreo());

        // Medicos Clinica 1
        medico1C1 = new Medico();
        medico1C1.setClinica(clinica1);
        medico1C1.setCedula("8888888882");
        medico1C1.setNombres("Medico");
        medico1C1.setApellidos("Uno");
        medico1C1.setActivo(true);
        medico1C1 = medicoRepository.save(medico1C1);

        medico2C1 = new Medico();
        medico2C1.setClinica(clinica1);
        medico2C1.setCedula("8888888883");
        medico2C1.setNombres("Medico");
        medico2C1.setApellidos("Dos");
        medico2C1.setActivo(true);
        medico2C1 = medicoRepository.save(medico2C1);

        Medico medicoInactivo = new Medico();
        medicoInactivo.setClinica(clinica1);
        medicoInactivo.setCedula("8888888887");
        medicoInactivo.setNombres("Medico");
        medicoInactivo.setApellidos("Inactivo");
        medicoInactivo.setActivo(false); // Inactivo!
        medicoInactivo = medicoRepository.save(medicoInactivo);

        // Paciente Clinica 1
        pacienteC1 = new Paciente();
        pacienteC1.setClinica(clinica1);
        pacienteC1.setCedula("0999999991");
        pacienteC1.setNombres("Juan");
        pacienteC1.setApellidos("Perez");
        pacienteC1.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        pacienteC1.setSexo(Sexo.MASCULINO);
        pacienteC1.setActivo(true);
        pacienteC1 = pacienteRepository.save(pacienteC1);

        // Citas Clinica 1
        citaM1C1 = new Cita();
        citaM1C1.setClinica(clinica1);
        citaM1C1.setPaciente(pacienteC1);
        citaM1C1.setMedico(medico1C1);
        citaM1C1.setFechaHoraInicio(Instant.now().plus(1, ChronoUnit.DAYS));
        citaM1C1.setFechaHoraFin(Instant.now().plus(1, ChronoUnit.DAYS).plus(30, ChronoUnit.MINUTES));
        citaM1C1.setDuracionMinutos(30);
        citaM1C1.setEstado(EstadoCita.PROGRAMADA);
        citaM1C1.setMotivo("Chequeo General");
        citaM1C1 = citaRepository.save(citaM1C1);

        citaM2C1 = new Cita();
        citaM2C1.setClinica(clinica1);
        citaM2C1.setPaciente(pacienteC1);
        citaM2C1.setMedico(medico2C1);
        citaM2C1.setFechaHoraInicio(Instant.now().plus(2, ChronoUnit.DAYS));
        citaM2C1.setFechaHoraFin(Instant.now().plus(2, ChronoUnit.DAYS).plus(30, ChronoUnit.MINUTES));
        citaM2C1.setDuracionMinutos(30);
        citaM2C1.setEstado(EstadoCita.PROGRAMADA);
        citaM2C1.setMotivo("Consulta Especialista");
        citaM2C1 = citaRepository.save(citaM2C1);

        // Clinica 2
        clinica2 = new Clinica();
        clinica2.setNombre("Clinica Citas 2");
        clinica2.setRazonSocial("Citas 2 S.A.");
        clinica2.setRuc("5555555555001");
        clinica2 = clinicaRepository.save(clinica2);

        Paciente pacienteC2 = new Paciente();
        pacienteC2.setClinica(clinica2);
        pacienteC2.setCedula("0999999992");
        pacienteC2.setNombres("Maria");
        pacienteC2.setApellidos("Gomez");
        pacienteC2.setFechaNacimiento(LocalDate.of(1995, 1, 1));
        pacienteC2.setSexo(Sexo.FEMENINO);
        pacienteC2.setActivo(true);
        pacienteC2 = pacienteRepository.save(pacienteC2);

        Medico medicoC2 = new Medico();
        medicoC2.setClinica(clinica2);
        medicoC2.setCedula("8888888889");
        medicoC2.setNombres("Medico");
        medicoC2.setApellidos("Dos Clinica Dos");
        medicoC2.setActivo(true);
        medicoC2 = medicoRepository.save(medicoC2);

        citaC2 = new Cita();
        citaC2.setClinica(clinica2);
        citaC2.setPaciente(pacienteC2);
        citaC2.setMedico(medicoC2);
        citaC2.setFechaHoraInicio(Instant.now().plus(3, ChronoUnit.DAYS));
        citaC2.setFechaHoraFin(Instant.now().plus(3, ChronoUnit.DAYS).plus(30, ChronoUnit.MINUTES));
        citaC2.setDuracionMinutos(30);
        citaC2.setEstado(EstadoCita.PROGRAMADA);
        citaC2.setMotivo("Otro motivo");
        citaC2 = citaRepository.save(citaC2);
    }

    @Test
    void listarCitasAdminClinica() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.message").isNotEmpty()).andExpect(jsonPath("$.data.content", hasSize(2))).andExpect(jsonPath("$.data.totalElements").value(2)).andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    void listarCitasMedicoLimitado() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + medicoToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].medico.id").value(medico1C1.getId()));
    }

    @Test
    void obtenerCitaAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas/" + citaM1C1.getId())
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.motivo").value("Chequeo General"));
    }

    @Test
    void obtenerCitaMedicoApropiado() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas/" + citaM1C1.getId())
                        .header("Authorization", "Bearer " + medicoToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.motivo").value("Chequeo General"));
    }

    @Test
    void obtenerCitaMedicoAjenaOcultada() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas/" + citaM2C1.getId())
                        .header("Authorization", "Bearer " + medicoToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void obtenerCitaCrossTenantOcultada() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas/" + citaC2.getId())
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void filtroSearchBuscaMotivo() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas?search=Especialista")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].motivo").value("Consulta Especialista"));
    }

    @Test
    void filtroSizeMayorA50SeLimita() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas?size=100")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void listarCitasRecepcionista() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + recepcionistaToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.message").isNotEmpty()).andExpect(jsonPath("$.data.content", hasSize(2))).andExpect(jsonPath("$.data.totalElements").value(2)).andExpect(jsonPath("$.data.totalPages").value(1));
    }

    @Test
    void detalleIdInexistenteDevuelve404() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas/999999")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void sortNoPermitidoDevuelveError() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas?sort=invalidSortProperty")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void fechaDesdePosteriorAFechaHastaDevuelveError() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas?fechaDesde=2030-01-01T00:00:00Z&fechaHasta=2020-01-01T00:00:00Z")
                        .header("Authorization", "Bearer " + adminToken1)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void usuarioNoAutenticadoNoPuedeAcceder() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized()); // o Forbidden según Spring Security sin token
    }

    @Test
    void superAdminNoPuedeAcceder() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void usuarioMedicoSinPerfilRecibeError() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + medicoSinPerfilToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound()); // ResourceNotFoundException mapped to 404
    }

    @Test
    void asociacionMedicoRespetaActivo() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/citas")
                        .header("Authorization", "Bearer " + medicoInactivoToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound()); // ResourceNotFoundException mapped to 404
    }

}

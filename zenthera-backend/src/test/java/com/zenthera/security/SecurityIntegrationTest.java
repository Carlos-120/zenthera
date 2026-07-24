package com.zenthera.security;

import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.security.jwt.JwtService;
import com.zenthera.security.user.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private com.zenthera.repository.PacienteRepository pacienteRepository;

    @Autowired
    private com.zenthera.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    private String validJwtMedico;
    private String validJwtRecepcionista;
    private Usuario medico;

    @BeforeEach
    void setup() {
        // Al usar @Transactional, la base de datos hace rollback después de cada test.
        // Solo necesitamos limpiar repositorios al principio del setup para asegurarnos
        // de que no queden datos de inicializadores.
        activationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        pacienteRepository.deleteAll();
        usuarioRepository.deleteAll();
        // Nota: si hay otras tablas que dependen de clinica (ej. medicos), deleteAll() de clinica fallará.
        // Pero con H2 mem y rollback, normalmente no es un problema si usamos un estado limpio.
        // Vamos a limpiar todas las tablas hijas antes de clínicas por si acaso.
        clinicaRepository.deleteAll();

        Clinica clinica = new Clinica();
        clinica.setNombre("Clinica Test Security");
        clinica.setRazonSocial("Clinica Test Security SA");
        clinica.setZonaHoraria("America/Guayaquil");
        clinica.setRuc("0999999999002");
        clinica.setCorreo("sec@clinica.com");
        clinica.setActiva(true);
        clinica = clinicaRepository.save(clinica);

        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO)
            .orElseGet(() -> {
                Rol r = new Rol();
                r.setNombre(RolNombre.MEDICO);
                return rolRepository.save(r);
            });

        Rol rolRecep = rolRepository.findByNombre(RolNombre.RECEPCIONISTA)
            .orElseGet(() -> {
                Rol r = new Rol();
                r.setNombre(RolNombre.RECEPCIONISTA);
                return rolRepository.save(r);
            });

        medico = new Usuario();
        medico.setNombres("Dr. House");
        medico.setApellidos("Gregory");
        medico.setCedula("0000000001");
        medico.setCorreo("house@test.com");
        medico.setPassword("hashedpass");
        medico.setActivo(true);
        medico.setBloqueado(false);
        medico.setCambiarPassword(false);
        medico.setClinica(clinica);
        medico.setRol(rolMedico);
        medico = usuarioRepository.save(medico);

        Usuario recep = new Usuario();
        recep.setNombres("Recep");
        recep.setApellidos("Tionista");
        recep.setCedula("0000000002");
        recep.setCorreo("recep@test.com");
        recep.setPassword("hashedpass");
        recep.setActivo(true);
        recep.setBloqueado(false);
        recep.setCambiarPassword(false);
        recep.setClinica(clinica);
        recep.setRol(rolRecep);
        usuarioRepository.save(recep);

        validJwtMedico = jwtService.generateToken(medico.getCorreo());
        validJwtRecepcionista = jwtService.generateToken(recep.getCorreo());
    }

    @Test
    void givenNoOrigin_whenLogin_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenInvalidOrigin_whenLogin_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://malicious.com")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenNoCustomHeader_whenLogin_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenNoJwt_whenAccessProtectedEndpoint_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/pacientes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void givenValidJwtButWrongRole_whenAccessEndpoint_thenForbidden() throws Exception {
        // Recepcionista intentando crear clínica o usuario (requiere ADMIN_CLINICA o SUPER_ADMIN)
        mockMvc.perform(get("/api/clinicas")
                .header("Authorization", "Bearer " + validJwtRecepcionista))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenValidJwtAndRole_whenAccessEndpoint_thenAuthorized() throws Exception {
        // Medico consultando pacientes (requiere ADMIN_CLINICA, MEDICO o RECEPCIONISTA)
        mockMvc.perform(get("/api/pacientes")
                .header("Authorization", "Bearer " + validJwtMedico))
                .andExpect(status().isOk());
    }

    @Test
    void givenPreflightValidOrigin_thenOk() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk());
    }

    @Test
    void givenPreflightInvalidOrigin_thenForbidden() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                .header(HttpHeaders.ORIGIN, "http://malicious.com")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenInactiveUser_whenAuthenticate_thenUnauthorized() throws Exception {
        medico.setActivo(false);
        usuarioRepository.save(medico);

        // Although the JWT signature is valid, the user is inactive in the DB, so the filter rejects it
        mockMvc.perform(get("/api/pacientes")
                .header("Authorization", "Bearer " + validJwtMedico))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void givenInactiveClinica_whenAuthenticate_thenUnauthorized() throws Exception {
        Clinica c = medico.getClinica();
        c.setActiva(false);
        clinicaRepository.save(c);

        mockMvc.perform(get("/api/pacientes")
                .header("Authorization", "Bearer " + validJwtMedico))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void givenPacienteInClinicaB_whenClinicaARequests_thenNotFound() throws Exception {
        // Crear Clínica B
        Clinica clinicaB = new Clinica();
        clinicaB.setNombre("Clinica B");
        clinicaB.setRazonSocial("Clinica B SA");
        clinicaB.setZonaHoraria("America/Guayaquil");
        clinicaB.setRuc("0999999999003");
        clinicaB.setCorreo("clinicab@test.com");
        clinicaB.setActiva(true);
        clinicaB = clinicaRepository.save(clinicaB);

        // Crear Paciente en Clínica B
        com.zenthera.entity.Paciente pacienteB = new com.zenthera.entity.Paciente();
        pacienteB.setCedula("0000000003");
        pacienteB.setNombres("Paciente");
        pacienteB.setApellidos("B");
        pacienteB.setFechaNacimiento(java.time.LocalDate.of(1990, 1, 1));
        pacienteB.setSexo(com.zenthera.enums.Sexo.MASCULINO);
        pacienteB.setActivo(true);
        pacienteB.setClinica(clinicaB);
        pacienteB = pacienteRepository.save(pacienteB);

        // Medico pertenece a Clínica A (validJwtMedico)
        // Intenta obtener al paciente de la clínica B
        mockMvc.perform(get("/api/pacientes/" + pacienteB.getId())
                .header("Authorization", "Bearer " + validJwtMedico))
                .andExpect(status().isBadRequest()) // IllegalArgumentException de paciente no encontrado mapea a bad request o internal server error en el handler global actual
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenRequestFinished_whenCheckTenantContext_thenContextIsEmpty() throws Exception {
        // Hacemos una petición válida
        mockMvc.perform(get("/api/pacientes")
                .header("Authorization", "Bearer " + validJwtMedico))
                .andExpect(status().isOk());

        // Al finalizar la petición, el filtro debe haber limpiado el ThreadLocal
        assertTrue(com.zenthera.security.tenant.TenantContext.getCurrentTenant() == null);
    }
}

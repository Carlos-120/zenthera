package com.zenthera.paciente;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.paciente.EstadoPacienteRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Paciente;
import com.zenthera.entity.Usuario;
import com.zenthera.entity.Rol;
import com.zenthera.enums.RolNombre;
import com.zenthera.enums.Sexo;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.repository.CitaRepository;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.repository.MedicoRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
public class PacienteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String superAdminToken;
    private Long clinicaId;
    private Long pacienteId;

    @BeforeEach
    void setUp() throws Exception {
        citaRepository.deleteAll();
        activationTokenRepository.deleteAll();
        pacienteRepository.deleteAll();
        usuarioRepository.deleteAll();
        medicoRepository.deleteAll();
        clinicaRepository.deleteAll();

        // 1. Crear clínica
        Clinica clinica = new Clinica();
        clinica.setNombre("Clinica Pacientes");
        clinica.setRuc("0999999999001");
        clinica.setCorreo("contacto@clinica.com");
        clinica.setTelefono("0999999999");
        clinica.setDireccion("Direccion");
        clinica.setActiva(true);
        clinica.setOnboardingCompletado(false);
        clinica = clinicaRepository.save(clinica);
        clinicaId = clinica.getId();

        // 2. Crear admin
        Usuario admin = new Usuario();
        admin.setNombres("Admin");
        admin.setApellidos("Clinica");
        admin.setCorreo("admin@clinica.com");
        admin.setPassword(passwordEncoder.encode("Password123!"));
        Rol rol = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(RolNombre.ADMIN_CLINICA);
            return rolRepository.save(r);
        });
        admin.setRol(rol);
        admin.setActivo(true);
        admin.setBloqueado(false);
        admin.setClinica(clinica);
        usuarioRepository.save(admin);

        // 3. Crear Paciente
        Paciente paciente = new Paciente();
        paciente.setCedula("1234567890");
        paciente.setNombres("Juan");
        paciente.setApellidos("Perez");
        paciente.setSexo(Sexo.MASCULINO);
        paciente.setFechaNacimiento(LocalDate.parse("1990-01-01"));
        paciente.setActivo(true);
        paciente.setClinica(clinica);
        paciente = pacienteRepository.save(paciente);
        pacienteId = paciente.getId();

        // 4. Obtener Token
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "correo": "admin@clinica.com",
                          "password": "Password123!"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        adminToken = objectMapper.readTree(loginResponse).path("data").path("accessToken").asText();

        // 5. Crear SUPER_ADMIN
        Usuario superAdmin = new Usuario();
        superAdmin.setNombres("Super");
        superAdmin.setApellidos("Admin");
        superAdmin.setCorreo("super@admin.com");
        superAdmin.setPassword(passwordEncoder.encode("Password123!"));
        Rol rolSuper = rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(RolNombre.SUPER_ADMIN);
            return rolRepository.save(r);
        });
        superAdmin.setRol(rolSuper);
        superAdmin.setActivo(true);
        superAdmin.setBloqueado(false);
        usuarioRepository.save(superAdmin);

        // 6. Obtener Token SUPER_ADMIN
        String loginResponseSuper = mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "correo": "super@admin.com",
                          "password": "Password123!"
                        }
                        """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        superAdminToken = objectMapper.readTree(loginResponseSuper).path("data").path("accessToken").asText();
    }

    @AfterEach
    void tearDown() {
        citaRepository.deleteAll();
        activationTokenRepository.deleteAll();
        pacienteRepository.deleteAll();
        usuarioRepository.deleteAll();
        medicoRepository.deleteAll();
        clinicaRepository.deleteAll();
    }

    @Test
    void testListarPaginadoYFiltrado() throws Exception {
        mockMvc.perform(get("/api/pacientes/paginado")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken)
                .param("page", "0")
                .param("size", "10")
                .param("search", "Juan")
                .param("activo", "true")
                .param("sort", "nombres")
                .param("direction", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].nombres", is("Juan")));
    }

    @Test
    void testActualizarEstado() throws Exception {
        EstadoPacienteRequest request = new EstadoPacienteRequest(false);

        mockMvc.perform(patch("/api/pacientes/" + pacienteId + "/estado")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));

        // Verificar con listarPaginado que ya no sale con activo=true
        mockMvc.perform(get("/api/pacientes/paginado")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken)
                .param("page", "0")
                .param("size", "10")
                .param("activo", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));
    }

    @Test
    void testCrearPacienteExitosoSinClinicaId() throws Exception {
        mockMvc.perform(post("/api/pacientes")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "cedula": "0998877665",
                          "nombres": "Nuevo",
                          "apellidos": "Paciente",
                          "fechaNacimiento": "2000-01-01",
                          "sexo": "MASCULINO"
                        }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.nombres", is("Nuevo")));
    }

    @Test
    void testCrearPacienteSuperAdminFalla() throws Exception {
        mockMvc.perform(post("/api/pacientes")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "cedula": "0998877665",
                          "nombres": "Nuevo",
                          "apellidos": "Paciente",
                          "fechaNacimiento": "2000-01-01",
                          "sexo": "MASCULINO"
                        }
                        """))
                .andExpect(status().isForbidden()); // O un error 4xx/5xx controlado
    }

    @Test
    void testObtenerPorIdExitoso() throws Exception {
        mockMvc.perform(get("/api/pacientes/" + pacienteId)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(pacienteId.intValue())))
                .andExpect(jsonPath("$.data.nombres", is("Juan")))
                .andExpect(jsonPath("$.data").value(not(hasKey("clinicaId"))))
                .andExpect(jsonPath("$.data").value(not(hasKey("nombreClinica"))));
    }

    @Test
    void testObtenerPorIdInexistenteDevuelve404() throws Exception {
        mockMvc.perform(get("/api/pacientes/999999")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Paciente no encontrado")));
    }

    @Test
    void testObtenerPorIdCrossTenantDevuelve404() throws Exception {
        // Crear clínica y admin 2
        Clinica clinica2 = new Clinica();
        clinica2.setNombre("Otra");
        clinica2.setRuc("0999999999002");
        clinica2.setCorreo("otra@clinica.com");
        clinica2.setTelefono("0999999998");
        clinica2.setDireccion("Otra");
        clinica2.setActiva(true);
        clinica2.setOnboardingCompletado(false);
        clinica2 = clinicaRepository.save(clinica2);

        Usuario admin2 = new Usuario();
        admin2.setNombres("Admin2");
        admin2.setApellidos("Clinica2");
        admin2.setCorreo("admin2@clinica.com");
        admin2.setPassword(passwordEncoder.encode("Password123!"));
        Rol rol = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        admin2.setRol(rol);
        admin2.setActivo(true);
        admin2.setBloqueado(false);
        admin2.setClinica(clinica2);
        usuarioRepository.save(admin2);

        // Obtener token 2
        String loginResponse2 = mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "correo": "admin2@clinica.com",
                          "password": "Password123!"
                        }
                        """))
                .andReturn().getResponse().getContentAsString();
        String adminToken2 = objectMapper.readTree(loginResponse2).path("data").path("accessToken").asText();

        // Admin 2 intenta ver el paciente 1
        mockMvc.perform(get("/api/pacientes/" + pacienteId)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Paciente no encontrado"))); // Same error as non-existent to avoid information disclosure
    }

    @Test
    void testActualizarPacientePropioExitoso() throws Exception {
        mockMvc.perform(put("/api/pacientes/" + pacienteId)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "cedula": "1234567890",
                          "nombres": "Juan Modificado",
                          "apellidos": "Perez",
                          "fechaNacimiento": "1990-01-01",
                          "sexo": "MASCULINO",
                          "telefono": "0912345678",
                          "activo": true
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nombres", is("Juan Modificado")))
                .andExpect(jsonPath("$.data.telefono", is("0912345678")));
    }

    @Test
    void testActualizarPacienteCrossTenantDevuelve404() throws Exception {
        // Crear clínica y admin 2
        Clinica clinica2 = new Clinica();
        clinica2.setNombre("Otra Update");
        clinica2.setRuc("0999999999003");
        clinica2.setCorreo("otra_update@clinica.com");
        clinica2.setTelefono("0999999997");
        clinica2.setDireccion("Otra Update");
        clinica2.setActiva(true);
        clinica2.setOnboardingCompletado(false);
        clinica2 = clinicaRepository.save(clinica2);

        Usuario admin2 = new Usuario();
        admin2.setNombres("Admin2 Update");
        admin2.setApellidos("Clinica2 Update");
        admin2.setCorreo("admin2_update@clinica.com");
        admin2.setPassword(passwordEncoder.encode("Password123!"));
        Rol rol = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        admin2.setRol(rol);
        admin2.setActivo(true);
        admin2.setBloqueado(false);
        admin2.setClinica(clinica2);
        usuarioRepository.save(admin2);

        // Obtener token 2
        String loginResponse2 = mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "correo": "admin2_update@clinica.com",
                          "password": "Password123!"
                        }
                        """))
                .andReturn().getResponse().getContentAsString();
        String admin2Token = objectMapper.readTree(loginResponse2).path("data").path("accessToken").asText();

        // Intentar actualizar paciente de la clínica 1 con el token de la clínica 2
        mockMvc.perform(put("/api/pacientes/" + pacienteId)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Authorization", "Bearer " + admin2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "cedula": "1234567890",
                          "nombres": "Juan Hack",
                          "apellidos": "Perez",
                          "fechaNacimiento": "1990-01-01",
                          "sexo": "MASCULINO",
                          "activo": true
                        }
                        """))
                .andExpect(status().isNotFound());
    }
}

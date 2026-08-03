package com.zenthera.medico;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Usuario;
import com.zenthera.entity.Rol;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.repository.CitaRepository;
import com.zenthera.repository.ActivationTokenRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
public class MedicoTenantIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminTokenClinicaA;
    private String adminTokenClinicaB;
    private String superAdminToken;
    private Long clinicaIdA;
    private Long clinicaIdB;
    private Long medicoIdA;
    private Long medicoIdB;

    @BeforeEach
    void setUp() throws Exception {
        citaRepository.deleteAll();
        activationTokenRepository.deleteAll();
        pacienteRepository.deleteAll();
        usuarioRepository.deleteAll();
        medicoRepository.deleteAll();
        clinicaRepository.deleteAll();

        // 1. Crear Clínica A y su Medico
        Clinica clinicaA = new Clinica();
        clinicaA.setNombre("Clinica A");
        clinicaA.setRuc("0000000000001");
        clinicaA.setActiva(true);
        clinicaA.setCorreo("contacto@clinicaA.com");
        clinicaA = clinicaRepository.save(clinicaA);
        clinicaIdA = clinicaA.getId();

        Medico medicoA = new Medico();
        medicoA.setCedula("1111111111");
        medicoA.setNombres("Medico");
        medicoA.setApellidos("A");
        medicoA.setEspecialidad("Cardiologia");
        medicoA.setActivo(true);
        medicoA.setClinica(clinicaA);
        medicoA = medicoRepository.save(medicoA);
        medicoIdA = medicoA.getId();

        // 2. Crear Clínica B y su Medico
        Clinica clinicaB = new Clinica();
        clinicaB.setNombre("Clinica B");
        clinicaB.setRuc("0000000000002");
        clinicaB.setActiva(true);
        clinicaB.setCorreo("contacto@clinicaB.com");
        clinicaB = clinicaRepository.save(clinicaB);
        clinicaIdB = clinicaB.getId();

        Medico medicoB = new Medico();
        medicoB.setCedula("2222222222");
        medicoB.setNombres("Medico");
        medicoB.setApellidos("B");
        medicoB.setEspecialidad("Dermatologia");
        medicoB.setActivo(true);
        medicoB.setClinica(clinicaB);
        medicoB = medicoRepository.save(medicoB);
        medicoIdB = medicoB.getId();

        // 3. Roles
        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(RolNombre.ADMIN_CLINICA);
            return rolRepository.save(r);
        });

        Rol rolSuperAdmin = rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(RolNombre.SUPER_ADMIN);
            return rolRepository.save(r);
        });

        // 4. Crear Admin Clínica A
        Usuario adminA = new Usuario();
        adminA.setNombres("Admin");
        adminA.setApellidos("A");
        adminA.setCorreo("admin@clinicaA.com");
        adminA.setPassword(passwordEncoder.encode("Password123!"));
        adminA.setRol(rolAdmin);
        adminA.setActivo(true);
        adminA.setClinica(clinicaA);
        usuarioRepository.save(adminA);

        // 5. Crear Admin Clínica B
        Usuario adminB = new Usuario();
        adminB.setNombres("Admin");
        adminB.setApellidos("B");
        adminB.setCorreo("admin@clinicaB.com");
        adminB.setPassword(passwordEncoder.encode("Password123!"));
        adminB.setRol(rolAdmin);
        adminB.setActivo(true);
        adminB.setClinica(clinicaB);
        usuarioRepository.save(adminB);

        // 6. Crear Super Admin
        Usuario superAdmin = new Usuario();
        superAdmin.setNombres("Super");
        superAdmin.setApellidos("Admin");
        superAdmin.setCorreo("super@zenthera.com");
        superAdmin.setPassword(passwordEncoder.encode("Password123!"));
        superAdmin.setRol(rolSuperAdmin);
        superAdmin.setActivo(true);
        usuarioRepository.save(superAdmin);

        // Obtener Tokens
        adminTokenClinicaA = getToken("admin@clinicaA.com");
        adminTokenClinicaB = getToken("admin@clinicaB.com");
        superAdminToken = getToken("super@zenthera.com");
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

    private String getToken(String email) throws Exception {
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"correo\": \"%s\", \"password\": \"Password123!\"}", email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(loginResponse).path("data").path("accessToken").asText();
    }

    @Test
    void testClinicaAConsultaSuMedico() throws Exception {
        mockMvc.perform(get("/api/medicos/" + medicoIdA)
                .header("Authorization", "Bearer " + adminTokenClinicaA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(medicoIdA.intValue())))
                .andExpect(jsonPath("$.data.cedula", is("1111111111")));
    }

    @Test
    void testClinicaANoPuedeConsultarMedicoClinicaB() throws Exception {
        mockMvc.perform(get("/api/medicos/" + medicoIdB)
                .header("Authorization", "Bearer " + adminTokenClinicaA))
                .andExpect(status().isBadRequest()) // IllegalArgumentException is currently mapped to 400 Bad Request
                .andExpect(jsonPath("$.message", is("Medico no encontrado.")));
    }

    @Test
    void testSuperAdminSinTenantRecibeError() throws Exception {
        mockMvc.perform(get("/api/medicos/" + medicoIdA)
                .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isForbidden()); // or Bad Request based on TenantContext resolution
    }

    @Test
    void testClinicaANoPuedeActualizarMedicoClinicaB() throws Exception {
        MedicoRequest request = new MedicoRequest();
        request.setCedula("3333333333");
        request.setNombres("Hack");
        request.setApellidos("Hack");
        request.setEspecialidad("Hack");
        request.setActivo(true);

        mockMvc.perform(put("/api/medicos/" + medicoIdB)
                .header("Authorization", "Bearer " + adminTokenClinicaA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Medico no encontrado.")));
    }

    @Test
    void testClinicaANoPuedeCambiarEstadoMedicoClinicaB() throws Exception {
        mockMvc.perform(patch("/api/medicos/" + medicoIdB + "/estado")
                .header("Authorization", "Bearer " + adminTokenClinicaA)
                .param("activo", "false"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Medico no encontrado.")));
    }

    @Test
    void testListadoSoloMuestraMedicosDeSuClinica() throws Exception {
        mockMvc.perform(get("/api/medicos")
                .header("Authorization", "Bearer " + adminTokenClinicaA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(medicoIdA.intValue())));
    }
}

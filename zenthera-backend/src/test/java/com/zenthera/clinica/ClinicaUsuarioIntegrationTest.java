package com.zenthera.clinica;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClinicaUsuarioIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private Clinica clinicaAlpha;
    private Clinica clinicaBeta;
    private String tokenAlpha;
    private String tokenBeta;
    private Rol rolMedico;
    private Rol rolAdmin;
    private Rol rolSuperAdmin;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        clinicaAlpha = new Clinica();
        clinicaAlpha.setNombre("Clinica Alpha");
        clinicaAlpha.setRuc("0000000001001");
        clinicaAlpha.setCorreo("contacto@alpha.com");
        clinicaAlpha.setActiva(true);
        clinicaAlpha = clinicaRepository.save(clinicaAlpha);

        clinicaBeta = new Clinica();
        clinicaBeta.setNombre("Clinica Beta");
        clinicaBeta.setRuc("0000000002001");
        clinicaBeta.setCorreo("contacto@beta.com");
        clinicaBeta.setActiva(true);
        clinicaBeta = clinicaRepository.save(clinicaBeta);

        rolMedico = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        rolSuperAdmin = rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseThrow();

        Usuario adminAlpha = new Usuario();
        adminAlpha.setClinica(clinicaAlpha);
        adminAlpha.setRol(rolAdmin);
        adminAlpha.setNombres("Admin");
        adminAlpha.setApellidos("Alpha");
        adminAlpha.setCorreo("admin@alpha.com");
        adminAlpha.setCedula("1111111111");
        adminAlpha.setPassword(passwordEncoder.encode("password"));
        adminAlpha.setActivo(true);
        adminAlpha = usuarioRepository.save(adminAlpha);

        Usuario adminBeta = new Usuario();
        adminBeta.setClinica(clinicaBeta);
        adminBeta.setRol(rolAdmin);
        adminBeta.setNombres("Admin");
        adminBeta.setApellidos("Beta");
        adminBeta.setCorreo("admin@beta.com");
        adminBeta.setCedula("2222222222");
        adminBeta.setPassword(passwordEncoder.encode("password"));
        adminBeta.setActivo(true);
        adminBeta = usuarioRepository.save(adminBeta);

        tokenAlpha = jwtService.generateToken(adminAlpha.getCorreo());
        tokenBeta = jwtService.generateToken(adminBeta.getCorreo());
    }

    @Test
    void listarUsuarios_TenantSafe() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/usuarios")
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].correo", is("admin@alpha.com")));
    }

    @Test
    void crearUsuario_Success() throws Exception {
        UsuarioRequest request = new UsuarioRequest();
        request.setRolId(rolMedico.getId());
        request.setNombres("Nuevo");
        request.setApellidos("Medico");
        request.setCedula("3333333333");
        request.setCorreo("medico@alpha.com");
        request.setPassword("password");

        mockMvc.perform(post("/api/v1/clinica/usuarios")
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.correo", is("medico@alpha.com")))
                .andExpect(jsonPath("$.data.clinicaId", is(clinicaAlpha.getId().intValue())))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void crearUsuario_NoPuedeAsignarSuperAdmin() throws Exception {
        UsuarioRequest request = new UsuarioRequest();
        request.setRolId(rolSuperAdmin.getId());
        request.setNombres("Hacker");
        request.setApellidos("Malo");
        request.setCedula("4444444444");
        request.setCorreo("hacker@alpha.com");
        request.setPassword("password");

        mockMvc.perform(post("/api/v1/clinica/usuarios")
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("No se puede crear un usuario con rol SUPER_ADMIN")));
    }

    @Test
    void leerUsuarioPropio_Success() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();

        mockMvc.perform(get("/api/v1/clinica/usuarios/" + alpha.getId())
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.correo", is("admin@alpha.com")))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void leerCrossTenant_Bloqueado() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();

        mockMvc.perform(get("/api/v1/clinica/usuarios/" + alpha.getId())
                        .header("Authorization", "Bearer " + tokenBeta)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("no encontrado")));
    }

    @Test
    void actualizarUsuario_Success() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();
        
        UsuarioRequest request = new UsuarioRequest();
        request.setRolId(rolMedico.getId());
        request.setNombres("Admin Editado");
        request.setApellidos("Alpha");
        request.setCedula("1111111111");
        request.setCorreo("admin@alpha.com");
        request.setPassword("newpassword");

        mockMvc.perform(put("/api/v1/clinica/usuarios/" + alpha.getId())
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nombres", is("Admin Editado")))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void actualizarCrossTenant_Bloqueado() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();
        
        UsuarioRequest request = new UsuarioRequest();
        request.setRolId(rolMedico.getId());
        request.setNombres("Admin Hack");
        request.setApellidos("Alpha");
        request.setCedula("1111111111");
        request.setCorreo("admin@alpha.com");
        request.setPassword("password");

        mockMvc.perform(put("/api/v1/clinica/usuarios/" + alpha.getId())
                        .header("Authorization", "Bearer " + tokenBeta)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("no encontrado")));
    }

    @Test
    void cambiarEstado_Success() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();

        mockMvc.perform(patch("/api/v1/clinica/usuarios/" + alpha.getId() + "/estado")
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activo\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));
    }

    @Test
    void cambiarEstadoCrossTenant_Bloqueado() throws Exception {
        Usuario alpha = usuarioRepository.findByCorreo("admin@alpha.com").get();

        mockMvc.perform(patch("/api/v1/clinica/usuarios/" + alpha.getId() + "/estado")
                        .header("Authorization", "Bearer " + tokenBeta)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activo\": false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("no encontrado")));
    }

    @Test
    void listarRolesAsignables_ExcluyeSuperAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/clinica/roles")
                        .header("Authorization", "Bearer " + tokenAlpha)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size()", greaterThan(0)))
                .andExpect(jsonPath("$.data[*].nombre", not(hasItem("SUPER_ADMIN"))));
    }
}

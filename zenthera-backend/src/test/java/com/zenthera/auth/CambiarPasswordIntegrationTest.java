package com.zenthera.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.auth.CambiarPasswordRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.security.jwt.JwtService;
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
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CambiarPasswordIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private Usuario medicoAutenticado;
    private String validToken;

    @BeforeEach
    void setUp() {
        Clinica clinica = new Clinica();
        clinica.setNombre("Clinica Password Test");
        clinica.setRuc("0987654321001");
        clinica.setCorreo("test_clinica_pass@test.com");
        clinicaRepository.saveAndFlush(clinica);

        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO)
                .orElseGet(() -> {
                    Rol r = new Rol();
                    r.setNombre(RolNombre.MEDICO);
                    return rolRepository.saveAndFlush(r);
                });

        medicoAutenticado = new Usuario();
        medicoAutenticado.setNombres("Juan");
        medicoAutenticado.setApellidos("Perez");
        medicoAutenticado.setCorreo("juan_pass@test.com");
        medicoAutenticado.setPassword(passwordEncoder.encode("temporalPassword123"));
        medicoAutenticado.setRol(rolMedico);
        medicoAutenticado.setClinica(clinica);
        medicoAutenticado.setCambiarPassword(true);
        medicoAutenticado.setActivo(true);
        usuarioRepository.saveAndFlush(medicoAutenticado);

        validToken = jwtService.generateToken(medicoAutenticado.getCorreo());
    }

    @AfterEach
    void tearDown() {
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();
    }

    @Test
    void cambiarPassword_requestValido_exito() throws Exception {
        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setNewPassword("NuevaPass123456");
        request.setConfirmPassword("NuevaPass123456");

        mockMvc.perform(post("/api/v1/auth/cambiar-password")
                .header("Authorization", "Bearer " + validToken)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Usuario actualizado = usuarioRepository.findById(medicoAutenticado.getId()).orElseThrow();
        assertFalse(actualizado.getCambiarPassword());
        assertTrue(passwordEncoder.matches("NuevaPass123456", actualizado.getPassword()));
        assertFalse(passwordEncoder.matches("temporalPassword123", actualizado.getPassword()));
    }

    @Test
    void cambiarPassword_noCoinciden_errorBadRequest() throws Exception {
        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setNewPassword("NuevaPass123456");
        request.setConfirmPassword("DiferentePass123");

        mockMvc.perform(post("/api/v1/auth/cambiar-password")
                .header("Authorization", "Bearer " + validToken)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Las contraseñas no coinciden"));
    }

    @Test
    void cambiarPassword_passwordPolicyInvalida_errorValidacion() throws Exception {
        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setNewPassword("corta");
        request.setConfirmPassword("corta");

        mockMvc.perform(post("/api/v1/auth/cambiar-password")
                .header("Authorization", "Bearer " + validToken)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Error de validación"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void cambiarPassword_noAutenticado_errorForbidden() throws Exception {
        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setNewPassword("NuevaPass123456");
        request.setConfirmPassword("NuevaPass123456");

        mockMvc.perform(post("/api/v1/auth/cambiar-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}

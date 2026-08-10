package com.zenthera;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.auth.ActivationRequest;
import com.zenthera.entity.ActivationToken;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Usuario;
import com.zenthera.entity.Rol;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.util.HashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ActivationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private Clinica clinica;
    private Usuario usuario;
    private String rawToken;
    private ActivationToken activationToken;

    @BeforeEach
    void setUp() {
        activationTokenRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM medicos");
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        clinica = new Clinica();
        clinica.setRuc("0999999999001");
        clinica.setRazonSocial("Test Clinica");
        clinica.setNombre("Test");
        clinica.setCorreo("test@clinica.com");
        clinica.setTelefono("0999999999");
        clinica.setDireccion("Direccion");
        clinica.setZonaHoraria("America/Guayaquil");
        clinica.setActiva(true);
        clinica = clinicaRepository.save(clinica);

        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA)
                .orElseThrow();

        usuario = new Usuario();
        usuario.setClinica(clinica);
        usuario.setRol(rolAdmin);
        usuario.setNombres("Admin");
        usuario.setApellidos("Test");
        usuario.setCorreo("admin@clinica.com");
        usuario.setCedula("0999999999");
        usuario.setPassword("hash");
        usuario.setActivo(false);
        usuario.setCambiarPassword(true);
        usuario.setBloqueado(false);
        usuario = usuarioRepository.save(usuario);

        rawToken = "testToken123456789012345678901234567890";
        activationToken = new ActivationToken();
        activationToken.setUsuario(usuario);
        activationToken.setTokenHash(HashUtil.sha256(rawToken));
        activationToken.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        activationToken = activationTokenRepository.save(activationToken);
    }

    @Test
    void givenValidToken_whenActivate_thenSuccess() throws Exception {
        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Usuario u = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(u.getActivo());
        assertFalse(u.getCambiarPassword());

        ActivationToken at = activationTokenRepository.findById(activationToken.getId()).orElseThrow();
        assertTrue(at.isUsed());
    }

    @Test
    void givenExpiredToken_whenActivate_thenGenericError() throws Exception {
        activationToken.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        activationTokenRepository.save(activationToken);

        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El token de activación es inválido o ha expirado"));
    }

    @Test
    void givenUsedToken_whenActivate_thenGenericError() throws Exception {
        activationToken.setUsed(true);
        activationTokenRepository.save(activationToken);

        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El token de activación es inválido o ha expirado"));
    }

    @Test
    void givenInvalidToken_whenActivate_thenGenericError() throws Exception {
        ActivationRequest request = new ActivationRequest();
        request.setToken("invalidTokenThatDoesNotExist");
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El token de activación es inválido o ha expirado"));
    }

    @Test
    void givenInactiveClinic_whenActivate_thenError() throws Exception {
        clinica.setActiva(false);
        clinicaRepository.save(clinica);

        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La clínica asociada se encuentra inactiva"));
    }

    @Test
    void givenShortPassword_whenActivate_thenValidationError() throws Exception {
        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("Short1!"); // 7 chars

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error de validación"));
    }

    @Test
    void givenConcurrentRequests_whenActivate_thenOnlyOneSucceeds() throws Exception {
        int threadCount = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger badRequestCount = new AtomicInteger(0);

        ActivationRequest request = new ActivationRequest();
        request.setToken(rawToken);
        request.setPassword("ValidPassword123!");
        String jsonPayload = objectMapper.writeValueAsString(request);

        for (int i = 0; i < threadCount; i++) {
            executorService.submit(() -> {
                try {
                    latch.await();
                    var result = mockMvc.perform(post("/api/v1/auth/activate")
                                    .header("Origin", "http://localhost:3000")
                                    .header("X-Requested-With", "XMLHttpRequest")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(jsonPayload))
                            .andReturn();

                    int status = result.getResponse().getStatus();
                    if (status == 200) {
                        successCount.incrementAndGet();
                    } else if (status == 400) {
                        badRequestCount.incrementAndGet();
                    } else {
                        System.err.println("Unexpected status in concurrent test: " + status);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        latch.countDown(); // Release both threads
        doneLatch.await(); // Wait for completion

        assertEquals(1, successCount.get(), "Exactamente una petición debe ser 200 OK");
        assertEquals(1, badRequestCount.get(), "Exactamente una petición debe fallar con 400 (Token utilizado)");

        // Verificar estado final en BD
        Usuario u = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(u.getActivo(), "El usuario debe estar activo");
        assertFalse(u.getCambiarPassword(), "No debe requerir cambio de contraseña");
        assertNotEquals("hash", u.getPassword(), "La contraseña debe haber cambiado");
        assertTrue(passwordEncoder.matches("ValidPassword123!", u.getPassword()), "La contraseña debe coincidir con ValidPassword123! usando PasswordEncoder");

        ActivationToken at = activationTokenRepository.findById(activationToken.getId()).orElseThrow();
        assertTrue(at.isUsed(), "El token debe estar marcado como usado");
    }
}

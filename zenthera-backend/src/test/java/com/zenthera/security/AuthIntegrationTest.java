package com.zenthera.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RefreshTokenRepository;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private Usuario medico;

    @BeforeEach
    void setup() {
        activationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        Clinica clinica = new Clinica();
        clinica.setNombre("Clínica Test");
        clinica.setRuc("1234567890123");
        clinica.setRazonSocial("Clínica Test SA");
        clinica.setZonaHoraria("America/Guayaquil");
        clinica.setTelefono("0999999999");
        clinica.setCorreo("test@clinica.com");
        clinica.setDireccion("Calle Falsa 123");
        clinica.setActiva(true);
        clinica = clinicaRepository.save(clinica);

        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO)
                .orElseGet(() -> {
                    Rol r = new Rol();
                    r.setNombre(RolNombre.MEDICO);
                    return rolRepository.save(r);
                });

        medico = new Usuario();
        medico.setCedula("1111111111");
        medico.setNombres("Dr. House");
        medico.setApellidos("Gregory");
        medico.setCorreo("house@clinic.com");
        medico.setPassword(passwordEncoder.encode("password123"));
        medico.setRol(rolMedico);
        medico.setClinica(clinica);
        medico.setActivo(true);
        medico = usuarioRepository.save(medico);
    }

    @Test
    void givenValidCredentials_whenLogin_thenReturnsTokensAndCookie() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setCorreo("house@clinic.com");
        request.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", "http://localhost:3000") // CORS
                .header("X-Requested-With", "XMLHttpRequest") // CSRF
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        Cookie refreshTokenCookie = result.getResponse().getCookie("refreshToken");
        assertNotNull(refreshTokenCookie);
        assertTrue(refreshTokenCookie.isHttpOnly());
        assertEquals("Strict", refreshTokenCookie.getAttribute("SameSite"));
        assertEquals("/api/v1/auth", refreshTokenCookie.getPath());

        // Verificar persistencia en base de datos
        assertEquals(1, refreshTokenRepository.count());
    }

    @Test
    void givenValidRefreshToken_whenRefresh_thenReturnsNewTokens() throws Exception {
        // 1. Realizar Login para obtener Cookie
        LoginRequest request = new LoginRequest();
        request.setCorreo("house@clinic.com");
        request.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie oldCookie = loginResult.getResponse().getCookie("refreshToken");

        // 2. Ejecutar Refresh
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(oldCookie)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")) // CSRF custom header (if applicable)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        Cookie newCookie = refreshResult.getResponse().getCookie("refreshToken");

        // 3. Verificar que la vieja cookie fue reemplazada y el viejo token revocado en DB
        assertNotEquals(oldCookie.getValue(), newCookie.getValue());
        assertEquals(2, refreshTokenRepository.count()); // Hay dos tokens en base

        // El primer token debería estar revocado ahora
        String oldHash = com.zenthera.util.HashUtil.sha256(oldCookie.getValue());
        com.zenthera.entity.RefreshToken oldTokenInDb = refreshTokenRepository.findByTokenHash(oldHash).orElseThrow();
        assertTrue(oldTokenInDb.isRevocado());

        String newHash = com.zenthera.util.HashUtil.sha256(newCookie.getValue());
        com.zenthera.entity.RefreshToken newTokenInDb = refreshTokenRepository.findByTokenHash(newHash).orElseThrow();
        assertFalse(newTokenInDb.isRevocado());
    }

    @Test
    void givenRevokedRefreshToken_whenRefresh_thenFamilyIsRevokedAndReturns401() throws Exception {
        // 1. Login
        LoginRequest request = new LoginRequest();
        request.setCorreo("house@clinic.com");
        request.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie oldCookie = loginResult.getResponse().getCookie("refreshToken");

        // 2. Refresh 1 (Exitoso)
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(oldCookie)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie newCookie = refreshResult.getResponse().getCookie("refreshToken");

        // 3. Intento de reusar el oldCookie (Simulación de Robo de Token o Doble Envío)
        mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(oldCookie)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Reutilización de refresh token detectada. Sesión invalidada."));

        // 4. Verificar que toda la familia fue revocada
        // El nuevo token (que antes era válido) ahora debe estar revocado también
        String newHash = com.zenthera.util.HashUtil.sha256(newCookie.getValue());
        com.zenthera.entity.RefreshToken newTokenInDb = refreshTokenRepository.findByTokenHash(newHash).orElseThrow();
        assertTrue(newTokenInDb.isRevocado());
    }

    @Test
    void givenValidRefreshToken_whenLogout_thenCookieIsClearedAndFamilyRevoked() throws Exception {
        // 1. Login
        LoginRequest request = new LoginRequest();
        request.setCorreo("house@clinic.com");
        request.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie oldCookie = loginResult.getResponse().getCookie("refreshToken");

        // 2. Logout
        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                .cookie(oldCookie)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie logoutCookie = logoutResult.getResponse().getCookie("refreshToken");
        assertNotNull(logoutCookie);
        assertEquals("", logoutCookie.getValue());
        assertEquals(0, logoutCookie.getMaxAge()); // Limpiada

        // 3. Verificar que el token en DB está revocado
        String oldHash = com.zenthera.util.HashUtil.sha256(oldCookie.getValue());
        com.zenthera.entity.RefreshToken oldTokenInDb = refreshTokenRepository.findByTokenHash(oldHash).orElseThrow();
        assertTrue(oldTokenInDb.isRevocado());
    }

    @Test
    void givenValidRefreshToken_whenConcurrentRefresh_thenOnlyOneSucceedsAndFamilyIsRevoked() throws Exception {
        // 1. Login inicial
        LoginRequest request = new LoginRequest();
        request.setCorreo("house@clinic.com");
        request.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie oldCookie = loginResult.getResponse().getCookie("refreshToken");
        assertNotNull(oldCookie);

        // 2. Ejecutar dos peticiones de refresh concurrentes con el MISMO token
        int threadCount = 2;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);

        java.util.concurrent.Callable<MvcResult> task = () -> {
            latch.await(); // Esperar para salir al mismo tiempo
            return mockMvc.perform(post("/api/v1/auth/refresh")
                    .cookie(oldCookie)
                    .header("Origin", "http://localhost:3000")
                    .header("X-Requested-With", "XMLHttpRequest"))
                    .andReturn();
        };

        java.util.concurrent.Future<MvcResult> future1 = executor.submit(task);
        java.util.concurrent.Future<MvcResult> future2 = executor.submit(task);

        // Iniciar al mismo tiempo
        latch.countDown();

        MvcResult res1 = future1.get();
        MvcResult res2 = future2.get();

        executor.shutdown();

        // 3. Evaluar resultados: Solo uno debe dar 200 OK, el otro debe dar 401 Unauthorized (o 500 si falla extrañamente, pero esperamos 401)
        int status1 = res1.getResponse().getStatus();
        int status2 = res2.getResponse().getStatus();

        assertTrue(
            (status1 == 200 && status2 == 401) || (status1 == 401 && status2 == 200),
            "Una petición debe tener éxito (200) y la otra ser detectada como reutilización (401). Status obtenidos: " + status1 + " y " + status2
        );

        // 4. Verificar en base de datos: Todos los tokens de esa familia deben estar revocados
        String hash = com.zenthera.util.HashUtil.sha256(oldCookie.getValue());
        com.zenthera.entity.RefreshToken oldTokenInDb = refreshTokenRepository.findByTokenHash(hash).orElseThrow();

        java.util.List<com.zenthera.entity.RefreshToken> familyTokens = refreshTokenRepository.findAll()
                .stream().filter(t -> t.getFamiliaId().equals(oldTokenInDb.getFamiliaId()))
                .toList();

        // Si uno tuvo éxito, debe haber 2 tokens (el viejo y el nuevo).
        assertEquals(2, familyTokens.size(), "Deberían existir 2 tokens en la familia (el original y el nuevo generado por la petición exitosa)");

        // AMBOS deben estar revocados. El viejo por rotación/detección, y el nuevo porque la petición fallida disparó la revocación masiva (REQUIRES_NEW).
        for (com.zenthera.entity.RefreshToken rt : familyTokens) {
            assertTrue(rt.isRevocado(), "El token con hash " + rt.getTokenHash() + " debería estar revocado tras el ataque concurrente.");
        }
    }
}

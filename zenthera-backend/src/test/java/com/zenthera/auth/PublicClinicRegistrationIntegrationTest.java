package com.zenthera.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.auth.ActivationRequest;
import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.PublicClinicRegistrationRequest;
import com.zenthera.entity.ActivationToken;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.event.ActivationNotificationEvent;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RefreshTokenRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.service.impl.TestNotificationServiceImpl;
import com.zenthera.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicClinicRegistrationIntegrationTest {

    private static final String REGISTER_URL = "/api/v1/auth/register-clinic";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ClinicaRepository clinicaRepository;
    @SpyBean private UsuarioRepository usuarioRepository;
    @SpyBean private RolRepository rolRepository;
    @SpyBean private ActivationTokenRepository activationTokenRepository;
    @SpyBean private NotificationService notificationServiceSpy;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TestNotificationServiceImpl notificationService;
    @Autowired private ApplicationEventPublisher eventPublisher;
    @Autowired private PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        activationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();
        notificationService.clear();
    }

    @Test
    void registerClinic_createsPendingAdminWithSafeResponseAndActivationToken() throws Exception {
        PublicClinicRegistrationRequest request = validRequest("admin@registro.test");

        mockMvc.perform(register(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adminCorreo").value("admin@registro.test"))
                .andExpect(jsonPath("$.data.estado").value("PENDIENTE_ACTIVACION"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.accessToken").doesNotExist());

        Usuario admin = usuarioRepository.findByCorreo("admin@registro.test").orElseThrow();
        Clinica clinica = clinicaRepository.findById(admin.getClinica().getId()).orElseThrow();
        assertTrue(clinica.getActiva());
        assertEquals(RolNombre.ADMIN_CLINICA,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
        assertNotEquals(RolNombre.SUPER_ADMIN,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
        assertTrue(clinica.getTerminosAceptados());
        assertNotNull(clinica.getTerminosAceptadosEn());
        assertEquals(com.zenthera.service.impl.ClinicaServiceImpl.CURRENT_TERMS_VERSION, clinica.getTerminosVersion());
        assertTrue(notificationService.getTokenForEmail("admin@registro.test").isPresent());
        assertEquals(clinica.getId(), admin.getClinica().getId());
        assertFalse(admin.getActivo());
        assertTrue(admin.getCambiarPassword());
        assertTrue(passwordEncoder.matches("RegistroSeguro123!", admin.getPassword()));
        assertNotEquals("RegistroSeguro123!", admin.getPassword());
        assertEquals(1, activationTokenRepository.count());
    }

    @Test
    void registerClinic_blocksLoginUntilActivationThenAllowsLogin() throws Exception {
        PublicClinicRegistrationRequest request = validRequest("admin.activar@test.com");
        mockMvc.perform(register(request)).andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setCorreo("admin.activar@test.com");
        login.setPassword("RegistroSeguro123!");
        mockMvc.perform(post("/api/v1/auth/login").header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales inválidas"))
                .andExpect(jsonPath("$.data").doesNotExist());

        ActivationRequest activation = new ActivationRequest();
        activation.setToken(notificationService.getTokenForEmail("admin.activar@test.com").orElseThrow());
        activation.setPassword("ActivadaSeguro123!");
        mockMvc.perform(post("/api/v1/auth/activate").header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(activation)))
                .andExpect(status().isOk());

        login.setPassword("ActivadaSeguro123!");
        mockMvc.perform(post("/api/v1/auth/login").header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk());
    }

    @Test
    void registerClinic_rejectsNormalizedDuplicateAdminEmail() throws Exception {
        mockMvc.perform(register(validRequest("admin.duplicado@test.com")))
                .andExpect(status().isCreated());

        PublicClinicRegistrationRequest duplicate = validRequest("ADMIN.DUPLICADO@TEST.COM");
        mockMvc.perform(register(duplicate))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void registerClinic_isPublicOnlyForPost() throws Exception {
        mockMvc.perform(get(REGISTER_URL))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerClinic_writeMethodsOtherThanPostAreNeverPublic() throws Exception {
        assertMethodIsNotPublic(put(REGISTER_URL));
        assertMethodIsNotPublic(patch(REGISTER_URL));
        assertMethodIsNotPublic(delete(REGISTER_URL));
    }

    @Test
    void registerClinic_rejectsInvalidDataAndIgnoresPrivilegedUnknownFields() throws Exception {
        PublicClinicRegistrationRequest invalid = validRequest("correo-invalido");
        invalid.setPassword("corta");
        mockMvc.perform(register(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        Map<String, Object> privilegedPayload = new LinkedHashMap<>();
        privilegedPayload.put("nombre", "Registro Seguro");
        privilegedPayload.put("adminNombres", "Admin");
        privilegedPayload.put("adminApellidos", "Registro");
        privilegedPayload.put("adminCorreo", "admin.privilegiado@test.com");
        privilegedPayload.put("password", "RegistroSeguro123!");
        privilegedPayload.put("rol", "SUPER_ADMIN");
        privilegedPayload.put("permisos", Set.of("SUPER_ADMIN"));
        privilegedPayload.put("tenantId", 999L);
        privilegedPayload.put("clinicaId", 999L);
        privilegedPayload.put("estado", "INACTIVA");
        privilegedPayload.put("superAdmin", true);
        privilegedPayload.put("plan", "ENTERPRISE");
        privilegedPayload.put("modulos", Set.of("TODOS"));
        privilegedPayload.put("fechaActivacion", "2099-01-01T00:00:00Z");
        privilegedPayload.put("terminosAceptados", true);
        mockMvc.perform(post(REGISTER_URL).header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(privilegedPayload)))
                .andExpect(status().isCreated());

        Usuario admin = usuarioRepository.findByCorreo("admin.privilegiado@test.com").orElseThrow();
        Clinica clinica = clinicaRepository.findById(admin.getClinica().getId()).orElseThrow();
        assertEquals(RolNombre.ADMIN_CLINICA,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
        assertNotEquals(RolNombre.SUPER_ADMIN,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
        assertTrue(clinica.getActiva());
        assertFalse(admin.getActivo());
        assertTrue(admin.getCambiarPassword());
        assertEquals(clinica.getId(), admin.getClinica().getId());
        assertNotEquals(999L, admin.getClinica().getId());
    }

    @Test
    void registerClinic_rollsBackWhenActivationTokenPersistenceFails() throws Exception {
        doThrow(new DataIntegrityViolationException("activation token persistence failed"))
                .when(activationTokenRepository).save(any(ActivationToken.class));

        mockMvc.perform(register(validRequest("admin.activation.rollback@test.com")))
                .andExpect(status().isConflict());

        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.activation.rollback@test.com").isEmpty());
        assertEquals(0, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("admin.activation.rollback@test.com").isEmpty());
    }

    @Test
    void registerClinic_rollsBackWhenAdministratorPersistenceFails() throws Exception {
        doThrow(new DataIntegrityViolationException("administrator persistence failed"))
                .when(usuarioRepository).save(any(Usuario.class));

        mockMvc.perform(register(validRequest("admin.persistence.rollback@test.com")))
                .andExpect(status().isConflict());

        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.persistence.rollback@test.com").isEmpty());
        assertEquals(0, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("admin.persistence.rollback@test.com").isEmpty());
    }

    @Test
    void registerClinic_rollsBackWhenAdminRoleCannotBeResolved() throws Exception {
        doReturn(Optional.empty()).when(rolRepository).findByNombre(RolNombre.ADMIN_CLINICA);

        mockMvc.perform(register(validRequest("admin.role.rollback@test.com")))
                .andExpect(status().isInternalServerError());

        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.role.rollback@test.com").isEmpty());
        assertEquals(0, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("admin.role.rollback@test.com").isEmpty());
    }

    @Test
    void activationNotificationListenerDoesNotRunWhenTransactionRollsBack() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            eventPublisher.publishEvent(new ActivationNotificationEvent("rollback.listener@test.com", "opaque-test-token"));
            status.setRollbackOnly();
        });

        assertTrue(notificationService.getTokenForEmail("rollback.listener@test.com").isEmpty());
    }

    @Test
    void activationNotificationListenerRunsAfterSuccessfulCommit() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                eventPublisher.publishEvent(new ActivationNotificationEvent("after.commit@test.com", "opaque-test-token")));

        assertTrue(notificationService.getTokenForEmail("after.commit@test.com").isPresent());
    }

    @Test
    void registerClinicPersistsDataWhenNotificationFailsAfterCommit() throws Exception {
        doThrow(new IllegalStateException("notification failure"))
                .when(notificationServiceSpy).sendActivationToken(anyString(), anyString());

        mockMvc.perform(register(validRequest("admin.notification.rollback@test.com")))
                .andExpect(status().isCreated());

        assertFalse(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.notification.rollback@test.com").isPresent());
        assertEquals(1, activationTokenRepository.count());
    }

    @Test
    void registerClinic_rejectsWhenTermsAreFalse() throws Exception {
        long initialTokens = activationTokenRepository.count();
        PublicClinicRegistrationRequest request = validRequest("false_terms@test.com");
        request.setTerminosAceptados(false);

        mockMvc.perform(register(request))
                .andExpect(status().isBadRequest());
                
        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("false_terms@test.com").isEmpty());
        assertEquals(initialTokens, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("false_terms@test.com").isEmpty());
    }

    @Test
    void registerClinic_rejectsWhenTermsAreNull() throws Exception {
        long initialTokens = activationTokenRepository.count();
        PublicClinicRegistrationRequest request = validRequest("null_terms@test.com");
        request.setTerminosAceptados(null);

        mockMvc.perform(register(request))
                .andExpect(status().isBadRequest());

        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("null_terms@test.com").isEmpty());
        assertEquals(initialTokens, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("null_terms@test.com").isEmpty());
    }

    @Test
    void registerClinic_rejectsWhenTermsAreMissing() throws Exception {
        long initialTokens = activationTokenRepository.count();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("nombre", "Missing Terms Clinic");
        payload.put("adminNombres", "Admin");
        payload.put("adminApellidos", "Missing");
        payload.put("adminCorreo", "missing_terms@test.com");
        payload.put("password", "RegistroSeguro123!");
        // terminosAceptados is intentionally missing

        mockMvc.perform(post(REGISTER_URL).header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());

        assertTrue(clinicaRepository.findAll().isEmpty());
        assertTrue(usuarioRepository.findByCorreo("missing_terms@test.com").isEmpty());
        assertEquals(initialTokens, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("missing_terms@test.com").isEmpty());
    }

    private PublicClinicRegistrationRequest validRequest(String adminCorreo) {
        PublicClinicRegistrationRequest request = new PublicClinicRegistrationRequest();
        request.setNombre("Registro Seguro");
        request.setAdminNombres("Admin");
        request.setAdminApellidos("Registro");
        request.setAdminCorreo(adminCorreo);
        request.setPassword("RegistroSeguro123!");
        request.setTerminosAceptados(true);
        return request;
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder register(PublicClinicRegistrationRequest request) throws Exception {
        return post(REGISTER_URL).header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request));
    }

    private void assertMethodIsNotPublic(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        int status = mockMvc.perform(request).andReturn().getResponse().getStatus();
        assertTrue(Set.of(401, 403, 405).contains(status), "status esperado para método no público: " + status);
    }
}

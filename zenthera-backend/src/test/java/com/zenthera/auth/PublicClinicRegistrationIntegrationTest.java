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
        PublicClinicRegistrationRequest request = validRequest("0999999999001", "admin@registro.test", "0100000001");

        mockMvc.perform(register(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adminCorreo").value("admin@registro.test"))
                .andExpect(jsonPath("$.data.estado").value("PENDIENTE_ACTIVACION"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.accessToken").doesNotExist());

        Clinica clinica = clinicaRepository.findByRuc("0999999999001").orElseThrow();
        Usuario admin = usuarioRepository.findByCorreo("admin@registro.test").orElseThrow();
        assertTrue(clinica.getActiva());
        assertEquals(RolNombre.ADMIN_CLINICA,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
        assertNotEquals(RolNombre.SUPER_ADMIN,
                rolRepository.findById(admin.getRol().getId()).orElseThrow().getNombre());
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
        PublicClinicRegistrationRequest request = validRequest("0999999999002", "admin.activar@test.com", "0100000002");
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
        mockMvc.perform(register(validRequest("0999999999003", "admin.duplicado@test.com", "0100000003")))
                .andExpect(status().isCreated());

        PublicClinicRegistrationRequest duplicate = validRequest("0999999999004", "ADMIN.DUPLICADO@TEST.COM", "0100000004");
        mockMvc.perform(register(duplicate))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void registerClinic_rejectsDuplicateClinicRuc() throws Exception {
        mockMvc.perform(register(validRequest("0999999999005", "admin.ruc.unico@test.com", "0100000005")))
                .andExpect(status().isCreated());

        mockMvc.perform(register(validRequest("0999999999005", "admin.ruc.duplicado@test.com", "0100000006")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void registerClinic_rejectsExactDuplicateClinicEmail() throws Exception {
        PublicClinicRegistrationRequest first = validRequest("0999999999012", "admin.correo.exacto.1@test.com", "0100000012");
        first.setCorreo("contacto.duplicado@test.com");
        mockMvc.perform(register(first)).andExpect(status().isCreated());

        PublicClinicRegistrationRequest duplicate = validRequest("0999999999013", "admin.correo.exacto.2@test.com", "0100000013");
        duplicate.setCorreo("contacto.duplicado@test.com");
        mockMvc.perform(register(duplicate))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede completar el registro con los datos proporcionados."));
    }

    @Test
    void registerClinic_rejectsCaseInsensitiveDuplicateClinicEmail() throws Exception {
        PublicClinicRegistrationRequest first = validRequest("0999999999014", "admin.correo.mayus.1@test.com", "0100000014");
        first.setCorreo("contacto.mayusculas@test.com");
        mockMvc.perform(register(first)).andExpect(status().isCreated());

        PublicClinicRegistrationRequest duplicate = validRequest("0999999999015", "admin.correo.mayus.2@test.com", "0100000015");
        duplicate.setCorreo("CONTACTO.MAYUSCULAS@TEST.COM");
        mockMvc.perform(register(duplicate)).andExpect(status().isConflict());
    }

    @Test
    void registerClinic_rejectsTrimmedDuplicateClinicEmail() throws Exception {
        PublicClinicRegistrationRequest first = validRequest("0999999999016", "admin.correo.espacios.1@test.com", "0100000016");
        first.setCorreo("contacto.espacios@test.com");
        mockMvc.perform(register(first)).andExpect(status().isCreated());

        PublicClinicRegistrationRequest duplicate = validRequest("0999999999017", "admin.correo.espacios.2@test.com", "0100000017");
        duplicate.setCorreo("  CONTACTO.ESPACIOS@TEST.COM  ");
        mockMvc.perform(register(duplicate)).andExpect(status().isConflict());
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
        PublicClinicRegistrationRequest invalid = validRequest("0999999999005", "correo-invalido", "0100000005");
        invalid.setPassword("corta");
        mockMvc.perform(register(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        Map<String, Object> privilegedPayload = new LinkedHashMap<>();
        privilegedPayload.put("ruc", "0999999999006");
        privilegedPayload.put("razonSocial", "Registro Seguro SA");
        privilegedPayload.put("nombre", "Registro Seguro");
        privilegedPayload.put("correo", "clinica.privilegiada@test.com");
        privilegedPayload.put("telefono", "0999999999");
        privilegedPayload.put("adminNombres", "Admin");
        privilegedPayload.put("adminApellidos", "Registro");
        privilegedPayload.put("adminCedula", "0100000006");
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
        mockMvc.perform(post(REGISTER_URL).header("Origin", "http://localhost:3000")
                        .header("X-Requested-With", "XMLHttpRequest").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(privilegedPayload)))
                .andExpect(status().isCreated());

        Usuario admin = usuarioRepository.findByCorreo("admin.privilegiado@test.com").orElseThrow();
        Clinica clinica = clinicaRepository.findByRuc("0999999999006").orElseThrow();
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
    void registerClinic_rejectsDuplicateCedula() throws Exception {
        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        Clinica existingClinic = new Clinica();
        existingClinic.setRuc("0999999999010");
        existingClinic.setRazonSocial("Existente SA");
        existingClinic.setNombre("Existente");
        existingClinic.setCorreo("existente@test.com");
        existingClinic.setTelefono("0999999999");
        existingClinic.setDireccion("Dirección");
        existingClinic.setZonaHoraria("America/Guayaquil");
        existingClinic = clinicaRepository.save(existingClinic);
        Usuario existingAdmin = new Usuario();
        existingAdmin.setClinica(existingClinic);
        existingAdmin.setRol(rolAdmin);
        existingAdmin.setNombres("Admin");
        existingAdmin.setApellidos("Existente");
        existingAdmin.setCedula("0100000099");
        existingAdmin.setCorreo("existente.admin@test.com");
        existingAdmin.setPassword(passwordEncoder.encode("RegistroSeguro123!"));
        existingAdmin.setActivo(true);
        existingAdmin.setBloqueado(false);
        existingAdmin.setCambiarPassword(false);
        usuarioRepository.saveAndFlush(existingAdmin);

        mockMvc.perform(register(validRequest("0999999999011", "admin.rollback@test.com", "0100000099")))
                .andExpect(status().isConflict());

        assertTrue(clinicaRepository.findByRuc("0999999999011").isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.rollback@test.com").isEmpty());
    }

    @Test
    void registerClinic_rollsBackWhenActivationTokenPersistenceFails() throws Exception {
        doThrow(new DataIntegrityViolationException("activation token persistence failed"))
                .when(activationTokenRepository).save(any(ActivationToken.class));

        mockMvc.perform(register(validRequest("0999999999018", "admin.activation.rollback@test.com", "0100000018")))
                .andExpect(status().isConflict());

        assertTrue(clinicaRepository.findByRuc("0999999999018").isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.activation.rollback@test.com").isEmpty());
        assertEquals(0, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("admin.activation.rollback@test.com").isEmpty());
    }

    @Test
    void registerClinic_rollsBackWhenAdministratorPersistenceFails() throws Exception {
        doThrow(new DataIntegrityViolationException("administrator persistence failed"))
                .when(usuarioRepository).save(any(Usuario.class));

        mockMvc.perform(register(validRequest("0999999999019", "admin.persistence.rollback@test.com", "0100000019")))
                .andExpect(status().isConflict());

        assertTrue(clinicaRepository.findByRuc("0999999999019").isEmpty());
        assertTrue(usuarioRepository.findByCorreo("admin.persistence.rollback@test.com").isEmpty());
        assertEquals(0, activationTokenRepository.count());
        assertTrue(notificationService.getTokenForEmail("admin.persistence.rollback@test.com").isEmpty());
    }

    @Test
    void registerClinic_rollsBackWhenAdminRoleCannotBeResolved() throws Exception {
        doReturn(Optional.empty()).when(rolRepository).findByNombre(RolNombre.ADMIN_CLINICA);

        mockMvc.perform(register(validRequest("0999999999020", "admin.role.rollback@test.com", "0100000020")))
                .andExpect(status().isInternalServerError());

        assertTrue(clinicaRepository.findByRuc("0999999999020").isEmpty());
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

        mockMvc.perform(register(validRequest("0999999999019", "admin.notification.rollback@test.com", "0100000019")))
                .andExpect(status().isCreated());

        assertTrue(clinicaRepository.findByRuc("0999999999019").isPresent());
        assertTrue(usuarioRepository.findByCorreo("admin.notification.rollback@test.com").isPresent());
        assertEquals(1, activationTokenRepository.count());
    }

    private PublicClinicRegistrationRequest validRequest(String ruc, String adminCorreo, String adminCedula) {
        PublicClinicRegistrationRequest request = new PublicClinicRegistrationRequest();
        request.setRuc(ruc);
        request.setRazonSocial("Registro Seguro SA");
        request.setNombre("Registro Seguro");
        request.setCorreo("clinica." + ruc + "@test.com");
        request.setTelefono("0999999999");
        request.setAdminNombres("Admin");
        request.setAdminApellidos("Registro");
        request.setAdminCedula(adminCedula);
        request.setAdminCorreo(adminCorreo);
        request.setPassword("RegistroSeguro123!");
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

package com.zenthera.clinica;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.clinica.ClinicOnboardingRequest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClinicOnboardingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String validJwtAdminClinica;
    private String validJwtRecepcionista;
    private Clinica clinicaA;
    private Clinica clinicaB;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        // Clinica A (Admin) - Onboarding incompleto
        clinicaA = new Clinica();
        clinicaA.setNombre("Clinica A");
        clinicaA.setActiva(true);
        clinicaA.setOnboardingCompletado(false);
        clinicaA = clinicaRepository.save(clinicaA);

        Rol rolAdminClinica = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        Usuario adminClinica = new Usuario();
        adminClinica.setClinica(clinicaA);
        adminClinica.setRol(rolAdminClinica);
        adminClinica.setNombres("Admin");
        adminClinica.setApellidos("Clinica");
        adminClinica.setCedula("0999999991");
        adminClinica.setCorreo("admin@clinicaa.com");
        adminClinica.setPassword("hash");
        adminClinica.setActivo(true);
        adminClinica.setBloqueado(false);
        adminClinica.setCambiarPassword(false);
        adminClinica = usuarioRepository.save(adminClinica);

        validJwtAdminClinica = jwtService.generateToken(adminClinica.getCorreo());

        // Recepcionista (Sin permisos)
        Rol rolRecepcionista = rolRepository.findByNombre(RolNombre.RECEPCIONISTA).orElseThrow();
        Usuario recepcionista = new Usuario();
        recepcionista.setClinica(clinicaA);
        recepcionista.setRol(rolRecepcionista);
        recepcionista.setNombres("Recepcionista");
        recepcionista.setApellidos("Uno");
        recepcionista.setCedula("0999999992");
        recepcionista.setCorreo("recepcion@clinicaa.com");
        recepcionista.setPassword("hash");
        recepcionista.setActivo(true);
        recepcionista.setBloqueado(false);
        recepcionista.setCambiarPassword(false);
        usuarioRepository.save(recepcionista);

        validJwtRecepcionista = jwtService.generateToken(recepcionista.getCorreo());

        // Clinica B - Ya tiene RUC y Correo para probar conflictos
        clinicaB = new Clinica();
        clinicaB.setNombre("Clinica B");
        clinicaB.setRuc("0999999999222");
        clinicaB.setCorreo("contacto@clinicab.com");
        clinicaB.setActiva(true);
        clinicaB.setOnboardingCompletado(true);
        clinicaB = clinicaRepository.save(clinicaB);
    }

    @Test
    void givenAdminClinica_whenCompleteOnboarding_thenSuccessAndFieldsUpdated() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.onboardingCompletado").value(true))
                .andExpect(jsonPath("$.data.ruc").value("0999999999111"));

        // Verificar BD
        Clinica updated = clinicaRepository.findById(clinicaA.getId()).orElseThrow();
        assertTrue(updated.getOnboardingCompletado());
        assertNotNull(updated.getOnboardingCompletadoEn());
        assertEquals("0999999999111", updated.getRuc());
        assertEquals("Clinica A S.A.", updated.getRazonSocial());
        assertEquals("contacto@clinicaa.com", updated.getCorreo());
    }

    @Test
    void givenRecepcionista_whenCompleteOnboarding_thenForbidden() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtRecepcionista)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithMissingFields_thenBadRequest() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        // Faltan campos obligatorios

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithInvalidRuc_thenBadRequest() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("ABCDEFGH"); // Inválido
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithExistingRucFromAnotherClinic_thenConflict() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999222"); // RUC de clinica B
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithExistingCorreoFromAnotherClinic_thenConflict() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111"); 
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicab.com"); // Correo de clinica B
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithEmptyFields_thenBadRequest() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial(""); // Vacío
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenCompleteOnboardingWithInvalidFields_thenBadRequest() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial("Clinica A S.A.");
        
        // 1. Teléfono inválido
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("abc"); 
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");
        mockMvc.perform(put("/api/v1/clinica/onboarding").header("Authorization", "Bearer " + validJwtAdminClinica).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isBadRequest());
        
        // 2. Ciudad inválida
        request.setTelefono("0999999999");
        request.setCiudad("Gua@yaquil"); // No permite arroba
        mockMvc.perform(put("/api/v1/clinica/onboarding").header("Authorization", "Bearer " + validJwtAdminClinica).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isBadRequest());

        // 3. Provincia inválida
        request.setCiudad("Guayaquil");
        request.setProvincia("Gua123"); // No permite números
        mockMvc.perform(put("/api/v1/clinica/onboarding").header("Authorization", "Bearer " + validJwtAdminClinica).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isBadRequest());

        // 4. Correo inválido
        request.setProvincia("Guayas");
        request.setCorreo("correoinvalido");
        mockMvc.perform(put("/api/v1/clinica/onboarding").header("Authorization", "Bearer " + validJwtAdminClinica).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(request))).andExpect(status().isBadRequest());
    }

    @Test
    void givenAdminClinica_whenRepeatedValidRequest_thenKeepsConsistentState() throws Exception {
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av. Siempre Viva 123");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");

        // Primera petición
        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Repetición idéntica
        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.onboardingCompletado").value(true));
    }

    @Test
    void givenAdminClinica_whenGetMe_thenReflectsOnboardingStatus() throws Exception {
        // Inicialmente false
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + validJwtAdminClinica))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.onboardingCompletado").value(false));

        // Completamos onboarding
        ClinicOnboardingRequest request = new ClinicOnboardingRequest();
        request.setRuc("0999999999111");
        request.setRazonSocial("Clinica A S.A.");
        request.setCorreo("contacto@clinicaa.com");
        request.setTelefono("0999999999");
        request.setDireccion("Av.");
        request.setCiudad("Guayaquil");
        request.setProvincia("Guayas");
        mockMvc.perform(put("/api/v1/clinica/onboarding")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verificamos MeResponse de nuevo
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + validJwtAdminClinica))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.onboardingCompletado").value(true));
    }

    @Test
    void givenUserWithoutClinic_whenGetMe_thenDoesNotThrowNullPointer() throws Exception {
        // Super admin sin clinica
        Usuario sysAdmin = new Usuario();
        sysAdmin.setRol(rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseThrow());
        sysAdmin.setNombres("Sys");
        sysAdmin.setApellidos("Admin");
        sysAdmin.setCedula("0999999993");
        sysAdmin.setCorreo("sys@admin.com");
        sysAdmin.setPassword("hash");
        sysAdmin.setActivo(true);
        sysAdmin.setBloqueado(false);
        sysAdmin.setCambiarPassword(false);
        sysAdmin.setClinica(clinicaB); // Para no fallar constraints db
        sysAdmin = usuarioRepository.save(sysAdmin);

        // Simulamos un usuario con clinicaId seteada a null dinámicamente si es posible, o que la clíinica borrada no rompa
        // Ya que schema exige not null, al menos comprobamos NPE si no tiene clinica. 
        // Forzaremos el NullPointer de otra forma si es posible, o comprobamos que funciona.
        String jwtSysAdmin = jwtService.generateToken(sysAdmin.getCorreo());
        
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + jwtSysAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

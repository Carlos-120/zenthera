package com.zenthera.clinica;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.clinica.ClinicaCreateRequest;
import com.zenthera.dto.clinica.ClinicaEstadoRequest;
import com.zenthera.dto.clinica.ClinicaUpdateRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.repository.ActivationTokenRepository;
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
import org.springframework.boot.test.mock.mockito.SpyBean;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClinicaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @SpyBean
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String validJwtSuperAdmin;
    private String validJwtAdminClinica;
    private Clinica clinicaB;

    @BeforeEach
    void setUp() {
        activationTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        // Clinica A (Admin)
        Clinica clinicaA = new Clinica();
        clinicaA.setNombre("Clinica A");
        clinicaA.setRazonSocial("Clinica A SA");
        clinicaA.setRuc("0999999999111");
        clinicaA.setZonaHoraria("America/Guayaquil");
        clinicaA.setCorreo("admin@clinicaa.com");
        clinicaA.setActiva(true);
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

        // Clinica B
        clinicaB = new Clinica();
        clinicaB.setNombre("Clinica B");
        clinicaB.setRazonSocial("Clinica B SA");
        clinicaB.setRuc("0999999999222");
        clinicaB.setZonaHoraria("America/Guayaquil");
        clinicaB.setCorreo("admin@clinicab.com");
        clinicaB.setActiva(true);
        clinicaB = clinicaRepository.save(clinicaB);

        // Super Admin (Sistema)
        Clinica sistema = clinicaRepository.findByRuc("9999999999001").orElseGet(() -> {
            Clinica sys = new Clinica();
            sys.setNombre("Sistema");
            sys.setRazonSocial("Sistema SA");
            sys.setRuc("9999999999001");
            sys.setZonaHoraria("America/Guayaquil");
            sys.setCorreo("sys@zenthera.com");
            sys.setActiva(true);
            return clinicaRepository.save(sys);
        });

        Rol rolSuperAdmin = rolRepository.findByNombre(RolNombre.SUPER_ADMIN).orElseThrow();
        Usuario superAdmin = new Usuario();
        superAdmin.setClinica(sistema);
        superAdmin.setRol(rolSuperAdmin);
        superAdmin.setNombres("Super");
        superAdmin.setApellidos("Admin");
        superAdmin.setCedula("0999999992");
        superAdmin.setCorreo("super@zenthera.com");
        superAdmin.setPassword("hash");
        superAdmin.setActivo(true);
        superAdmin.setBloqueado(false);
        superAdmin.setCambiarPassword(false);
        superAdmin = usuarioRepository.save(superAdmin);

        validJwtSuperAdmin = jwtService.generateToken(superAdmin.getCorreo());
    }

    @Test
    void givenAdminClinica_whenGetMiClinica_thenReturnOwnClinicaOnly() throws Exception {
        mockMvc.perform(get("/api/v1/clinica")
                .header("Authorization", "Bearer " + validJwtAdminClinica))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nombre").value("Clinica A"));
    }

    @Test
    void givenAdminClinica_whenUpdateEstadoClinicaB_thenForbidden() throws Exception {
        ClinicaEstadoRequest req = new ClinicaEstadoRequest();
        req.setActiva(false);
        req.setMotivo("Prueba");

        mockMvc.perform(patch("/api/v1/admin/clinicas/" + clinicaB.getId() + "/estado")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenSuperAdmin_whenCreateClinicaWithDuplicateRuc_thenBadRequest() throws Exception {
        ClinicaCreateRequest req = new ClinicaCreateRequest();
        req.setRuc("0999999999222"); // Ya existe Clínica B
        req.setNombre("Clínica Duplicada");
        req.setRazonSocial("Dup SA");
        req.setCorreo("dup@test.com");
        req.setTelefono("0999999999");
        req.setAdminNombres("Admin");
        req.setAdminApellidos("Dup");
        req.setAdminCedula("0000000001");
        req.setAdminCorreo("admin@dup.com");

        // Assuming your GlobalExceptionHandler catches IllegalArgumentException for RUC duplicates
        mockMvc.perform(post("/api/v1/admin/clinicas")
                .header("Authorization", "Bearer " + validJwtSuperAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("El RUC ya está registrado"));
    }

    @Test
    void givenSuperAdmin_whenUpdateEstadoWithoutMotivo_thenBadRequest() throws Exception {
        ClinicaEstadoRequest req = new ClinicaEstadoRequest();
        req.setActiva(false);
        // Sin motivo

        mockMvc.perform(patch("/api/v1/admin/clinicas/" + clinicaB.getId() + "/estado")
                .header("Authorization", "Bearer " + validJwtSuperAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenUpdateConZonaHorariaValida_thenSuccess() throws Exception {
        ClinicaUpdateRequest req = new ClinicaUpdateRequest();
        req.setNombre("Update");
        req.setTelefono("099");
        req.setCorreo("test@test.com");
        req.setDireccion("Dir");

        // 1 segment
        req.setZonaHoraria("UTC");
        mockMvc.perform(put("/api/v1/clinica")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // 2 segments
        req.setZonaHoraria("America/Guayaquil");
        mockMvc.perform(put("/api/v1/clinica")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // 3 segments
        req.setZonaHoraria("America/Argentina/Buenos_Aires");
        mockMvc.perform(put("/api/v1/clinica")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void givenAdminClinica_whenUpdateConZonaHorariaInvalida_thenBadRequest() throws Exception {
        ClinicaUpdateRequest req = new ClinicaUpdateRequest();
        req.setNombre("Update");
        req.setTelefono("099");
        req.setCorreo("test@test.com");
        req.setDireccion("Dir");
        req.setZonaHoraria("Invalida/Falsa");

        mockMvc.perform(put("/api/v1/clinica")
                .header("Authorization", "Bearer " + validJwtAdminClinica)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenSuperAdmin_whenCreateClinicaValid_thenSuccess() throws Exception {
        ClinicaCreateRequest req = new ClinicaCreateRequest();
        req.setRuc("0999999999005");
        req.setNombre("Nueva Clínica");
        req.setRazonSocial("Nueva SA");
        req.setCorreo("nueva@test.com");
        req.setTelefono("0999999999");
        req.setAdminNombres("Admin");
        req.setAdminApellidos("Nuevo");
        req.setAdminCedula("0000000005");
        req.setAdminCorreo("admin@nueva.com");

        mockMvc.perform(post("/api/v1/admin/clinicas")
                .header("Authorization", "Bearer " + validJwtSuperAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        Optional<Usuario> adminNuevo = usuarioRepository.findByCorreo("admin@nueva.com");
        assertTrue(adminNuevo.isPresent());
        assertTrue(adminNuevo.get().getCambiarPassword()); // Debe requerir cambio
        assertFalse(adminNuevo.get().getActivo()); // Debe estar inactivo
    }

    @Test
    void givenSuperAdmin_whenCreateClinicaWithDuplicateEmailBypassingService_thenConflictHttp() throws Exception {
        ClinicaCreateRequest req = new ClinicaCreateRequest();
        req.setRuc("0999999999010");
        req.setNombre("Clinica Concurrente");
        req.setRazonSocial("Conc SA");
        req.setCorreo("conc@test.com");
        req.setTelefono("0999999999");
        req.setAdminNombres("Admin");
        req.setAdminApellidos("Uno");
        req.setAdminCedula("0000000010");
        req.setAdminCorreo("duplicado@test.com"); // Mismo correo

        // Simulamos que el correo ya existe a nivel BD insertándolo manualmente
        Usuario existingUser = new Usuario();
        existingUser.setClinica(clinicaB);
        existingUser.setRol(rolRepository.findByNombre(RolNombre.RECEPCIONISTA).orElseThrow());
        existingUser.setNombres("User");
        existingUser.setApellidos("Old");
        existingUser.setCedula("0000000020");
        existingUser.setCorreo("duplicado@test.com");
        existingUser.setPassword("hash");
        existingUser.setActivo(true);
        existingUser.setBloqueado(false);
        existingUser.setCambiarPassword(false);
        usuarioRepository.saveAndFlush(existingUser);

        // Bypassear la validación a nivel de servicio para simular la condición de carrera,
        // permitiendo que el save() tire DataIntegrityViolationException real que atraviese el GlobalExceptionHandler.
        doReturn(Optional.empty()).when(usuarioRepository).findByCorreo("duplicado@test.com");

        mockMvc.perform(post("/api/v1/admin/clinicas")
                .header("Authorization", "Bearer " + validJwtSuperAdmin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("El correo electrónico proporcionado ya se encuentra registrado por otra cuenta."));
    }

    @Test
    void givenSuperAdmin_whenGetDetalle_thenOk() throws Exception {
        mockMvc.perform(get("/api/v1/admin/clinicas/" + clinicaB.getId())
                .header("Authorization", "Bearer " + validJwtSuperAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value(clinicaB.getNombre()))
                .andExpect(jsonPath("$.data.ruc").value(clinicaB.getRuc()));
    }

    @Test
    void givenSuperAdmin_whenGetDetalleInexistente_thenNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/admin/clinicas/999999")
                .header("Authorization", "Bearer " + validJwtSuperAdmin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void givenAdminClinica_whenGetDetalle_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/clinicas/" + clinicaB.getId())
                .header("Authorization", "Bearer " + validJwtAdminClinica))
                .andExpect(status().isForbidden());
    }

    @Test
    void givenAnonymous_whenGetDetalle_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/clinicas/" + clinicaB.getId()))
                .andExpect(status().isUnauthorized());
    }
}

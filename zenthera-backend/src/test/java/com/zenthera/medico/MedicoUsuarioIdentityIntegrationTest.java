package com.zenthera.medico;

import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.medico.MedicoResponse;
import com.zenthera.dto.medico.UsuarioMedicoLinkRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import com.zenthera.entity.ActivationToken;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;
import com.zenthera.service.ActivationService;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class MedicoUsuarioIdentityIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private ActivationTokenRepository activationTokenRepository;

    @Autowired
    private com.zenthera.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ActivationService activationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Clinica clinica;
    private Usuario adminUsuario;
    private Usuario medicoUsuario;
    private Usuario medicoUsuario2;
    private Usuario recepcionistaUsuario;
    private String adminToken;

    @BeforeEach
    void setUp() {
        medicoRepository.deleteAll();
        activationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        clinica = new Clinica();
        clinica.setNombre("Clinica Identity Test");
        clinica = clinicaRepository.save(clinica);

        Rol adminRol = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        Rol medicoRol = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        Rol recepcionistaRol = rolRepository.findByNombre(RolNombre.RECEPCIONISTA).orElseThrow();

        adminUsuario = new Usuario();
        adminUsuario.setClinica(clinica);
        adminUsuario.setRol(adminRol);
        adminUsuario.setNombres("Admin");
        adminUsuario.setApellidos("Test");
        adminUsuario.setCorreo("admin.identity@test.com");
        adminUsuario.setCedula("1000000000");
        adminUsuario.setPassword("password");
        adminUsuario = usuarioRepository.save(adminUsuario);

        medicoUsuario = new Usuario();
        medicoUsuario.setClinica(clinica);
        medicoUsuario.setRol(medicoRol);
        medicoUsuario.setNombres("Doctor Link");
        medicoUsuario.setApellidos("Test");
        medicoUsuario.setCorreo("doctor.link@test.com");
        medicoUsuario.setCedula("1000000001");
        medicoUsuario.setPassword("password");
        medicoUsuario = usuarioRepository.save(medicoUsuario);

        medicoUsuario2 = new Usuario();
        medicoUsuario2.setClinica(clinica);
        medicoUsuario2.setRol(medicoRol);
        medicoUsuario2.setNombres("Doctor Link 2");
        medicoUsuario2.setApellidos("Test 2");
        medicoUsuario2.setCorreo("doctor.link2@test.com");
        medicoUsuario2.setCedula("1000000002");
        medicoUsuario2.setPassword("password");
        medicoUsuario2 = usuarioRepository.save(medicoUsuario2);

        recepcionistaUsuario = new Usuario();
        recepcionistaUsuario.setClinica(clinica);
        recepcionistaUsuario.setRol(recepcionistaRol);
        recepcionistaUsuario.setNombres("Recep");
        recepcionistaUsuario.setApellidos("Test");
        recepcionistaUsuario.setCorreo("recep.link@test.com");
        recepcionistaUsuario.setCedula("1000000003");
        recepcionistaUsuario.setPassword("password");
        recepcionistaUsuario = usuarioRepository.save(recepcionistaUsuario);

        adminToken = jwtService.generateToken(adminUsuario.getCorreo());
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @Test
    void vincularUsuario_success() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("2000000000");
        medico.setNombres("Doctor Profile");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCreatedAt(LocalDateTime.now());
        medico = medicoRepository.save(medico);

        UsuarioMedicoLinkRequest request = new UsuarioMedicoLinkRequest();
        request.setUsuarioId(medicoUsuario.getId());

        HttpEntity<UsuarioMedicoLinkRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/usuario",
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getUsuarioId()).isEqualTo(medicoUsuario.getId());
        
        // Verify in DB
        Medico saved = medicoRepository.findById(medico.getId()).orElseThrow();
        assertThat(saved.getUsuario()).isNotNull();
        assertThat(saved.getUsuario().getId()).isEqualTo(medicoUsuario.getId());
    }

    @Test
    void vincularUsuario_failsWhenUserNotMedicoRole() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("2000000000");
        medico.setNombres("Doctor Profile");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCreatedAt(LocalDateTime.now());
        medico = medicoRepository.save(medico);

        UsuarioMedicoLinkRequest request = new UsuarioMedicoLinkRequest();
        request.setUsuarioId(recepcionistaUsuario.getId());

        HttpEntity<UsuarioMedicoLinkRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/usuario",
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void vincularUsuario_failsWhenUserAlreadyLinked() {
        Medico medico1 = new Medico();
        medico1.setClinica(clinica);
        medico1.setCedula("2000000000");
        medico1.setNombres("Doctor Profile 1");
        medico1.setApellidos("Test");
        medico1.setEspecialidad("General");
        medico1.setUsuario(medicoUsuario);
        medico1.setCreatedAt(LocalDateTime.now());
        medicoRepository.save(medico1);

        Medico medico2 = new Medico();
        medico2.setClinica(clinica);
        medico2.setCedula("2000000001");
        medico2.setNombres("Doctor Profile 2");
        medico2.setApellidos("Test");
        medico2.setEspecialidad("General");
        medico2.setCreatedAt(LocalDateTime.now());
        medico2 = medicoRepository.save(medico2);

        UsuarioMedicoLinkRequest request = new UsuarioMedicoLinkRequest();
        request.setUsuarioId(medicoUsuario.getId()); // Already linked to medico1

        HttpEntity<UsuarioMedicoLinkRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico2.getId() + "/usuario",
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void vincularUsuario_failsWhenUserCrossTenant() {
        Clinica clinica2 = new Clinica();
        clinica2.setNombre("Clinica 2");
        clinica2 = clinicaRepository.save(clinica2);

        Usuario medicoUsuarioClinica2 = new Usuario();
        medicoUsuarioClinica2.setClinica(clinica2);
        medicoUsuarioClinica2.setRol(rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow());
        medicoUsuarioClinica2.setNombres("Doctor Cross");
        medicoUsuarioClinica2.setApellidos("Tenant");
        medicoUsuarioClinica2.setCorreo("cross@test.com");
        medicoUsuarioClinica2.setCedula("9999999999");
        medicoUsuarioClinica2.setPassword("password");
        medicoUsuarioClinica2 = usuarioRepository.save(medicoUsuarioClinica2);

        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("2000000000");
        medico.setNombres("Doctor Profile");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCreatedAt(LocalDateTime.now());
        medico = medicoRepository.save(medico);

        UsuarioMedicoLinkRequest request = new UsuarioMedicoLinkRequest();
        request.setUsuarioId(medicoUsuarioClinica2.getId());

        HttpEntity<UsuarioMedicoLinkRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/usuario",
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void desvincularUsuario_success() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("2000000000");
        medico.setNombres("Doctor Profile");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setUsuario(medicoUsuario);
        medico.setCreatedAt(LocalDateTime.now());
        medico = medicoRepository.save(medico);

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/usuario",
                HttpMethod.DELETE,
                new HttpEntity<>(getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getUsuarioId()).isNull();

        Medico saved = medicoRepository.findById(medico.getId()).orElseThrow();
        assertThat(saved.getUsuario()).isNull();
    }

    @Test
    void testUsuariosMedicosDisponibles_ElegiblesContainsOnlyMedicoTenant() {
        Clinica clinica2 = new Clinica();
        clinica2.setNombre("Clinica 2");
        clinica2 = clinicaRepository.save(clinica2);

        Rol medicoRol = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();

        Usuario medicoUsuarioClinica2 = new Usuario();
        medicoUsuarioClinica2.setClinica(clinica2);
        medicoUsuarioClinica2.setRol(medicoRol);
        medicoUsuarioClinica2.setNombres("Doctor Cross");
        medicoUsuarioClinica2.setApellidos("Tenant");
        medicoUsuarioClinica2.setCorreo("cross@test.com");
        medicoUsuarioClinica2.setCedula("9999999999");
        medicoUsuarioClinica2.setPassword("password");
        usuarioRepository.save(medicoUsuarioClinica2);

        Medico medico1 = new Medico();
        medico1.setClinica(clinica);
        medico1.setCedula("2000000000");
        medico1.setNombres("Doctor Profile 1");
        medico1.setApellidos("Test");
        medico1.setEspecialidad("General");
        medico1.setUsuario(medicoUsuario2);
        medico1.setCreatedAt(LocalDateTime.now());
        medicoRepository.save(medico1);

        ResponseEntity<ApiResponse<java.util.List<com.zenthera.dto.usuario.UsuarioDisponibleResponse>>> response = restTemplate.exchange(
                "/api/v1/clinica/usuarios/medicos-disponibles",
                HttpMethod.GET,
                new HttpEntity<>(getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        java.util.List<com.zenthera.dto.usuario.UsuarioDisponibleResponse> disponibles = response.getBody().getData();

        assertThat(disponibles).hasSize(1);
        assertThat(disponibles.get(0).getId()).isEqualTo(medicoUsuario.getId());
        assertThat(disponibles.get(0).getNombres()).isEqualTo("Doctor Link");
        assertThat(disponibles.get(0)).hasNoNullFieldsOrProperties();
    }

    @Test
    void crear_conCuentaAccesoTrue_createsUsuarioAndMedico() {
        MedicoRequest request = new MedicoRequest();
        request.setCedula("3000000000");
        request.setNombres("Doctor Auto");
        request.setApellidos("Prov");
        request.setEspecialidad("Surgery");
        request.setCorreo("auto.prov@test.com");
        request.setActivo(true);
        request.setCrearCuentaAcceso(true);
        request.setPassword("TemporalPassword123!");
        request.setConfirmPassword("TemporalPassword123!");

        HttpEntity<MedicoRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        MedicoResponse body = response.getBody().getData();
        assertThat(body.getUsuarioId()).isNotNull();
        assertThat(body.getEstadoCuenta()).isEqualTo("CAMBIO_PASSWORD_REQUERIDO");

        // Validate Medico saved
        Medico saved = medicoRepository.findById(body.getId()).orElseThrow();
        assertThat(saved.getUsuario()).isNotNull();
        
        Usuario savedUser = usuarioRepository.findById(saved.getUsuario().getId()).orElseThrow();
        assertThat(savedUser.getCorreo()).isEqualTo("auto.prov@test.com");
        
        Rol medicoRol = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        assertThat(savedUser.getRol().getId()).isEqualTo(medicoRol.getId());
        
        assertThat(savedUser.getClinica().getId()).isEqualTo(clinica.getId());
        assertThat(savedUser.getActivo()).isTrue();
        assertThat(savedUser.getCambiarPassword()).isTrue();

        // Validate ActivationToken NOT created
        Optional<ActivationToken> tokenOpt = activationTokenRepository.findAll().stream()
                .filter(t -> t.getUsuario().getId().equals(savedUser.getId()))
                .findFirst();
        assertThat(tokenOpt).isNotPresent();
    }

    @Test
    void crear_conCuentaAccesoFalse_createsOnlyMedico() {
        MedicoRequest request = new MedicoRequest();
        request.setCedula("3000000001");
        request.setNombres("Doctor NoAccount");
        request.setApellidos("Test");
        request.setEspecialidad("General");
        request.setCorreo("no.account@test.com");
        request.setActivo(true);
        request.setCrearCuentaAcceso(false);

        HttpEntity<MedicoRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        MedicoResponse body = response.getBody().getData();
        assertThat(body.getUsuarioId()).isNull();
        assertThat(body.getEstadoCuenta()).isEqualTo("SIN_CUENTA");

        Medico saved = medicoRepository.findById(body.getId()).orElseThrow();
        assertThat(saved.getUsuario()).isNull();
    }

    @Test
    void crear_conCuentaAccesoTrue_failsIfEmailAlreadyExists() {
        MedicoRequest request = new MedicoRequest();
        request.setCedula("3000000002");
        request.setNombres("Doctor Duplicate");
        request.setApellidos("Test");
        request.setEspecialidad("General");
        request.setCorreo(medicoUsuario.getCorreo()); // Email already taken by medicoUsuario
        request.setActivo(true);
        request.setCrearCuentaAcceso(true);

        HttpEntity<MedicoRequest> entity = new HttpEntity<>(request, getHeaders());

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(medicoRepository.existsByClinicaIdAndCedulaAndActivoTrue(clinica.getId(), "3000000002")).isFalse();
    }

    @Test
    void crearCuentaAcceso_endpoint_createsUsuarioForHistoricalMedico() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("4000000000");
        medico.setNombres("Doctor Historical");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCorreo("historical@test.com");
        medico.setCreatedAt(LocalDateTime.now());
        medico = medicoRepository.save(medico);

        com.zenthera.dto.medico.RestablecerPasswordRequest request = new com.zenthera.dto.medico.RestablecerPasswordRequest();
        request.setPassword("NewTemporal123!");
        request.setConfirmPassword("NewTemporal123!");

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/cuenta",
                HttpMethod.POST,
                new HttpEntity<>(request, getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        MedicoResponse body = response.getBody().getData();
        assertThat(body.getUsuarioId()).isNotNull();
        assertThat(body.getEstadoCuenta()).isEqualTo("CAMBIO_PASSWORD_REQUERIDO");

        Medico saved = medicoRepository.findById(medico.getId()).orElseThrow();
        assertThat(saved.getUsuario()).isNotNull();
        Usuario savedUser = usuarioRepository.findById(saved.getUsuario().getId()).orElseThrow();
        assertThat(savedUser.getCorreo()).isEqualTo("historical@test.com");
        
        Rol medicoRol = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        assertThat(savedUser.getRol().getId()).isEqualTo(medicoRol.getId());
    }

    @Test
    void loginBeforeChangePassword_forcesChangeAndBlocksAccess() {
        // Create user with temp password
        MedicoRequest request = new MedicoRequest();
        request.setCedula("5000000000");
        request.setNombres("Doctor Login");
        request.setApellidos("Test");
        request.setEspecialidad("General");
        request.setCorreo("login.test@test.com");
        request.setActivo(true);
        request.setCrearCuentaAcceso(true);
        request.setPassword("TemporalPassword123!");
        request.setConfirmPassword("TemporalPassword123!");

        restTemplate.exchange("/api/medicos", HttpMethod.POST, new HttpEntity<>(request, getHeaders()), new ParameterizedTypeReference<ApiResponse<MedicoResponse>>() {});

        // Login with temp password should work
        LoginRequest login = new LoginRequest();
        login.setCorreo("login.test@test.com");
        login.setPassword("TemporalPassword123!");
        HttpHeaders loginHeaders = new HttpHeaders();
        loginHeaders.setContentType(MediaType.APPLICATION_JSON);
        loginHeaders.set("Origin", "http://localhost:3000");
        loginHeaders.set("X-Requested-With", "XMLHttpRequest");
        ResponseEntity<ApiResponse<LoginResponse>> loginResp = restTemplate.exchange("/api/v1/auth/login", HttpMethod.POST, new HttpEntity<>(login, loginHeaders), new ParameterizedTypeReference<>() {});
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        String tokenStr = loginResp.getBody().getData().getAccessToken();
        
        // Non-auth endpoints should be blocked with 403 because cambiarPassword=true
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenStr);
        ResponseEntity<String> blockedResp = restTemplate.exchange("/api/pacientes", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertThat(blockedResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        
        // Changing password should work
        com.zenthera.dto.auth.CambiarPasswordRequest changeReq = new com.zenthera.dto.auth.CambiarPasswordRequest();
        changeReq.setNewPassword("NuevaClaveRobusta456!");
        changeReq.setConfirmPassword("NuevaClaveRobusta456!");
        
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Origin", "http://localhost:3000");
        headers.set("X-Requested-With", "XMLHttpRequest");
        ResponseEntity<ApiResponse<Void>> changeResp = restTemplate.exchange("/api/v1/auth/cambiar-password", HttpMethod.POST, new HttpEntity<>(changeReq, headers), new ParameterizedTypeReference<>() {});
        assertThat(changeResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // After changing password, non-auth endpoints should be accessible
        ResponseEntity<String> allowedResp = restTemplate.exchange("/api/pacientes", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertThat(allowedResp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void restablecerPassword_success() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("7000000000");
        medico.setNombres("Doctor Resend");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCorreo("resend@test.com");
        medico.setCreatedAt(LocalDateTime.now());
        
        Usuario u = new Usuario();
        u.setClinica(clinica);
        u.setRol(rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow());
        u.setNombres("Doctor Resend");
        u.setApellidos("Test");
        u.setCedula("7000000000");
        u.setCorreo("resend@test.com");
        u.setPassword(passwordEncoder.encode("oldPassword"));
        u.setActivo(true);
        u.setCambiarPassword(false);
        Usuario savedU = usuarioRepository.save(u);
        
        medico.setUsuario(savedU);
        medico = medicoRepository.save(medico);

        com.zenthera.dto.medico.RestablecerPasswordRequest request = new com.zenthera.dto.medico.RestablecerPasswordRequest();
        request.setPassword("NewTemporal123!");
        request.setConfirmPassword("NewTemporal123!");

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId() + "/cuenta/restablecer-password",
                HttpMethod.POST,
                new HttpEntity<>(request, getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        Usuario updatedU = usuarioRepository.findById(savedU.getId()).orElseThrow();
        assertThat(updatedU.getCambiarPassword()).isTrue();
        
        // Login with old password should fail, new should succeed
        LoginRequest login = new LoginRequest();
        login.setCorreo("resend@test.com");
        login.setPassword("oldPassword");
        HttpHeaders loginHeaders = new HttpHeaders();
        loginHeaders.setContentType(MediaType.APPLICATION_JSON);
        loginHeaders.set("Origin", "http://localhost:3000");
        loginHeaders.set("X-Requested-With", "XMLHttpRequest");
        ResponseEntity<ApiResponse<LoginResponse>> oldResp = restTemplate.exchange("/api/v1/auth/login", HttpMethod.POST, new HttpEntity<>(login, loginHeaders), new ParameterizedTypeReference<>() {});
        assertThat(oldResp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        
        login.setPassword("NewTemporal123!");
        ResponseEntity<ApiResponse<LoginResponse>> newResp = restTemplate.exchange("/api/v1/auth/login", HttpMethod.POST, new HttpEntity<>(login, loginHeaders), new ParameterizedTypeReference<>() {});
        assertThat(newResp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
    @Test
    void estadoCuenta_inactiva_whenUserDeactivated() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("8000000000");
        medico.setNombres("Doctor Inactive");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCorreo("inactive@test.com");
        medico.setCreatedAt(LocalDateTime.now());
        
        Usuario u = new Usuario();
        u.setClinica(clinica);
        u.setRol(rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow());
        u.setNombres("Doctor Inactive");
        u.setApellidos("Test");
        u.setCedula("8000000000");
        u.setCorreo("inactive@test.com");
        u.setPassword("test");
        u.setActivo(false);
        u.setCambiarPassword(false);
        Usuario savedU = usuarioRepository.save(u);
        
        medico.setUsuario(savedU);
        medico = medicoRepository.save(medico);

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId(),
                HttpMethod.GET,
                new HttpEntity<>(getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getEstadoCuenta()).isEqualTo("INACTIVA");
    }

    @Test
    void estadoCuenta_cambioPasswordRequerido_whenCambiarPasswordTrue() {
        Medico medico = new Medico();
        medico.setClinica(clinica);
        medico.setCedula("9000000000");
        medico.setNombres("Doctor Pending");
        medico.setApellidos("Test");
        medico.setEspecialidad("General");
        medico.setCorreo("pending@test.com");
        medico.setCreatedAt(LocalDateTime.now());
        
        Usuario u = new Usuario();
        u.setClinica(clinica);
        u.setRol(rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow());
        u.setNombres("Doctor Pending");
        u.setApellidos("Test");
        u.setCedula("9000000000");
        u.setCorreo("pending@test.com");
        u.setPassword("test");
        u.setActivo(true);
        u.setCambiarPassword(true);
        Usuario savedU = usuarioRepository.save(u);
        
        medico.setUsuario(savedU);
        medico = medicoRepository.save(medico);

        ResponseEntity<ApiResponse<MedicoResponse>> response = restTemplate.exchange(
                "/api/medicos/" + medico.getId(),
                HttpMethod.GET,
                new HttpEntity<>(getHeaders()),
                new ParameterizedTypeReference<>() {}
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getEstadoCuenta()).isEqualTo("CAMBIO_PASSWORD_REQUERIDO");
    }
}


package com.zenthera.clinico;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Paciente;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.repository.PacienteRepository;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class HistoriaClinicaSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Clinica clinicaAlpha;
    private Clinica clinicaBeta;
    private Paciente pacienteAlpha;
    private Usuario medicoAlpha;
    private Usuario adminAlpha;
    private Usuario recepcionistaAlpha;
    private Usuario superAdmin;
    private Long consultaAlphaId;

    @BeforeEach
    void setUp() throws Exception {
        clinicaAlpha = new Clinica();
        clinicaAlpha.setNombre("Clinica Alpha");
        clinicaAlpha.setRuc("99" + UUID.randomUUID().toString().substring(0, 11));
        clinicaAlpha = clinicaRepository.saveAndFlush(clinicaAlpha);

        clinicaBeta = new Clinica();
        clinicaBeta.setNombre("Clinica Beta");
        clinicaBeta.setRuc("99" + UUID.randomUUID().toString().substring(0, 11));
        clinicaBeta = clinicaRepository.saveAndFlush(clinicaBeta);

        pacienteAlpha = new Paciente();
        pacienteAlpha.setNombres("Paciente");
        pacienteAlpha.setApellidos("Alpha");
        pacienteAlpha.setClinica(clinicaAlpha);
        pacienteAlpha.setCedula("1111111111");
        pacienteAlpha.setSexo(com.zenthera.enums.Sexo.MASCULINO);
        pacienteAlpha.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        pacienteAlpha = pacienteRepository.saveAndFlush(pacienteAlpha);

        Rol rolMedico = getOrCreateRol(RolNombre.MEDICO);
        Rol rolAdmin = getOrCreateRol(RolNombre.ADMIN_CLINICA);
        Rol rolRecepcionista = getOrCreateRol(RolNombre.RECEPCIONISTA);
        Rol rolSuperAdmin = getOrCreateRol(RolNombre.SUPER_ADMIN);

        medicoAlpha = createUsuario("medico@alpha.com", rolMedico, clinicaAlpha, false);
        Medico m = new Medico();
        m.setUsuario(medicoAlpha);
        m.setClinica(clinicaAlpha);
        m.setEspecialidad("General");
        m.setCedula("2222222222");
        m.setNombres("Medico");
        m.setApellidos("Alpha");
        medicoRepository.saveAndFlush(m);

        recepcionistaAlpha = createUsuario("recep@alpha.com", rolRecepcionista, clinicaAlpha, false);
        adminAlpha = createUsuario("admin@alpha.com", rolAdmin, clinicaAlpha, false);
        superAdmin = createUsuario("super@admin.com", rolSuperAdmin, null, false);
        consultaAlphaId = crearConsultaComoMedico();
    }

    private Rol getOrCreateRol(RolNombre nombre) {
        return rolRepository.findByNombre(nombre)
                .orElseGet(() -> {
                    Rol r = new Rol();
                    r.setNombre(nombre);
                    return rolRepository.saveAndFlush(r);
                });
    }

    private Usuario createUsuario(String email, Rol rol, Clinica clinica, boolean cambiarPassword) {
        Usuario u = new Usuario();
        u.setNombres("Name");
        u.setApellidos("Surname");
        u.setCorreo("user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com");
        u.setPassword(passwordEncoder.encode("pass"));
        u.setRol(rol);
        u.setClinica(clinica);
        u.setActivo(true);
        u.setCambiarPassword(cambiarPassword);
        return usuarioRepository.saveAndFlush(u);
    }

    private Long crearConsultaComoMedico() throws Exception {
        String token = jwtService.generateToken(medicoAlpha.getCorreo());

        mockMvc.perform(post("/api/v1/pacientes/" + pacienteAlpha.getId() + "/consultas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivoConsulta\":\"Consulta de seguridad\"}"))
                .andExpect(status().isCreated());

        return jdbcTemplate.queryForObject(
                "SELECT id FROM consulta_clinica WHERE clinica_id = ? ORDER BY id DESC LIMIT 1",
                Long.class,
                clinicaAlpha.getId());
    }

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DELETE FROM consulta_clinica; DELETE FROM historia_clinica;");
        pacienteRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();
    }

    @Test
    void medico_mismoTenant_accesoPermitido() throws Exception {
        String token = jwtService.generateToken(medicoAlpha.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void medico_mismoTenant_puedeConsultarConsulta() throws Exception {
        String token = jwtService.generateToken(medicoAlpha.getCorreo());

        mockMvc.perform(get("/api/v1/consultas/" + consultaAlphaId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void admin_mismoTenant_accesoDenegado() throws Exception {
        String token = jwtService.generateToken(adminAlpha.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void recepcionista_mismoTenant_accesoDenegado() throws Exception {
        String token = jwtService.generateToken(recepcionistaAlpha.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdmin_sinTenant_accesoDenegado() throws Exception {
        String token = jwtService.generateToken(superAdmin.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void rolesNoMedicos_noPuedenLeerNiCrearContenidoClinico() throws Exception {
        assertAccesoClinicoDenegado(adminAlpha);
        assertAccesoClinicoDenegado(recepcionistaAlpha);
        assertAccesoClinicoDenegado(superAdmin);
    }

    private void assertAccesoClinicoDenegado(Usuario usuario) throws Exception {
        String token = jwtService.generateToken(usuario.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/consultas/" + consultaAlphaId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/pacientes/" + pacienteAlpha.getId() + "/consultas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivoConsulta\":\"Acceso denegado\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void medico_sinRelacionMedico_accesoPermitidoTemporalmente() throws Exception {
        Usuario otroMedico = createUsuario("medico_otro@alpha.com", getOrCreateRol(RolNombre.MEDICO), clinicaAlpha, false);
        String token = jwtService.generateToken(otroMedico.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void medico_crossTenant_accesoDenegado() throws Exception {
        Usuario medicoBeta = createUsuario("medico@beta.com", getOrCreateRol(RolNombre.MEDICO), clinicaBeta, false);
        Medico m = new Medico();
        m.setUsuario(medicoBeta);
        m.setClinica(clinicaBeta);
        m.setEspecialidad("General");
        m.setCedula("3333333333");
        m.setNombres("Medico");
        m.setApellidos("Beta");
        medicoRepository.saveAndFlush(m);

        String token = jwtService.generateToken(medicoBeta.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound()); // or isNotFound depending on implementation, but blocked

        mockMvc.perform(get("/api/v1/consultas/" + consultaAlphaId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }



    @Test
    void medico_cambiarPasswordTrue_bloqueadoPorFiltro() throws Exception {
        Usuario medicoBloqueado = createUsuario("block@alpha.com", getOrCreateRol(RolNombre.MEDICO), clinicaAlpha, true);
        Medico m = new Medico();
        m.setUsuario(medicoBloqueado);
        m.setClinica(clinicaAlpha);
        m.setEspecialidad("General");
        m.setCedula("4444444444");
        m.setNombres("Medico");
        m.setApellidos("Bloqueado");
        medicoRepository.saveAndFlush(m);

        String token = jwtService.generateToken(medicoBloqueado.getCorreo());

        mockMvc.perform(get("/api/v1/pacientes/" + pacienteAlpha.getId() + "/historia")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}

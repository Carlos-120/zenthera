package com.zenthera.clinico;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.clinico.ConsultaRequest;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ConsultaClinicaIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Clinica clinicaAlpha;
    private Paciente pacienteAlpha;
    private Usuario medicoAlpha;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM consulta_clinica; DELETE FROM historia_clinica;");
        pacienteRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        clinicaRepository.deleteAll();

        clinicaAlpha = new Clinica();
        clinicaAlpha.setNombre("Clinica Alpha");
        clinicaAlpha.setRuc(UUID.randomUUID().toString().substring(0, 13));
        clinicaAlpha.setCorreo(UUID.randomUUID().toString() + "@alpha.com");
        clinicaAlpha.setActiva(true);
        clinicaAlpha = clinicaRepository.saveAndFlush(clinicaAlpha);

        pacienteAlpha = new Paciente();
        pacienteAlpha.setClinica(clinicaAlpha);
        pacienteAlpha.setCedula(UUID.randomUUID().toString().substring(0, 10));
        pacienteAlpha.setNombres("Paciente");
        pacienteAlpha.setApellidos("Alpha");
        pacienteAlpha.setFechaNacimiento(java.time.LocalDate.of(1990, 1, 1));
        pacienteAlpha.setSexo(com.zenthera.enums.Sexo.MASCULINO);
        pacienteAlpha = pacienteRepository.saveAndFlush(pacienteAlpha);

        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(RolNombre.MEDICO);
            return rolRepository.saveAndFlush(r);
        });

        medicoAlpha = new Usuario();
        medicoAlpha.setCorreo(UUID.randomUUID().toString() + "@alpha.com");
        medicoAlpha.setPassword("Password123!");
        medicoAlpha.setCedula(UUID.randomUUID().toString().substring(0, 10));
        medicoAlpha.setNombres("Medico");
        medicoAlpha.setApellidos("Alpha");
        medicoAlpha.setClinica(clinicaAlpha);
        medicoAlpha.setRol(rolMedico);
        medicoAlpha.setActivo(true);
        medicoAlpha.setCambiarPassword(false);
        medicoAlpha = usuarioRepository.saveAndFlush(medicoAlpha);

        Medico m = new Medico();
        m.setUsuario(medicoAlpha);
        m.setClinica(clinicaAlpha);
        m.setCedula(medicoAlpha.getCedula());
        m.setNombres(medicoAlpha.getNombres());
        m.setApellidos(medicoAlpha.getApellidos());
        medicoRepository.saveAndFlush(m);
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
    void medico_sameTenant_createConsulta_urlRealDelBackend_creaBorrador() throws Exception {
        String token = jwtService.generateToken(medicoAlpha.getCorreo());

        ConsultaRequest req = new ConsultaRequest();
        req.setMotivoConsulta("Dolor de cabeza");
        req.setDiagnosticoInicial("Migraña");

        mockMvc.perform(post("/api/v1/pacientes/" + pacienteAlpha.getId() + "/consultas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("BORRADOR"))
                .andExpect(jsonPath("$.motivoConsulta").value("Dolor de cabeza"));
    }
}

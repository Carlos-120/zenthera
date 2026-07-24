package com.zenthera.clinica;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.zenthera.dto.cita.CitaCreateRequest;
import com.zenthera.dto.cita.CitaUpdateRequest;
import com.zenthera.dto.cita.EstadoCitaRequest;
import com.zenthera.entity.*;
import com.zenthera.enums.RolNombre;
import com.zenthera.enums.Sexo;
import com.zenthera.repository.*;
import com.zenthera.security.jwt.JwtService;
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

import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ClinicaCitaOperacionesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EntityManager entityManager;

    private String adminToken;
    private String medicoToken;
    private String recepcionistaToken;

    private Clinica clinica;
    private Clinica clinicaOtra;
    private Paciente paciente;
    private Paciente pacienteOtro;
    private Medico medico;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA).orElseThrow();
        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO).orElseThrow();
        Rol rolRecepcionista = rolRepository.findByNombre(RolNombre.RECEPCIONISTA).orElseThrow();

        // Clinica 1
        clinica = new Clinica();
        clinica.setNombre("Clinica Ops 1");
        clinica.setRazonSocial("Ops 1 S.A.");
        clinica.setRuc("5555555555001");
        clinica = clinicaRepository.save(clinica);

        // Clinica Otra
        clinicaOtra = new Clinica();
        clinicaOtra.setNombre("Clinica Ops Otra");
        clinicaOtra.setRazonSocial("Ops Otra S.A.");
        clinicaOtra.setRuc("5555555555002");
        clinicaOtra = clinicaRepository.save(clinicaOtra);

        // Usuarios
        Usuario admin = new Usuario();
        admin.setNombres("Admin Ops");
        admin.setApellidos("Uno");
        admin.setCedula("9999999991");
        admin.setCorreo("adminops@uno.com");
        admin.setPassword(passwordEncoder.encode("Password123!"));
        admin.setClinica(clinica);
        admin.setRol(rolAdmin);
        admin.setActivo(true);
        usuarioRepository.save(admin);
        adminToken = jwtService.generateToken(admin.getCorreo());

        Usuario uMedico = new Usuario();
        uMedico.setNombres("Medico Ops");
        uMedico.setApellidos("Uno");
        uMedico.setCedula("9999999992");
        uMedico.setCorreo("medicoops@uno.com");
        uMedico.setPassword(passwordEncoder.encode("Password123!"));
        uMedico.setClinica(clinica);
        uMedico.setRol(rolMedico);
        uMedico.setActivo(true);
        usuarioRepository.save(uMedico);
        medicoToken = jwtService.generateToken(uMedico.getCorreo());

        Usuario uRecep = new Usuario();
        uRecep.setNombres("Recep Ops");
        uRecep.setApellidos("Uno");
        uRecep.setCedula("9999999993");
        uRecep.setCorreo("recepops@uno.com");
        uRecep.setPassword(passwordEncoder.encode("Password123!"));
        uRecep.setClinica(clinica);
        uRecep.setRol(rolRecepcionista);
        uRecep.setActivo(true);
        usuarioRepository.save(uRecep);
        recepcionistaToken = jwtService.generateToken(uRecep.getCorreo());

        // Medico Profile
        medico = new Medico();
        medico.setClinica(clinica);
        medico.setNombres("Medico Ops");
        medico.setApellidos("Uno");
        medico.setCedula("9999999992");
        medico.setEspecialidad("Pediatria");
        medico.setActivo(true);
        medico = medicoRepository.save(medico);

        // Paciente
        paciente = new Paciente();
        paciente.setClinica(clinica);
        paciente.setNombres("Paciente Ops");
        paciente.setApellidos("Uno");
        paciente.setCedula("9999999995");
        paciente.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        paciente.setSexo(Sexo.MASCULINO);
        paciente.setTelefono("0999999999");
        paciente.setCorreo("pacienteops@uno.com");
        paciente.setActivo(true);
        paciente = pacienteRepository.save(paciente);

        // Paciente Otro (Cross tenant)
        pacienteOtro = new Paciente();
        pacienteOtro.setClinica(clinicaOtra);
        pacienteOtro.setNombres("Paciente Cross");
        pacienteOtro.setApellidos("Uno");
        pacienteOtro.setCedula("9999999996");
        pacienteOtro.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        pacienteOtro.setSexo(Sexo.MASCULINO);
        pacienteOtro.setTelefono("0999999999");
        pacienteOtro.setCorreo("pacientecross@uno.com");
        pacienteOtro.setActivo(true);
        pacienteOtro = pacienteRepository.save(pacienteOtro);
    }

    @Test
    void crearCita_Valid_Returns201() throws Exception {
        CitaCreateRequest request = CitaCreateRequest.builder()
                .pacienteId(paciente.getId())
                .medicoId(medico.getId())
                .fechaHoraInicio(Instant.now().plus(2, ChronoUnit.DAYS))
                .duracionMinutos(30)
                .motivo("Consulta general")
                .build();

        mockMvc.perform(post("/api/v1/clinica/citas")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.estado").value("PROGRAMADA"))
                .andExpect(jsonPath("$.data.duracionMinutos").value(30))
                .andExpect(jsonPath("$.data.motivo").value("Consulta general"));
    }

    @Test
    void crearCita_MedicoCannotCreate_Returns403() throws Exception {
        CitaCreateRequest request = CitaCreateRequest.builder()
                .pacienteId(paciente.getId())
                .medicoId(medico.getId())
                .fechaHoraInicio(Instant.now().plus(2, ChronoUnit.DAYS))
                .duracionMinutos(30)
                .motivo("Consulta general")
                .build();

        mockMvc.perform(post("/api/v1/clinica/citas")
                .header("Authorization", "Bearer " + medicoToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void crearCita_PacienteCrossTenant_Returns404() throws Exception {
        CitaCreateRequest request = CitaCreateRequest.builder()
                .pacienteId(pacienteOtro.getId())
                .medicoId(medico.getId())
                .fechaHoraInicio(Instant.now().plus(2, ChronoUnit.DAYS))
                .duracionMinutos(30)
                .motivo("Consulta general")
                .build();

        mockMvc.perform(post("/api/v1/clinica/citas")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void crearCita_Overlap_Returns409() throws Exception {
        Instant fechaInicio = Instant.now().plus(2, ChronoUnit.DAYS);

        Cita citaExistente = new Cita();
        citaExistente.setClinica(clinica);
        citaExistente.setPaciente(paciente);
        citaExistente.setMedico(medico);
        citaExistente.setEstado(EstadoCita.PROGRAMADA);
        citaExistente.setFechaHoraInicio(fechaInicio);
        citaExistente.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        citaExistente.setDuracionMinutos(30);
        citaExistente.setMotivo("Existente");
        citaRepository.save(citaExistente);

        CitaCreateRequest request = CitaCreateRequest.builder()
                .pacienteId(paciente.getId())
                .medicoId(medico.getId())
                .fechaHoraInicio(fechaInicio.plus(15, ChronoUnit.MINUTES)) // overlap
                .duracionMinutos(30)
                .motivo("Nueva")
                .build();

        mockMvc.perform(post("/api/v1/clinica/citas")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("MEDICO_HORARIO_OCUPADO"));
    }

    @Test
    void actualizarCita_Reprogramar_ChangesToProgramada() throws Exception {
        Instant fechaInicio = Instant.now().plus(2, ChronoUnit.DAYS);

        Cita citaExistente = new Cita();
        citaExistente.setClinica(clinica);
        citaExistente.setPaciente(paciente);
        citaExistente.setMedico(medico);
        citaExistente.setEstado(EstadoCita.CONFIRMADA);
        citaExistente.setFechaHoraInicio(fechaInicio);
        citaExistente.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        citaExistente.setDuracionMinutos(30);
        citaExistente.setMotivo("Consulta 1");
        citaExistente = citaRepository.save(citaExistente);

        CitaUpdateRequest request = CitaUpdateRequest.builder()
                .pacienteId(paciente.getId())
                .medicoId(medico.getId())
                .fechaHoraInicio(fechaInicio.plus(1, ChronoUnit.DAYS))
                .duracionMinutos(30)
                .motivo("Consulta 1 reprogramada")
                .build();

        mockMvc.perform(put("/api/v1/clinica/citas/" + citaExistente.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("PROGRAMADA")); // Automáticamente pasa a PROGRAMADA
    }

    @Test
    void cambiarEstado_ProgramadaToConfirmada_ReturnsOk() throws Exception {
        Instant fechaInicio = Instant.now().plus(2, ChronoUnit.DAYS);

        Cita citaExistente = new Cita();
        citaExistente.setClinica(clinica);
        citaExistente.setPaciente(paciente);
        citaExistente.setMedico(medico);
        citaExistente.setEstado(EstadoCita.PROGRAMADA);
        citaExistente.setFechaHoraInicio(fechaInicio);
        citaExistente.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        citaExistente.setDuracionMinutos(30);
        citaExistente.setMotivo("Consulta");
        citaExistente = citaRepository.save(citaExistente);

        EstadoCitaRequest request = EstadoCitaRequest.builder()
                .estado(EstadoCita.CONFIRMADA)
                .build();

        mockMvc.perform(patch("/api/v1/clinica/citas/" + citaExistente.getId() + "/estado")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("CONFIRMADA"));
    }

    @Test
    void cambiarEstado_MedicoCannotConfirmOwnProgramada_Returns403AndKeepsAudit() throws Exception {
        Instant fechaInicio = Instant.now().plus(2, ChronoUnit.DAYS);
        Cita cita = new Cita();
        cita.setClinica(clinica);
        cita.setPaciente(paciente);
        cita.setMedico(medico);
        cita.setEstado(EstadoCita.PROGRAMADA);
        cita.setFechaHoraInicio(fechaInicio);
        cita.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        cita.setDuracionMinutos(30);
        cita.setMotivo("Confirmación no permitida para médico");
        cita = citaRepository.saveAndFlush(cita);
        entityManager.clear();

        Cita before = citaRepository.findById(cita.getId()).orElseThrow();
        Instant updatedAtBefore = before.getUpdatedAt();
        String updatedByBefore = before.getUpdatedBy();
        assertNotNull(updatedAtBefore);

        EstadoCitaRequest request = EstadoCitaRequest.builder()
                .estado(EstadoCita.CONFIRMADA)
                .build();

        mockMvc.perform(patch("/api/v1/clinica/citas/" + cita.getId() + "/estado")
                .header("Authorization", "Bearer " + medicoToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        entityManager.clear();
        Cita after = citaRepository.findById(cita.getId()).orElseThrow();
        assertEquals(EstadoCita.PROGRAMADA, after.getEstado());
        assertEquals(updatedAtBefore, after.getUpdatedAt());
        assertEquals(updatedByBefore, after.getUpdatedBy());
    }

    @Test
    void cambiarEstado_EnAtencion_AntesDeHora_Returns409() throws Exception {
        Instant fechaInicio = Instant.now().plus(1, ChronoUnit.HOURS); // En el futuro

        Cita citaExistente = new Cita();
        citaExistente.setClinica(clinica);
        citaExistente.setPaciente(paciente);
        citaExistente.setMedico(medico);
        citaExistente.setEstado(EstadoCita.PROGRAMADA);
        citaExistente.setFechaHoraInicio(fechaInicio);
        citaExistente.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        citaExistente.setDuracionMinutos(30);
        citaExistente.setMotivo("Consulta");
        citaExistente = citaRepository.save(citaExistente);

        EstadoCitaRequest request = EstadoCitaRequest.builder()
                .estado(EstadoCita.EN_ATENCION)
                .build();

        mockMvc.perform(patch("/api/v1/clinica/citas/" + citaExistente.getId() + "/estado")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("ATENCION_ANTES_DE_HORA"));
    }

    @Test
    void cambiarEstado_CanceladaWithoutMotivo_Returns400() throws Exception {
        Instant fechaInicio = Instant.now().plus(2, ChronoUnit.DAYS);

        Cita citaExistente = new Cita();
        citaExistente.setClinica(clinica);
        citaExistente.setPaciente(paciente);
        citaExistente.setMedico(medico);
        citaExistente.setEstado(EstadoCita.PROGRAMADA);
        citaExistente.setFechaHoraInicio(fechaInicio);
        citaExistente.setFechaHoraFin(fechaInicio.plus(30, ChronoUnit.MINUTES));
        citaExistente.setDuracionMinutos(30);
        citaExistente.setMotivo("Consulta");
        citaExistente = citaRepository.save(citaExistente);

        EstadoCitaRequest request = EstadoCitaRequest.builder()
                .estado(EstadoCita.CANCELADA)
                .build();

        mockMvc.perform(patch("/api/v1/clinica/citas/" + citaExistente.getId() + "/estado")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

}

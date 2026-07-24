package com.zenthera.service.impl;

import com.zenthera.dto.cita.CitaCreateRequest;
import com.zenthera.dto.cita.CitaListResponse;
import com.zenthera.dto.cita.CitaResponse;
import com.zenthera.dto.cita.CitaUpdateRequest;
import com.zenthera.dto.cita.EstadoCitaRequest;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.entity.Cita;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.EstadoCita;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Paciente;
import com.zenthera.exception.BusinessRuleException;
import com.zenthera.exception.ResourceNotFoundException;
import com.zenthera.mapper.common.PageResponseMapper;
import com.zenthera.repository.CitaRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.repository.specification.CitaSpecification;
import com.zenthera.security.tenant.TenantContext;
import com.zenthera.security.user.CustomUserDetails;
import com.zenthera.service.CitaService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepository;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;
    private final ClinicaRepository clinicaRepository;
    private final Clock clock;

    private static final List<String> ALLOWED_SORT_PROPERTIES = List.of(
            "fechaHoraInicio", "fechaHoraFin", "estado", "createdAt"
    );

    public CitaServiceImpl(CitaRepository citaRepository, MedicoRepository medicoRepository,
                           PacienteRepository pacienteRepository, ClinicaRepository clinicaRepository,
                           Clock clock) {
        this.citaRepository = citaRepository;
        this.medicoRepository = medicoRepository;
        this.pacienteRepository = pacienteRepository;
        this.clinicaRepository = clinicaRepository;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CitaListResponse> listarCitas(
            int page,
            int size,
            String search,
            Long pacienteId,
            Long medicoId,
            EstadoCita estado,
            Instant fechaDesde,
            Instant fechaHasta,
            String sort,
            String direction
    ) {
        Long tenantId = TenantContext.getCurrentTenant();

        if (size > 50) {
            throw new IllegalArgumentException("El tamaño máximo de página permitido es 50");
        }

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String rolNombre = userDetails.getUsuario().getRol().getNombre().name();

        if (fechaDesde != null && fechaHasta != null && fechaDesde.isAfter(fechaHasta)) {
            throw new IllegalArgumentException("fechaDesde no puede ser posterior a fechaHasta");
        }

        if ("MEDICO".equals(rolNombre)) {
            Medico medico = medicoRepository.findByClinicaIdAndCedulaAndActivoTrue(tenantId, userDetails.getUsuario().getCedula())
                    .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo"));
            medicoId = medico.getId();
        }

        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

        if (sort != null && !ALLOWED_SORT_PROPERTIES.contains(sort)) {
            throw new IllegalArgumentException("Parámetro de ordenamiento no válido: " + sort);
        }
        String sortProperty = sort != null ? sort : "fechaHoraInicio";

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortProperty));

        Specification<Cita> spec = CitaSpecification.buildFilter(tenantId, pacienteId, medicoId, estado, fechaDesde, fechaHasta, search);

        Page<CitaListResponse> citasPage = citaRepository.findAll(spec, pageable).map(this::mapToListResponse);

        return PageResponseMapper.from(citasPage);
    }

    @Override
    @Transactional(readOnly = true)
    public CitaResponse obtenerCita(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();

        Cita cita = citaRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada."));

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String rolNombre = userDetails.getUsuario().getRol().getNombre().name();

        if ("MEDICO".equals(rolNombre)) {
            Medico medico = medicoRepository.findByClinicaIdAndCedulaAndActivoTrue(tenantId, userDetails.getUsuario().getCedula())
                    .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo"));
            if (!cita.getMedico().getId().equals(medico.getId())) {
                throw new ResourceNotFoundException("Cita no encontrada.");
            }
        }

        return mapToResponse(cita);
    }

    @Override
    @Transactional
    public CitaResponse crearCita(CitaCreateRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String rolNombre = userDetails.getUsuario().getRol().getNombre().name();

        if ("MEDICO".equals(rolNombre)) {
            throw new AccessDeniedException("Los médicos no pueden crear citas directamente.");
        }

        Clinica clinica = clinicaRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica no encontrada."));

        Paciente paciente = pacienteRepository.findByIdAndClinicaIdAndActivoTrue(request.getPacienteId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado o inactivo."));

        System.out.println("VALIDATING MEDICO: " + request.getMedicoId() + " FOR TENANT: " + tenantId);
        Medico medico = medicoRepository.findByIdAndClinicaIdAndActivoTrue(request.getMedicoId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo."));

        Instant fechaHoraFin = request.getFechaHoraInicio().plus(request.getDuracionMinutos(), ChronoUnit.MINUTES);

        verificarSolapamientos(medico.getId(), paciente.getId(), tenantId, request.getFechaHoraInicio(), fechaHoraFin, null);

        Cita cita = new Cita();
        cita.setClinica(clinica);
        cita.setPaciente(paciente);
        cita.setMedico(medico);
        cita.setFechaHoraInicio(request.getFechaHoraInicio());
        cita.setFechaHoraFin(fechaHoraFin);
        cita.setDuracionMinutos(request.getDuracionMinutos());
        cita.setMotivo(request.getMotivo());
        cita.setObservaciones(request.getObservaciones());
        cita.setEstado(EstadoCita.PROGRAMADA);

        Cita savedCita = citaRepository.save(cita);
        return mapToResponse(savedCita);
    }

    @Override
    @Transactional
    public CitaResponse actualizarCita(Long id, CitaUpdateRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();
        Cita cita = citaRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada."));

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String rolNombre = userDetails.getUsuario().getRol().getNombre().name();

        if ("MEDICO".equals(rolNombre)) {
            Medico currentMedico = medicoRepository.findByClinicaIdAndCedulaAndActivoTrue(tenantId, userDetails.getUsuario().getCedula())
                    .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo"));
            if (!cita.getMedico().getId().equals(currentMedico.getId())) {
                throw new ResourceNotFoundException("Cita no encontrada.");
            }
        }

        if (cita.getEstado() == EstadoCita.CANCELADA || cita.getEstado() == EstadoCita.COMPLETADA || cita.getEstado() == EstadoCita.NO_ASISTIO) {
            throw new BusinessRuleException("No se pueden modificar citas en estado final.", HttpStatus.CONFLICT);
        }

        if (cita.getEstado() == EstadoCita.EN_ATENCION) {
            if ("RECEPCIONISTA".equals(rolNombre)) {
                throw new AccessDeniedException("Recepcionista no puede editar observaciones en atención.");
            }
            if (request.getObservaciones() != null) {
                cita.setObservaciones(request.getObservaciones());
            }
        } else {
            if ("RECEPCIONISTA".equals(rolNombre) && request.getObservaciones() != null && !request.getObservaciones().equals(cita.getObservaciones())) {
                throw new AccessDeniedException("Recepcionista no puede editar observaciones clínicas.");
            }

            if ("MEDICO".equals(rolNombre)) {
                if (request.getObservaciones() != null) {
                    cita.setObservaciones(request.getObservaciones());
                }
            } else {
                Paciente paciente = pacienteRepository.findByIdAndClinicaIdAndActivoTrue(request.getPacienteId(), tenantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado o inactivo."));
                Medico medico = medicoRepository.findByIdAndClinicaIdAndActivoTrue(request.getMedicoId(), tenantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo."));

                Instant newFechaHoraFin = request.getFechaHoraInicio().plus(request.getDuracionMinutos(), ChronoUnit.MINUTES);

                boolean isReprogramada = !cita.getFechaHoraInicio().equals(request.getFechaHoraInicio()) ||
                                         !cita.getDuracionMinutos().equals(request.getDuracionMinutos()) ||
                                         !cita.getMedico().getId().equals(medico.getId()) ||
                                         !cita.getPaciente().getId().equals(paciente.getId());

                if (isReprogramada) {
                    verificarSolapamientos(medico.getId(), paciente.getId(), tenantId, request.getFechaHoraInicio(), newFechaHoraFin, cita.getId());
                    if (cita.getEstado() == EstadoCita.CONFIRMADA) {
                        cita.setEstado(EstadoCita.PROGRAMADA);
                    }
                }

                cita.setPaciente(paciente);
                cita.setMedico(medico);
                cita.setFechaHoraInicio(request.getFechaHoraInicio());
                cita.setDuracionMinutos(request.getDuracionMinutos());
                cita.setFechaHoraFin(newFechaHoraFin);
                cita.setMotivo(request.getMotivo());

                if (request.getObservaciones() != null) {
                    cita.setObservaciones(request.getObservaciones());
                }
            }
        }

        Cita savedCita = citaRepository.save(cita);
        return mapToResponse(savedCita);
    }

    @Override
    @Transactional
    public CitaResponse cambiarEstadoCita(Long id, EstadoCitaRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();
        Cita cita = citaRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita no encontrada."));

        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String rolNombre = userDetails.getUsuario().getRol().getNombre().name();

        if ("MEDICO".equals(rolNombre)) {
            Medico currentMedico = medicoRepository.findByClinicaIdAndCedulaAndActivoTrue(tenantId, userDetails.getUsuario().getCedula())
                    .orElseThrow(() -> new ResourceNotFoundException("Médico no encontrado o inactivo"));
            if (!cita.getMedico().getId().equals(currentMedico.getId())) {
                throw new ResourceNotFoundException("Cita no encontrada.");
            }
        }

        EstadoCita currentState = cita.getEstado();
        EstadoCita newState = request.getEstado();

        if ("MEDICO".equals(rolNombre)
                && newState != EstadoCita.EN_ATENCION
                && newState != EstadoCita.COMPLETADA
                && newState != EstadoCita.NO_ASISTIO) {
            throw new AccessDeniedException("El médico no puede ejecutar esta transición de estado.");
        }

        if (currentState == EstadoCita.CANCELADA || currentState == EstadoCita.COMPLETADA || currentState == EstadoCita.NO_ASISTIO) {
            throw new BusinessRuleException("La cita se encuentra en un estado final y no puede cambiar.", HttpStatus.CONFLICT);
        }

        switch (newState) {
            case CONFIRMADA:
                if (currentState != EstadoCita.PROGRAMADA) {
                    throw new BusinessRuleException("Solo citas PROGRAMADAS pueden ser CONFIRMADAS.", HttpStatus.CONFLICT);
                }
                break;
            case EN_ATENCION:
                if ("RECEPCIONISTA".equals(rolNombre)) {
                    throw new AccessDeniedException("Recepcionista no puede iniciar la atención médica.");
                }
                if (currentState != EstadoCita.PROGRAMADA && currentState != EstadoCita.CONFIRMADA) {
                    throw new BusinessRuleException("Transición a EN_ATENCION no permitida desde estado " + currentState, HttpStatus.CONFLICT);
                }
                if (clock.instant().isBefore(cita.getFechaHoraInicio())) {
                    throw new BusinessRuleException("ATENCION_ANTES_DE_HORA", HttpStatus.CONFLICT);
                }
                break;
            case COMPLETADA:
                if ("RECEPCIONISTA".equals(rolNombre)) {
                    throw new AccessDeniedException("Recepcionista no puede completar la atención médica.");
                }
                if (currentState != EstadoCita.EN_ATENCION) {
                    throw new BusinessRuleException("Solo citas EN_ATENCION pueden ser COMPLETADAS.", HttpStatus.CONFLICT);
                }
                break;
            case CANCELADA:
                if ("MEDICO".equals(rolNombre)) {
                    throw new AccessDeniedException("El médico no puede cancelar la cita directamente.");
                }
                if (currentState == EstadoCita.EN_ATENCION) {
                    throw new BusinessRuleException("No se puede cancelar una cita EN_ATENCION.", HttpStatus.CONFLICT);
                }
                if (request.getMotivoCancelacion() == null || request.getMotivoCancelacion().trim().isEmpty()) {
                    throw new IllegalArgumentException("MOTIVO_CANCELACION_REQUERIDO");
                }
                cita.setMotivoCancelacion(request.getMotivoCancelacion());
                break;
            case NO_ASISTIO:
                if (currentState == EstadoCita.EN_ATENCION) {
                    throw new BusinessRuleException("No se puede marcar NO_ASISTIO en una cita EN_ATENCION.", HttpStatus.CONFLICT);
                }
                if (clock.instant().isBefore(cita.getFechaHoraInicio())) {
                    throw new BusinessRuleException("NO_ASISTIO_ANTES_DE_HORA", HttpStatus.CONFLICT);
                }
                break;
            default:
                throw new BusinessRuleException("Estado desconocido.", HttpStatus.CONFLICT);
        }

        cita.setEstado(newState);
        Cita savedCita = citaRepository.save(cita);
        return mapToResponse(savedCita);
    }

    private void verificarSolapamientos(Long medicoId, Long pacienteId, Long tenantId, Instant inicio, Instant fin, Long excludeCitaId) {
        if (citaRepository.existsOverlapByMedicoIdAndTenant(medicoId, tenantId, inicio, fin, excludeCitaId)) {
            throw new BusinessRuleException("MEDICO_HORARIO_OCUPADO", HttpStatus.CONFLICT);
        }
        if (citaRepository.existsOverlapByPacienteIdAndTenant(pacienteId, tenantId, inicio, fin, excludeCitaId)) {
            throw new BusinessRuleException("PACIENTE_HORARIO_OCUPADO", HttpStatus.CONFLICT);
        }
    }

    private CitaListResponse mapToListResponse(Cita cita) {
        CitaListResponse response = new CitaListResponse();
        response.setId(cita.getId());
        response.setPaciente(new CitaListResponse.ResumenPersona(
                cita.getPaciente().getId(),
                cita.getPaciente().getNombres(),
                cita.getPaciente().getApellidos()
        ));
        response.setMedico(new CitaListResponse.ResumenPersona(
                cita.getMedico().getId(),
                cita.getMedico().getNombres(),
                cita.getMedico().getApellidos()
        ));
        response.setFechaHoraInicio(cita.getFechaHoraInicio());
        response.setFechaHoraFin(cita.getFechaHoraFin());
        response.setDuracionMinutos(cita.getDuracionMinutos());
        response.setEstado(cita.getEstado());
        response.setMotivo(cita.getMotivo());
        response.setCreatedAt(cita.getCreatedAt());
        return response;
    }

    private CitaResponse mapToResponse(Cita cita) {
        CitaResponse response = new CitaResponse();
        response.setId(cita.getId());
        response.setPaciente(new CitaListResponse.ResumenPersona(
                cita.getPaciente().getId(),
                cita.getPaciente().getNombres(),
                cita.getPaciente().getApellidos()
        ));
        response.setMedico(new CitaListResponse.ResumenPersona(
                cita.getMedico().getId(),
                cita.getMedico().getNombres(),
                cita.getMedico().getApellidos()
        ));
        response.setFechaHoraInicio(cita.getFechaHoraInicio());
        response.setFechaHoraFin(cita.getFechaHoraFin());
        response.setDuracionMinutos(cita.getDuracionMinutos());
        response.setEstado(cita.getEstado());
        response.setMotivo(cita.getMotivo());
        response.setObservaciones(cita.getObservaciones());
        response.setMotivoCancelacion(cita.getMotivoCancelacion());
        response.setCreatedAt(cita.getCreatedAt());
        response.setUpdatedAt(cita.getUpdatedAt());
        return response;
    }
}

package com.zenthera.service.impl;

import com.zenthera.dto.clinico.ConsultaRequest;
import com.zenthera.dto.clinico.ConsultaResponse;
import com.zenthera.entity.ConsultaClinica;
import com.zenthera.entity.HistoriaClinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.EstadoConsulta;
import com.zenthera.exception.ResourceNotFoundException;
import com.zenthera.mapper.ClinicoMapper;
import com.zenthera.repository.ConsultaClinicaRepository;
import com.zenthera.service.AuthService;
import com.zenthera.service.ConsultaClinicaService;
import com.zenthera.service.HistoriaClinicaService;
import com.zenthera.service.MedicoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.lang.Long;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultaClinicaServiceImpl implements ConsultaClinicaService {

    private final ConsultaClinicaRepository consultaClinicaRepository;
    private final HistoriaClinicaService historiaClinicaService;
    private final MedicoService medicoService;
    private final AuthService authService;
    private final ClinicoMapper clinicoMapper;

    @Override
    @Transactional
    public ConsultaResponse crearBorrador(Long pacienteId, ConsultaRequest request) {
        Long clinicaId = authService.getClinicaActualId();

        // El usuario logueado debe ser Médico y estar vinculado a un registro de Medico
        Medico medico = medicoService.getMedicoPorUsuarioAutenticado();

        // Asegurar que la historia existe
        HistoriaClinica historia = historiaClinicaService.findOrCreateHistoria(pacienteId);

        ConsultaClinica consulta = clinicoMapper.toEntity(request);
        consulta.setHistoriaClinicaId(historia.getId());
        consulta.setClinicaId(clinicaId);
        consulta.setMedicoId(medico.getId());
        consulta.setEstado(EstadoConsulta.BORRADOR);

        ConsultaClinica saved = consultaClinicaRepository.save(consulta);

        // Refresh para cargar relaciones si es necesario, o setearlas manual
        saved.setMedico(medico);

        return clinicoMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ConsultaResponse actualizarBorrador(Long consultaId, ConsultaRequest request) {
        Long clinicaId = authService.getClinicaActualId();

        ConsultaClinica consulta = consultaClinicaRepository.findByIdAndClinicaId(consultaId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta no encontrada"));

        if (consulta.getEstado() == EstadoConsulta.FINALIZADA) {
            throw new IllegalStateException("No se puede editar una consulta finalizada");
        }

        // Validar que solo el médico autor pueda editar? Por ahora permitimos a cualquier médico del tenant según requerimiento básico
        // (En el futuro se restringirá al autor).

        clinicoMapper.updateEntity(request, consulta);

        return clinicoMapper.toResponse(consultaClinicaRepository.save(consulta));
    }

    @Override
    @Transactional
    public ConsultaResponse finalizarConsulta(Long consultaId) {
        Long clinicaId = authService.getClinicaActualId();
        Usuario usuarioActual = authService.getUsuarioAutenticado();

        ConsultaClinica consulta = consultaClinicaRepository.findByIdAndClinicaId(consultaId, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta no encontrada"));

        if (consulta.getEstado() == EstadoConsulta.FINALIZADA) {
            throw new IllegalStateException("La consulta ya se encuentra finalizada");
        }

        consulta.setEstado(EstadoConsulta.FINALIZADA);
        consulta.setFinalizadaAt(LocalDateTime.now());
        consulta.setFinalizadaPor(usuarioActual.getId());

        return clinicoMapper.toResponse(consultaClinicaRepository.save(consulta));
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultaResponse getConsultaById(Long id) {
        Long clinicaId = authService.getClinicaActualId();
        ConsultaClinica consulta = consultaClinicaRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Consulta no encontrada"));
        return clinicoMapper.toResponse(consulta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultaResponse> getConsultasPorHistoria(Long historiaClinicaId) {
        Long clinicaId = authService.getClinicaActualId();
        return consultaClinicaRepository.findByHistoriaClinicaIdAndClinicaIdOrderByCreatedAtDesc(historiaClinicaId, clinicaId)
                .stream()
                .map(clinicoMapper::toResponse)
                .collect(Collectors.toList());
    }
}

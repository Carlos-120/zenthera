package com.zenthera.service.impl;

import com.zenthera.dto.paciente.PacienteResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Paciente;
import com.zenthera.mapper.PacienteMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.service.PacienteService;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.zenthera.mapper.common.PageResponseMapper;
import com.zenthera.security.tenant.TenantContext;

import java.util.List;

@Service
public class PacienteServiceImpl implements PacienteService {

    private final PacienteRepository pacienteRepository;
    private final ClinicaRepository clinicaRepository;
    private final PacienteMapper pacienteMapper;

    public PacienteServiceImpl(
            PacienteRepository pacienteRepository,
            ClinicaRepository clinicaRepository,
            PacienteMapper pacienteMapper) {

        this.pacienteRepository = pacienteRepository;
        this.clinicaRepository = clinicaRepository;
        this.pacienteMapper = pacienteMapper;
    }

    @Override
    public PacienteResponse crear(PacienteRequest request) {

        Long tenantId = TenantContext.getCurrentTenant();

        Clinica clinica = clinicaRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada en el contexto"));
        if (pacienteRepository.existsByClinicaIdAndCedulaAndActivoTrue(
                tenantId, request.getCedula())) {

            throw new IllegalArgumentException(
                    "Ya existe un paciente con esa cédula en la clínica.");
        }
        Paciente paciente = pacienteMapper.toEntity(request);
        paciente.setClinica(clinica);

        Paciente guardado = pacienteRepository.save(paciente);

        return pacienteMapper.toResponse(guardado);
    }

    @Override
    public List<PacienteListResponse> listar() {
        Long tenantId = TenantContext.getCurrentTenant();
        return pacienteMapper.toListResponse(
                pacienteRepository.findByClinicaIdAndActivoTrue(tenantId));
    }

    @Override
    public PageResponse<PacienteListResponse> listar(int page, int size) {
        Long tenantId = TenantContext.getCurrentTenant();
        Page<PacienteListResponse> pacientes = pacienteRepository
                .findByClinicaIdAndActivoTrue(tenantId, PageRequest.of(page, size))
                .map(pacienteMapper::toListResponse);

        return PageResponseMapper.from(pacientes);
    }

    @Override
    public PacienteResponse obtenerPorId(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        return pacienteRepository.findByIdAndClinicaId(id, tenantId)
                .map(pacienteMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado o pertenece a otra clínica"));
    }

    @Override
    public PacienteResponse actualizar(Long id, PacienteRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado o pertenece a otra clínica"));

        // La clínica no se actualiza (se mantiene la del tenant)
        paciente.setCedula(request.getCedula());
        paciente.setNombres(request.getNombres());
        paciente.setApellidos(request.getApellidos());
        paciente.setFechaNacimiento(request.getFechaNacimiento());
        paciente.setSexo(request.getSexo());
        paciente.setTelefono(request.getTelefono());
        paciente.setCorreo(request.getCorreo());
        paciente.setDireccion(request.getDireccion());
        paciente.setTipoSangre(request.getTipoSangre());
        paciente.setAlergias(request.getAlergias());
        paciente.setContactoEmergencia(request.getContactoEmergencia());
        paciente.setTelefonoEmergencia(request.getTelefonoEmergencia());
        paciente.setActivo(request.getActivo());

        Paciente actualizado = pacienteRepository.save(paciente);

        return pacienteMapper.toResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Paciente paciente = pacienteRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado o pertenece a otra clínica"));

        paciente.setActivo(false);

        pacienteRepository.save(paciente);
    }

    @Override
    public List<PacienteListResponse> buscar(String buscar) {
        Long tenantId = TenantContext.getCurrentTenant();
        return pacienteMapper.toListResponse(
                pacienteRepository.buscarPacientesPorClinica(tenantId, buscar));
    }
}

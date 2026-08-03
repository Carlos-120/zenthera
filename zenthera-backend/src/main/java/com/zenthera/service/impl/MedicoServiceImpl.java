package com.zenthera.service.impl;

import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.medico.MedicoListResponse;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.medico.MedicoResponse;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.mapper.MedicoMapper;
import com.zenthera.mapper.common.PageResponseMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.security.tenant.TenantContext;
import com.zenthera.service.MedicoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicoServiceImpl implements MedicoService {

    private final MedicoRepository medicoRepository;
    private final ClinicaRepository clinicaRepository;
    private final MedicoMapper medicoMapper;

    public MedicoServiceImpl(
            MedicoRepository medicoRepository,
            ClinicaRepository clinicaRepository,
            MedicoMapper medicoMapper) {

        this.medicoRepository = medicoRepository;
        this.clinicaRepository = clinicaRepository;
        this.medicoMapper = medicoMapper;
    }

    @Override
    public MedicoResponse crear(MedicoRequest request) {

        Long tenantId = TenantContext.getCurrentTenant();
        Clinica clinica = clinicaRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Clinica no encontrada."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrue(
                tenantId, request.getCedula())) {

            throw new IllegalArgumentException(
                    "Ya existe un medico con esa cedula en la clinica.");
        }

        Medico medico = medicoMapper.toEntity(request);
        medico.setClinica(clinica);

        Medico guardado = medicoRepository.save(medico);

        return medicoMapper.toResponse(guardado);
    }

    @Override
    public MedicoResponse obtenerPorId(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        return medicoRepository.findByIdAndClinicaId(id, tenantId)
                .map(medicoMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));
    }

    @Override
    public List<MedicoListResponse> listar() {
        Long tenantId = TenantContext.getCurrentTenant();

        return medicoMapper.toListResponse(
                medicoRepository.findByClinicaIdAndActivoTrue(tenantId));
    }

    @Override
    public PageResponse<MedicoListResponse> listar(int page, int size, String buscar, Boolean activo) {
        Long tenantId = TenantContext.getCurrentTenant();

        Page<MedicoListResponse> medicos = medicoRepository
                .buscarMedicosPaginado(tenantId, buscar, activo, null, PageRequest.of(page, size))
                .map(medicoMapper::toListResponse);

        return PageResponseMapper.from(medicos);
    }

    @Override
    public List<MedicoListResponse> buscar(String buscar) {
        Long tenantId = TenantContext.getCurrentTenant();
        return medicoMapper.toListResponse(
                medicoRepository.buscarMedicos(tenantId, buscar));
    }

    @Override
    public MedicoResponse actualizar(Long id, MedicoRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();

        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrueAndIdNot(
                tenantId, request.getCedula(), id)) {

            throw new IllegalArgumentException(
                    "Ya existe un medico con esa cedula en la clinica.");
        }

        // medico.setClinica(clinica); // Not needed anymore as tenant isolation handles it
        medico.setCedula(request.getCedula());
        medico.setNombres(request.getNombres());
        medico.setApellidos(request.getApellidos());
        medico.setEspecialidad(request.getEspecialidad());
        medico.setTelefono(request.getTelefono());
        medico.setCorreo(request.getCorreo());
        medico.setDireccion(request.getDireccion());
        medico.setRegistroProfesional(request.getRegistroProfesional());
        medico.setActivo(
                request.getActivo() != null
                        ? request.getActivo()
                        : true);

        Medico actualizado = medicoRepository.save(medico);
        return medicoMapper.toResponse(actualizado);
    }

    @Override
    public MedicoResponse cambiarEstado(Long id, Boolean activo) {
        Long tenantId = TenantContext.getCurrentTenant();
        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));

        medico.setActivo(activo);
        Medico actualizado = medicoRepository.save(medico);
        return medicoMapper.toResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));
        medico.setActivo(false);
        medicoRepository.save(medico);
    }
}

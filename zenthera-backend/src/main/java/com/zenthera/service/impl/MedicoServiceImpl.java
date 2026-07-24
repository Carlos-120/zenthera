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

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clinica no encontrada."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrue(
                request.getClinicaId(), request.getCedula())) {

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
        return medicoRepository.findById(id)
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
    public PageResponse<MedicoListResponse> listar(int page, int size) {
        Long tenantId = TenantContext.getCurrentTenant();

        Page<MedicoListResponse> medicos = medicoRepository
                .findByClinicaIdAndActivoTrue(tenantId, PageRequest.of(page, size))
                .map(medicoMapper::toListResponse);

        return PageResponseMapper.from(medicos);
    }

    @Override
    public List<MedicoListResponse> buscar(String buscar) {
        return medicoMapper.toListResponse(
                medicoRepository.buscarMedicos(buscar));
    }

    @Override
    public MedicoResponse actualizar(Long id, MedicoRequest request) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clinica no encontrada."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrueAndIdNot(
                request.getClinicaId(), request.getCedula(), id)) {

            throw new IllegalArgumentException(
                    "Ya existe un medico con esa cedula en la clinica.");
        }

        medico.setClinica(clinica);
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
    public void eliminar(Long id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));
        medico.setActivo(false);
        medicoRepository.save(medico);
    }
}

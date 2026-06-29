package com.zenthera.service.impl;

import com.zenthera.dto.request.ClinicaRequest;
import com.zenthera.dto.response.ClinicaResponse;
import com.zenthera.entity.Clinica;
import com.zenthera.mapper.ClinicaMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.service.ClinicaService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClinicaServiceImpl implements ClinicaService {

    private final ClinicaRepository clinicaRepository;

    public ClinicaServiceImpl(ClinicaRepository clinicaRepository) {
        this.clinicaRepository = clinicaRepository;
    }

    @Override
    public ClinicaResponse guardar(ClinicaRequest request) {

        Clinica clinica = ClinicaMapper.toEntity(request);

        Clinica guardada = clinicaRepository.save(clinica);

        return ClinicaMapper.toResponse(guardada);
    }

    @Override
    public List<ClinicaResponse> listar() {
        return clinicaRepository.findAll()
                .stream()
                .map(ClinicaMapper::toResponse)
                .toList();
    }

    @Override
    public ClinicaResponse buscarPorId(Long id) {

        return clinicaRepository.findById(id)
                .map(ClinicaMapper::toResponse)
                .orElse(null);
    }
}
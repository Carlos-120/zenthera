package com.zenthera.service.impl;

import com.zenthera.dto.paciente.PacienteResponse;
import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Paciente;
import com.zenthera.mapper.PacienteMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.service.PacienteService;
import org.springframework.stereotype.Service;

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

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada"));

        Paciente paciente = pacienteMapper.toEntity(request);
        paciente.setClinica(clinica);

        Paciente guardado = pacienteRepository.save(paciente);

        return pacienteMapper.toResponse(guardado);
    }

    @Override
    public List<PacienteListResponse> listar() {
        return pacienteMapper.toListResponse(
                pacienteRepository.findAll());
    }

    @Override
    public PacienteResponse obtenerPorId(Long id) {
        return pacienteRepository.findById(id)
                .map(pacienteMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));
    }

    @Override
    public PacienteResponse actualizar(Long id, PacienteRequest request) {

        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada"));

        paciente.setClinica(clinica);
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

        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado"));

        paciente.setActivo(false);

        pacienteRepository.save(paciente);
    }
}
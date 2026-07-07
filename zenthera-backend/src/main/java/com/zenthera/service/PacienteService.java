package com.zenthera.service;

import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.dto.paciente.PacienteResponse;

import java.util.List;

public interface PacienteService {

    PacienteResponse crear(PacienteRequest request);

    PacienteResponse obtenerPorId(Long id);

    List<PacienteListResponse> listar();

    PacienteResponse actualizar(Long id, PacienteRequest request);

    void eliminar(Long id);

}
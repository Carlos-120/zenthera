package com.zenthera.service;

import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.dto.paciente.PacienteResponse;

import java.util.List;

public interface PacienteService {

    PacienteResponse crear(PacienteRequest request);

    PacienteResponse obtenerPorId(Long id);

    List<PacienteListResponse> buscar(String buscar);

    List<PacienteListResponse> listar();

    PageResponse<PacienteListResponse> listar(int page, int size);

    PacienteResponse actualizar(Long id, PacienteRequest request);

    void eliminar(Long id);

}

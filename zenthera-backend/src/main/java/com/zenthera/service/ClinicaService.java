package com.zenthera.service;

import com.zenthera.dto.request.ClinicaRequest;
import com.zenthera.dto.response.ClinicaResponse;

import java.util.List;

public interface ClinicaService {

    ClinicaResponse guardar(ClinicaRequest request);

    List<ClinicaResponse> listar();

    ClinicaResponse buscarPorId(Long id);
}
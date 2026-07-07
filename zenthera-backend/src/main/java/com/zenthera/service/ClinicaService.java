package com.zenthera.service;

import com.zenthera.dto.clinica.ClinicaRequest;
import com.zenthera.dto.clinica.ClinicaResponse;

import java.util.List;

public interface ClinicaService {

    ClinicaResponse guardar(ClinicaRequest request);

    List<ClinicaResponse> listar();

    ClinicaResponse buscarPorId(Long id);
}
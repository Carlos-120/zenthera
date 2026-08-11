package com.zenthera.service;

import com.zenthera.dto.clinico.ConsultaRequest;
import com.zenthera.dto.clinico.ConsultaResponse;

import java.util.List;
import java.lang.Long;

public interface ConsultaClinicaService {
    ConsultaResponse crearBorrador(Long pacienteId, ConsultaRequest request);
    ConsultaResponse actualizarBorrador(Long consultaId, ConsultaRequest request);
    ConsultaResponse finalizarConsulta(Long consultaId);
    ConsultaResponse getConsultaById(Long id);
    List<ConsultaResponse> getConsultasPorHistoria(Long historiaClinicaId);
}

package com.zenthera.controller;

import com.zenthera.dto.clinico.ConsultaResponse;
import com.zenthera.dto.clinico.HistoriaClinicaResponse;
import com.zenthera.service.ConsultaClinicaService;
import com.zenthera.service.HistoriaClinicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.lang.Long;

@RestController
@RequestMapping("/api/v1/pacientes/{pacienteId}/historia")
@RequiredArgsConstructor
public class HistoriaClinicaController {

    private final HistoriaClinicaService historiaClinicaService;
    private final ConsultaClinicaService consultaClinicaService;

    @GetMapping
    @PreAuthorize("hasAuthority('MEDICO')")
    public ResponseEntity<HistoriaClinicaResponse> getHistoriaClinica(@PathVariable Long pacienteId) {
        var historia = historiaClinicaService.findOrCreateHistoria(pacienteId);
        List<ConsultaResponse> consultas = consultaClinicaService.getConsultasPorHistoria(historia.getId());

        HistoriaClinicaResponse response = new HistoriaClinicaResponse();
        response.setId(historia.getId());
        response.setPacienteId(historia.getPacienteId());
        response.setCreatedAt(historia.getCreatedAt());
        response.setUpdatedAt(historia.getUpdatedAt());
        response.setConsultas(consultas);

        return ResponseEntity.ok(response);
    }
}

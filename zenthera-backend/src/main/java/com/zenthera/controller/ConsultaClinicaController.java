package com.zenthera.controller;

import com.zenthera.dto.clinico.ConsultaRequest;
import com.zenthera.dto.clinico.ConsultaResponse;
import com.zenthera.service.ConsultaClinicaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.lang.Long;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ConsultaClinicaController {

    private final ConsultaClinicaService consultaClinicaService;

    @PostMapping("/pacientes/{pacienteId}/consultas")
    @PreAuthorize("hasAuthority('MEDICO')")
    public ResponseEntity<ConsultaResponse> crearBorrador(
            @PathVariable Long pacienteId,
            @Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(consultaClinicaService.crearBorrador(pacienteId, request));
    }

    @GetMapping("/consultas/{id}")
    @PreAuthorize("hasAuthority('MEDICO')")
    public ResponseEntity<ConsultaResponse> getConsulta(@PathVariable Long id) {
        return ResponseEntity.ok(consultaClinicaService.getConsultaById(id));
    }

    @PutMapping("/consultas/{id}")
    @PreAuthorize("hasAuthority('MEDICO')")
    public ResponseEntity<ConsultaResponse> actualizarBorrador(
            @PathVariable Long id,
            @Valid @RequestBody ConsultaRequest request) {
        return ResponseEntity.ok(consultaClinicaService.actualizarBorrador(id, request));
    }

    @PostMapping("/consultas/{id}/finalizar")
    @PreAuthorize("hasAuthority('MEDICO')")
    public ResponseEntity<ConsultaResponse> finalizarConsulta(@PathVariable Long id) {
        return ResponseEntity.ok(consultaClinicaService.finalizarConsulta(id));
    }
}

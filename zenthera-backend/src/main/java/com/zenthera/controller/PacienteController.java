package com.zenthera.controller;

import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.paciente.PacienteResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.service.PacienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

    private final PacienteService pacienteService;

    public PacienteController(PacienteService pacienteService) {
        this.pacienteService = pacienteService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PacienteResponse>> guardar(
            @Valid @RequestBody PacienteRequest request) {

        PacienteResponse response = pacienteService.crear(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PacienteResponse>builder()
                        .success(true)
                        .message("Paciente registrado correctamente")
                        .data(response)
                        .build());
    }

    @GetMapping
    public List<PacienteListResponse> listar() {
        return pacienteService.listar();
    }

    @GetMapping("/{id}")
    public PacienteResponse obtenerPorId(@PathVariable Long id) {
        return pacienteService.obtenerPorId(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PacienteResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PacienteRequest request) {

        PacienteResponse response = pacienteService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.<PacienteResponse>builder()
                        .success(true)
                        .message("Paciente actualizado correctamente")
                        .data(response)
                        .build());
    }
}

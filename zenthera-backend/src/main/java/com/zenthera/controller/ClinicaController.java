package com.zenthera.controller;

import com.zenthera.dto.clinica.ClinicaRequest;
import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.service.ClinicaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clinicas")
public class ClinicaController {

    private final ClinicaService clinicaService;

    public ClinicaController(ClinicaService clinicaService) {
        this.clinicaService = clinicaService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClinicaResponse>> guardar(
            @Valid @RequestBody ClinicaRequest request) {

        ClinicaResponse response = clinicaService.guardar(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ApiResponse.<ClinicaResponse>builder()
                                .success(true)
                                .message("Clínica registrada correctamente.")
                                .data(response)
                                .build());
    }

    @GetMapping
    public List<ClinicaResponse> listar() {
        return clinicaService.listar();
    }

    @GetMapping("/{id}")
    public ClinicaResponse buscarPorId(@PathVariable Long id) {
        return clinicaService.buscarPorId(id);
    }
}
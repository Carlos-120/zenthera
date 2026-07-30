package com.zenthera.controller;

import com.zenthera.dto.clinica.ClinicaCreateRequest;
import com.zenthera.dto.clinica.ClinicaEstadoRequest;
import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.security.user.CustomUserDetails;
import com.zenthera.service.ClinicaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/clinicas")
public class SuperAdminClinicaController {

    private final ClinicaService clinicaService;

    public SuperAdminClinicaController(ClinicaService clinicaService) {
        this.clinicaService = clinicaService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClinicaResponse>> obtenerDetalle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<ClinicaResponse>builder()
                .success(true)
                .message("Detalle de clínica obtenido correctamente")
                .data(clinicaService.obtenerDetalle(id))
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClinicaResponse>> createClinica(
            @Valid @RequestBody ClinicaCreateRequest request) {

        ClinicaResponse response = clinicaService.createClinica(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ClinicaResponse>builder()
                .success(true)
                .message("Clínica y administrador creados correctamente")
                .data(response)
                .build());
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ClinicaResponse>> updateEstado(
            @PathVariable Long id,
            @Valid @RequestBody ClinicaEstadoRequest request,
            @AuthenticationPrincipal CustomUserDetails adminDetails) {

        ClinicaResponse response = clinicaService.updateEstadoClinica(id, request, adminDetails.getUsuario().getId());

        return ResponseEntity.ok(ApiResponse.<ClinicaResponse>builder()
                .success(true)
                .message("Estado de la clínica actualizado")
                .data(response)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<ClinicaResponse>>> getAllClinicas(
            @RequestParam(required = false) String search,
            Pageable pageable) {

        PageResponse<ClinicaResponse> response = clinicaService.getAllClinicas(search, pageable);

        return ResponseEntity.ok(ApiResponse.<PageResponse<ClinicaResponse>>builder()
                .success(true)
                .message("Clínicas obtenidas correctamente")
                .data(response)
                .build());
    }
}

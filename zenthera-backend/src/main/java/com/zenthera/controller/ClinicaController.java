package com.zenthera.controller;

import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.dto.clinica.ClinicaUpdateRequest;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.security.user.CustomUserDetails;
import com.zenthera.service.ClinicaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clinica")
public class ClinicaController {

    private final ClinicaService clinicaService;

    public ClinicaController(ClinicaService clinicaService) {
        this.clinicaService = clinicaService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    public ResponseEntity<ApiResponse<ClinicaResponse>> getMiClinica(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ClinicaResponse response = clinicaService.getMiClinica(userDetails.getUsuario().getClinica().getId());

        return ResponseEntity.ok(ApiResponse.<ClinicaResponse>builder()
                .success(true)
                .message("Clínica obtenida correctamente")
                .data(response)
                .build());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    public ResponseEntity<ApiResponse<ClinicaResponse>> updateMiClinica(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ClinicaUpdateRequest request) {

        ClinicaResponse response = clinicaService.updateMiClinica(userDetails.getUsuario().getClinica().getId(), request);

        return ResponseEntity.ok(ApiResponse.<ClinicaResponse>builder()
                .success(true)
                .message("Clínica actualizada correctamente")
                .data(response)
                .build());
    }
}

package com.zenthera.controller;

import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.rol.RolResponse;
import com.zenthera.service.ClinicaRolService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clinica/roles")
public class ClinicaRolController {

    private final ClinicaRolService clinicaRolService;

    public ClinicaRolController(ClinicaRolService clinicaRolService) {
        this.clinicaRolService = clinicaRolService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RolResponse>>> listarRolesAsignables() {
        List<RolResponse> response = clinicaRolService.listarRolesAsignables();
        
        return ResponseEntity.ok(
                ApiResponse.<List<RolResponse>>builder()
                        .success(true)
                        .message("Roles listados correctamente")
                        .data(response)
                        .build());
    }
}

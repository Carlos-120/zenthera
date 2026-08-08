package com.zenthera.controller;

import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.usuario.EstadoUsuarioRequest;
import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;
import com.zenthera.security.tenant.TenantContext;
import com.zenthera.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clinica/usuarios")
public class ClinicaUsuarioController {

    private final UsuarioService usuarioService;

    public ClinicaUsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioResponse>> guardar(
            @Valid @RequestBody UsuarioRequest request) {

        Long clinicaId = TenantContext.getCurrentTenant();
        UsuarioResponse response = usuarioService.guardar(clinicaId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Usuario registrado correctamente")
                        .data(response)
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UsuarioResponse>>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(required = false) Long rolId,
            @PageableDefault(size = 10) Pageable pageable) {
            
        Long clinicaId = TenantContext.getCurrentTenant();
        PageResponse<UsuarioResponse> response = usuarioService.listar(clinicaId, search, activo, rolId, pageable);
        
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UsuarioResponse>>builder()
                        .success(true)
                        .message("Usuarios listados correctamente")
                        .data(response)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> buscarPorId(@PathVariable Long id) {
        Long clinicaId = TenantContext.getCurrentTenant();
        UsuarioResponse response = usuarioService.buscarPorId(id, clinicaId);
        
        return ResponseEntity.ok(
                ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Usuario encontrado")
                        .data(response)
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequest request) {

        Long clinicaId = TenantContext.getCurrentTenant();
        UsuarioResponse response = usuarioService.actualizar(id, clinicaId, request);

        return ResponseEntity.ok(
                ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Usuario actualizado correctamente")
                        .data(response)
                        .build());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoUsuarioRequest request) {

        Long clinicaId = TenantContext.getCurrentTenant();
        UsuarioResponse response = usuarioService.actualizarEstado(id, clinicaId, request.getActivo());

        return ResponseEntity.ok(
                ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Estado de usuario actualizado correctamente")
                        .data(response)
                        .build());
    }
}

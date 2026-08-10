package com.zenthera.controller;

import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.medico.MedicoListResponse;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.medico.MedicoResponse;
import com.zenthera.dto.medico.UsuarioMedicoLinkRequest;
import com.zenthera.service.MedicoService;

import org.springframework.security.access.prepost.PreAuthorize;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medicos")
public class MedicoController {

    private final MedicoService medicoService;

    public MedicoController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PostMapping
    public ResponseEntity<ApiResponse<MedicoResponse>> crear(
            @Valid @RequestBody MedicoRequest request) {

        MedicoResponse response = medicoService.crear(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Medico registrado correctamente.",
                        response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicoListResponse>>> listar() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Medicos obtenidos correctamente.",
                        medicoService.listar()));
    }

    @GetMapping("/paginado")
    public ResponseEntity<ApiResponse<PageResponse<MedicoListResponse>>> listarPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean activo) {

        PageResponse<MedicoListResponse> medicos = medicoService.listar(page, size, search, activo);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Medicos obtenidos correctamente.",
                        medicos));
    }

    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<MedicoListResponse>>> buscar(
            @RequestParam String buscar) {

        List<MedicoListResponse> medicos = medicoService.buscar(buscar);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Busqueda realizada correctamente.",
                        medicos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicoResponse>> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Medico obtenido correctamente.",
                        medicoService.obtenerPorId(id)));
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PatchMapping("/{id}/estado")
    public ResponseEntity<ApiResponse<MedicoResponse>> cambiarEstado(
            @PathVariable Long id,
            @RequestParam Boolean activo) {

        MedicoResponse response = medicoService.cambiarEstado(id, activo);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Estado del médico actualizado correctamente.",
                        response));
    }



    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicoResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody MedicoRequest request) {

        MedicoResponse response = medicoService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Medico actualizado correctamente.",
                        response));
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {

        medicoService.eliminar(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Medico eliminado correctamente.")
                        .build());
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PutMapping("/{id}/usuario")
    public ResponseEntity<ApiResponse<MedicoResponse>> vincularUsuario(
            @PathVariable Long id,
            @RequestBody UsuarioMedicoLinkRequest request) {

        MedicoResponse response = medicoService.vincularUsuario(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Usuario vinculado al médico correctamente.",
                        response));
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PostMapping("/{id}/cuenta")
    public ResponseEntity<ApiResponse<MedicoResponse>> crearCuentaAcceso(
            @PathVariable Long id,
            @Valid @RequestBody com.zenthera.dto.medico.RestablecerPasswordRequest request) {

        MedicoResponse response = medicoService.crearCuentaAcceso(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Cuenta de acceso creada y vinculada correctamente.",
                        response));
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @PostMapping("/{id}/cuenta/restablecer-password")
    public ResponseEntity<ApiResponse<MedicoResponse>> restablecerPasswordMedico(
            @PathVariable Long id,
            @Valid @RequestBody com.zenthera.dto.medico.RestablecerPasswordRequest request) {

        MedicoResponse response = medicoService.restablecerPasswordMedico(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Contraseña restablecida correctamente. El usuario deberá cambiarla en su próximo inicio de sesión.",
                        response));
    }

    @PreAuthorize("hasAuthority('ADMIN_CLINICA')")
    @DeleteMapping("/{id}/usuario")
    public ResponseEntity<ApiResponse<MedicoResponse>> desvincularUsuario(@PathVariable Long id) {

        MedicoResponse response = medicoService.desvincularUsuario(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Usuario desvinculado del médico correctamente.",
                        response));
    }
}

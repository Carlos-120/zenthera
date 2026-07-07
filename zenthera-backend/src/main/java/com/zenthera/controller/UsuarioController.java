package com.zenthera.controller;

import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;
import com.zenthera.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioResponse>> guardar(
            @Valid @RequestBody UsuarioRequest request) {

        UsuarioResponse response = usuarioService.guardar(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Usuario registrado correctamente")
                        .data(response)
                        .build());
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscarPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequest request) {

        UsuarioResponse response = usuarioService.actualizar(id, request);

        return ResponseEntity.ok(
                ApiResponse.<UsuarioResponse>builder()
                        .success(true)
                        .message("Usuario actualizado correctamente")
                        .data(response)
                        .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {

        usuarioService.eliminar(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Usuario eliminado correctamente")
                        .build());
    }
}
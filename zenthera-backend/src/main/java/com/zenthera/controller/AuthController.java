package com.zenthera.controller;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = authService.authenticate(request);

        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.<LoginResponse>builder()
                        .success(true)
                        .message("Ingreso exitoso")
                        .data(response)
                        .build());
    }
}

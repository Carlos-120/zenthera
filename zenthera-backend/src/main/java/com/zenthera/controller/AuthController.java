package com.zenthera.controller;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;
import com.zenthera.dto.auth.MeResponse;
import com.zenthera.dto.auth.AuthResult;
import com.zenthera.dto.auth.ActivationRequest;
import com.zenthera.dto.auth.PublicClinicRegistrationRequest;
import com.zenthera.dto.auth.PublicClinicRegistrationResponse;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.exception.TokenReutilizadoException;
import com.zenthera.service.AuthService;
import com.zenthera.service.ActivationService;
import com.zenthera.service.ClinicaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final ActivationService activationService;
    private final ClinicaService clinicaService;
    private final long refreshExpirationMs;
    private final boolean cookieSecure;

    public AuthController(AuthService authService,
                          ActivationService activationService,
                          ClinicaService clinicaService,
                          @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs,
                          @Value("${jwt.cookie-secure}") boolean cookieSecure) {
        this.authService = authService;
        this.activationService = activationService;
        this.clinicaService = clinicaService;
        this.refreshExpirationMs = refreshExpirationMs;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/register-clinic")
    public ResponseEntity<ApiResponse<PublicClinicRegistrationResponse>> registerClinic(
            @Valid @RequestBody PublicClinicRegistrationRequest request) {
        PublicClinicRegistrationResponse response = clinicaService.registerPublicClinic(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<PublicClinicRegistrationResponse>builder()
                        .success(true)
                        .message("Registro recibido. Active la cuenta del administrador para continuar.")
                        .data(response)
                        .build());
    }

    private ResponseCookie createRefreshTokenCookie(String refreshToken, long maxAge) {
        return ResponseCookie.from("refreshToken", refreshToken != null ? refreshToken : "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResult authResult = authService.login(request);

        ResponseCookie cookie = createRefreshTokenCookie(authResult.getRefreshToken(), refreshExpirationMs / 1000);

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.<LoginResponse>builder()
                        .success(true)
                        .message("Autenticación exitosa")
                        .data(authResult.getLoginResponse())
                        .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<LoginResponse>builder()
                            .success(false)
                            .message("Falta token de actualización")
                            .build());
        }

        try {
            AuthResult authResult = authService.refresh(refreshToken);

            ResponseCookie cookie = createRefreshTokenCookie(authResult.getRefreshToken(), refreshExpirationMs / 1000);

            return ResponseEntity.status(HttpStatus.OK)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(ApiResponse.<LoginResponse>builder()
                            .success(true)
                            .message("Token renovado")
                            .data(authResult.getLoginResponse())
                            .build());

        } catch (TokenReutilizadoException e) {
            // Reutilización confirmada — invalidar cookie y responder 401
            ResponseCookie emptyCookie = createRefreshTokenCookie("", 0);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, emptyCookie.toString())
                    .body(ApiResponse.<LoginResponse>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());

        } catch (IllegalArgumentException e) {
            // Token inválido o expirado
            ResponseCookie emptyCookie = createRefreshTokenCookie("", 0);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, emptyCookie.toString())
                    .body(ApiResponse.<LoginResponse>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken);
        }

        ResponseCookie emptyCookie = createRefreshTokenCookie("", 0);

        return ResponseEntity.status(HttpStatus.OK)
                .header(HttpHeaders.SET_COOKIE, emptyCookie.toString())
                .body(ApiResponse.<Void>builder()
                        .success(true)
                        .message("Sesión finalizada exitosamente")
                        .build());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> me() {
        MeResponse me = authService.getMe();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.<MeResponse>builder()
                        .success(true)
                        .message("Perfil obtenido exitosamente")
                        .data(me)
                        .build());
    }

    @PostMapping("/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@Valid @RequestBody ActivationRequest request) {
        try {
            activationService.activateAccount(request.getToken(), request.getPassword());
            return ResponseEntity.status(HttpStatus.OK)
                    .body(ApiResponse.<Void>builder()
                            .success(true)
                            .message("Cuenta activada exitosamente")
                            .build());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }
}

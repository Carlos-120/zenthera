package com.zenthera.service;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.MeResponse;
import com.zenthera.dto.auth.AuthResult;

public interface AuthService {

    AuthResult login(LoginRequest request);

    AuthResult refresh(String rawRefreshToken);

    void logout(String rawRefreshToken);

    MeResponse getMe();

    void cambiarPassword(com.zenthera.dto.auth.CambiarPasswordRequest request);
}

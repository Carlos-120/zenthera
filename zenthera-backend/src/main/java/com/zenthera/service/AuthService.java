package com.zenthera.service;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;

public interface AuthService {

    LoginResponse authenticate(LoginRequest loginRequest);

}

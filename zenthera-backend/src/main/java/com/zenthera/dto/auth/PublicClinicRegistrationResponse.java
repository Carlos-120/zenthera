package com.zenthera.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PublicClinicRegistrationResponse {
    private final String adminCorreo;
    private final String estado;
}

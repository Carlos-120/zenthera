package com.zenthera.dto.auth;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class LoginResponse {

    private String accessToken;

    private String tokenType;

    private Long usuarioId;

    private String nombreCompleto;

    private String correo;

    private String rol;

    private String clinica;

}
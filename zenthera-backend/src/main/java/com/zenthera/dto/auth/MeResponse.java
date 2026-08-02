package com.zenthera.dto.auth;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MeResponse {

    private Long id;
    private String nombres;
    private String apellidos;
    private String correo;
    private String rol;
    private Long clinicaId;
    private String clinicaNombre;
    private Boolean onboardingCompletado;

}

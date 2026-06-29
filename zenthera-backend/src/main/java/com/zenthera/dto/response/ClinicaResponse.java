package com.zenthera.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicaResponse {

    private Long id;

    private String nombre;

    private String ruc;

    private String telefono;

    private String correo;

    private String ciudad;

    private Boolean activa;
}
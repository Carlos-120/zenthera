package com.zenthera.dto.clinica;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicaResponse {

    private Long id;
    private String nombre;
    private String razonSocial;
    private String ruc;
    private String telefono;
    private String correo;
    private String direccion;
    private String ciudad;
    private String provincia;
    private String pais;
    private String zonaHoraria;
    private String logo;
    private Boolean activa;
}

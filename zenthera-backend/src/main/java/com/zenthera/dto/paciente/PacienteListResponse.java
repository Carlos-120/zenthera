package com.zenthera.dto.paciente;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PacienteListResponse {

    private Long id;

    private String cedula;

    private String nombres;

    private String apellidos;

    private String telefono;

    private Boolean activo;

}
package com.zenthera.dto.medico;

import lombok.Data;

@Data
public class MedicoListResponse {

    private Long id;

    private Long clinicaId;

    private String nombreClinica;

    private String cedula;

    private String nombres;

    private String apellidos;

    private String especialidad;

    private String telefono;

    private Boolean activo;

    private Long usuarioId;

    private String correoUsuario;
}

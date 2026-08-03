package com.zenthera.dto.medico;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MedicoRequest {

    private Long clinicaId;

    @NotBlank(message = "La cédula es obligatoria")
    @Size(max = 13)
    private String cedula;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 80)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 80)
    private String apellidos;

    @NotBlank(message = "La especialidad es obligatoria")
    @Size(max = 100)
    private String especialidad;

    @Size(max = 20)
    private String telefono;

    @Email(message = "Correo inválido")
    @Size(max = 120)
    private String correo;

    @Size(max = 255)
    private String direccion;

    @Size(max = 20)
    private String registroProfesional;

    private Boolean activo;
}

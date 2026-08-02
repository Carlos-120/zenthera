package com.zenthera.dto.paciente;

import com.zenthera.enums.Sexo;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class PacienteRequest {


    @NotBlank(message = "La cédula es obligatoria")
    @Size(max = 13)
    private String cedula;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 80)
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 80)
    private String apellidos;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate fechaNacimiento;

    @NotNull(message = "El sexo es obligatorio")
    private Sexo sexo;

    @Size(max = 20)
    private String telefono;

    @Email(message = "Correo inválido")
    @Size(max = 120)
    private String correo;

    @Size(max = 255)
    private String direccion;

    @Size(max = 5)
    private String tipoSangre;

    private String alergias;

    @Size(max = 120)
    private String contactoEmergencia;

    @Size(max = 20)
    private String telefonoEmergencia;

    private Boolean activo = true;
}

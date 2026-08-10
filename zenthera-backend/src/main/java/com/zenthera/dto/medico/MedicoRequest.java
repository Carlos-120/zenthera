package com.zenthera.dto.medico;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MedicoRequest {

    private Long clinicaId;

    @NotBlank(message = "La identificación es obligatoria.")
    @Pattern(regexp = "^\\d+$", message = "La identificación debe contener solo números.")
    @Size(min = 10, max = 13, message = "La identificación debe tener entre 10 y 13 dígitos.")
    private String cedula;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(min = 2, max = 80, message = "Los nombres no pueden exceder 80 caracteres")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "Los nombres solo pueden contener letras, espacios y acentos")
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(min = 2, max = 80, message = "Los apellidos no pueden exceder 80 caracteres")
    @Pattern(regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$", message = "Los apellidos solo pueden contener letras, espacios y acentos")
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

    private Boolean crearCuentaAcceso;

    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String password;

    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String confirmPassword;
}

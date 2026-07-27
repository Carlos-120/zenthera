package com.zenthera.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicClinicRegistrationRequest {

    @NotBlank(message = "El RUC es obligatorio")
    private String ruc;

    @NotBlank(message = "La razón social es obligatoria")
    private String razonSocial;

    @NotBlank(message = "El nombre de la clínica es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo de la clínica es obligatorio")
    @Email(message = "Correo de clínica inválido")
    private String correo;

    @NotBlank(message = "El teléfono es obligatorio")
    private String telefono;

    @NotBlank(message = "Los nombres del administrador son obligatorios")
    private String adminNombres;

    @NotBlank(message = "Los apellidos del administrador son obligatorios")
    private String adminApellidos;

    @NotBlank(message = "La cédula del administrador es obligatoria")
    private String adminCedula;

    @NotBlank(message = "El correo del administrador es obligatorio")
    @Email(message = "Correo del administrador inválido")
    private String adminCorreo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String password;

    public void setCorreo(String correo) {
        this.correo = trim(correo);
    }

    public void setAdminCorreo(String adminCorreo) {
        this.adminCorreo = trim(adminCorreo);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

package com.zenthera.dto.clinica;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicOnboardingRequest {

    @NotBlank(message = "El RUC es obligatorio")
    @Pattern(regexp = "^\\d{13}$", message = "El RUC debe tener exactamente 13 dígitos numéricos")
    private String ruc;

    @NotBlank(message = "La razón social es obligatoria")
    @Size(min = 3, max = 150, message = "La razón social debe tener entre 3 y 150 caracteres")
    private String razonSocial;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El formato del correo es inválido")
    @Size(max = 120, message = "El correo no puede exceder 120 caracteres")
    private String correo;

    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^\\d{7,20}$", message = "El teléfono debe contener entre 7 y 20 dígitos")
    private String telefono;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 500, message = "La dirección no puede exceder 500 caracteres")
    private String direccion;

    @NotBlank(message = "La ciudad es obligatoria")
    @Pattern(regexp = "^[\\p{L}ñÑáéíóúÁÉÍÓÚ\\s\\-.,]+$", message = "La ciudad contiene caracteres inválidos")
    @Size(min = 2, max = 100, message = "La ciudad debe tener entre 2 y 100 caracteres")
    private String ciudad;

    @NotBlank(message = "La provincia es obligatoria")
    @Pattern(regexp = "^[\\p{L}ñÑáéíóúÁÉÍÓÚ\\s\\-.,]+$", message = "La provincia contiene caracteres inválidos")
    @Size(min = 2, max = 100, message = "La provincia debe tener entre 2 y 100 caracteres")
    private String provincia;

    public void setCorreo(String correo) {
        this.correo = trim(correo);
    }

    public void setRuc(String ruc) {
        this.ruc = trim(ruc);
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = trim(razonSocial);
    }

    public void setTelefono(String telefono) {
        this.telefono = trim(telefono);
    }

    public void setDireccion(String direccion) {
        this.direccion = trim(direccion);
    }

    public void setCiudad(String ciudad) {
        this.ciudad = trim(ciudad);
    }

    public void setProvincia(String provincia) {
        this.provincia = trim(provincia);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

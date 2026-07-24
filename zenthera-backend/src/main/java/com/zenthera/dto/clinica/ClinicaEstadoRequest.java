package com.zenthera.dto.clinica;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicaEstadoRequest {

    private boolean activa;

    @NotBlank(message = "Debe proporcionar un motivo para el cambio de estado")
    private String motivo;
}

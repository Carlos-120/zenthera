package com.zenthera.dto.paciente;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoPacienteRequest {

    @NotNull(message = "El estado (activo/inactivo) es obligatorio")
    private Boolean activo;

}

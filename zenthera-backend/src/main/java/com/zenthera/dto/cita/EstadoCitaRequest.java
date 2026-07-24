package com.zenthera.dto.cita;

import com.zenthera.entity.EstadoCita;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoCitaRequest {

    @NotNull(message = "El estado es obligatorio")
    private EstadoCita estado;

    private String motivoCancelacion;
}

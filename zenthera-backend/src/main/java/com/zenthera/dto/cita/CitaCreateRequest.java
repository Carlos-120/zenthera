package com.zenthera.dto.cita;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CitaCreateRequest {

    @NotNull(message = "El paciente es obligatorio")
    private Long pacienteId;

    @NotNull(message = "El médico es obligatorio")
    private Long medicoId;

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    @Future(message = "La fecha de inicio debe ser en el futuro")
    private Instant fechaHoraInicio;

    @NotNull(message = "La duración es obligatoria")
    @Min(value = 15, message = "La duración mínima es de 15 minutos")
    @Max(value = 480, message = "La duración máxima es de 480 minutos")
    private Integer duracionMinutos;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    private String observaciones;
}

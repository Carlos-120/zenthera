package com.zenthera.dto.clinico;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignosVitalesDto {
    @Min(value = 0, message = "El peso no puede ser negativo")
    private BigDecimal peso;

    @Min(value = 0, message = "La talla no puede ser negativa")
    private BigDecimal talla;

    @Min(value = 0, message = "La presión sistólica no puede ser negativa")
    private Integer presionSistolica;

    @Min(value = 0, message = "La presión diastólica no puede ser negativa")
    private Integer presionDiastolica;

    @Min(value = 0, message = "La frecuencia cardíaca no puede ser negativa")
    private Integer frecuenciaCardiaca;

    @Min(value = 0, message = "La temperatura no puede ser negativa")
    private BigDecimal temperatura;

    @Min(value = 0, message = "La saturación de oxígeno no puede ser negativa")
    @Max(value = 100, message = "La saturación de oxígeno no puede ser mayor a 100")
    private Integer saturacionOxigeno;
}

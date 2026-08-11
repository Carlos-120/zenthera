package com.zenthera.dto.clinico;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.lang.Long;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoriaClinicaResponse {
    private Long id;
    private Long pacienteId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ConsultaResponse> consultas;
}

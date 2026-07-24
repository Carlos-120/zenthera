package com.zenthera.dto.cita;

import com.zenthera.entity.EstadoCita;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class CitaResponse {

    private Long id;
    private CitaListResponse.ResumenPersona paciente;
    private CitaListResponse.ResumenPersona medico;
    private Instant fechaHoraInicio;
    private Instant fechaHoraFin;
    private Integer duracionMinutos;
    private EstadoCita estado;
    private String motivo;

    private String observaciones;
    private String motivoCancelacion;

    private Instant createdAt;
    private Instant updatedAt;

}

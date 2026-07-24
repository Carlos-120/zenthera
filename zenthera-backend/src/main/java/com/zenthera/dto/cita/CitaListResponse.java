package com.zenthera.dto.cita;

import com.zenthera.entity.EstadoCita;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class CitaListResponse {

    private Long id;
    private ResumenPersona paciente;
    private ResumenPersona medico;
    private Instant fechaHoraInicio;
    private Instant fechaHoraFin;
    private Integer duracionMinutos;
    private EstadoCita estado;
    private String motivo;
    private Instant createdAt;

    @Getter
    @Setter
    public static class ResumenPersona {
        private Long id;
        private String nombres;
        private String apellidos;

        public ResumenPersona() {}

        public ResumenPersona(Long id, String nombres, String apellidos) {
            this.id = id;
            this.nombres = nombres;
            this.apellidos = apellidos;
        }
    }
}

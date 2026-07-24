package com.zenthera.service;

import com.zenthera.dto.cita.CitaListResponse;
import com.zenthera.dto.cita.CitaResponse;
import com.zenthera.entity.EstadoCita;
import com.zenthera.dto.common.PageResponse;

import java.time.Instant;

public interface CitaService {

    PageResponse<CitaListResponse> listarCitas(
            int page,
            int size,
            String search,
            Long pacienteId,
            Long medicoId,
            EstadoCita estado,
            Instant fechaDesde,
            Instant fechaHasta,
            String sort,
            String direction
    );

    CitaResponse obtenerCita(Long id);

    CitaResponse crearCita(com.zenthera.dto.cita.CitaCreateRequest request);

    CitaResponse actualizarCita(Long id, com.zenthera.dto.cita.CitaUpdateRequest request);

    CitaResponse cambiarEstadoCita(Long id, com.zenthera.dto.cita.EstadoCitaRequest request);

}

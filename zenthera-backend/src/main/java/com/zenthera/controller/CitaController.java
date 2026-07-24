package com.zenthera.controller;

import com.zenthera.dto.cita.CitaCreateRequest;
import com.zenthera.dto.cita.CitaListResponse;
import com.zenthera.dto.cita.CitaResponse;
import com.zenthera.dto.cita.CitaUpdateRequest;
import com.zenthera.dto.cita.EstadoCitaRequest;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.entity.EstadoCita;
import com.zenthera.service.CitaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/clinica/citas")
public class CitaController {

    private final CitaService citaService;

    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN_CLINICA', 'RECEPCIONISTA', 'MEDICO')")
    public ResponseEntity<ApiResponse<PageResponse<CitaListResponse>>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long pacienteId,
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) EstadoCita estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fechaHasta,
            @RequestParam(required = false, defaultValue = "fechaHoraInicio") String sort,
            @RequestParam(required = false, defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Citas obtenidas exitosamente",
                citaService.listarCitas(page, size, search, pacienteId, medicoId, estado, fechaDesde, fechaHasta, sort, direction)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN_CLINICA', 'RECEPCIONISTA', 'MEDICO')")
    public ResponseEntity<ApiResponse<CitaResponse>> obtenerPorId(@PathVariable Long id) {
        CitaResponse cita = citaService.obtenerCita(id);
        return ResponseEntity.ok(ApiResponse.success("Cita obtenida correctamente", cita));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN_CLINICA', 'RECEPCIONISTA')")
    public ResponseEntity<ApiResponse<CitaResponse>> crear(@Valid @RequestBody CitaCreateRequest request) {
        CitaResponse cita = citaService.crearCita(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cita agendada correctamente", cita));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN_CLINICA', 'RECEPCIONISTA', 'MEDICO')")
    public ResponseEntity<ApiResponse<CitaResponse>> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CitaUpdateRequest request) {
        CitaResponse cita = citaService.actualizarCita(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cita actualizada correctamente", cita));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ADMIN_CLINICA', 'RECEPCIONISTA', 'MEDICO')")
    public ResponseEntity<ApiResponse<CitaResponse>> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoCitaRequest request) {
        CitaResponse cita = citaService.cambiarEstadoCita(id, request);
        return ResponseEntity.ok(ApiResponse.success("Estado de cita actualizado correctamente", cita));
    }

}

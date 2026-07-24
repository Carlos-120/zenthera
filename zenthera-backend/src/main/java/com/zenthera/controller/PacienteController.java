package com.zenthera.controller;

import com.zenthera.dto.paciente.PacienteListResponse;
import org.springframework.web.bind.annotation.RequestParam;
import com.zenthera.dto.common.ApiResponse;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.paciente.PacienteResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.service.PacienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteController {

        private final PacienteService pacienteService;

        public PacienteController(PacienteService pacienteService) {
                this.pacienteService = pacienteService;
        }

        @PostMapping
        public ResponseEntity<ApiResponse<PacienteResponse>> guardar(
                        @Valid @RequestBody PacienteRequest request) {

                PacienteResponse response = pacienteService.crear(request);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.<PacienteResponse>builder()
                                                .success(true)
                                                .message("Paciente registrado correctamente")
                                                .data(response)
                                                .build());
        }

        @GetMapping
        public List<PacienteListResponse> listar() {
                return pacienteService.listar();
        }

        @GetMapping("/paginado")
        public ResponseEntity<ApiResponse<PageResponse<PacienteListResponse>>> listarPaginado(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                PageResponse<PacienteListResponse> pacientes = pacienteService.listar(page, size);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Pacientes obtenidos correctamente.",
                                                pacientes));
        }

        @GetMapping("/buscar")
        public ResponseEntity<ApiResponse<List<PacienteListResponse>>> buscar(
                        @RequestParam String buscar) {

                List<PacienteListResponse> pacientes = pacienteService.buscar(buscar);

                return ResponseEntity.ok(
                                ApiResponse.success(
                                                "Búsqueda realizada correctamente.",
                                                pacientes));
        }

        @GetMapping("/{id}")
        public PacienteResponse obtenerPorId(@PathVariable Long id) {
                return pacienteService.obtenerPorId(id);
        }

        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<PacienteResponse>> actualizar(
                        @PathVariable Long id,
                        @Valid @RequestBody PacienteRequest request) {

                PacienteResponse response = pacienteService.actualizar(id, request);

                return ResponseEntity.ok(
                                ApiResponse.<PacienteResponse>builder()
                                                .success(true)
                                                .message("Paciente actualizado correctamente")
                                                .data(response)
                                                .build());
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {

                pacienteService.eliminar(id);

                return ResponseEntity.ok(
                                ApiResponse.<Void>builder()
                                                .success(true)
                                                .message("Paciente eliminado correctamente.")
                                                .build());
        }
}

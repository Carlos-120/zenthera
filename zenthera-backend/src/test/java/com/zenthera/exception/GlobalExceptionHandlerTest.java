package com.zenthera.exception;

import com.zenthera.dto.common.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @RestController
    static class DummyController {
        @GetMapping("/test-409-correo")
        public void test409Correo() {
            throw new DataIntegrityViolationException("Error", new Throwable("ERROR: duplicate key value violates unique constraint \"uk_usuario_correo\""));
        }

        @GetMapping("/test-409-ruc")
        public void test409Ruc() {
            throw new DataIntegrityViolationException("Error", new Throwable("ERROR: duplicate key value violates unique constraint \"clinicas_ruc_key\""));
        }

        @GetMapping("/test-409-unknown")
        public void test409Unknown() {
            throw new DataIntegrityViolationException("Error", new Throwable("ERROR: some other constraint"));
        }

        @GetMapping("/test-500")
        public void test500() {
            throw new RuntimeException("Internal DB Error with sensitive info: SELECT * FROM users");
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void whenDataIntegrityViolationWithCorreo_thenConflictHttp() throws Exception {
        mockMvc.perform(get("/test-409-correo").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Ya existe una cuenta con este correo."));
    }

    @Test
    void whenDataIntegrityViolationWithRuc_thenConflictHttp() throws Exception {
        mockMvc.perform(get("/test-409-ruc").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("El RUC proporcionado ya se encuentra registrado."));
    }

    @Test
    void whenDataIntegrityViolationUnknown_thenGenericConflictHttp() throws Exception {
        mockMvc.perform(get("/test-409-unknown").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Conflicto de integridad de datos. El registro ya existe o está en uso."));
    }

    @Test
    void whenGeneralException_thenInternalServerErrorWithoutSensitiveInfo() throws Exception {
        mockMvc.perform(get("/test-500").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Ha ocurrido un error interno. El incidente ha sido registrado."))
                .andExpect(jsonPath("$.errors").isEmpty()); // Verifica que no haya detalles del error expuestos
    }
}

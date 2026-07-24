package com.zenthera;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.dto.auth.ActivationRequest;
import com.zenthera.service.ActivationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ActivationTimeoutTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ActivationService activationService;

    @Test
    void givenDatabaseLockTimeout_whenActivate_thenReturns503AndRetryAfter() throws Exception {
        ActivationRequest request = new ActivationRequest();
        request.setToken("someToken");
        request.setPassword("ValidPassword123!");

        // Simular que la base de datos lanza un error de lock timeout al intentar adquirir el lock pesimista
        doThrow(new PessimisticLockingFailureException("Lock acquisition timeout"))
                .when(activationService).activateAccount(anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/activate")
                .header("Origin", "http://localhost:3000")
                .header("X-Requested-With", "XMLHttpRequest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable()) // 503
                .andExpect(header().string("Retry-After", "5"))
                .andExpect(jsonPath("$.message").value("El servicio se encuentra procesando una solicitud concurrente para este recurso. Por favor, intente de nuevo en unos segundos."));
    }
}

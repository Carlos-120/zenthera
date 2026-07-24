package com.zenthera.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.zenthera.dto.common.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class CsrfAndOriginFilter extends OncePerRequestFilter {

    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getRequestURI();

        // Solo validar peticiones mutables a los endpoints críticos de auth
        if (("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))
                && path.startsWith("/api/v1/auth")) {

            // 1. Validación de Origin estricta (Obligatorio para navegadores)
            String origin = request.getHeader("Origin");
            List<String> allowedOriginsList = Arrays.asList(allowedOrigins);
            if (origin == null || !allowedOriginsList.contains(origin)) {
                rejectRequest(response, "Origen no permitido o ausente (CSRF Protection).");
                return;
            }

            // 2. Validación de Custom Header para peticiones mutables
            // Requerimos que el cliente SPA envíe un header personalizado (mitigación CSRF clásica para APIs)
            String requestedWith = request.getHeader("X-Requested-With");
            if (requestedWith == null || !requestedWith.equals("XMLHttpRequest")) {
                rejectRequest(response, "Falta cabecera de seguridad X-Requested-With (CSRF Protection).");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void rejectRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<Void> apiResponse = ApiResponse.error(message);
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.writeValue(response.getOutputStream(), apiResponse);
    }
}

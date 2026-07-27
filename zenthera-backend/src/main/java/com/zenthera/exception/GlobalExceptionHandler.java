package com.zenthera.exception;

import com.zenthera.dto.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.AuthenticationException;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(
                        IllegalArgumentException ex) {

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message(ex.getMessage())
                                .errors(List.of())
                                .build();

                return ResponseEntity.badRequest().body(response);
        }


        @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(
            ResourceNotFoundException ex) {

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Object>> handleValidationException(
                        MethodArgumentNotValidException ex) {

                List<String> errors = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .map(error -> error.getDefaultMessage())
                                .toList();

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message("Error de validación")
                                .errors(errors)
                                .build();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(response);
        }

        @ExceptionHandler({CannotAcquireLockException.class, PessimisticLockingFailureException.class})
        public ResponseEntity<ApiResponse<Object>> handleLockException(Exception ex) {
                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message("El servicio se encuentra procesando una solicitud concurrente para este recurso. Por favor, intente de nuevo en unos segundos.")
                                .build();

                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.RETRY_AFTER, "5");

                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .headers(headers)
                                .body(response);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolationException(
                        DataIntegrityViolationException ex) {

                String msg = ex.getMostSpecificCause().getMessage();
                String userMessage = "Conflicto de integridad de datos. El registro ya existe o está en uso.";

                if (msg != null) {
                        String msgLower = msg.toLowerCase();
                        if (msgLower.contains("usuarios_correo_key") || msgLower.contains("uk_usuario_correo")) {
                                userMessage = "El correo electrónico proporcionado ya se encuentra registrado por otra cuenta.";
                        } else if (msgLower.contains("clinicas_ruc_key") || msgLower.contains("uk_clinica_ruc")) {
                                userMessage = "El RUC proporcionado ya se encuentra registrado.";
                        }
                }

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message(userMessage)
                                .build();

                return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(response);
        }

        @ExceptionHandler(BusinessRuleException.class)
        public ResponseEntity<ApiResponse<Object>> handleBusinessRuleException(
                        BusinessRuleException ex) {

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message(ex.getMessage())
                                .build();

                return ResponseEntity.status(ex.getStatus())
                                .body(response);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(
                        AuthenticationException ex) {

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message("Credenciales inválidas")
                                .errors(List.of())
                                .build();

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Object>> handleGeneralException(
                        Exception ex) {

                log.error("Unhandled exception: ", ex);

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message("Ha ocurrido un error interno. El incidente ha sido registrado.")
                                .errors(List.of())
                                .build();

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }

        @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(
                        org.springframework.security.access.AccessDeniedException ex) {

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message(ex.getMessage())
                                .build();

                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(response);
        }

}

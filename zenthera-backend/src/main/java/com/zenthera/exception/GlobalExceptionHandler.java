package com.zenthera.exception;

import com.zenthera.dto.common.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
                        IllegalArgumentException ex) {

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.<Void>builder()
                                                .success(false)
                                                .message(ex.getMessage())
                                                .build());
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Void>> handleValidationException(
                        MethodArgumentNotValidException ex) {

                String mensaje = ex.getBindingResult()
                                .getFieldError()
                                .getDefaultMessage();

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.<Void>builder()
                                                .success(false)
                                                .message(mensaje)
                                                .build());
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ApiResponse<Void>> handleConstraintViolationException(
                        ConstraintViolationException ex) {

                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ApiResponse.<Void>builder()
                                                .success(false)
                                                .message(ex.getMessage())
                                                .build());
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(ApiResponse.<Void>builder()
                                                .success(false)
                                                .message("Ha ocurrido un error interno.")
                                                .build());
        }
}
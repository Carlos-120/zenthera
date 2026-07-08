package com.zenthera.exception;

import com.zenthera.dto.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

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

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Object>> handleGeneralException(
                        Exception ex) {

                ApiResponse<Object> response = ApiResponse.<Object>builder()
                                .success(false)
                                .message("Ha ocurrido un error interno.")
                                .errors(List.of(ex.getMessage()))
                                .build();

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(response);
        }

}
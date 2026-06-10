package com.example.{:packagename:}.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/** Translates exceptions from the REST controllers into a stable JSON error shape. */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** {@code message} is for humans, {@code fieldErrors} maps field name to message (422 only). */
    public record ApiError(String message, Map<String, String> fieldErrors) {
    }

    /** Bean validation on a request body failed -> 422 with one message per field. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validationFailed(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.unprocessableEntity().body(new ApiError("Validation failed", fieldErrors));
    }

    /** Business-rule validation (e.g. duplicate customer number) -> same shape as bean validation. */
    @ExceptionHandler(FieldValidationException.class)
    public ResponseEntity<ApiError> fieldValidationFailed(FieldValidationException ex) {
        return ResponseEntity.unprocessableEntity()
                .body(new ApiError("Validation failed", Map.of(ex.getField(), ex.getMessage())));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> authenticationFailed(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError("Invalid username or password", null));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> responseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ApiError(ex.getReason(), null));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> illegalState(IllegalStateException ex) {
        return ResponseEntity.internalServerError().body(new ApiError(ex.getMessage(), null));
    }
}

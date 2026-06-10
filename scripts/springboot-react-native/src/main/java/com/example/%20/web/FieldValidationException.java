package com.example.{:packagename:}.web;

/** A business-rule validation error tied to a single form field (rendered like bean validation). */
public class FieldValidationException extends RuntimeException {

    private final String field;

    public FieldValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}

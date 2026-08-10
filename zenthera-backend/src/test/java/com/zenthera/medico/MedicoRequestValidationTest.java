package com.zenthera.medico;

import com.zenthera.dto.medico.MedicoRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class MedicoRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    private MedicoRequest createValidRequest() {
        MedicoRequest req = new MedicoRequest();
        req.setNombres("Juan");
        req.setApellidos("Perez");
        req.setEspecialidad("Cardiologia");
        return req;
    }

    @Test
    void cedulaVacia_rechazada() {
        MedicoRequest req = createValidRequest();
        req.setCedula("");
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().contains("La identificación es obligatoria") 
                                          || v.getMessage().contains("La identificación debe tener entre 10 y 13 dígitos")
                                          || v.getMessage().contains("La identificación debe contener solo números"));
    }

    @Test
    void cedulaMenorA10_rechazada() {
        MedicoRequest req = createValidRequest();
        req.setCedula("123456789"); // 9 chars
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().equals("La identificación debe tener entre 10 y 13 dígitos."));
    }

    @Test
    void cedulaMayorA13_rechazada() {
        MedicoRequest req = createValidRequest();
        req.setCedula("12345678901234"); // 14 chars
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().equals("La identificación debe tener entre 10 y 13 dígitos."));
    }

    @Test
    void cedulaConLetras_rechazada() {
        MedicoRequest req = createValidRequest();
        req.setCedula("12345ABCDE"); // 10 chars, but has letters
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().equals("La identificación debe contener solo números."));
    }

    @Test
    void cedulaOriginalManual_aceptada() {
        MedicoRequest req = createValidRequest();
        req.setCedula("1851077729"); // 10 chars, numbers only
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        
        // Assert no violations related to cedula
        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("cedula"));
    }

    @Test
    void nombresValidos_aceptados() {
        MedicoRequest req = createValidRequest();
        req.setNombres("Juan Carlos");
        req.setApellidos("Muñoz Pérez");
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).noneMatch(v -> v.getPropertyPath().toString().equals("nombres") || v.getPropertyPath().toString().equals("apellidos"));
    }

    @Test
    void nombresConNumeros_rechazados() {
        MedicoRequest req = createValidRequest();
        req.setNombres("Juan123");
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Los nombres solo pueden contener letras, espacios y acentos"));
    }

    @Test
    void apellidosConNumeros_rechazados() {
        MedicoRequest req = createValidRequest();
        req.setApellidos("Pérez99");
        Set<ConstraintViolation<MedicoRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Los apellidos solo pueden contener letras, espacios y acentos"));
    }
}

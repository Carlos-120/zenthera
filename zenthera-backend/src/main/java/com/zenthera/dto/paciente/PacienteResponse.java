package com.zenthera.dto.paciente;

import com.zenthera.enums.Sexo;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class PacienteResponse {

    private Long id;



    private String cedula;

    private String nombres;

    private String apellidos;

    private LocalDate fechaNacimiento;

    private Sexo sexo;

    private String telefono;

    private String correo;

    private String direccion;

    private String tipoSangre;

    private String alergias;

    private String contactoEmergencia;

    private String telefonoEmergencia;

    private Boolean activo;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}

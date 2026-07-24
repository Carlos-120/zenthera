package com.zenthera.bootstrap.initializer;

import com.zenthera.entity.Clinica;
import com.zenthera.repository.ClinicaRepository;
import org.springframework.stereotype.Component;

@Component
public class ClinicaInitializer {

    private final ClinicaRepository clinicaRepository;

    public ClinicaInitializer(ClinicaRepository clinicaRepository) {
        this.clinicaRepository = clinicaRepository;
    }

    public void initialize() {

        if (clinicaRepository.findByRuc("9999999999001").isPresent()) {
            return;
        }

        Clinica clinica = new Clinica();

        clinica.setNombre("Clínica del Sistema");
        clinica.setRuc("9999999999001");
        clinica.setRazonSocial("Zenthera System");
        clinica.setZonaHoraria("America/Guayaquil");
        clinica.setTelefono("0000000000");
        clinica.setCorreo("system@zenthera.com");
        clinica.setDireccion("Sistema");
        clinica.setCiudad("Pelileo");
        clinica.setProvincia("Tungurahua");
        clinica.setPais("Ecuador");
        clinica.setActiva(true);

        clinicaRepository.save(clinica);

        System.out.println("✔ Clínica del sistema creada.");

    }

}

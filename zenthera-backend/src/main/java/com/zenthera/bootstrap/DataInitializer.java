package com.zenthera.bootstrap;

import com.zenthera.bootstrap.initializer.ClinicaInitializer;
import com.zenthera.bootstrap.initializer.RolInitializer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RolInitializer rolInitializer;
    private final ClinicaInitializer clinicaInitializer;

    public DataInitializer(
            RolInitializer rolInitializer,
            ClinicaInitializer clinicaInitializer) {

        this.rolInitializer = rolInitializer;
        this.clinicaInitializer = clinicaInitializer;
    }

    @Override
    public void run(String... args) {

        System.out.println("====================================");
        System.out.println("   ZENTHERA SYSTEM INITIALIZATION   ");
        System.out.println("====================================");

        rolInitializer.initialize();
        clinicaInitializer.initialize();

    }
}
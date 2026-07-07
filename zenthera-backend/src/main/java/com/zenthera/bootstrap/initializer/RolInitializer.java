package com.zenthera.bootstrap.initializer;

import com.zenthera.entity.Rol;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.RolRepository;
import org.springframework.stereotype.Component;

@Component
public class RolInitializer {

    private final RolRepository rolRepository;

    public RolInitializer(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public void initialize() {

        crearRolSiNoExiste(
                RolNombre.SUPER_ADMIN,
                "Administrador General del Sistema"
        );

        crearRolSiNoExiste(
                RolNombre.ADMIN_CLINICA,
                "Administrador de la Clínica"
        );

        crearRolSiNoExiste(
                RolNombre.MEDICO,
                "Médico"
        );

        crearRolSiNoExiste(
                RolNombre.RECEPCIONISTA,
                "Recepcionista"
        );

        System.out.println("✔ Roles inicializados.");

    }

    private void crearRolSiNoExiste(RolNombre nombre, String descripcion) {

        if (rolRepository.findByNombre(nombre).isPresent()) {
            return;
        }

        Rol rol = new Rol();
        rol.setNombre(nombre);
        rol.setDescripcion(descripcion);

        rolRepository.save(rol);

        System.out.println("Rol creado: " + nombre);

    }

}
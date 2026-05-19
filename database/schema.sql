-- 1. Crear la base de datos y usarla
CREATE DATABASE IF NOT EXISTS eventmaster_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE eventmaster_db;

-- 2. Tabla de Organizadores (Usuarios del panel)
CREATE TABLE Organizadores (
    id_organizador INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 3. Tabla de Eventos
CREATE TABLE Eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_organizador INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    lugar VARCHAR(150) NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    vestimenta VARCHAR(50) NOT NULL,
    titulo_invitacion VARCHAR(100),
    mensaje_invitacion TEXT,
    FOREIGN KEY (id_organizador) REFERENCES Organizadores(id_organizador) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Tabla de Menús (Platillos dinámicos)
CREATE TABLE Menus (
    id_menu INT AUTO_INCREMENT PRIMARY KEY,
    id_evento INT NOT NULL,
    nombre_platillo VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_evento) REFERENCES Eventos(id_evento) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabla de Mesas (Para el acomodo Drag & Drop)
CREATE TABLE Mesas (
    id_mesa INT AUTO_INCREMENT PRIMARY KEY,
    id_evento INT NOT NULL,
    numero_mesa INT NOT NULL,
    capacidad_maxima INT NOT NULL DEFAULT 8,
    FOREIGN KEY (id_evento) REFERENCES Eventos(id_evento) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabla de Invitados (Incluye principales y acompañantes)
CREATE TABLE Invitados (
    id_invitado INT AUTO_INCREMENT PRIMARY KEY,
    id_evento INT NOT NULL,
    id_menu INT NULL,           -- Puede ser nulo si no han escogido comida
    id_mesa INT NULL,           -- Puede ser nulo si están en "Sin Asignar"
    nombre_completo VARCHAR(150) NOT NULL,
    tipo_invitado ENUM('Principal', 'Acompañante') NOT NULL DEFAULT 'Principal',
    id_invitado_principal INT NULL, -- Llave foránea a esta misma tabla (Para agrupar familias)
    FOREIGN KEY (id_evento) REFERENCES Eventos(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_menu) REFERENCES Menus(id_menu) ON DELETE SET NULL,
    FOREIGN KEY (id_mesa) REFERENCES Mesas(id_mesa) ON DELETE SET NULL,
    FOREIGN KEY (id_invitado_principal) REFERENCES Invitados(id_invitado) ON DELETE CASCADE
) ENGINE=InnoDB;



SELECT * FROM mesas;
SELECT * FROM eventos;
SELECT * FROM menus;
SELECT * FROM invitados;
SELECT * FROM organizadores;
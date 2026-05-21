CREATE DATABASE IF NOT EXISTS `eventmaster` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `eventmaster`;
-- ========================================================
-- TABLAS INDEPENDIENTES Y CATÁLOGOS
-- ========================================================

CREATE TABLE IF NOT EXISTS `organizadores` (
  `id_organizador` INT AUTO_INCREMENT NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_organizador`),
  UNIQUE (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tipos_evento` (
  `id_tipo_evento` INT AUTO_INCREMENT NOT NULL,
  `nombre_tipo` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_tipo_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tipos_vestimenta` (
  `id_tipo_vestimenta` INT AUTO_INCREMENT NOT NULL,
  `nombre_vestimenta` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_tipo_vestimenta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tipos_invitado` (
  `id_tipo_invitado` INT AUTO_INCREMENT NOT NULL,
  `nombre_tipo` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_tipo_invitado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- TABLA PRINCIPAL: EVENTOS
-- ========================================================

CREATE TABLE IF NOT EXISTS `eventos` (
  `id_evento` INT AUTO_INCREMENT NOT NULL,
  `id_organizador` INT NOT NULL,
  `id_tipo_evento` INT NULL,
  `id_tipo_vestimenta` INT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `lugar` VARCHAR(150) NOT NULL,
  `titulo_invitacion` VARCHAR(100) NULL,
  `mensaje_invitacion` TEXT NULL,
  PRIMARY KEY (`id_evento`),
  FOREIGN KEY (`id_organizador`) REFERENCES `organizadores` (`id_organizador`) ON DELETE CASCADE,
  FOREIGN KEY (`id_tipo_evento`) REFERENCES `tipos_evento` (`id_tipo_evento`) ON DELETE SET NULL,
  FOREIGN KEY (`id_tipo_vestimenta`) REFERENCES `tipos_vestimenta` (`id_tipo_vestimenta`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- TABLAS DEPENDIENTES DE EVENTOS: MENÚS Y MESAS
-- ========================================================

CREATE TABLE IF NOT EXISTS `menus` (
  `id_menu` INT AUTO_INCREMENT NOT NULL,
  `id_evento` INT NOT NULL,
  `nombre_platillo` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_menu`),
  FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mesas` (
  `id_mesa` INT AUTO_INCREMENT NOT NULL,
  `id_evento` INT NOT NULL,
  `numero_mesa` INT NOT NULL,
  `capacidad_maxima` INT NOT NULL,
  PRIMARY KEY (`id_mesa`),
  FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- TABLA: INVITADOS
-- ========================================================

CREATE TABLE IF NOT EXISTS `invitados` (
  `id_invitado` INT AUTO_INCREMENT NOT NULL,
  `id_evento` INT NOT NULL,
  `id_menu` INT NULL,
  `id_mesa` INT NULL,
  `id_tipo_invitado` INT NULL,
  `nombre_completo` VARCHAR(150) NOT NULL,
  `id_invitado_principal` INT NULL,
  PRIMARY KEY (`id_invitado`),
  FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`) ON DELETE CASCADE,
  FOREIGN KEY (`id_menu`) REFERENCES `menus` (`id_menu`) ON DELETE SET NULL,
  FOREIGN KEY (`id_mesa`) REFERENCES `mesas` (`id_mesa`) ON DELETE SET NULL,
  FOREIGN KEY (`id_tipo_invitado`) REFERENCES `tipos_invitado` (`id_tipo_invitado`) ON DELETE SET NULL,
  FOREIGN KEY (`id_invitado_principal`) REFERENCES `invitados` (`id_invitado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


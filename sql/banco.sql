CREATE DATABASE IF NOT EXISTS banco;
USE banco;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    estado_civil VARCHAR(50),
    tipo_cuenta ENUM('Ahorros', 'Corriente'),
    cedula VARCHAR(20) UNIQUE,
    usuario_id VARCHAR(50) UNIQUE
);

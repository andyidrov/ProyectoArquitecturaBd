CREATE DATABASE IF NOT EXISTS banco;
USE banco;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    estado_civil VARCHAR(50) NOT NULL,
    tipo_cuenta ENUM('Ahorros', 'Corriente') NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL, -- mejor llamarlo usuario en vez usuario_id
    password VARCHAR(255) NOT NULL,      -- campo para contraseña (hash)
    saldo DECIMAL(10,2) DEFAULT 0        -- saldo para simular transacciones
);

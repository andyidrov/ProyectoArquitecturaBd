const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models/db');

// Registro de usuario
router.post('/registro', async (req, res) => {
  const {
    nombre,
    apellido,
    fecha_nacimiento,
    estado_civil,
    tipo_cuenta,
    cedula,
    usuario,
    correo,
    password
  } = req.body;

  // Validación de campos vacíos
  if (
    !nombre || !apellido || !fecha_nacimiento ||
    !estado_civil || !tipo_cuenta || !cedula ||
    !usuario || !correo || !password
  ) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // Validación de cédula (exactamente 10 dígitos numéricos)
  if (!/^\d{10}$/.test(cedula)) {
    return res.status(400).json({ error: 'La cédula debe tener exactamente 10 dígitos numéricos.' });
  }

  // Validación de formato de correo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido.' });
  }

  try {
    // Verificar si ya existe el usuario, cédula o correo
    const [existe] = await db.query(
      'SELECT id FROM usuarios WHERE usuario = ? OR cedula = ? OR correo = ?',
      [usuario, cedula, correo]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Usuario, cédula o correo ya registrados.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar en la base de datos
    await db.query(
      `INSERT INTO usuarios
        (nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, hashedPassword]
    );

    res.status(201).json({ message: '✅ Usuario registrado con éxito.' });
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    res.status(200).json({ message: '✅ Inicio de sesión exitoso', usuario: user.usuario });
  } catch (err) {
    console.error('❌ Error en /login:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

module.exports = router;

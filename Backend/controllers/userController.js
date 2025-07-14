const db = require('../models/db');
const bcrypt = require('bcryptjs');

// 🧾 Registro de usuario
const registerUser = async (req, res) => {
  try {
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

    if (
      !nombre || !apellido || !fecha_nacimiento ||
      !estado_civil || !tipo_cuenta || !cedula ||
      !usuario || !correo || !password
    ) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (!/^\d{10}$/.test(cedula)) {
      return res.status(400).json({ error: 'La cédula debe tener exactamente 10 dígitos numéricos' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }

    const [userExists] = await db.query(
      'SELECT id FROM usuarios WHERE usuario = ? OR cedula = ? OR correo = ?',
      [usuario, cedula, correo]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Usuario, cédula o correo ya registrados' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO usuarios
      (nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, hashedPassword]
    );

    res.status(201).json({ message: '✅ Usuario registrado con éxito' });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.message);
    if (err.sqlMessage) console.error('🛑 MySQL Error:', err.sqlMessage);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
};

// 🔐 Login
const loginUser = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.status(200).json({ message: '✅ Inicio de sesión exitoso', usuario: user.usuario });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

// ✅ REMOVED: handleTransfer function - Now handled in routes/transaccion.js

module.exports = {
  registerUser,
  loginUser
  // handleTransfer removed - using routes/transaccion.js instead
};

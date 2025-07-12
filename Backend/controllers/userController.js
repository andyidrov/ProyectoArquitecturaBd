const db = require('../models/db');
const bcrypt = require('bcrypt');

// Registro
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

    // Validar campos obligatorios
    if (
      !nombre || !apellido || !fecha_nacimiento ||
      !estado_civil || !tipo_cuenta || !cedula ||
      !usuario || !correo || !password
    ) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validar cédula
    if (!/^\d{10}$/.test(cedula)) {
      return res.status(400).json({ error: 'La cédula debe tener exactamente 10 dígitos numéricos' });
    }

    // Validar correo con regex simple
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }

    // Verificar unicidad usuario, cédula y correo
    const [userExists] = await db.query(
      'SELECT id FROM usuarios WHERE usuario = ? OR cedula = ? OR correo = ?',
      [usuario, cedula, correo]
    );
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'Usuario, cédula o correo ya registrados' });
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    await db.query(
      `INSERT INTO usuarios
      (nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, correo, hashedPassword]
    );

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.message);
    if (err.sqlMessage) console.error('🛑 MySQL Error:', err.sqlMessage);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: user.usuario });
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

// Transacciones
const handleTransfer = async (req, res) => {
  try {
    const { usuario, tipo, monto } = req.body;
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return res.status(400).json({ error: 'Monto inválido' });

    const conn = await db.getConnection();
    await conn.beginTransaction();

    const [userRows] = await conn.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    if (userRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRows[0];
    let nuevoSaldo = parseFloat(user.saldo || 0);

    if (tipo === 'deposito') nuevoSaldo += montoNum;
    else if (tipo === 'retiro') {
      if (montoNum > nuevoSaldo) {
        await conn.rollback();
        return res.status(400).json({ error: 'Fondos insuficientes' });
      }
      nuevoSaldo -= montoNum;
    } else {
      await conn.rollback();
      return res.status(400).json({ error: 'Tipo de transacción inválido' });
    }

    await conn.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldo, user.id]);
    await conn.query('INSERT INTO transacciones (usuario_id, tipo, monto) VALUES (?, ?, ?)', [user.id, tipo, montoNum]);

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Transacción exitosa', nuevoSaldo });
  } catch (err) {
    console.error('❌ Error en la transacción:', err);
    res.status(500).json({ error: 'Error interno en la transacción' });
  }
};

module.exports = { registerUser, loginUser, handleTransfer };

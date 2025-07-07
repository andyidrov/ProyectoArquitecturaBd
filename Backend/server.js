const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ============== REGISTRO DE USUARIO ==============
app.post('/api/register', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, password } = req.body;

  if (!nombre || !apellido || !fecha_nacimiento || !estado_civil || !tipo_cuenta || !cedula || !usuario || !password) {
    return res.status(400).json({ message: 'Faltan datos para el registro' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, password, saldo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario, hashedPassword, 0]
    );

    console.log(`✅ Nuevo usuario creado: ${usuario} (ID: ${result.insertId})`);
    res.json({ message: 'Usuario registrado exitosamente', id: result.insertId });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.warn('⚠ Usuario o cédula duplicados');
      res.status(409).json({ message: 'Usuario o cédula ya existen' });
    } else {
      console.error('❌ Error interno al registrar:', err);
      res.status(500).json({ message: 'Error interno al registrar' });
    }
  }
});

// ============== LOGIN DE USUARIO ==============
app.post('/api/login', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ message: 'Faltan datos para el login' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

    if (rows.length === 0) {
      console.warn(`⚠ Usuario no encontrado: ${usuario}`);
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn(`⚠ Contraseña incorrecta para usuario: ${usuario}`);
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    console.log(`✅ Login exitoso para usuario: ${usuario}`);
    res.json({
      message: 'Login exitoso',
      user: { id: user.id, nombre: user.nombre, saldo: user.saldo }
    });

  } catch (err) {
    console.error('❌ Error interno en login:', err);
    res.status(500).json({ message: 'Error interno en login' });
  }
});

// ============== TRANSFERENCIAS (Depositos y Retiros) ==============
app.post('/api/transfer', async (req, res) => {
  const { usuario_id, tipo, monto } = req.body;

  if (!usuario_id || !tipo || !monto) {
    return res.status(400).json({ message: 'Faltan datos para la transacción' });
  }

  if (!['deposito', 'retiro'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de transacción inválido' });
  }

  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT saldo FROM usuarios WHERE id = ?', [usuario_id]);

    if (rows.length === 0) {
      await conn.rollback();
      conn.release();
      console.warn(`⚠ Usuario no encontrado para transacción (ID: ${usuario_id})`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let saldo = parseFloat(rows[0].saldo);
    const montoNum = parseFloat(monto);

    if (tipo === 'retiro' && saldo < montoNum) {
      await conn.rollback();
      conn.release();
      console.warn(`⚠ Saldo insuficiente: intento de retiro de $${montoNum} con saldo $${saldo}`);
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    saldo = tipo === 'deposito' ? saldo + montoNum : saldo - montoNum;

    await conn.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [saldo, usuario_id]);
    await conn.query('INSERT INTO transacciones (usuario_id, tipo, monto) VALUES (?, ?, ?)', [usuario_id, tipo, montoNum]);

    await conn.commit();
    conn.release();

    console.log(`✅ Transacción ${tipo} por $${montoNum} completada. Nuevo saldo: $${saldo}`);
    res.json({ message: 'Transacción exitosa', saldo });

  } catch (err) {
    console.error('❌ Error interno en transacción:', err);
    res.status(500).json({ message: 'Error interno en transacción' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});

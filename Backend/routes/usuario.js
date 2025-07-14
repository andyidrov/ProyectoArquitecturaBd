const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { registerUser, loginUser, updateUser } = require('../controllers/userController'); // AGREGADO: Importar controladores

// 🧾 POST /api/registro - Registro de usuario (usando controlador)
router.post('/registro', registerUser);

// 🔐 POST /api/login - Login de usuario (usando controlador)
router.post('/login', loginUser);

// 🔄 PUT /api/usuario - Actualizar usuario (NUEVA RUTA)
router.put('/usuario', updateUser);

// 🔍 GET /api/usuarios - Lista básica de usuarios con su saldo
router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, usuario, nombre, saldo FROM usuarios');
    res.status(200).json(usuarios);
  } catch (err) {
    console.error('❌ Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error interno al obtener la lista de usuarios.' });
  }
});

// 💰 GET /api/saldo/:usuario - Saldo actual de un usuario específico
router.get('/saldo/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Falta el nombre de usuario en la URL.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT nombre, saldo FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { nombre, saldo } = rows[0];
    res.status(200).json({ usuario, nombre, saldo });
  } catch (err) {
    console.error('❌ Error al obtener saldo:', err);
    res.status(500).json({ error: 'Error interno al consultar el saldo.' });
  }
});

// ✅ GET /api/historial-completo/:usuario - Todas las transacciones
router.get('/historial-completo/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido.' });
  }

  try {
    const [historial] = await db.query(`
      SELECT t.id, t.tipo, t.monto, t.fecha, t.descripcion, u.usuario, u.nombre
      FROM transacciones t
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE u.usuario = ?
      ORDER BY t.fecha DESC
    `, [usuario]);

    // Separar por tipo para el frontend
    const transacciones = historial.filter(t => ['deposito', 'retiro'].includes(t.tipo));
    const transferencias = historial.filter(t => ['transferencia_envio', 'transferencia_recibo'].includes(t.tipo));

    res.status(200).json({ 
      historial_completo: historial,
      transacciones,
      transferencias,
      totales: {
        total: historial.length,
        transacciones: transacciones.length,
        transferencias: transferencias.length
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener historial completo:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

module.exports = router;
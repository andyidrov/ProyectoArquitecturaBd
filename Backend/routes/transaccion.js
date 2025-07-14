
// ====== AGREGAR A transaccion.js ======
const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Ruta POST para transferencias (YA EXISTE)
router.post('/transaccion', async (req, res) => {
  // ... tu código existente ...
});

// ✅ NUEVO: GET /api/transacciones/:usuario - Solo depósitos y retiros
router.get('/transacciones/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido.' });
  }

  try {
    const [transacciones] = await db.query(`
      SELECT t.id, t.tipo, t.monto, t.fecha, t.descripcion, u.usuario, u.nombre
      FROM transacciones t
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE u.usuario = ? AND t.tipo IN ('deposito', 'retiro')
      ORDER BY t.fecha DESC
    `, [usuario]);

    res.status(200).json({ 
      transacciones,
      total: transacciones.length
    });
  } catch (error) {
    console.error('❌ Error al obtener historial de transacciones:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

module.exports = router;
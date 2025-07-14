const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ✅ POST /api/transaccion - depósitos o retiros
router.post('/transaccion', async (req, res) => {
  const { tipo, monto, usuario } = req.body;

  // Validación básica
  if (!tipo || isNaN(monto) || monto <= 0 || !usuario) {
    console.log('❌ Datos incompletos o inválidos:', req.body);
    return res.status(400).json({ error: 'Datos incompletos o inválidos.' });
  }

  try {
    console.log('🚀 Registrando transacción:', { tipo, monto, usuario });

    // Insertar transacción
    await db.query(`
      INSERT INTO transacciones (usuario_id, tipo, monto, fecha, descripcion)
      VALUES ((SELECT id FROM usuarios WHERE usuario = ?), ?, ?, NOW(), ?)
    `, [usuario, tipo, monto, `Transacción de ${tipo}`]);

    console.log('✅ Transacción insertada correctamente');
    return res.status(200).json({ message: `Transacción de ${tipo} realizada exitosamente.` });

  } catch (err) {
    console.error('❌ Error en POST /transaccion:', err);
    return res.status(500).json({ error: 'Error interno al procesar transacción.' });
  }
});

// ✅ GET /api/transacciones/:usuario - Solo depósitos y retiros
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

    return res.status(200).json({ 
      transacciones,
      total: transacciones.length
    });

  } catch (error) {
    console.error('❌ Error al obtener historial de transacciones:', error);
    return res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

module.exports = router;

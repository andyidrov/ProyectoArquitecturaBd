const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Ruta POST para transferencias (YA EXISTE)
router.post('/transferencia', async (req, res) => {
  // ... tu código existente ...
});

// ✅ NUEVO: GET /api/transferencias/:usuario - Solo transferencias enviadas y recibidas
router.get('/transferencias/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido.' });
  }

  try {
    const [transferencias] = await db.query(`
      SELECT t.id, t.tipo, t.monto, t.fecha, t.descripcion, u.usuario, u.nombre
      FROM transacciones t
      JOIN usuarios u ON t.usuario_id = u.id
      WHERE u.usuario = ? AND t.tipo IN ('transferencia_envio', 'transferencia_recibo')
      ORDER BY t.fecha DESC
    `, [usuario]);

    res.status(200).json({ 
      transferencias,
      total: transferencias.length
    });
  } catch (error) {
    console.error('❌ Error al obtener historial de transferencias:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

// ✅ NUEVO: GET /api/transferencias-detalle/:usuario - Información más detallada
router.get('/transferencias-detalle/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido.' });
  }

  try {
    // Consulta más detallada que incluye información de la tabla transferencias
    const [transferencias] = await db.query(`
      SELECT 
        tr.id as transfer_id,
        tr.monto,
        tr.fecha,
        u_remitente.usuario as remitente,
        u_remitente.nombre as nombre_remitente,
        u_destinatario.usuario as destinatario,
        u_destinatario.nombre as nombre_destinatario,
        CASE 
          WHEN u_remitente.usuario = ? THEN 'enviada'
          ELSE 'recibida'
        END as tipo_transferencia
      FROM transferencias tr
      JOIN usuarios u_remitente ON tr.remitente_id = u_remitente.id
      JOIN usuarios u_destinatario ON tr.destinatario_id = u_destinatario.id
      WHERE u_remitente.usuario = ? OR u_destinatario.usuario = ?
      ORDER BY tr.fecha DESC
    `, [usuario, usuario, usuario]);

    res.status(200).json({ 
      transferencias,
      total: transferencias.length
    });
  } catch (error) {
    console.error('❌ Error al obtener historial detallado de transferencias:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

module.exports = router;
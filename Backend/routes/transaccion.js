const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ✅ POST /api/transferencia - SOLO guarda en tabla 'transferencias', NO en 'transacciones'
router.post('/transferencia', async (req, res) => {
  const { usuario_origen, usuario_destino, monto } = req.body;

  // Validación básica
  if (!usuario_origen || !usuario_destino || isNaN(monto) || monto <= 0) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos.' });
  }

  if (usuario_origen === usuario_destino) {
    return res.status(400).json({ error: 'No puedes transferir a ti mismo.' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Obtener datos del usuario origen
    const [origenRows] = await conn.query('SELECT id, saldo FROM usuarios WHERE usuario = ?', [usuario_origen]);
    if (origenRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Usuario origen no encontrado.' });
    }

    // 2. Obtener datos del usuario destino
    const [destinoRows] = await conn.query('SELECT id, saldo FROM usuarios WHERE usuario = ?', [usuario_destino]);
    if (destinoRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ error: 'Usuario destino no encontrado.' });
    }

    const userOrigen = origenRows[0];
    const userDestino = destinoRows[0];
    const saldoOrigen = parseFloat(userOrigen.saldo || 0);
    const saldoDestino = parseFloat(userDestino.saldo || 0);
    const montoTransferencia = parseFloat(monto);

    // 3. Verificar fondos suficientes
    if (montoTransferencia > saldoOrigen) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ error: 'Fondos insuficientes para la transferencia.' });
    }

    // 4. Actualizar saldos
    const nuevoSaldoOrigen = saldoOrigen - montoTransferencia;
    const nuevoSaldoDestino = saldoDestino + montoTransferencia;

    await conn.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldoOrigen, userOrigen.id]);
    await conn.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldoDestino, userDestino.id]);

    // 5. ✅ IMPORTANTE: Solo guardar en tabla 'transferencias', NO en 'transacciones'
    await conn.query(`
      INSERT INTO transferencias (remitente_id, destinatario_id, monto, fecha)
      VALUES (?, ?, ?, NOW())
    `, [userOrigen.id, userDestino.id, montoTransferencia]);

    // 6. Confirmar transacción
    await conn.commit();
    conn.release();

    console.log('✅ Transferencia completada exitosamente');
    return res.status(200).json({ 
      message: `Transferencia de $${montoTransferencia} realizada exitosamente de ${usuario_origen} a ${usuario_destino}.`,
      saldo_origen_anterior: saldoOrigen,
      saldo_origen_nuevo: nuevoSaldoOrigen,
      saldo_destino_anterior: saldoDestino,
      saldo_destino_nuevo: nuevoSaldoDestino
    });

  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('❌ Error en POST /transferencia:', err);
    return res.status(500).json({ error: 'Error interno al procesar transferencia.' });
  }
});

// ✅ GET /api/transferencias/:usuario - Solo transferencias enviadas y recibidas
router.get('/transferencias/:usuario', async (req, res) => {
  const usuario = req.params.usuario;

  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido.' });
  }

  try {
    const [transferencias] = await db.query(`
      SELECT 
        tr.id,
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
    console.error('❌ Error al obtener historial de transferencias:', error);
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
});

// ✅ GET /api/transferencias-detalle/:usuario - Información más detallada
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
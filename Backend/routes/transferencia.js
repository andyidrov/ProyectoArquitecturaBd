const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/transferencia', async (req, res) => {
  const { usuario_origen, usuario_destino, monto } = req.body;

  if (!usuario_origen || !usuario_destino || !monto || isNaN(monto) || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Datos inválidos para la transferencia.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[origen]] = await conn.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario_origen]);
    if (!origen) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario origen no encontrado.' });
    }

    const [[destino]] = await conn.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario_destino]);
    if (!destino) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario destino no encontrado.' });
    }

    const montoNum = parseFloat(monto);
    if (origen.saldo < montoNum) {
      await conn.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente.' });
    }

    // Actualiza saldos
    await conn.query('UPDATE usuarios SET saldo = saldo - ? WHERE id = ?', [montoNum, origen.id]);
    await conn.query('UPDATE usuarios SET saldo = saldo + ? WHERE id = ?', [montoNum, destino.id]);

    // Inserta en transferencias
    await conn.query(
      'INSERT INTO transferencias (remitente_id, destinatario_id, monto) VALUES (?, ?, ?)',
      [origen.id, destino.id, montoNum]
    );

    // Inserta en transacciones
    await conn.query(
      'INSERT INTO transacciones (usuario_id, tipo, monto, descripcion) VALUES (?, ?, ?, ?)',
      [origen.id, 'transferencia_envio', montoNum, `Transferencia enviada a ${usuario_destino}`]
    );
    await conn.query(
      'INSERT INTO transacciones (usuario_id, tipo, monto, descripcion) VALUES (?, ?, ?, ?)',
      [destino.id, 'transferencia_recibo', montoNum, `Transferencia recibida de ${usuario_origen}`]
    );

    await conn.commit();
    conn.release();

    return res.status(200).json({
      message: `✅ Transferencia de $${montoNum.toFixed(2)} realizada con éxito.`
    });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('❌ Error en la transferencia:', error);
    return res.status(500).json({ error: 'Error interno en la transferencia.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Ruta POST para transferencias
router.post('/transaccion', async (req, res) => {
  const { usuario, tipo, monto } = req.body;

  if (!usuario || !tipo || !monto || isNaN(monto)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos.' });
  }

  try {
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = usuarios[0];
    const userId = user.id;
    let nuevoSaldo = parseFloat(user.saldo);

    if (tipo === 'deposito') {
      nuevoSaldo += parseFloat(monto);
      await db.query('INSERT INTO transacciones (usuario_id, tipo, monto) VALUES (?, ?, ?)', [userId, tipo, monto]);
      await db.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldo, userId]);
      return res.status(200).json({ message: `✅ Depositaste $${parseFloat(monto).toFixed(2)}` });
    }

    if (tipo === 'retiro') {
      if (parseFloat(monto) > user.saldo) {
        return res.status(400).json({ error: '❌ Saldo insuficiente.' });
      }

      nuevoSaldo -= parseFloat(monto);
      await db.query('INSERT INTO transacciones (usuario_id, tipo, monto) VALUES (?, ?, ?)', [userId, tipo, monto]);
      await db.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldo, userId]);
      return res.status(200).json({ message: `💰 Tu saldo disponible es $${nuevoSaldo.toFixed(2)}` });
    }

    return res.status(400).json({ error: 'Tipo de transacción no válido.' });
  } catch (error) {
    console.error('❌ Error al procesar la transacción:', error);
    res.status(500).json({ error: 'Error interno en la transacción.' });
  }
});

// ✅ Exporta el router directamente
module.exports = router;

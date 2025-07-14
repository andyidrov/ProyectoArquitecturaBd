const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ✅ POST /api/transaccion - Para depósitos y retiros (NUEVA RUTA)
router.post('/transaccion', async (req, res) => {
  const { tipo, monto, usuario } = req.body;

  // Validación básica
  if (!tipo || !monto || !usuario) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (isNaN(monto) || monto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a cero.' });
  }

  if (!['deposito', 'retiro'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de transacción inválido.' });
  }

  try {
    // Obtener el usuario y su saldo actual
    const [userRows] = await db.query('SELECT id, saldo FROM usuarios WHERE usuario = ?', [usuario]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = userRows[0];
    const saldoActual = parseFloat(user.saldo || 0);
    const montoTransaccion = parseFloat(monto);
    let nuevoSaldo;

    // Calcular nuevo saldo según el tipo de transacción
    if (tipo === 'deposito') {
      nuevoSaldo = saldoActual + montoTransaccion;
    } else if (tipo === 'retiro') {
      if (montoTransaccion > saldoActual) {
        return res.status(400).json({ error: 'Fondos insuficientes para el retiro.' });
      }
      nuevoSaldo = saldoActual - montoTransaccion;
    }

    // Actualizar saldo del usuario
    await db.query('UPDATE usuarios SET saldo = ? WHERE id = ?', [nuevoSaldo, user.id]);

    // Registrar la transacción en la tabla transacciones
    await db.query(
      'INSERT INTO transacciones (usuario_id, tipo, monto, descripcion, fecha) VALUES (?, ?, ?, ?, NOW())',
      [user.id, tipo, montoTransaccion, `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} de $${montoTransaccion}`]
    );

    res.status(200).json({
      message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} de $${montoTransaccion} realizado exitosamente.`,
      saldo_anterior: saldoActual,
      saldo_nuevo: nuevoSaldo,
      tipo: tipo,
      monto: montoTransaccion
    });

  } catch (error) {
    console.error('❌ Error en POST /transaccion:', error);
    res.status(500).json({ error: 'Error interno al procesar la transacción.' });
  }
});
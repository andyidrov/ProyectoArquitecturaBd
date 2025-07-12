const express = require('express');
const router = express.Router();
const db = require('../models/db');

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

module.exports = router;



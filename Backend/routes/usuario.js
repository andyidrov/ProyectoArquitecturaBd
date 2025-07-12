const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/usuarios - lista básica de usuarios con saldo
router.get('/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, usuario, nombre, saldo FROM usuarios');
    res.status(200).json(usuarios);
  } catch (err) {
    console.error('❌ Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error interno al obtener usuarios.' });
  }
});

// GET /api/saldo/:usuario - saldo actual del usuario
router.get('/saldo/:usuario', async (req, res) => {
  const usuario = req.params.usuario;
  try {
    const [rows] = await db.query('SELECT nombre, saldo FROM usuarios WHERE usuario = ?', [usuario]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.status(200).json({ usuario, nombre: rows[0].nombre, saldo: rows[0].saldo });
  } catch (err) {
    console.error('❌ Error al obtener saldo:', err);
    res.status(500).json({ error: 'Error interno al obtener saldo.' });
  }
});

module.exports = router;


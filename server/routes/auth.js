const express = require('express');
const router = express.Router();
const db = require('../models/db');
const crypto = require('crypto');

router.post('/register', (req, res) => {
    const { nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula } = req.body;
    const usuario_id = crypto.randomBytes(8).toString('hex');
    db.query('INSERT INTO usuarios (nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellido, fecha_nacimiento, estado_civil, tipo_cuenta, cedula, usuario_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Usuario registrado", usuario_id });
        });
});

router.post('/login', (req, res) => {
    const { cedula } = req.body;
    db.query('SELECT * FROM usuarios WHERE cedula = ?', [cedula], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(401).json({ message: "No encontrado" });
        res.json({ message: "Login exitoso", user: results[0] });
    });
});

module.exports = router;

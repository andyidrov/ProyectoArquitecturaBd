const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const transaccionRoutes = require('./routes/transaccion');
const transferenciaRoutes = require('./routes/transferencia');
const usuarioRoutes = require('./routes/usuario');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'frontend'
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Rutas de API
app.use('/api', authRoutes);
app.use('/api', transaccionRoutes);
app.use('/api', transferenciaRoutes);
app.use('/api', usuarioRoutes);

module.exports = app;

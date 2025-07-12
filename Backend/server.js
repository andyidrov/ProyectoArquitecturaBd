const app = require('./app');
const db = require('./models/db');

const PORT = process.env.PORT || 8080;

db.getConnection()
  .then(() => {
    console.log('✅ Conexión a la base de datos exitosa');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  });

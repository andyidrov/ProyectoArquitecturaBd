const mysql = require('mysql2');
require('dotenv').config();

// DEBUG: Verificar si dotenv lee las variables correctamente
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect(err => {
    if (err) {
        console.error('Error conectando a la BD:', err);
        process.exit(1);
    }
    console.log("DB Connected");
});

module.exports = connection;

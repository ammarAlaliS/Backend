const express = require('express');
const http = require('http');
const dbConnection = require('./config/dbConnection');
const dotenv = require('dotenv').config();
const authRouter = require('./routes/authRoute');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middleawares/errorHandle');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const setupSwaggerDocs = require('./swaggerDocs');
const { initialize } = require('./socketLogic');

const app = express();
const PORT = process.env.PORT || 5000;

// Conexión a la base de datos
dbConnection();

// Configuración de CORS (permitir desde cualquier origen)
app.use(cors());

// Middleware para analizar cuerpos de solicitud entrantes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware para manejar cookies
app.use(cookieParser());

// Ruta para manejar la raíz del servidor
app.get('/', (req, res) => {
    res.send('¡Bienvenido a ObbaraMarket_Backend!');
});

// Rutas para la autenticación
app.use('/api/ObbaraMarket', authRouter);

// Configuración de la documentación Swagger
setupSwaggerDocs(app, PORT);

// Middleware para manejar rutas no encontradas
app.use(notFound);

// Middleware para manejar errores
app.use(errorHandler);

// Creación del servidor HTTP con Express
const server = http.createServer(app);

// Inicialización de socket.io
initialize(server);

// Inicio del servidor en el puerto especificado
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Exportación del servidor para pruebas unitarias u otros propósitos
module.exports = server;

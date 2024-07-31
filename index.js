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
const { initializeServer } = require('./socket/MessageSocket'); // Importar la función initialize

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos
dbConnection();

// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true
}));

// Middleware para analizar cuerpos de solicitud entrantes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Ruta para manejar la raíz
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
initializeServer(server)

// Ajuste de timeouts
server.keepAliveTimeout = 120000; // 2 minutos en milisegundos
server.headersTimeout = 130000;   // 2 minutos y 10 segundos en milisegundos



// Inicio del servidor en el puerto especificado
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Exportación del servidor para pruebas unitarias u otros propósitos
module.exports = server;

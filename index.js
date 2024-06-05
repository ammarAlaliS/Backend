const express = require('express');
const dbConnection = require('./config/dbConnection');
const dotenv = require('dotenv').config();
const authRouter = require('./routes/authRoute');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middleawares/errorHandle');
const cookieParser = require('cookie-parser');
const cors = require('cors'); 
const setupSwaggerDocs = require('./swaggerDocs'); // Asegúrate de que la ruta sea correcta

const app = express();
const PORT = process.env.PORT || 5000;

dbConnection();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Ruta para manejar la raíz
app.get('/', (req, res) => {
  res.send('¡Bienvenido a ObbaraMarket_Backend!');
});

app.use('/api/ObbaraMarket', authRouter);

// Setup Swagger documentation
setupSwaggerDocs(app, PORT);

// Middleware para manejar rutas no encontradas
app.use(notFound);
// Middleware para manejar errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server is running at PORT ${PORT}`);
});

const express = require('express');
const dbConnection = require('./config/dbConnection');
const app = express();
const dotenv = require('dotenv').config()
const PORT = process.env.PORT || 5000;
const authRouter = require('./routes/authRoute');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middleawares/errorHandle');

const cookieParser = require('cookie-parser');
dbConnection()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false }));
app.use(cookieParser());

app.use('/api/ObbaraMarket/user', authRouter)

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log(`server is running at PORT ${PORT}`);
});
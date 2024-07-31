const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Middleware para verificar el token de autenticación
const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    if (req?.headers?.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(' ')[1];
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded?.id);
                if (!user) {
                    throw new Error("User not found");
                }
                req.user = user;
                next();
            }
        } catch (error) {
            res.status(401).json({ error: "Not authorized. Token expired or invalid." });
        }
    } else {
        res.status(401).json({ error: "No token attached to header." });
    }
});

// Middleware para verificar si el usuario es un administrador
const isAdmin = asyncHandler(async (req, res, next) => {
    const user = req.user;
    if (!user) {
        throw new Error("User not found");
    }

    if (user.global_user.role !== "admin") {
        console.log("Role:", user.global_user.role);
        throw new Error("You are not an admin");
    }

    next();
});


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate.' });
    }
};

module.exports = { authMiddleware, isAdmin, auth };

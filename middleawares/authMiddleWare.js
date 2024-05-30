const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');


// Middleware para verificar el token
const authMiddleware = asyncHandler(async (req, res, next) => {
    let token; 
    if (req?.headers?.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(' ')[1];
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded?.id);
                if (user) {
                    req.user = user;
                    next();
                } else {
                    res.status(401).json({ error: "User not found" });
                }
            } else {
                res.status(401).json({ error: "Token not provided" });
            }
        } catch (error) {
            res.status(401).json({ error: "Not authorized, token expired or invalid, login again" });
        }
    } else {
        res.status(401).json({ error: "Token not attached to header" });
    }
}); 

// Middleware para verificar si el usuario es administrador
const isAdmin = asyncHandler(async (req, res, next) => {
    const user = req.user; 
    if (!user || user.role !== "admin") { 
        res.status(403).json({ error: "You are not an admin" });
    } else {
        next();
    }
});

// Middleware para verificar si la cuenta del usuario está eliminada
const checkAccountStatus = asyncHandler(async (req, res, next) => {
    const user = req.user; 
    if (!user) {
        res.status(404).json({ error: "User not found" });
    } else if (user.isDelete) {
        res.status(403).json({ error: "User account has been deleted" });
    } else {
        next();
    }
});

// Middleware para obtener usuarios con cuentas eliminadas
const AccountStatus = asyncHandler(async (req, res, next) => {
    try {
        const users = await User.find({ isDelete: true });
        req.usersWithDeletedAccounts = users;
        next();
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users with deleted accounts" });
    }
});

module.exports = { authMiddleware, isAdmin, checkAccountStatus, AccountStatus };

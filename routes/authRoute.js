const express = require('express');
const { createDriverUser, createUser, loginUserCtrl, getUsers, findUser, deleteUser, updateUser, blockUser, unBlockUser, handleRefreshToken, findDeletedAccounts,  } = require('../controller/userController');
const { authMiddleware, isAdmin, checkAccountStatus, AccountStatus } = require('../middleawares/authMiddleWare');

const router = express.Router();

// Public routes
router.post("/register", createUser);
router.post("/login", loginUserCtrl);
router.post("/driver/register", createDriverUser );

// Authenticated routes
router.get("/users",  getUsers);
router.get("/user/:id", authMiddleware, isAdmin, findUser);
router.get("/refreshToken", handleRefreshToken);
router.get("/deleted-accounts", authMiddleware, isAdmin, findDeletedAccounts);

// User actions
router.delete("/user/:id", authMiddleware, isAdmin, deleteUser);
router.put("/user/update", authMiddleware, updateUser);
router.put("/user/block/:id", authMiddleware, isAdmin, blockUser);
router.put("/user/unblock/:id", authMiddleware, isAdmin, unBlockUser);



module.exports = router;
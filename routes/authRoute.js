const express = require('express');
const { createDriverUser, loginUserCtrl, getUsers, findUser, deleteUser, updateUser, blockUser, unBlockUser, handleRefreshToken, findDeletedAccounts } = require('../controller/userController');
const { authMiddleware, isAdmin, checkAccountStatus, AccountStatus } = require('../middleawares/authMiddleWare');
const { createTrip, joinTrip } = require('../controller/TripController');
const { upload, createUser } = require('../controller/imageController');
const { createBlog } = require('../controller/BlogController')
const { addComment } = require('../controller/CommentController');

const router = express.Router();

// Public routes
router.post("/register", upload, createUser);

router.post("/login", loginUserCtrl);
router.post("/driver/register", authMiddleware, createDriverUser);

// blog routes. 
router.post('/create/blog', authMiddleware, isAdmin, createBlog );

// comment routes. 
router.post('/blogs/:blogId/comments', authMiddleware, addComment);

// Authenticated routes
router.get("/users", getUsers);
router.get("/user/:id", authMiddleware, isAdmin, findUser);
router.get("/refreshToken", handleRefreshToken);
router.get("/deleted-accounts", authMiddleware, isAdmin, findDeletedAccounts);

router.post("/create-trip", authMiddleware, createTrip);
router.post('/subcribeToTrip/:tripId', authMiddleware, joinTrip);

// User actions
router.delete("/user/:id", authMiddleware, isAdmin, deleteUser);
router.put("/user/update", authMiddleware, updateUser);
router.put("/user/block/:id", authMiddleware, isAdmin, blockUser);
router.put("/user/unblock/:id", authMiddleware, isAdmin, unBlockUser);

module.exports = router;

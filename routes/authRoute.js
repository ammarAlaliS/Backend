const express = require('express');
const { createUser, loginUserCtrl, getUsers, findUser, deleteUser, updateUser, blockUser, unBlockUser, handleRefreshToken, findDeletedAccounts,  } = require('../controller/userController');
const { authMiddleware, isAdmin, checkAccountStatus, AccountStatus } = require('../middleawares/authMiddleWare');

const router = express.Router();


router.post("/register", createUser);
router.post("/login", loginUserCtrl);

router.get("/all-users", getUsers);
router.get("/:id", authMiddleware, isAdmin, findUser);

router.get("/refreshToken", handleRefreshToken)

router.get("/all-users-delete",  getUsers);
router.get("/delete-account/:id", authMiddleware, isAdmin, findDeletedAccounts)

router.delete("/:id", deleteUser);

router.put("/update-user", authMiddleware,  updateUser);
router.put("/block-user/:id", authMiddleware, isAdmin,  blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin,  unBlockUser);


module.exports = router;
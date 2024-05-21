const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// verify the token

const authMiddleware = asyncHandler(async(req,res,next) =>{
    let token; 
    if (req?.headers?.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(' ')[1];
        try {
            if(token){
                const decoded= jwt.verify(token, process.env.JWT_SECRET)
                const user = await User.findById(decoded?.id);
                req.user = user;
                next();
            }
        } catch (error) {
            res.status(500).json({error:"Not Authorized token expired, Login again"})
        }
    }else{
       throw new Error("There is not a Token attached to header")
    }
}); 

// verify is the user role is admin or user.

const isAdmin = asyncHandler(async (req, res, next) => {
    const userId = req.user;  
    const adminUser = await User.findOne({ _id: userId }); 

    if (!adminUser || adminUser.role !== "admin") {
        throw new Error("You are not an admin");
    } else {
        next();
    }
});

// verify if the user is delete 

const checkAccountStatus = asyncHandler(async (req, res, next) => {
    const userId = req.user;
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    if (user.isDelete) {
        throw new Error("User account has been deleted");
    }

    next();
});
const AccountStatus = asyncHandler(async (req, res, next) => {
    try {
        const users = await User.find({ isDelete: true });
        req.usersWithDeletedAccounts = users;
        next();
    } catch (error) {
        next(error); 
    }
});



module.exports = { authMiddleware, isAdmin, checkAccountStatus, AccountStatus };
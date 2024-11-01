const { generateToken } = require("../config/jwtToken");
const User = require('../models/userModel');
const QuickCar = require("../models/quickCarModel");
const asyncHandler = require("express-async-handler");
const { validateMongoDbId } = require("../utilis/validateMongoDb");
const { generateRefreshToken } = require("../config/refreshToken");
const { isUserDelete } = require("../middleawares/authMiddleWare");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');

// create a driver user.

const schema = Joi.object({
  vehicleType: Joi.string().valid("Coche", "Moto").required(),
  vehicleModel: Joi.string().required(),
  startLocation: Joi.string().required(),
  endLocation: Joi.string().required(),
  startTime: Joi.object({
    hour: Joi.number().integer().min(0).max(23).required(),
    minute: Joi.number().integer().min(0).max(59).required(),
  }).required(),
  endTime: Joi.object({
    hour: Joi.number().integer().min(0).max(23).required(),
    minute: Joi.number().integer().min(0).max(59).required(),
  }).required(),
  regularDays: Joi.array()
    .items(
      Joi.string().valid(
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo"
      )
    )
    .required(),
  availableSeats: Joi.number().integer().min(1).required(),
  pricePerSeat: Joi.number().required(),
  image: Joi.string().uri().optional(),
  drivingLicense: Joi.string().optional(),
  fare: Joi.number().required(),
});

const createDriverUser = asyncHandler(async (req, res) => {
  const {
    vehicleType,
    vehicleModel,
    startLocation,
    endLocation,
    startTime,
    endTime,
    regularDays,
    availableSeats,
    pricePerSeat,
    image,
    drivingLicense,
    fare,
  } = req.body;

  // Validate the input data
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = req.user;

  // Check if the user already has a QuickCarDriver
  if (user.global_user.QuickCar) {
    return res
      .status(400)
      .json({ message: "El usuario ya está registrado como conductor" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quickCar = new QuickCar({
      vehicleType,
      vehicleModel,
      startLocation,
      endLocation,
      startTime,
      endTime,
      regularDays,
      availableSeats,
      pricePerSeat,
      image,
      drivingLicense,
      fare,
    });

    const savedQuickCar = await quickCar.save({ session });

    user.global_user.QuickCar = savedQuickCar._id;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(201)
      .json({ global_user: user.global_user, quickCar: savedQuickCar });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating QuickCar:", error);
    res
      .status(500)
      .json({ message: "Error creating QuickCar", error: error.message });
  }
});

// ===================================================================================================================================================================
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {

    const findUser = await User.findOne({ "global_user.email": email });

    if (!findUser) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await findUser.isPasswordMatched(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña inválida" });
    }

    const refreshToken = await generateRefreshToken(findUser._id);

    const updatedUser = await User.findByIdAndUpdate(
      findUser._id,
      { "global_user.refreshToken": refreshToken, "global_user.isActive": true },
      { new: true }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 6 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });
    

    const token = await generateToken(findUser._id);

    res.json({
      id: updatedUser._id,
      first_name: updatedUser.global_user.first_name,
      last_name: updatedUser.global_user.last_name,
      profile_img_url: updatedUser.global_user.profile_img_url || null,
      token,
      isActive: updatedUser.global_user.isActive 
    });
  } catch (error) {
    console.error("Error en loginUserCtrl:", error);
    res.status(500).json({ message: "Error Interno del Servidor" });
  }
});


// ============================================================================================================================================================

const checkSession = asyncHandler(async (req, res) => {
  // Extraer el token del encabezado Authorization
  const authHeader = req.headers.authorization;

  // Verificar que el encabezado Authorization esté presente y tenga el formato adecuado
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token de acceso
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar al usuario en la base de datos
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verificar el estado de la sesión
    if (!user.global_user.isActive) {
      return res.status(401).json({ message: "Session is not active" });
    }

    // Devolver la información del usuario
    res.json({
      id: user._id,
      first_name: user.global_user.first_name,
      last_name: user.global_user.last_name,
      profile_img_url: user.global_user.profile_img_url || null,
      isActive: user.global_user.isActive
    });
  } catch (error) {
    console.error("Error en checkSession:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// =========================================================================================================================================

const handleRefreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.global_user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { "global_user.refreshToken": newRefreshToken });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 6 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken 
    });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
});

// ============================================================================================================================================================

// update a user

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  // execute the validateMongoDbId funtion
  validateMongoDbId(_id);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
      },
      {
        new: true,
      }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// ===============================================================================================================================================================
const updateUserRole = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  // execute the validateMongoDbId funtion
  validateMongoDbId(_id);

  const role = req.body.role;

  if (!role || !["user", "admin", "passenger", "driver"].includes(role)) {
    res.status(404).json({ error: "Ingrese un role valido" });
    return;
  }

  try {
    const updatedUser = await User.updateOne(
      { _id: _id },
      { $set: { "global_user.role": req.body.role } }
    );

    if (!updatedUser.acknowledged) {
      res
        .status(404)
        .json({ error: "Error al actualizar el role del usuario" });
      return;
    }

    res.status(204).json(null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el role del usuario" });
  }
});

// ===============================================================================================================================================================
const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find()
      .populate({
        path: "global_user.QuickCar",
        options: { retainNullValues: true },
      })
      .populate({ path: "Blog", options: { retainNullValues: true } });

    res.json(
      users.map((user) => ({
        _id: user._id,
        first_name: user.global_user.first_name,
        last_name: user.global_user.last_name,
        email: user.global_user.email,
        role: user.global_user.role,
        profile_img_url: user.global_user.profile_img_url || null,
        QuickCar: user.global_user.QuickCar || null,
        Blog: user.Blog || null,
      }))
    );
  } catch (error) {
    // Lanzar el error para ser manejado por asyncHandler
    throw new Error(error.message);
  }
});

//====================================================================================================================================================================

// get delete account

const getAllDeleteAccount = asyncHandler(async (req, res) => {
  try {
    const users = req.usersWithDeletedAccounts;
    res.json(users);
  } catch (error) {
    throw new Error("error");
  }
});

//=====================================================================================================================================================================

// find a sigle user

const findUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id)
    // execute the validateMongoDbId funtion
    validateMongoDbId(id);

    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    throw new Error(error);
  }
});

// ======================================================================================================================================================================

//  find deleted accounts

const findDeletedAccounts = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id)
    // execute the validateMongoDbId funtion
    validateMongoDbId(id);

    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    throw new Error("error");
  }
});

// delate user

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id)

    const deleteUser = await User.findByIdAndDelete(id);
    res.json({
      deleteUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// block a user

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // execute the validateMongoDbId funtion
  validateMongoDbId(id);

  try {
    // Verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Update the isBlokend status to true

    const usuarioBloqueado = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );

    // send the right response
    res.status(200).json({
      message: "User Blocked",
    });
  } catch (error) {
    // Manejar errores
    console.error(error);
    res.status(500).json({ error: "Algo salió mal" });
  }
});

// unblock a user

const unBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // execute the validateMongoDbId funtion
  validateMongoDbId(id);
  try {
    const unBlock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "User unBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  loginUserCtrl,
  getUsers,
  findUser,
  deleteUser,
  updateUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  findDeletedAccounts,
  getAllDeleteAccount,
  createDriverUser,
  updateUserRole,
  checkSession
};

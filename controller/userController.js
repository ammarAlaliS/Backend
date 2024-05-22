const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const QuickCar = require("../models/quickCarModel")
const asyncHandler = require("express-async-handler");
const { validateMongoDbId } = require("../utilis/validateMongoDb");
const { generateRefreshToken } = require("../config/refreshToken");
const { isUserDelete } = require("../middleawares/authMiddleWare");
const Joi = require('joi');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');


const createUser = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Verificar si ya existe un usuario con el mismo correo electrónico
  const existingUser = await User.findOne({ 'global_user.email': email });
  if (existingUser) {
    return res.status(400).json({ message: "User Already Exists" });
  }

  // Si no existe un usuario con el mismo correo electrónico, crear uno nuevo
  const newUser = await User.create(req.body);
  res.json(newUser);
});
// create a driver user. 

const schema = Joi.object({
  vehicleType: Joi.string().valid('Coche', 'Moto').required(),
  vehicleModel: Joi.string().required(),
  startLocation: Joi.string().required(),
  endLocation: Joi.string().required(),
  startTime: Joi.object({
      hour: Joi.number().integer().min(0).max(23).required(),
      minute: Joi.number().integer().min(0).max(59).required()
  }).required(),
  endTime: Joi.object({
      hour: Joi.number().integer().min(0).max(23).required(),
      minute: Joi.number().integer().min(0).max(59).required()
  }).required(),
  regularDays: Joi.array().items(Joi.string().valid('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')).required(),
  availableSeats: Joi.number().integer().min(1).required(),
  pricePerSeat: Joi.number().required(),
  image: Joi.string().uri().optional(),
  drivingLicense: Joi.string().optional(),
  fare: Joi.number().required()
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

  // Validar los datos de entrada
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const user = req.user;

  // Verificar si el usuario ya tiene un QuickCarDriver
  if (user.global_user.QuickCar) {
    return res.status(400).json({ message: "El usuario ya está registrado como conductor" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quickCarDriver = new QuickCar({
      driver_information: {
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
      }
    });

    const userDriver = await quickCarDriver.save({ session });

    user.global_user.QuickCar = userDriver._id;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ user, driver_information: userDriver });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creando conductor:", error);
    res.status(500).json({ message: "Error creando conductor", error: error.message });
  }
});



// create Loggin controller
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exist or not
  const findUser = await User.findOne({ 'global_user.email': email }).populate('global_user.QuickCar');
  if (findUser && (await findUser.isPasswordMatched(password))) {
    // generate a new token
    const refreshToken = await generateRefreshToken(findUser._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser._id,
      { 'global_user.refreshToken': refreshToken },
      { new: true }
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser._id,
      first_name: findUser.global_user.first_name,
      last_name: findUser.global_user.last_name,
      email: findUser.global_user.email,
      token: generateToken(findUser._id),
      QuickCar: findUser.global_user.QuickCar || null, // Agrega el objeto QuickCar si existe, sino null
    });
  } else {
    throw new Error('Invalid Credentials');
  }
});


// handle refresh token 
const handleRefreshToken = asyncHandler(async(req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("Not Refresh Token in Cookies")
})

// update a user

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  // execute the validateMongoDbId funtion
  validateMongoDbId(_id)
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
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});


// get all users

const getUsers = asyncHandler(async (req, res) => {
  try {
    // Usar populate para obtener el objeto completo de QuickCar
    const users = await User.find().populate('global_user.QuickCar');
    res.json(users);
  } catch (error) {
    // Lanzar el error para ser manejado por asyncHandler
    throw new Error(error);
  }
});

// get delete account 

const getAllDeleteAccount = asyncHandler(async (req, res) => {
  try {
      const users = req.usersWithDeletedAccounts;
      res.json(users);
  } catch (error) {
      throw new Error("error");
  }
});

// find a sigle user

const findUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id)
     // execute the validateMongoDbId funtion
    validateMongoDbId(id)

    const user = await User.findById(id);
    res.json(user);
  } catch (error) {
    throw new Error(error);
  }
});

//  find deleted accounts

const findDeletedAccounts = asyncHandler(async (req, res)=>{
  try {
    const { id } = req.params;
    // console.log(id)
     // execute the validateMongoDbId funtion
    validateMongoDbId(id)

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
   validateMongoDbId(id)

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
      message: "User Blocked"
    });
  } catch (error) {
    // Manejar errores
    console.error(error);
    res.status(500).json({ error: "Algo salió mal" });
  }
});




// unblock a user

const unBlockUser = asyncHandler(async(req,res) => {
  const { id } = req.params; 

   // execute the validateMongoDbId funtion
   validateMongoDbId(id)
  try {
    const unBlock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked:false,
      },
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "User unBlocked",
    });
  } catch (error) {
    throw new Error(error)
  }
})

module.exports = {
  createUser,
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
  createDriverUser

};

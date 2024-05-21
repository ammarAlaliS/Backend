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


// create user controler

const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email: email });
  if (!findUser) {
    // CREATE A NEW USER
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    // USER ALREADY EXISTS
    throw new Error("User Already Exists");
  };
});

// create a driver user. 

const schema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
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

const createDriverUser = async (req, res) => {
  const {
      first_name,
      last_name,
      email,
      password,
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
      fare
  } = req.body;

  // Validar los datos de entrada
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      // Buscar usuario por email
      let user = await User.findOne({ email }).session(session);

      if (!user) {
          // Si el usuario no existe, crearlo
          user = new User({
              first_name,
              last_name,
              email,
              password,
              role: 'user'
          });

          user = await user.save({ session });
      } else {
        throw new Error("User Already Exists");
      }

      // Crear documento en quickCar usando el _id del usuario
      const quickCarRide = new QuickCar({
          user: user._id,
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
          fare
      });

      const savedRide = await quickCarRide.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ user, ride: savedRide });

  } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error creando usuario y viaje:', error);
      res.status(500).json({ message: 'Error creando usuario y viaje', error: error.message });
  }
};

// create Loggin controler

const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exist or not
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {

    // generate a new token 

    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateUser = await User.findByIdAndUpdate(findUser.id, 
      {
        refreshToken: refreshToken,
      },
      {
        new: true
      })
    res.cookie('refreshToken', refreshToken,
    {
      httpOnly:true,
      maxAge: 72 * 60 * 60 * 1000,
    })
    res.json({
      _id: findUser?._id,
      first_name: findUser?.first_name,
      last_name: findUser?.last_name,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),

    });
  } else {
    throw new Error("Invalid Credentials");
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
    const users = await User.find();
    res.json(users);
  } catch (error) {
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

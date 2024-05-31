const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// Configurar Google Cloud Storage
const storage = new Storage({
  keyFilename: 'uber-demo-423803-c6075455c79f.json',
});

// Nombre del bucket
const bucketName = 'quickcar';

// Configurar multer para gestionar la subida de archivos
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage }).single('profile_img_url');

// Función para subir la imagen a Google Cloud Storage
const uploadImageToStorage = (file) => {
  return new Promise((resolve, reject) => {
    const blob = storage.bucket(bucketName).file(file.originalname);
    const blobStream = blob.createWriteStream({ resumable: false });

    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

// Función para crear un usuario
const createUser = asyncHandler(async (req, res) => {
  try {
    const { email, first_name, last_name, password } = req.body;

    // Verificar si ya existe un usuario con el mismo correo electrónico
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    let profileImageUrl;
    if (req.file) {
      // Subir la imagen si se proporciona
      profileImageUrl = await uploadImageToStorage(req.file);
    }

    // Crear el usuario con la URL de la imagen de perfil si se proporciona
    const userData = { email, first_name, last_name, password };
    if (profileImageUrl) {
      userData.profile_img_url = profileImageUrl;
    }

    const newUser = await User.create(userData);
    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = { upload, createUser };

const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// Configuración de Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
  },
});

const bucketName = 'quickcar';

// Configuración de multer
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage }).single('profile_img_url');

// Función para subir la imagen a Google Cloud Storage
const uploadImageToStorage = (file) => {
  return new Promise((resolve, reject) => {
    const blob = storage.bucket(bucketName).file(Date.now() + "_" + file.originalname);
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
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
      console.log("Missing required fields:", { email, first_name, last_name, password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ 'global_user.email': email });
    if (existingUser) {
      console.log("User already exists with email:", email);
      return res.status(409).json({ message: "User Already Exists" });
    }

    let profileImageUrl;
    if (req.file) {
      profileImageUrl = await uploadImageToStorage(req.file);
    }

    const userData = {
      global_user: {
        first_name,
        last_name,
        email,
        password,
        role
      },
    };

    if (profileImageUrl) {
      userData.global_user.profile_img_url = profileImageUrl;
    }

    console.log("Creating user with data:", userData);
    const newUser = await User.create(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = { upload, createUser };

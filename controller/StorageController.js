const asyncHandler = require("express-async-handler");
const Blog = require("../models/Blog");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
  },
});

const bucketName = "quickcar-storage"; // Nombre de tu bucket en Google Cloud Storage

// Configurar el almacenamiento en memoria para Multer
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

const handleDriverFormDataQuickCar = upload.fields([
  { name: "vehicleModelImage", maxCount: 5 },
  { name: "drivingLicenseImage", maxCount: 2 },
]);

// Función para subir una imagen a Google Cloud Storage
const uploadImageToStorage = async (file, altText) => {
  const blob = storage
    .bucket(bucketName)
    .file(uuidv4() + "_" + file.originalname);
  const blobStream = blob.createWriteStream({ resumable: false });

  return new Promise((resolve, reject) => {
    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve({ url: publicUrl, alt: altText });
      console.log(`Imagen subida: ${publicUrl}`);
    });

    console.log(`Archivo local eliminado: ${file.path}`);
    blobStream.end(file.buffer);
  });
};

// Middleware para manejar las imágenes y los datos del formulario
const handleFormData = (req, res, next) => {
  upload.fields([{ name: "blog_image_url", maxCount: 5 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: "Error uploading images", error: err });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Internal server error", error: err });
    }
    next();
  });
};

// Middleware para manejar las imágenes y los datos del formulario de productos
const handleProductFormData = (req, res, next) => {
  upload.fields([{ name: "product_image_url", maxCount: 5 }])(
    req,
    res,
    (err) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: "Error uploading images", error: err });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "Internal server error", error: err });
      }
      next();
    }
  );
};

// Función para procesar las imágenes de un campo específico
const processImages = async (files) => {
  let imageUrls = [];
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = await uploadImageToStorage(file, file.originalname);
      console.log(`URL de imagen subida: ${imageUrl}`);
      imageUrls.push(imageUrl);
    }
  }
  return imageUrls;
};

// Función para eliminar una imagen de Google Cloud Storage
const deleteImageFromStorage = async (fileName) => {
  try {
    if (fileName) {
      await storage
        .bucket(bucketName)
        .file(
          fileName.replace(
            "https://storage.googleapis.com/quickcar-storage/",
            ""
          )
        )
        .delete();
    }
  } catch (error) {
    console.error(`No se encontro la imagen: ${error.message}`);
  }
};

module.exports = {
  uploadImageToStorage,
  handleFormData,
  processImages,
  handleProductFormData,
  deleteImageFromStorage,
  handleDriverFormDataQuickCar,
};

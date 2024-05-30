const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

// Función para subir la imagen a Ionos
const uploadToIonos = async (fileBuffer, filename) => {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, filename); // Corregido: pasa filename directamente

    // Obtén las variables de entorno para la configuración de SFTP
    const sftpHost = process.env.SFTP_HOST;
    const sftpPort = process.env.SFTP_PORT;
    const sftpUsername = process.env.SFTP_USERNAME;
    const sftpPassword = process.env.SFTP_PASSWORD;

    // Construye la URL para el servidor SFTP
    const sftpUrl = `sftp://${sftpHost}:${sftpPort}/ruta/de/subida`;

    // Realiza la solicitud POST al servidor SFTP utilizando Axios
    const response = await axios.post(sftpUrl, formData, {
      headers: formData.getHeaders(), // Corregido: usar getHeaders() directamente
    });

    return response.data;
  } catch (error) {
    console.error('Error al subir la imagen al servidor:', error);
    throw error;
  }
};

// Función para manejar la subida de imagen
const uploadImg = async (req, res) => {
  try {
    // Accede al archivo subido utilizando Multer
    const file = req.file;

    // Sube el archivo al servidor
    const serverResponse = await uploadToIonos(file.buffer, file.originalname);

    // Puedes hacer algo con la respuesta del servidor si es necesario
    console.log('Respuesta del servidor:', serverResponse);

    // Envía una respuesta al cliente
    res.status(200).send('Imagen subida correctamente al servidor');
  } catch (error) {
    res.status(500).send('Error al subir la imagen al servidor');
  }
};

module.exports = { upload, uploadImg };

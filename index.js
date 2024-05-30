const express = require('express');
const multer = require('multer');
const SftpClient = require('ssh2-sftp-client');

const app = express();

// Configurar multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' });

// Configuración de conexión SFTP
const sftpConfig = {
  host: "sftp.hidrive.ionos.com",
  protocol: "sftp",
  port: 22,
  username: "Obbara333Market",
  password: "Obbara_Market333.",
};

// Ruta POST para subir imágenes
app.post('/upload', upload.single('image'), async (req, res) => {
    const sftp = new SftpClient();
    try {
        await sftp.connect(sftpConfig);
        // Subir la imagen al directorio /images/ en el servidor remoto
        await sftp.put(req.file.path, `users/obbara333market/profile_images/${req.file.originalname}`);
        res.send('Imagen subida con éxito');
    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Error al subir la imagen');
    } finally {
        await sftp.end();
    }
});

app.listen(3000, () => {
    console.log('Servidor Express escuchando en el puerto 3000');
});

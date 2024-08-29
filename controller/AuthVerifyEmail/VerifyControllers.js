const nodemailer = require('nodemailer');
const User = require('../../models/userModel'); // Asegúrate de que la ruta al modelo es correcta

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',  // Host proporcionado por Mailtrap
  port: 2525,                 // Puerto proporcionado por Mailtrap
  auth: {
    user: process.env.EMAIL_USER, // Usuario proporcionado por Mailtrap
    pass: process.env.EMAIL_PASS  // Contraseña proporcionada por Mailtrap
  }
});

// Controlador para enviar el código de verificación
const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Generar un código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Actualizar el código de verificación en la base de datos
    await User.updateOne({ email }, { verificationCode, isVerified: false });

    // Configurar opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Código de verificación',
      text: `Tu código de verificación es ${verificationCode}.`
    };

    // Enviar el correo electrónico
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Código enviado al correo electrónico.' });
  } catch (error) {
    console.error('Error al enviar el código de verificación:', error);
    res.status(500).json({ message: 'Error al enviar el código de verificación.' });
  }
};

// Controlador para verificar el código de verificación
const verifyCode = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Buscar el usuario con el código de verificación
    const user = await User.findOne({ email, verificationCode });

    if (!user) {
      return res.status(400).json({ message: 'Código de verificación inválido.' });
    }

    // Marcar el usuario como verificado
    await User.updateOne({ email }, { isVerified: true, verificationCode: null });

    res.status(200).json({ message: 'Correo electrónico verificado exitosamente.' });
  } catch (error) {
    console.error('Error al verificar el código:', error);
    res.status(500).json({ message: 'Error al verificar el código.' });
  }
};

module.exports = { sendVerificationCode, verifyCode };

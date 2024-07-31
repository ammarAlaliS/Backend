const mongoose = require('mongoose');
const Message = require('../../models/MessageModel');
const { emitEvent } = require('../../socket/MessageSocket'); 

const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        if (!content || !receiverId) {
            return res.status(400).json({ message: 'El contenido y el receptor son requeridos.' });
        }
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'El ID del receptor no es válido.' });
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content: content
        });

        const savedMessage = await newMessage.save();

        // Emitir el mensaje a los usuarios correspondientes
        emitEvent(receiverId, 'newMessage', savedMessage);
        emitEvent(senderId.toString(), 'newMessage', savedMessage);

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el mensaje.' });
    }
};

const getAllUserMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'El ID del usuario no es válido.' });
        }
        if (senderId !== userId) {
            return res.status(401).json({ message: 'Acceso no autorizado, solo el propietario de estos mensajes puede leerlos.' });
        }

        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Obtener mensajes con paginación, ordenando por timestamp en orden descendente
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
        .sort({ timestamp: -1 }) // Ordenar por timestamp descendente
        .skip(skip)
        .limit(limit);

        // Contar el total de mensajes
        const totalMessages = await Message.countDocuments({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });

        // Emitir los mensajes obtenidos al usuario
        emitEvent(userId, 'loadMessages', {
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            messages
        });

        res.json({
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            messages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los mensajes.' });
    }
};
const getAllMessages = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Acceso no autorizado, solo los administradores pueden acceder a esta información.' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Obtener todos los mensajes con paginación
        const messages = await Message.find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        // Contar el total de mensajes
        const totalMessages = await Message.countDocuments();

        res.json({
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            messages
        });

        // Emitir los mensajes obtenidos a los administradores
        emitEvent('adminRoom', 'loadAllMessages', {
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            messages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los mensajes.' });
    }
};

const getUserConversations = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Encontrar todas las conversaciones donde el usuario es el remitente o el receptor
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).populate('sender receiver', 'username'); // Asumiendo que tienes un campo `username` en el modelo User

        // Extraer los usuarios únicos con los que el usuario ha intercambiado mensajes
        const users = new Set();
        messages.forEach(message => {
            if (message.sender._id.toString() !== userId) {
                users.add(JSON.stringify({ _id: message.sender._id, username: message.sender.username }));
            }
            if (message.receiver._id.toString() !== userId) {
                users.add(JSON.stringify({ _id: message.receiver._id, username: message.receiver.username }));
            }
        });

        res.json(Array.from(users).map(user => JSON.parse(user)));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las conversaciones de usuario.' });
    }
};

module.exports = { sendMessage, getAllUserMessages, getAllMessages, getUserConversations };

const mongoose = require('mongoose');
const Message = require('../../models/MessageModel');
const { emitEvent } = require('../../socketLogic');

// Controlador para enviar mensajes
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

// Controlador para obtener todos los mensajes entre el usuario y otro usuario
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
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'receiver',
            select: 'global_user.first_name global_user.last_name global_user.email global_user.profile_img_url'
        })
        .populate({
            path: 'sender',
            select: 'global_user.first_name global_user.last_name global_user.email global_user.profile_img_url'
        });

        // Contar el total de mensajes
        const totalMessages = await Message.countDocuments({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });

        // Agrupar mensajes por receptor
        const groupedMessages = messages.reduce((acc, message) => {
            const key = message.receiver._id.toString();
            if (!acc[key]) {
                acc[key] = {
                    receiver: message.receiver,
                    sender: message.sender,
                    messages: []
                };
            }
            acc[key].messages.push({
                _id: message._id,
                sender: { _id: message.sender._id },
                receiver: { _id: message.receiver._id },
                content: message.content,
                read: message.read,
                timestamp: message.timestamp
            });
            return acc;
        }, {});

        const result = Object.values(groupedMessages);

        // Emitir los mensajes obtenidos al usuario
        emitEvent(userId, 'loadMessages', {
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            conversations: result
        });

        res.json({
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            conversations: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los mensajes.' });
    }
};


// Controlador para obtener todos los mensajes (admin)
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

// Controlador para obtener las conversaciones con los usuarios
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Agregación para obtener usuarios únicos con los que se ha intercambiado mensajes
        const conversations = await Message.aggregate([
            { $match: { $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }] } },
            { $group: { _id: { $cond: [{ $eq: ["$sender", mongoose.Types.ObjectId(userId)] }, "$receiver", "$sender"] } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: "$user" },
            { $project: { _id: 1, username: "$user.username", profile_img_url: "$user.profile_img_url" } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Contar el total de conversaciones
        const totalConversations = await Message.aggregate([
            { $match: { $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }] } },
            { $group: { _id: { $cond: [{ $eq: ["$sender", mongoose.Types.ObjectId(userId)] }, "$receiver", "$sender"] } } }
        ]).count();

        res.json({
            totalConversations: conversations.length,
            totalPages: Math.ceil(totalConversations / limit),
            currentPage: page,
            conversations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las conversaciones de usuario.' });
    }
};

module.exports = { sendMessage, getAllUserMessages, getAllMessages, getUserConversations };

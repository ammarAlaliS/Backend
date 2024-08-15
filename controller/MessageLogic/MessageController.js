const mongoose = require('mongoose');
const Message = require('../../models/MessageModel');
const User = require('../../models/userModel');
const { emitEvent } = require('../../socketLogic');
const moment = require('moment-timezone');

const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id.toString(); 

      
        if (!content || !receiverId) {
            return res.status(400).json({ message: 'El contenido y el receptor son requeridos.' });
        }
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'El ID del receptor no es válido.' });
        }

    
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            content: content,
            timestamp: new Date() 
        });

        const savedMessage = await newMessage.save();

        const receiver = await User.findById(receiverId).select('global_user');
        const sender = await User.findById(senderId).select('global_user');

        if (!receiver || !sender) {
            return res.status(404).json({ message: 'Usuario receptor o emisor no encontrado.' });
        }

        emitEvent('newMessage', {
            message: savedMessage,
            sender: sender.global_user,
            receiver: receiver.global_user
        });

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el mensaje.' });
    }
};

const GetUserInformacionToListMyUsersInteraction = async (req, res) => {
    try {
        const { userId } = req.params;
        const senderId = req.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'El ID del usuario no es válido.' });
        }
        if (senderId !== userId) {
            return res.status(401).json({ message: 'Acceso no autorizado, solo el propietario de estos mensajes puede leerlos.' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

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

        const groupedConversations = {};
        messages.forEach(message => {
            const otherUserId = message.sender._id.toString() === userId ? message.receiver._id.toString() : message.sender._id.toString();
            const conversationKey = [userId, otherUserId].sort().join('-');

            if (!groupedConversations[conversationKey]) {
                groupedConversations[conversationKey] = {
                    receiver: message.receiver._id.toString() === userId ? message.sender : message.receiver,
                    sender: message.sender._id.toString() === userId ? message.sender : message.receiver,
                    lastMessage: {
                        _id: message._id,
                        content: message.content,
                        timestamp: message.timestamp,
                        read: message.read
                    }
                };
            }
        });

        const result = Object.values(groupedConversations);

        res.json({
            totalConversaciones: result.length,
            totalPages: Math.ceil(result.length / limit),
            currentPage: page,
            conversations: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las conversaciones.' });
    }
};

const getConversationWithUser = async (req, res) => {
    try {
        const { userId } = req.params; 
        const senderId = req.user._id.toString();

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'El ID del usuario no es válido.' });
        }

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Acceso no autorizado.' });
        }

        const timeZone = req.query.timeZone || 'UTC';

        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: userId },
                { sender: userId, receiver: senderId }
            ]
        })
        .sort({ timestamp: -1 })
        .skip(skip) 
        .limit(limit)
        .populate({
            path: 'receiver',
            select: 'global_user.first_name global_user.last_name global_user.profile_img_url'
        })
        .populate({
            path: 'sender',
            select: 'global_user.first_name global_user.last_name global_user.profile_img_url'
        });

        const totalMessages = await Message.countDocuments({
            $or: [
                { sender: senderId, receiver: userId },
                { sender: userId, receiver: senderId }
            ]
        });

        res.json({
            totalMessages,
            totalPages: Math.ceil(totalMessages / limit),
            currentPage: page,
            messages,
            timeZone 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las conversaciones.' });
    }
};






module.exports = { sendMessage, GetUserInformacionToListMyUsersInteraction, getConversationWithUser };

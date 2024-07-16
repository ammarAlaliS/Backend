const mongoose = require('mongoose');
const Message = require('../../models/MessageModel')
const { emitEvent } = require('../../socketLogic');



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
        emitEvent('newMessage', savedMessage);

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el mensaje.' });
    }
};

const getMessageById = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'El ID del usuario no es válido.' });
        }
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort('timestamp');
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los mensajes.' });
    }
};

module.exports = { sendMessage, getMessageById };
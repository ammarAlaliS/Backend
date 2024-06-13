const { emitEvent } = require('../socketLogic');
const Like = require('../models/LikeModel');

// Añadir o quitar like
const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id; // Obtener el ID de usuario del token de autenticación
        const { blogId } = req.params; // Obtener el ID del blog de los parámetros de la URL

        // Verificar si el like ya existe
        const existingLike = await Like.findOne({ user: userId, blog: blogId });

        if (existingLike) {
            // Si el like ya existe, quítalo
            await Like.deleteOne({ _id: existingLike._id });
            const totalLikes = await Like.countDocuments({ blog: blogId });
            emitEvent('likeUpdated', { blogId, likes: totalLikes }); // Emitir evento a todos los clientes conectados
            return res.status(200).json({ blogId, userId, likes: totalLikes }); // Incluye userId en la respuesta
        } else {
            // Si no existe, agrégalo
            const newLike = new Like({
                user: userId,
                blog: blogId,
            });
            await newLike.save();
            const totalLikes = await Like.countDocuments({ blog: blogId });
            emitEvent('likeUpdated', { blogId, likes: totalLikes }); // Emitir evento a todos los clientes conectados
            return res.status(201).json({ blogId, userId, likes: totalLikes }); // Incluye userId en la respuesta
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al manejar el like' });
    }
};

// Obtener todos los likes de un blog
const getBlogLikes = async (req, res) => {
    try {
        const { blogId } = req.params;
        const likes = await Like.find({ blog: blogId }).populate('user');
        return res.status(200).json(likes);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener los likes' });
    }
};

module.exports = {
    toggleLike,
    getBlogLikes
};

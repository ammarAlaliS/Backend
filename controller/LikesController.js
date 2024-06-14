const { emitEvent } = require('../socketLogic');
const Like = require('../models/LikeModel');
const User = require('../models/userModel');
const Blog = require('../models/Blog');

// Añadir o quitar like
const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const { blogId } = req.params;

        // Buscar si ya existe un like del usuario en este blog
        const existingLike = await Like.findOne({ user: userId, blog: blogId });

        if (existingLike) {
            // Si ya existe un like, actualizar userSubcribe a false
            existingLike.userSubcribe = false;
            await existingLike.save();

            // Actualizar el contador de likes en el blog
            const totalLikes = await Like.countDocuments({ blog: blogId, userSubcribe: true });

            // Emitir evento a todos los clientes conectados
            emitEvent('likeUpdated', { blogId, likes: totalLikes });

            // Responder con el resultado actualizado
            return res.status(200).json({ blogId, userId, likes: totalLikes });
        } else {
            // Si no existe, se agrega el like con userSubcribe en true
            const newLike = new Like({
                user: userId,
                blog: blogId,
                userSubcribe: true,
            });
            await newLike.save();

            // Actualizar el contador de likes en el blog
            const totalLikes = await Like.countDocuments({ blog: blogId, userSubcribe: true });

            // Emitir evento a todos los clientes conectados
            emitEvent('likeUpdated', { blogId, likes: totalLikes });

            // Responder con el resultado actualizado
            return res.status(201).json({ blogId, userId, likes: totalLikes });
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
        
        // Contar todos los likes para el blog específico
        const totalLikes = await Like.countDocuments({ blog: blogId });

        // Devolver el número total de likes en formato JSON
        return res.status(200).json({ blogId, totalLikes });
    } catch (error) {
        // Manejo de errores en caso de fallo en la búsqueda
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener los likes' });
    }
};




module.exports = {
    toggleLike,
    getBlogLikes
};

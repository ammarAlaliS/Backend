const { emitEvent } = require('../socketLogic');
const Like = require('../models/LikeModel');
const User = require('../models/userModel');
const Blog = require('../models/Blog');

const toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const { blogId } = req.params;

        const existingLike = await Like.findOne({ user: userId, blog: blogId });

        if (existingLike) {
 
            await Like.deleteOne({ _id: existingLike._id });
            await User.findByIdAndUpdate(userId, { $pull: { likes: existingLike._id } });
g
            const totalLikes = await Like.countDocuments({ blog: blogId });
            await Blog.findByIdAndUpdate(blogId, { $pull: { likes: existingLike._id } });

            emitEvent('likeUpdated', { blogId, likes: totalLikes });

            return res.status(200).json({ blogId, userId, likes: totalLikes });
        } else {

            const newLike = new Like({
                user: userId,
                blog: blogId,
            });
            await newLike.save();


            await User.findByIdAndUpdate(userId, { $push: { likes: newLike._id } });

            const totalLikes = await Like.countDocuments({ blog: blogId });
            await Blog.findByIdAndUpdate(blogId, { $push: { likes: newLike._id } });

            emitEvent('likeUpdated', { blogId, likes: totalLikes });

            return res.status(201).json({ blogId, userId, likes: totalLikes });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al manejar el like' });
    }
};

const getBlogLikes = async (req, res) => {
    try {
        const { blogId } = req.params;
        
        const totalLikes = await Like.countDocuments({ blog: blogId });

        return res.status(200).json({ blogId, totalLikes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener los likes' });
    }
};


const checkUserLike = async (req, res) => {
    const userId = req.user.id; 
    const { blogId } = req.params; 
    if (!userId) {
        return res.status(401).json({ message: 'No se proporcionó un id del usuario' });
    }

    try {
        const existingLike = await Like.findOne({ user: userId, blog: blogId });

        if (existingLike) {
            return res.status(200).json({ userId, blogId, hasLiked: true });
        } else {
            return res.status(200).json({ userId, blogId, hasLiked: false });
        }
    } catch (error) {
        console.error('Error al verificar el like del usuario:', error.message);
        return res.status(500).json({ message: 'Error al verificar el like del usuario' });
    }
};


module.exports = {
    toggleLike,
    getBlogLikes,
    checkUserLike
};
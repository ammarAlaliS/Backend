const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const Comment = require('../models/CommentModel');

// Controlador para agregar un comentario a un blog
const addComment = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;
        const { blogId } = req.params;

        // Buscar el blog al que se quiere agregar el comentario
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Crear el comentario
        const comment = new Comment({
            content,
            author: req.user._id, // El ID del usuario que realiza la solicitud
            blog: blog._id,
        });

        // Guardar el comentario en la base de datos
        await comment.save();

        // Agregar el comentario al blog
        blog.comments.push(comment._id);
        await blog.save();

        // Volver a buscar el comentario y popular los datos del autor
        const populatedComment = await Comment.findById(comment._id).populate('author');

        res.status(201).json(populatedComment);
    } catch (error) {
        // Manejar cualquier error capturado
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { addComment };

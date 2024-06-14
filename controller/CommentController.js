const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/CommentModel');
const { emitEvent } = require('../socketLogic');

// Controlador para agregar un comentario a un blog
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { blogId } = req.params;
    const userId = req.user._id;


    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(400).json({ error: 'ID del blog inválido' });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 3 || content.trim().length > 500) {
        return res.status(400).json({ error: 'Contenido inválido. El contenido debe tener entre 3 y 500 caracteres.' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
        return res.status(404).json({ error: 'Blog no encontrado' });
    }

    const comment = new Comment({
        content: content.trim(),
        author: userId,
        blog: blog._id,
    });

    await comment.save();

    blog.comments.push(comment._id);
    await blog.save();

    const populatedComment = await Comment.findById(comment._id).populate('author', 'username email');

    emitEvent('newComment', populatedComment);

    res.status(201).json(populatedComment);
});



const getCommentsByBlogId = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    let { page, limit, sortBy, order } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.status(400).json({ error: 'ID del blog inválido' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
        return res.status(404).json({ error: 'Blog no encontrado' });
    }

    const skip = (page - 1) * limit;

    const sortCriteria = {};
    if (sortBy) {
        sortCriteria[sortBy] = order === 'desc' ? -1 : 1;
    } else {
        sortCriteria.createdAt = -1;
    }

    try {
        const comments = await Comment.find({ blog: blog._id })
            .populate({
                path: 'author',
                select: {
                    'global_user.first_name': 1,
                    'global_user.last_name': 1,
                    'global_user.profile_img_url': 1
                }
            })
            .sort(sortCriteria)
            .skip(skip)
            .limit(limit);

        if (page) {
            emitEvent('commentsUpdated', { blogId, comments });
        }

        res.json(comments);
    } catch (error) {
        console.error('Error al obtener comentarios paginados:', error);
        res.status(500).json({ error: 'Ocurrió un error interno al obtener comentarios paginados' });
    }
});

module.exports = { addComment, getCommentsByBlogId };

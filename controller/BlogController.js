const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');

// Controlador para crear un nuevo blog
const createBlog = asyncHandler(async (req, res) => {
    try {
        const { blog_image_url, title, blog_description, tags } = req.body;
        
        // Extraer el ID del usuario del token JWT
        const userId = req.user._id;

        // Crear el nuevo blog
        const newBlog = new Blog({
            blog_image_url,
            title,
            blog_description,
            author: userId, // Asignar el ID del usuario
            tags,
        });

        // Guardar el blog en la base de datos
        await newBlog.save();

        res.status(201).json(newBlog);
    } catch (error) {
        // Manejar cualquier error capturado
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Controlador para obtener todos los blogs
const getAllBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find().populate('author', 'global_user.first_name global_user.last_name');

    res.status(200).json(blogs);
});

// Controlador para obtener un blog por su ID
const getBlogById = asyncHandler(async (req, res) => {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId).populate('author', 'global_user.first_name global_user.last_name').populate('comments');

    if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json(blog);
});

// Controlador para actualizar un blog por su ID
const updateBlogById = asyncHandler(async (req, res) => {
    const blogId = req.params.id;
    const { blog_image_url, title, blog_description, tags } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, {
        blog_image_url,
        title,
        blog_description,
        tags,
    }, { new: true });

    if (!updatedBlog) {
        return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json(updatedBlog);
});

// Controlador para eliminar un blog por su ID
const deleteBlogById = asyncHandler(async (req, res) => {
    const blogId = req.params.id;

    const deletedBlog = await Blog.findByIdAndDelete(blogId);

    if (!deletedBlog) {
        return res.status(404).json({ error: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog deleted successfully' });
});

module.exports = {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlogById,
    deleteBlogById,
};


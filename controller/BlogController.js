
const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');



// Configuración de Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    credentials: {
        private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GCLOUD_CLIENT_EMAIL,
    },
});
const bucketName = 'quickcar'; // Nombre del bucket en Google Cloud Storage

// Configuración de Multer para manejar archivos en memoria
const upload = multer().fields([
    { name: 'blog_image_url', maxCount: 5 },
]);

// Función para subir una imagen a Google Cloud Storage
const uploadImageToStorage = async (file) => {
    return new Promise((resolve, reject) => {
        const blob = storage.bucket(bucketName).file(uuidv4() + "_" + file.originalname);
        const blobStream = blob.createWriteStream({ resumable: false });

        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
};

// Función para crear un blog
const createBlog = async (req, res) => {
    try {
             
        // Manejo de subida de imágenes con Multer
        upload(req, res, async (err) => {
            if (err) {
                console.error('Error uploading images:', err);
                return res.status(400).json({ message: 'Error uploading blog images', error: err.message });
            }

            try {
                // Subida de imágenes principales del blog
                const blogImageUrls = await Promise.all(req.files['blog_image_url'].map(file => uploadImageToStorage(file)));

                // Procesamiento de las secciones del blog
                const processedSections = req.body.sections.map(section => ({
                    title: section.title || '',
                    content: section.content,
                    list: section.list || [],
                    links: section.links || [],
                }));

                // Creación del objeto del blog
                const tagsArray = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

                const newBlog = new Blog({
                    blog_image_url: blogImageUrls,
                    title: req.body.title,
                    blog_description: req.body.blog_description,
                    sections: processedSections,
                    user: req.user._id,
                    tags: tagsArray,
                });

                // Guardar el nuevo blog en la base de datos
                await newBlog.save();

                // Actualizar la referencia del blog en el usuario
                req.user.Blog.push(newBlog._id);
                await req.user.save();

                // Responder con el blog recién creado
                res.status(201).json(newBlog);
            } catch (error) {
                console.error('Error creating blog:', error);
                res.status(500).json({ message: 'Error interno del servidor', error: error.message });
            }
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};
// ============================================================================================================================================


// Controlador para obtener todos los blogs
const getAllBlogs = asyncHandler(async (req, res) => {
    try {
        // Obtener todos los blogs de la base de datos, incluyendo los likes poblados
        const blogs = await Blog.find().populate('likes');

        // Enviar la respuesta con los blogs encontrados
        res.status(200).json(blogs);
    } catch (error) {
        // Si ocurre un error, enviar una respuesta de error al cliente
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ==============================================================================================================================================

// Controlador para obtener un blog por su ID
const getBlogById = asyncHandler(async (req, res) => {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId).populate('User', 'first_name last_name').populate('comments');

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
    uploadImageToStorage
};

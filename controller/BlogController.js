const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const User = require('../models/userModel');


// ==================================================================================================================================================

// Configuración de Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
  },
});

const bucketName = 'quickcar';

// Configuración de multer
const multerStorage = multer.memoryStorage();
const upload_blog_img = multer({ storage: multerStorage }).single('blog_image_url');

// ==================================================================================================================================================

// Función para subir la imagen a Google Cloud Storage
const uploadImageToStorage = (file) => {
  return new Promise((resolve, reject) => {
    const blob = storage.bucket(bucketName).file(Date.now() + "_" + file.originalname);
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

// ===================================================================================================================================================

// Función para crear un blog

const createBlog = asyncHandler(async (req, res) => {
    try {
        const { title, tags, blog_description, sections } = req.body;

        // Validar campos requeridos
        if (!title || !blog_description || !sections || sections.length === 0) {
            return res.status(400).json({ message: 'Title, blog description, and at least one section are required' });
        }

        // Procesar imagen del blog si está presente
        let blogImageUrl;
        if (req.file) {
            // Subir la imagen a Google Cloud Storage (ejemplo, reemplaza con tu lógica de subida)
            blogImageUrl = await uploadImageToStorage(req.file);
        } else {
            return res.status(400).json({ message: 'Blog image is required' });
        }

        // Convertir los tags de cadena separada por comas a array si es necesario
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        // Crear las secciones del blog
        const blogSections = sections.map(section => ({
            title: section.title,
            content: section.content,
            list: section.list
        }));

        // Crear el nuevo blog con secciones
        const newBlog = new Blog({
            blog_image_url: blogImageUrl,
            title,
            blog_description,
            sections: blogSections,
            user: req.user._id, // Asignar el ID del usuario
            tags: tagsArray,
        });

        // Guardar el blog en la base de datos
        await newBlog.save();

        // Asociar el blog con el usuario
        req.user.Blog.push(newBlog._id);
        await req.user.save();

        res.status(201).json(newBlog);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return res.status(400).json({ message: 'Validation error', errors: validationErrors });
        }
        // Otros errores
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});


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
    upload_blog_img
};

const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración de Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    credentials: {
        private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GCLOUD_CLIENT_EMAIL,
    },
});

const bucketName = 'quickcar'; // Reemplazar con tu bucket de Google Cloud Storage

// Configuración de Multer para manejar la memoria
const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limitar tamaño de archivo a 5MB
});

// Función para subir una imagen a Google Cloud Storage
const uploadImageToStorage = async (file) => {
    return new Promise((resolve, reject) => {
        const blobName = `${uuidv4()}_${path.basename(file.originalname)}`;
        const blob = storage.bucket(bucketName).file(blobName);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
            resumable: false,
        });

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
        // Procesar la carga de imágenes utilizando Multer
        upload.array('blog_image_url', 5)(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                return res.status(400).json({ message: 'Error uploading files', error: err.message });
            } else if (err) {
                console.error('Unknown error during file upload:', err);
                return res.status(500).json({ message: 'Unknown error uploading files', error: err.message });
            }

            // Extraer datos del cuerpo de la solicitud
            const { title, tags, blog_description, sections } = req.body;

            // Validar campos requeridos
            if (!title || !blog_description || !sections || sections.length === 0) {
                return res.status(400).json({ message: 'Title, blog description, and at least one section are required' });
            }

            // Procesar las imágenes del blog
            const blogImageUrls = [];
            if (req.files && req.files.length > 0) {
                // Subir cada imagen del blog a Google Cloud Storage
                for (let file of req.files) {
                    const imageUrl = await uploadImageToStorage(file);
                    blogImageUrls.push(imageUrl);
                }
            } else {
                return res.status(400).json({ message: 'Blog images are required' });
            }

            // Convertir los tags de cadena separada por comas a array si es necesario
            const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

            // Crear las secciones del blog
            const blogSections = sections.map(section => ({
                title: section.title || '',
                content: section.content || [],
                list: section.list || [],
                links: section.links || [],
                blog_image_url: section.blog_image_url || [], // Aquí puedes añadir lógica para manejar imágenes de sección si es necesario
            }));

            // Crear el nuevo blog en la base de datos
            const newBlog = new Blog({
                blog_image_url: blogImageUrls,
                title,
                blog_description,
                sections: blogSections,
                user: req.user._id, // Suponiendo que `req.user._id` contiene el ID del usuario actual
                tags: tagsArray,
            });

            // Guardar el blog en la base de datos
            await newBlog.save();

            // Asociar el blog con el usuario
            req.user.Blog.push(newBlog._id);
            await req.user.save();

            // Enviar respuesta con el nuevo blog creado
            res.status(201).json(newBlog);
        });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
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


const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

//==================================================================================================================================
// Configuración de Google Cloud Storage

// Configuración de Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT_ID,
    credentials: {
        private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GCLOUD_CLIENT_EMAIL,
    },
});

const bucketName = 'quickcar'; // Nombre de tu bucket en Google Cloud Storage

// Configurar el almacenamiento en memoria para Multer
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// Función para subir una imagen a Google Cloud Storage
const uploadImageToStorage = async (file, altText) => {
    const blob = storage.bucket(bucketName).file(uuidv4() + "_" + file.originalname);
    const blobStream = blob.createWriteStream({ resumable: false });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
            reject(err);
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
            resolve({ url: publicUrl, alt: altText });
            console.log(`Imagen subida: ${publicUrl}`);
        });

        blobStream.end(file.buffer);
    });
};

// Middleware para manejar las imágenes y los datos del formulario
const handleFormData = (req, res, next) => {
    upload.fields([
        { name: 'blog_image_url', maxCount: 5 }, 
    ])(req, res, err => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'Error uploading images', error: err });
        } else if (err) {
            return res.status(500).json({ message: 'Internal server error', error: err });
        }
        next();
    });
};

// Función para procesar las imágenes de un campo específico
const processImages = async (files) => {
    let imageUrls = [];
    if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const imageUrl = await uploadImageToStorage(file, file.originalname);
            console.log(`URL de imagen subida: ${imageUrl}`);
            imageUrls.push(imageUrl);
        }
    }
    return imageUrls;
};

// Controlador para crear un nuevo blog
const createBlog = async (req, res) => {
    const { title, tags, blog_description, sections } = req.body;

    // Validar campos requeridos
    if (!title || !blog_description || !sections || sections.length === 0) {
        return res.status(400).json({ message: 'Title, blog description, and at least one section are required' });
    }

    try {
        // Procesar imágenes del blog principal
        const blogImageUrls = await processImages(req.files['blog_image_url']);

        // Procesar las secciones del blog
        const processedSections = sections.map(section => ({
            title: section.title || '',
            content: section.content || [],
            list: section.list || [],
            links: section.links || [],
        }));

        // Convertir los tags de cadena separada por comas a array si es necesario
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        // Crear el nuevo blog con secciones y URLs de imagen
        const newBlog = new Blog({
            blog_image_url: blogImageUrls,
            title,
            blog_description,
            sections: processedSections,
            user: req.user._id,
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
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Internal server error', error });
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
    uploadImageToStorage,
    handleFormData

};

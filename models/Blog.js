const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    blog_image_url: {
        type: String,
        required: [true, 'La URL de la imagen del blog es requerida'],
        validate: {
            validator: function(v) {
                // Validación de URL usando una expresión regular básica
                return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
            },
            message: props => `${props.value} no es una URL válida para la imagen del blog`
        }
    },
    title: {
        type: String,
        required: [true, 'El título del blog es requerido'],
        minlength: [5, 'El título debe tener al menos 5 caracteres'],
        maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    tags: {
        type: [String],
        validate: {
            validator: function(arr) {
                // Validación de que cada tag sea una cadena no vacía
                return arr.every(tag => typeof tag === 'string' && tag.trim().length > 0);
            },
            message: props => `Los tags deben ser cadenas no vacías`
        }
    },
    blog_description: {
        type: String,
        required: [true, 'La descripción del blog es requerida'],
        minlength: [10, 'La descripción debe tener al menos 10 caracteres']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario del blog es requerido'],
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Like'
    }]
}, {
    timestamps: true,
});

// Añadir índices si es necesario
blogSchema.index({ title: 'text', blog_description: 'text' });

module.exports = mongoose.model('Blog', blogSchema);

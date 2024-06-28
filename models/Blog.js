const mongoose = require('mongoose');

// Definición del esquema del blog
const blogSchema = new mongoose.Schema({
    blog_image_url: [{
        url: {
            type: String,
            required: true,
        },
        alt: {
            type: String,
            required: false, 
            trim: true,
        },
    }],
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
    sections: [{
        title: {
            type: String,
        },
        content: {
            type: [String],
            required: [true, 'El contenido de la sección es requerido'],
            minlength: [4, 'El contenido debe tener al menos 4 caracteres']
        },
        list: {
            type: [String],
        },
        links: {
            type: [{
                title: {
                    type: String,
                    required: false,
                    trim: true,
                },
                url: {
                    type: String,
                    required: false,
                    validate: {
                        validator: function(v) {
                            return v === '' || /^(ftp|http|https):\/\/[^ "]+$/.test(v);
                        },
                        message: props => `${props.value} no es una URL válida para el enlace`
                    }
                }
            }],
            validate: {
                validator: function(arr) {
                    return arr.every(link => (!link.title && !link.url) || (link.title && link.url));
                },
                message: 'Los enlaces deben tener título y URL válida'
            }
        },
        
    }],
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

blogSchema.index({
    title: 'text',
    blog_description: 'text',
    'sections.title': 'text',
    'sections.content': 'text'
});

module.exports = mongoose.model('Blog', blogSchema);

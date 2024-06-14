const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'El contenido es obligatorio'],
        minlength: [3, 'El contenido es muy corto. Mínimo 3 caracteres'],
        maxlength: [500, 'El contenido es muy largo. Máximo 500 caracteres'],
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El autor es obligatorio'],
        validate: {
            validator: async function(value) {
                const user = await mongoose.model('User').findById(value);
                return user !== null;
            },
            message: 'El autor no existe',
        },
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: [true, 'El blog es obligatorio'],
        validate: {
            validator: async function(value) {
                const blog = await mongoose.model('Blog').findById(value);
                return blog !== null;
            },
            message: 'El blog no existe',
        },
    },
}, {
    timestamps: true,
});

commentSchema.pre('save', function(next) {
    this.content = this.content.replace(/<[^>]*>?/gm, ''); 
    next();
});

module.exports = mongoose.model('Comment', commentSchema);

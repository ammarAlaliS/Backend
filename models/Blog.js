const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    blog_image_url: {
        type: String,
    },
    title: {
        type: String,
        required: true,
    },
    blog_description: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tags: {
        type: [String],
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Blog', blogSchema);

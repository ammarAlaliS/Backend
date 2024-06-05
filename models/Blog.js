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
 
    tags: {
        type: [String],
    },
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('Blog', blogSchema);

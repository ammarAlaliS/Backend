const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    like: {
        type: Number,
        default: 0,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Like', likeSchema);

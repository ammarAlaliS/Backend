const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    like: {
        type: Number,
        default: 0,
        required: true,
        min: 0, 
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model('Like', likeSchema);

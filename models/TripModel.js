
const mongoose = require('mongoose');

const tripMadeSchema = new mongoose.Schema({
    startLocation: {
        type: String,
        required: [true, 'Start location is required'],
        trim: true,
    },
    endLocation: {
        type: String,
        required: [true, 'End location is required'],
        trim: true,
    },
    fare: {
        type: Number,
        required: true
    },
    driverUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    tripUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model('TripMade', tripMadeSchema);
const mongoose = require('mongoose');

const startLocationSchema = new mongoose.Schema({
    startLocationName: {
        type: String,
        required: [false, 'Start location is required'],
        trim: true,
    },
    latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
    },
    driverUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quickcar',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('StartLocation', startLocationSchema);

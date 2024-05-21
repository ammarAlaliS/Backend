// models/Ride.js
const mongoose = require('mongoose');

const quickCarSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    vehicleType: {
        type: String,
        enum: ['Coche', 'Moto'],
        required: true,
    },
    vehicleModel: {
        type: String,
        required: true,
    },
    startLocation: {
        type: String,
        required: true,
    },
    endLocation: {
        type: String,
        required: true,
    },
    startTime: {
        hour: { type: Number, required: true },
        minute: { type: Number, required: true },
    },
    endTime: {
        hour: { type: Number, required: true },
        minute: { type: Number, required: true },
    },
    regularDays: {
        type: [String],
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: true,
    },
    availableSeats: {
        type: Number,
        required: true,
    },
    pricePerSeat: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    drivingLicense: {
        type: String,
    },
    fare: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const quickCar = mongoose.model('quickCar', quickCarSchema);

module.exports = quickCar;

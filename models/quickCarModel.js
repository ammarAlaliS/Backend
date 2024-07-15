const mongoose = require('mongoose');

const quickCarSchema = new mongoose.Schema({
    driverIsActiveState: {
        type: Boolean,
        default: false
    },
    vehicleType: {
        type: String,
        enum: ['Coche', 'Moto'],
        required: [true, 'Vehicle type is required'],
    },
    vehicleModel: {
        type: String,
        required: [true, 'Vehicle model is required'],
        trim: true,
    },
    vehicleModelImage: [{
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
    drivingLicense: {
        type: String,
        trim: true,
    },
    drivingLicenseImage: [{
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
    startTime: [
        {
            hour: {
                type: Number,
                min: 0,
                max: 23,
                required: [true, 'Start time hour is required'],
            },
            minute: {
                type: Number,
                min: 0,
                max: 59,
                required: [true, 'Start time minute is required'],
            },
        }
    ],
    endTime: [
        {
            hour: {
                type: Number,
                min: 0,
                max: 23,
                required: [true, 'End time hour is required'],
            },
            minute: {
                type: Number,
                min: 0,
                max: 59,
                required: [true, 'End time minute is required'],
            },
        }
    ],
    regularDays: {
        type: [String],
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: [true, 'Regular days are required'],
    },
    availableSeats: {
        type: Number,
        min: 1,
        required: [true, 'Available seats is required and should be at least 1'],
    },
    pricePerSeat: {
        type: Number,
        required: [true, 'Price per seat is required'],
    },
    TripFare: {
        type: Number,
        required: [true, 'Fare is required'],
    },
    PricePerKilometer: {
        type: Number,
        required: [true, 'Fare is required'],
    },
    starLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StartLocation',
        required: true
    },
    endLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EndLocation',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    CurrentQuickCarLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CurrentQuickCarLocation',
        required: false,
        index: true,
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model('QuickCar', quickCarSchema);

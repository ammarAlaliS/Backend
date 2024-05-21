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
        required: [true, 'Vehicle type is required'],
    },
    vehicleModel: {
        type: String,
        required: [true, 'Vehicle model is required'],
    },
    startLocation: {
        type: String,
        required: [true, 'Start location is required'],
    },
    endLocation: {
        type: String,
        required: [true, 'End location is required'],
    },
    startTime: {
        hour: { 
            type: Number, 
            required: [true, 'Start hour is required'],
            min: 0,
            max: 23
        },
        minute: { 
            type: Number, 
            required: [true, 'Start minute is required'],
            min: 0,
            max: 59
        },
    },
    endTime: {
        hour: { 
            type: Number, 
            required: [true, 'End hour is required'],
            min: 0,
            max: 23
        },
        minute: { 
            type: Number, 
            required: [true, 'End minute is required'],
            min: 0,
            max: 59
        },
    },
    regularDays: {
        type: [String],
        enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        required: [true, 'Regular days are required'],
    },
    availableSeats: {
        type: Number,
        required: [true, 'Available seats are required'],
        min: 1,
    },
    pricePerSeat: {
        type: Number,
        required: [true, 'Price per seat is required'],
    },
    image: {
        type: String,
        validate: {
            validator: function(v) {
                return v ? /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v) : true;
            },
            message: 'Invalid URL'
        },
    },
    drivingLicense: {
        type: String,
    },
    fare: {
        type: Number,
        required: [true, 'Fare is required'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const QuickCar = mongoose.model('QuickCar', quickCarSchema);

module.exports = QuickCar;

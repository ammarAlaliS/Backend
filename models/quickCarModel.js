const mongoose = require('mongoose');

const quickCarSchema = new mongoose.Schema({
    driver_information: {
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
        startTime: {
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
        },
        endTime: {
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
        },
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
        image: {
            type: String,
            trim: true,
            validate: {
                validator: (v) => {
                    const regex = /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i;
                    return regex.test(v);
                },
                message: (props) => `${props.value} is not a valid image URL`,
            },
        },
        drivingLicense: {
            type: String,
            trim: true,
        },
        fare: {
            type: Number,
            required: [true, 'Fare is required'],
        },
    },
    Trips: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TripMade',
        required: false,
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model('QuickCar', quickCarSchema);

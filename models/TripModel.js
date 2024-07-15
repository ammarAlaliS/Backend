const mongoose = require('mongoose');

const tripMadeSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pending', 'Created', 'ongoing', 'completed', 'canceled'],
    },
    paymentType: {
        type: String,
        required: true,
        enum: ['cash', 'card', 'online'],
    },
    numberOfSeatsRequested: {
        type: Number,
        required: true,
    },
    totalRate: {
        type: Number,
        required: true,
    },
    startLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StartLocation',
        required: true,
    },
    endLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EndLocation',
        required: true,
    },
    driverUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    passengerUsers: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('TripMade', tripMadeSchema);

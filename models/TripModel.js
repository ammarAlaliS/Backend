
const mongoose = require('mongoose');

const tripMadeSchema = new mongoose.Schema({
    status: { type: String, 
        required: true, 
        enum: ['Requested', 'Rejected', 'Accepted', 'Paid', 'Processing', 'Completed'] 
    },
     paymentType : {
        type: String,
        required: [true, 'Start location is required'],
        trim: true,
     },
    numberOfSeatsRequested: {
        type: Number,
        min: 0,
        max: 3,
        required: [true, 'number of seats requested is required'],
    }, 
    totalRate: {
        type: Number,
        required: true
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
    driverUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quickcar',
    },
    passengerUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true,
});
module.exports = mongoose.model('TripMade', tripMadeSchema);
const mongoose = require("mongoose");

const tripMadeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "Created", "ongoing", "completed", "canceled"],
    },
    paymentType: {
      type: String,
      required: true,
      enum: ["cash", "card", "online"],
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
      startLocationName: {
        type: String,
        required: [false, "Start location is required"],
        trim: true,
      },
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    endLocation: {
      endLocationName: {
        type: String,
        required: [false, "End location is required"],
        trim: true,
      },
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
        min: [-90, "Latitude must be between -90 and 90"],
        max: [90, "Latitude must be between -90 and 90"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
        min: [-180, "Longitude must be between -180 and 180"],
        max: [180, "Longitude must be between -180 and 180"],
      },
    },
    tripDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    driverUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuickCar",
      required: true,
    },
    passengerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TripMade", tripMadeSchema);

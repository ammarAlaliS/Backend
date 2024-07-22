const mongoose = require("mongoose");

const quickCarSchema = new mongoose.Schema(
  {
    driverIsActiveState: {
      type: Boolean,
      default: false,
    },
    vehicleType: {
      type: String,
      enum: ["Coche", "Moto"],
      required: [true, "Vehicle type is required"],
    },
    vehicleModel: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    vehicleModelImage: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          required: false,
          trim: true,
        },
      },
    ],
    drivingLicense: {
      type: String,
      trim: true,
    },
    drivingLicenseImage: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          required: false,
          trim: true,
        },
      },
    ],
    startTime: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
        required: [true, "Start time hour is required"],
      },
      minute: {
        type: Number,
        min: 0,
        max: 59,
        required: [true, "Start time minute is required"],
      },
    },
    endTime: {
      hour: {
        type: Number,
        min: 0,
        max: 23,
        required: [true, "End time hour is required"],
      },
      minute: {
        type: Number,
        min: 0,
        max: 59,
        required: [true, "End time minute is required"],
      },
    },
    regularDays: {
      type: [String],
      enum: [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ],
      required: [true, "Regular days are required"],
    },
    availableSeats: {
      type: Number,
      min: 1,
      required: [true, "Available seats is required and should be at least 1"],
    },
    pricePerSeat: {
      type: Number,
      required: [true, "Price per seat is required"],
    },
    TripFare: {
      type: Number,
      required: [true, "Fare is required"],
    },
    PricePerKilometer: {
      type: Number,
      required: [true, "Fare is required"],
    },
    starLocation: {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    CurrentQuickCarLocation: {
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuickCar", quickCarSchema);

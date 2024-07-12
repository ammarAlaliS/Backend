const mongoose = require("mongoose");

const quickCarLocationSchema = new mongoose.Schema({
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
});

const QuickCarLocation = mongoose.model("QuickCarLocation",quickCarLocationSchema);

module.exports = QuickCarLocation;

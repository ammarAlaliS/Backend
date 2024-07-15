const mongoose = require("mongoose");

const CurrentQuickCarLocationSchema = new mongoose.Schema({
  CurrentLatitude: {
    type: Number,
    required: [false, "Latitude is required"],
    min: [-90, "Latitude must be between -90 and 90"],
    max: [90, "Latitude must be between -90 and 90"],
  },
  CurrentLongitude: {
    type: Number,
    required: [false, "Longitude is required"],
    min: [-180, "Longitude must be between -180 and 180"],
    max: [180, "Longitude must be between -180 and 180"],
  },
});

module.exports = mongoose.model("CurrentQuickCarLocation", CurrentQuickCarLocationSchema);

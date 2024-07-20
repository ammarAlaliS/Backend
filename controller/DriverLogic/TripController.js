const TripMade = require("../../models/TripModel");
const QuickCar = require("../../models/quickCarModel");
const User = require("../../models/userModel");
const asyncHandler = require("express-async-handler");

// Function to calculate the distance between two geographic points
function calculateDistance(point1, point2) {
  const lat1 = point1.lat;
  const lon1 = point1.lon;
  const lat2 = point2.lat;
  const lon2 = point2.lon;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

// Controller to create a new trip
const createTrip = asyncHandler(async (req, res) => {
  const userId = req.user._id; // ID of the driver user obtained from the JWT token
  const {
    paymentType,
    startLocationName,
    startLocationLatitude,
    startLocationLongitude,
    endLocationName,
    endLocationLatitude,
    endLocationLongitude,
    numberOfSeatsRequested,
    quickCarId,
  } = req.body;

  // Find the QuickCar associated with the driver user
  const quickCar = await QuickCar.findById(quickCarId);

  if (!quickCar || !quickCar.driverIsActiveState) {
    return res
      .status(400)
      .json({ error: "El QuickCar no está activo o no existe." });
  }

  if (numberOfSeatsRequested > quickCar.availableSeats) {
    return res.status(400).json({
      error:
        "El número de asientos solicitados excede los disponibles en el QuickCar.",
    });
  }

  // Ensure valid IDs for StartLocation and EndLocation
  const newTrip = await TripMade.create({
    status: "pending",
    paymentType,
    numberOfSeatsRequested,
    totalRate: quickCar.pricePerSeat * numberOfSeatsRequested,
    startLocation: {
      startLocationName: startLocationName,
      latitude: startLocationLatitude,
      longitude: startLocationLongitude,
    },
    endLocation: {
      endLocationName: endLocationName,
      latitude: endLocationLatitude,
      longitude: endLocationLongitude,
    },
    driverUser: quickCarId,
    passengerUser: userId, // Cambia a un array vacío
  });

  res.status(201).json(newTrip);
});

// Controller to join an existing trip
const joinTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const userId = req.user._id;

  const trip = await TripMade.findById(tripId);

  return res.status(500).json({ error: "Endpoint no implementado" });

  if (!trip) {
    return res.status(404).json({ error: "Viaje no encontrado" });
  }

  // if (trip.passengerUsers.length >= 4) {
  //   return res.status(400).json({ error: "El viaje ya está completo." });
  // }

  // if (trip.passengerUsers.includes(userId)) {
  //   return res
  //     .status(400)
  //     .json({ error: "El usuario ya está suscrito a este viaje." });
  // }

  trip.passengerUsers.push(userId);
  await trip.save();

  res.json(trip);
});

// Controller to get all trips
const getAllTrips = asyncHandler(async (req, res) => {
  try {
    const trips = await TripMade.find()
      .populate({
        path: "driverUser",
        select:
          "global_user.first_name global_user.last_name global_user.profile_img_url global_user.role",
      })
      .populate({
        path: "passengerUser",
        select:
          "global_user.first_name global_user.last_name global_user.profile_img_url global_user.role",
      });

    res.status(200).json(trips);
  } catch (error) {
    console.error("Error acquiring all trips:", error);
    res.status(500).json({ error: "Failed to acquire all trips" });
  }
});

const updateTripStatus = asyncHandler(async (req, res) => {
  const { tripId, estado } = req.body;

  const trip = await TripMade.findById(tripId);
  if (!trip) {
    return res.status(404).json({ error: "Viaje no encontrado" });
  }

  if (estado === "canceled" && trip.status === "pending") {
    await TripMade.findByIdAndDelete(tripId);
    return res.status(204).json({ data: null });
  } else {
    trip.status = estado;
    await trip.save();
    return res.status(204).json({ data: null });
  }
});
module.exports = {
  createTrip,
  joinTrip,
  calculateDistance,
  getAllTrips,
  updateTripStatus,
};

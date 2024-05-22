const TripMade = require('../models/TripModel');
const User = require('../models/userModel');

const asyncHandler = require('express-async-handler');

const createTrip = asyncHandler(async (req, res) => {
  try {
    // Extraer el ID del usuario del conductor del token JWT
    const driverUserId = req.user._id;

    // Crear un nuevo viaje con los datos proporcionados en el cuerpo de la solicitud
    const newTrip = await TripMade.create({ ...req.body, driverUser: driverUserId });

    // Responder con el nuevo viaje
    res.status(201).json(newTrip);
  } catch (error) {
    // Manejar errores
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

const joinTrip = asyncHandler(async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const userId = req.user._id; // Suponiendo que req.user contiene la información del usuario autenticado
    
    // Buscar el viaje por su ID
    const trip = await TripMade.findById(tripId);

    if (!trip) {
      return res.status(404).json({ msg: 'Trip not found' });
    }

    // Verificar si ya hay un usuario inscrito en el viaje
    if (trip.tripUser) {
      return res.status(400).json({ msg: 'Trip already has a user' });
    }

    // Asignar el ID del usuario al viaje y guardarlo
    trip.tripUser = userId;
    await trip.save();

    res.json(trip);
  } catch (error) {
    console.error('Error joining trip:', error);
    res.status(500).json({ error: 'Failed to join trip' });
  }
});

module.exports = {
  createTrip, 
  joinTrip
};

const QuickCar = require("../../models/quickCarModel");
const tripModel = require("../../models/TripModel");
const asyncHandler = require("express-async-handler");

function calculateDistance(lat1, lon1, loc2) {
  const lat2 = loc2.latitude;
  const lon2 = loc2.longitude;

  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

const calculateLatitudes = (latitude) => {
  const EARTH_RADIUS_KM = 6371; // Radio de la Tierra en km
  const DISTANCE_KM = 15; // Distancia en km

  // Convertir la distancia de km a grados de latitud
  const distanceInDegrees = DISTANCE_KM / 111; // Aproximadamente 111 km por grado de latitud

  const latitudePlus = latitude + distanceInDegrees;
  const latitudeMinus = latitude - distanceInDegrees;

  return {
    latitudePlus,
    latitudeMinus,
  };
};

const calculateLongitudes = (longitude, latitude) => {
  const EARTH_RADIUS_KM = 6371; // Radio de la Tierra en km
  const DISTANCE_KM = 15; // Distancia en km

  // Convertir la distancia de km a grados de longitud en una latitud específica
  const distanceInDegrees =
    DISTANCE_KM / (111 * Math.cos((latitude * Math.PI) / 180));

  const longitudePlus = longitude + distanceInDegrees;
  const longitudeMinus = longitude - distanceInDegrees;

  return {
    longitudePlus,
    longitudeMinus,
  };
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const getNearbyQuickCars = asyncHandler(async (req, res) => {
  const { userLatitude, userLongitude } = req.query;

  if (!userLatitude || !userLongitude) {
    return res
      .status(400)
      .json({ message: "Se requieren las coordenadas del usuario." });
  }

  const userLat = parseFloat(userLatitude);
  const userLng = parseFloat(userLongitude);

  const maxDistance = 10;

  try {
    const { latitudePlus, latitudeMinus } = calculateLatitudes(userLat);
    const { longitudePlus, longitudeMinus } = calculateLongitudes(
      userLng,
      userLat
    );

    const activeQuickCars = await QuickCar.find({
      "CurrentQuickCarLocation.latitude": {
        $gte: latitudeMinus,
        $lte: latitudePlus,
      },
      "CurrentQuickCarLocation.longitude": {
        $gte: longitudeMinus,
        $lte: longitudePlus,
      },
    }).populate({
      path: "user",
    });

    const nearbyQuickCars = [];
    let driversFound = false;

    activeQuickCars.forEach((quickCar) => {
      const distanceToQuickCarLocation = calculateDistance(
        userLat,
        userLng,
        quickCar.CurrentQuickCarLocation
      );

      const midpointBetweenLocations = {
        latitude: (userLat + quickCar.CurrentQuickCarLocation.latitude) / 2,
        longitude: (userLng + quickCar.CurrentQuickCarLocation.longitude) / 2,
      };

      const distanceToMidpointBetweenLocations = calculateDistance(
        userLat,
        userLng,
        midpointBetweenLocations
      );

      if (
        distanceToQuickCarLocation <= maxDistance ||
        distanceToMidpointBetweenLocations <= maxDistance
      ) {
        const formattedQuickCar = {
          id: quickCar.id,
          driverIsActiveState: true,
          vehicleType: quickCar.vehicleType,
          vehicleModel: quickCar.vehicleModel,
          vehicleModelImage: quickCar.vehicleModelImage,
          drivingLicense: quickCar.drivingLicense,
          drivingLicenseImage: quickCar.drivingLicenseImage,
          startTime: quickCar.startTime,
          endTime: quickCar.endTime,
          regularDays: quickCar.regularDays,
          availableSeats: quickCar.availableSeats,
          pricePerSeat: quickCar.pricePerSeat,
          TripFare: quickCar.TripFare,
          PricePerKilometer: quickCar.PricePerKilometer,
          starLocation: quickCar.starLocation,
          endLocation: quickCar.endLocation,
          CurrentQuickCarLocation: quickCar.CurrentQuickCarLocation,
          vehicleModelImageUrl: quickCar.vehicleModelImageUrl,
          user: {
            id: quickCar.user.id,
            name: quickCar.user.global_user.first_name,
            lastName: quickCar.user.global_user.last_name,
            driverImage: quickCar.user.global_user.profile_img_url,
          },
        };

        if (!nearbyQuickCars.some((car) => car.id === quickCar.id)) {
          nearbyQuickCars.push(formattedQuickCar);
        }

        driversFound = true;
      }
    });

    if (!driversFound) {
      return res.status(404).json({
        message:
          "No se encontraron conductores dentro del rango de 10 kilómetros.",
      });
    }

    res.status(200).json({
      message: "Lista de conductores en el rango de 10 kilómetros.",
      conductores: nearbyQuickCars,
    });
  } catch (error) {
    console.error("Error al buscar QuickCars cercanos:", error);
    res
      .status(500)
      .json({ message: "Hubo un problema al buscar QuickCars cercanos." });
  }
});

const getNearbyLocationQuickCars = asyncHandler(async (req, res) => {
  const {
    starLocationLatitude,
    starLocationLongitude,
    endLocationLatitude,
    endLocationLongitude,
    starTimeHour,
    starTimeMinutes,
    numberOfSeatRequested,
    tripDate
  } = req.query;

  const maxDistance = 10;

  const midpointBetweenTripLocations = {
    latitude:
      (parseFloat(starLocationLatitude) + parseFloat(endLocationLatitude)) / 2,
    longitude:
      (parseFloat(starLocationLongitude) + parseFloat(endLocationLongitude)) /
      2,
  };

  const { latitudeMinus, latitudePlus } = calculateLatitudes(
    midpointBetweenTripLocations.latitude
  );

  const { longitudePlus, longitudeMinus } = calculateLongitudes(
    midpointBetweenTripLocations.longitude,
    midpointBetweenTripLocations.latitude
  );

  const activeQuickCars = await QuickCar.find({
    "CurrentQuickCarLocation.latitude": {
      $gte: latitudeMinus,
      $lte: latitudePlus,
    },
    "CurrentQuickCarLocation.longitude": {
      $gte: longitudeMinus,
      $lte: longitudePlus,
    },
    availableSeats: {
      $gte: parseFloat(numberOfSeatRequested),
    },
    $or: [
      { "startTime.hour": { $lt: parseFloat(starTimeHour) } },
      {
        "startTime.hour": parseFloat(starTimeHour),
        "startTime.minute": { $lte: parseFloat(starTimeMinutes) },
      },
    ],
  }).populate({
    path: "user",
  });

  const nearbyQuickCars = [];
  let driversFound = false;

  activeQuickCars.forEach((quickCar) => {
    const distanceToQuickCarLocationFromMidTripUser = calculateDistance(
      midpointBetweenTripLocations.latitude,
      midpointBetweenTripLocations.longitude,
      quickCar.CurrentQuickCarLocation
    );

    const midpointBetweenQuickCarLocations = {
      latitude:
        (quickCar.starLocation.latitude + quickCar.endLocation.latitude) / 2,
      longitude:
        (quickCar.starLocation.longitude + quickCar.endLocation.longitude) / 2,
    };

    const distanceToMidpointBetweenLocations = calculateDistance(
      midpointBetweenTripLocations.latitude,
      midpointBetweenTripLocations.longitude,
      midpointBetweenQuickCarLocations
    );

    if (
      distanceToQuickCarLocationFromMidTripUser <= maxDistance ||
      distanceToMidpointBetweenLocations <= maxDistance
    ) {
      const formattedQuickCar = {
        id: quickCar.id,
        driverIsActiveState: true,
        vehicleType: quickCar.vehicleType,
        vehicleModel: quickCar.vehicleModel,
        vehicleModelImage: quickCar.vehicleModelImage,
        drivingLicense: quickCar.drivingLicense,
        drivingLicenseImage: quickCar.drivingLicenseImage,
        startTime: quickCar.startTime,
        endTime: quickCar.endTime,
        regularDays: quickCar.regularDays,
        availableSeats: quickCar.availableSeats,
        pricePerSeat: quickCar.pricePerSeat,
        TripFare: quickCar.TripFare,
        PricePerKilometer: quickCar.PricePerKilometer,
        starLocation: quickCar.starLocation,
        endLocation: quickCar.endLocation,
        CurrentQuickCarLocation: quickCar.CurrentQuickCarLocation,
        vehicleModelImageUrl: quickCar.vehicleModelImageUrl,
        user: {
          id: quickCar.user.id,
          name: quickCar.user.global_user.first_name,
          lastName: quickCar.user.global_user.last_name,
          driverImage: quickCar.user.global_user.profile_img_url,
        },
      };
      if (!nearbyQuickCars.some((car) => car.id === quickCar.id)) {
        nearbyQuickCars.push(formattedQuickCar);
      }
      driversFound = true;
    }
  });

  const quickCarIds=nearbyQuickCars.map(car => car.id);

  const trips = await tripModel.find({
    driverUser: { $in: quickCarIds },
    tripDate:tripDate,
    $or:[
        {status: "Created"},
        {status: "ongoing"},
    ]
  });

  let nearbyQuickCarsFilters=[];

  nearbyQuickCars.forEach((quickCar) => {

    let tripsFilters=trips.map((trip)=> trip.driverUser==quickCar.id);
    if(tripsFilters.length>0){

      let seatAvaible=quickCar.availableSeats;

      tripsFilters.forEach(element => {
        seatAvaible=seatAvaible-element.numberOfSeatsRequested;
      });
      
      if(seatAvaible>=numberOfSeatRequested){
        nearbyQuickCarsFilters.push(quickCar);
      }

    }else{
      nearbyQuickCarsFilters.push(quickCar);
    }
  });


  if (!driversFound) {
    return res.status(404).json({
      message:
        "No se encontraron conductores dentro del rango de 10 kilómetros.",
    });
  }

  res.status(200).json({
    message: "Lista de conductores en el rango de 10 kilómetros.",
    conductores: nearbyQuickCarsFilters,
  });
});

module.exports = {
  getNearbyQuickCars,
  calculateDistance,
  getNearbyLocationQuickCars,
};


const QuickCar = require('../../models/quickCarModel');
const asyncHandler = require('express-async-handler');


function calculateDistance(lat1, lon1, loc2) {
    const lat2 = loc2.latitude;
    const lon2 = loc2.longitude;

    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 

    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const getNearbyQuickCars = asyncHandler(async (req, res) => {
    const { userLatitude, userLongitude } = req.query;

    if (!userLatitude || !userLongitude) {
        return res.status(400).json({ message: 'Se requieren las coordenadas del usuario.' });
    }

    const userLat = parseFloat(userLatitude);
    const userLng = parseFloat(userLongitude);
    const maxDistance = 10;

    try {
        const activeQuickCars = await QuickCar.find({
            driverIsActiveState: true,
        })
            .populate('starLocation')
            .populate('endLocation')
            .populate({
                path: 'user',
                select: 'global_user.first_name global_user.last_name global_user.profile_img_url'
            });

        const nearbyQuickCars = [];
        let driversFound = false;

        activeQuickCars.forEach(quickCar => {
            const vehicleModelImage = quickCar.vehicleModelImage || [];
            const vehicleModelImageUrl = vehicleModelImage.map(image => image.url);

            const startTime = quickCar.startTime && quickCar.startTime.length > 0 ? quickCar.startTime[0] : null;
            const endTime = quickCar.endTime && quickCar.endTime.length > 0 ? quickCar.endTime[0] : null;

            const distanceToStarLocation = calculateDistance(userLat, userLng, quickCar.starLocation);
            const distanceToEndLocation = calculateDistance(userLat, userLng, quickCar.endLocation);

            if (distanceToStarLocation <= maxDistance || distanceToEndLocation <= maxDistance) {
                const formattedQuickCar = {
                    DriverState: 'Activo',
                    vehicleType: quickCar.vehicleType,
                    vehicleModel: quickCar.vehicleModel,
                    StarLocation: quickCar.starLocation.startLocationName,
                    EndLocation: quickCar.endLocation.endLocationName,
                    StarTime: startTime ? { hour: startTime.hour, minute: startTime.minute } : null,
                    EndTime: endTime ? { hour: endTime.hour, minute: endTime.minute } : null,
                    availableSeats: quickCar.availableSeats,
                    pricePerSeat: quickCar.pricePerSeat,
                    vehicleModelImageUrl: vehicleModelImageUrl,
                    PricePerKilometer: quickCar.PricePerKilometer,
                    user: {
                        name: quickCar.user.global_user.first_name,
                        lastName: quickCar.user.global_user.last_name,
                        driverImage: quickCar.user.global_user.profile_img_url
                    },
                };

                if (!nearbyQuickCars.some(car => car._id === quickCar._id)) {
                    nearbyQuickCars.push(formattedQuickCar);
                }

                driversFound = true;
            }
        });

        if (!driversFound) {
            return res.status(404).json({ message: 'No se encontraron conductores dentro del rango de 10 kilómetros.' });
        }

        res.status(200).json({
            message: 'Lista de conductores en el rango de 10 kilómetros.',
            conductores: nearbyQuickCars
        });

    } catch (error) {
        console.error('Error al buscar QuickCars cercanos:', error);
        res.status(500).json({ message: 'Hubo un problema al buscar QuickCars cercanos.' });
    }
});

module.exports = { getNearbyQuickCars, calculateDistance };
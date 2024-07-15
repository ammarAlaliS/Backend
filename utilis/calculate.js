// Función para calcular la distancia en kilómetros entre dos puntos geográficos dados sus coordenadas (latitud y longitud)
function calculateDistance(lat1, lon1, loc2) {
  const lat2 = loc2.latitude;
  const lon2 = loc2.longitude;

  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en kilómetros

  return distance;
}

// Función para convertir grados a radianes
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = calculateDistance;

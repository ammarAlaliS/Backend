const socketIo = require("socket.io");

let io;

function initialize(server) {
  io = socketIo(server);
  io.on("connection", (socket) => {
    console.log("Un cliente se ha conectado");

    //Unirse a una sala
    io.on("joinDriverRoom", (roomId) => {
      socket.join(roomId);
    });

    // Emitir ubicacion a una sala
    socket.on("sendDriverLocation", ({ room, driverLocation }) => {
      io.to(room).emit("reciveDriverLocation", driverLocation);
    });
  });
}

function emitEvent(eventName, eventData) {
  if (io) {
    io.emit(eventName, eventData);
    console.log(`Evento "${eventName}" emitido con los datos:`, eventData);
  } else {
    console.error("Socket.io is not initialized");
  }
}

module.exports = {
  initialize,
  emitEvent,
};

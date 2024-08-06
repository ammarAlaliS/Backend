const socketIo = require("socket.io");

let io;

function initialize(server) {
  io = socketIo(server);
  io.on("connection", (socket) => {
    console.log("Un cliente se ha conectado");
    socket.on("joinDriverRoom", (roomId) => {
      socket.join(roomId);
    });
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
    console.error("Socket.io no está inicializado");
  }
}

module.exports = {
  initialize,
  emitEvent,
};

// socket/MessageSocket.js
const socketIo = require("socket.io");

let io;

function initializeServer(server) {
  io = socketIo(server);
  io.on("connection", (socket) => {
    console.log("Un cliente se ha conectado");

    // Unirse a una sala
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    // Emitir ubicación a una sala
    socket.on("sendLocation", ({ room, location }) => {
      io.to(room).emit("receiveLocation", location);
    });
  });
}

function emitEvent(room, eventName, eventData) {
  if (io) {
    io.to(room).emit(eventName, eventData);
    console.log(`Evento "${eventName}" emitido a la sala "${room}" con los datos:`, eventData);
  } else {
    console.error("Socket.io no está inicializado");
  }
}

module.exports = {
  initializeServer,
  emitEvent,
};

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  walletEntity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  totalDeposit: {
    type: Number,
    required: true,
  },
  totalCommission: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  startTime: { 
    type: Date, 
    required: true
 },
  endTime: { 
    type: Date, 
    required: true 
},
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

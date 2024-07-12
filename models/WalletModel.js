const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  totalPaid: { 
    type: Number, 
    required: true 
},
  cashPaymentCommissions: { 
    type: Number,
     required: true 
    },
  quickCarUser: { type: mongoose.Schema.Types.ObjectId,
     ref: 'QuickCar', 
     required: true 
    }
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;

const mongoose = require('mongoose');

const lootBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number, // in cents
    required: true
  },
  rewards: [{
    type: {
      type: String,
      enum: ['voice', 'profilePicture', 'coins', 'gems'],
      required: true
    },
    itemId: String,
    quantity: Number,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary']
    },
    probability: Number // 0-100
  }],
  guaranteedReward: {
    type: {
      type: String,
      enum: ['voice', 'profilePicture', 'coins', 'gems']
    },
    itemId: String,
    quantity: Number
  }
});

module.exports = mongoose.model('LootBox', lootBoxSchema);


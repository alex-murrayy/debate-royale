const mongoose = require('mongoose');

const voiceSchema = new mongoose.Schema({
  voiceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['free', 'premium', 'lootbox'],
    default: 'free'
  },
  price: {
    coins: Number,
    gems: Number,
    realMoney: Number // in cents
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  levelRequired: {
    type: Number,
    default: 1
  },
  unlockedByDefault: {
    type: Boolean,
    default: false
  },
  elevenLabsVoiceId: String,
  previewUrl: String
});

module.exports = mongoose.model('Voice', voiceSchema);


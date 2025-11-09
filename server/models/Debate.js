const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  player1: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    side: {
      type: String,
      enum: ['for', 'against'],
      required: true
    },
    arguments: [{
      text: String,
      timestamp: Date,
      voiceoverUrl: String
    }]
  },
  player2: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    side: {
      type: String,
      enum: ['for', 'against']
    },
    arguments: [{
      text: String,
      timestamp: Date,
      voiceoverUrl: String
    }]
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  finishedAt: Date,
  duration: Number // in seconds
});

module.exports = mongoose.model('Debate', debateSchema);


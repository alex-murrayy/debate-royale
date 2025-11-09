const mongoose = require('mongoose');

const debateSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  player1: {
    sessionId: {
      type: String,
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
    sessionId: String,
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
  votes: {
    player1: {
      type: Number,
      default: 0
    },
    player2: {
      type: Number,
      default: 0
    },
    voters: [{
      type: String // sessionId of voters
    }]
  },
  spectatorCount: {
    type: Number,
    default: 0
  },
  winner: {
    type: String, // 'player1' or 'player2'
    default: null
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


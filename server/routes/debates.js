const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Debate = require('../models/Debate');

// Helper to check if database is connected
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get active debates (public - no auth required)
router.get('/active', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please start MongoDB or configure MONGODB_URI'
      });
    }
    
    const debates = await Debate.find({ status: 'active' })
      .sort({ startedAt: -1 })
      .limit(20)
      .select('topic player1 player2 status startedAt spectatorCount votes');
    
    res.json(debates);
  } catch (error) {
    console.error('❌ Error fetching active debates:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch debates' });
  }
});

// Get debate by ID (public - no auth required)
// NOTE: This must come AFTER /active route to avoid matching "active" as an ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Fetching debate by ID:', id);
    
    if (!id) {
      return res.status(400).json({ error: 'Debate ID is required' });
    }

    if (!isDBConnected()) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please start MongoDB or configure MONGODB_URI'
      });
    }

    const debate = await Debate.findById(id);
    if (!debate) {
      console.error('❌ Debate not found in database:', id);
      return res.status(404).json({ error: 'Debate not found' });
    }

    console.log('✅ Debate found:', debate._id, debate.topic);
    res.json(debate);
  } catch (error) {
    console.error('❌ Error fetching debate:', error);
    // Check if it's an invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid debate ID format' });
    }
    // Check if it's a database connection error
    if (error.name === 'MongoServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please start MongoDB or configure MONGODB_URI'
      });
    }
    res.status(500).json({ error: error.message || 'Failed to fetch debate' });
  }
});

module.exports = router;


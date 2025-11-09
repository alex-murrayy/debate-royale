const express = require('express');
const router = express.Router();
const Debate = require('../models/Debate');
const auth = require('../middleware/auth');

// Get user's debates
router.get('/my-debates', auth, async (req, res) => {
  try {
    const debates = await Debate.find({
      $or: [
        { 'player1.userId': req.userId },
        { 'player2.userId': req.userId }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json(debates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get debate by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    res.json(debate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;


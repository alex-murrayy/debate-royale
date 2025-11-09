const express = require('express');
const router = express.Router();
const Debate = require('../models/Debate');
const User = require('../models/User');
const { auth0Middleware, auth0ErrorHandler } = require('../middleware/auth0');

router.use(auth0Middleware);
router.use(auth0ErrorHandler);

// Get user's debates
router.get('/my-debates', async (req, res) => {
  try {
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const debates = await Debate.find({
      $or: [
        { 'player1.userId': user._id },
        { 'player2.userId': user._id }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json(debates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get debate by ID
router.get('/:id', async (req, res) => {
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


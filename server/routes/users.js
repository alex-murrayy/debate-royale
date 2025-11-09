const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile picture
router.put('/profile-picture', auth, async (req, res) => {
  try {
    const { pictureId } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user.unlockedPictures.includes(pictureId) && pictureId !== 'default-1') {
      return res.status(403).json({ error: 'Picture not unlocked' });
    }

    user.profilePicture = pictureId;
    await user.save();

    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update selected voice
router.put('/voice', auth, async (req, res) => {
  try {
    const { voiceId } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user.unlockedVoices.includes(voiceId) && voiceId !== 'default') {
      return res.status(403).json({ error: 'Voice not unlocked' });
    }

    user.selectedVoice = voiceId;
    await user.save();

    res.json({ success: true, selectedVoice: user.selectedVoice });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;


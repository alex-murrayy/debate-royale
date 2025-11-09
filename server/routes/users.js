const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth0Middleware, auth0ErrorHandler } = require('../middleware/auth0');

// Apply Auth0 middleware to all routes
router.use(auth0Middleware);
router.use(auth0ErrorHandler);

// Get or create user from Auth0
router.post('/create', async (req, res) => {
  try {
    const { auth0Id, email, username, picture } = req.body;
    const auth0Sub = req.auth.sub; // From Auth0 token

    // Check if user exists
    let user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      // Create new user
      user = new User({
        auth0Id: auth0Sub,
        email: email || req.auth.email,
        username: username || email.split('@')[0],
        profilePicture: picture || 'default-1'
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile picture
router.put('/profile-picture', async (req, res) => {
  try {
    const { pictureId } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.unlockedPictures.includes(pictureId) && pictureId !== 'default-1') {
      return res.status(403).json({ error: 'Picture not unlocked' });
    }

    user.profilePicture = pictureId;
    await user.save();

    res.json({ success: true, profilePicture: user.profilePicture, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update selected voice
router.put('/voice', async (req, res) => {
  try {
    const { voiceId } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.unlockedVoices.includes(voiceId) && voiceId !== 'default') {
      return res.status(403).json({ error: 'Voice not unlocked' });
    }

    user.selectedVoice = voiceId;
    await user.save();

    res.json({ success: true, selectedVoice: user.selectedVoice, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update username
router.put('/username', async (req, res) => {
  try {
    const { username } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!username || username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ 
      username: username.trim(),
      auth0Id: { $ne: auth0Sub } // Exclude current user
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    user.username = username.trim();
    await user.save();

    res.json({ success: true, username: user.username, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

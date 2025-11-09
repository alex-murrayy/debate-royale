const express = require('express');
const router = express.Router();
const Voice = require('../models/Voice');
const User = require('../models/User');
const { auth0Middleware, auth0ErrorHandler } = require('../middleware/auth0');
const axios = require('axios');

// Get all available voices (public)
router.get('/', async (req, res) => {
  try {
    const voices = await Voice.find();
    res.json(voices);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate voiceover using ElevenLabs (protected)
router.post('/generate', auth0Middleware, auth0ErrorHandler, async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has unlocked this voice
    if (!user.unlockedVoices.includes(voiceId) && voiceId !== 'default') {
      return res.status(403).json({ error: 'Voice not unlocked' });
    }

    // Get voice details
    const voice = await Voice.findOne({ voiceId });
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }

    // Generate voiceover with ElevenLabs
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'fake_api_key_for_demo') {
      // Mock response
      return res.json({ 
        voiceoverUrl: 'mock_voiceover_url',
        message: 'Using mock API. Add ELEVENLABS_API_KEY to generate real voiceovers.'
      });
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM'}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
          },
          responseType: 'arraybuffer'
        }
      );

      // In production, you'd save this to cloud storage (S3, etc.)
      // For now, we'll return a mock URL
      res.json({ 
        voiceoverUrl: `data:audio/mpeg;base64,${Buffer.from(response.data).toString('base64')}`,
        success: true
      });
    } catch (error) {
      console.error('ElevenLabs API Error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to generate voiceover' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unlock voice (purchase) - protected
router.post('/unlock', auth0Middleware, auth0ErrorHandler, async (req, res) => {
  try {
    const { voiceId } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already unlocked
    if (user.unlockedVoices.includes(voiceId)) {
      return res.status(400).json({ error: 'Voice already unlocked' });
    }

    // Get voice details
    const voice = await Voice.findOne({ voiceId });
    if (!voice) {
      return res.status(404).json({ error: 'Voice not found' });
    }

    // Check level requirement
    if (user.level < voice.levelRequired) {
      return res.status(403).json({ error: 'Level requirement not met' });
    }

    // Check if user has enough coins/gems
    if (voice.price.coins && user.coins < voice.price.coins) {
      return res.status(400).json({ error: 'Not enough coins' });
    }

    if (voice.price.gems && user.gems < voice.price.gems) {
      return res.status(400).json({ error: 'Not enough gems' });
    }

    // Deduct payment
    if (voice.price.coins) user.coins -= voice.price.coins;
    if (voice.price.gems) user.gems -= voice.price.gems;

    // Unlock voice
    user.unlockedVoices.push(voiceId);
    await user.save();

    res.json({ success: true, unlockedVoices: user.unlockedVoices });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

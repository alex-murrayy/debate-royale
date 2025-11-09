const express = require('express');
const router = express.Router();
const LootBox = require('../models/LootBox');
const User = require('../models/User');
const Voice = require('../models/Voice');
const auth = require('../middleware/auth');

// Get all loot boxes
router.get('/', async (req, res) => {
  try {
    const lootBoxes = await LootBox.find();
    res.json(lootBoxes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Open loot box
router.post('/open', auth, async (req, res) => {
  try {
    const { lootBoxId } = req.body;
    const user = await User.findById(req.userId);
    
    // Get loot box
    const lootBox = await LootBox.findById(lootBoxId);
    if (!lootBox) {
      return res.status(404).json({ error: 'Loot box not found' });
    }

    // Generate rewards based on probabilities
    const rewards = [];
    
    // Add guaranteed reward
    if (lootBox.guaranteedReward) {
      rewards.push(lootBox.guaranteedReward);
    }

    // Random rewards based on probability
    for (const reward of lootBox.rewards) {
      const roll = Math.random() * 100;
      if (roll <= reward.probability) {
        rewards.push(reward);
      }
    }

    // Apply rewards to user
    for (const reward of rewards) {
      switch (reward.type) {
        case 'voice':
          if (!user.unlockedVoices.includes(reward.itemId)) {
            user.unlockedVoices.push(reward.itemId);
          }
          break;
        case 'profilePicture':
          if (!user.unlockedPictures.includes(reward.itemId)) {
            user.unlockedPictures.push(reward.itemId);
          }
          break;
        case 'coins':
          user.coins += reward.quantity || 0;
          break;
        case 'gems':
          user.gems += reward.quantity || 0;
          break;
      }
    }

    await user.save();

    res.json({ success: true, rewards });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;


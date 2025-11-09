const mongoose = require('mongoose');
const Voice = require('../models/Voice');
const LootBox = require('../models/LootBox');
require('dotenv').config();

const voices = [
  {
    voiceId: 'default',
    name: 'Default Voice',
    description: 'Standard voice for all users',
    category: 'free',
    unlockedByDefault: true,
    rarity: 'common',
    levelRequired: 1
  },
  {
    voiceId: 'rachel',
    name: 'Rachel',
    description: 'Professional female voice',
    category: 'free',
    rarity: 'common',
    levelRequired: 1,
    price: { coins: 0 },
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM'
  },
  {
    voiceId: 'domi',
    name: 'Domi',
    description: 'Energetic female voice',
    category: 'free',
    rarity: 'common',
    levelRequired: 3,
    price: { coins: 100 },
    elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld'
  },
  {
    voiceId: 'bella',
    name: 'Bella',
    description: 'Calm British female voice',
    category: 'free',
    rarity: 'rare',
    levelRequired: 5,
    price: { coins: 250 },
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL'
  },
  {
    voiceId: 'antoni',
    name: 'Antoni',
    description: 'Professional male voice',
    category: 'free',
    rarity: 'rare',
    levelRequired: 7,
    price: { coins: 500 },
    elevenLabsVoiceId: 'ErXwobaYiN019PkySvjV'
  },
  {
    voiceId: 'premium-1',
    name: 'Premium Voice Alpha',
    description: 'Exclusive premium voice',
    category: 'premium',
    rarity: 'epic',
    levelRequired: 10,
    price: { realMoney: 499 } // $4.99
  },
  {
    voiceId: 'premium-2',
    name: 'Premium Voice Beta',
    description: 'Legendary premium voice',
    category: 'premium',
    rarity: 'legendary',
    levelRequired: 15,
    price: { realMoney: 999 } // $9.99
  }
];

const lootBoxes = [
  {
    name: 'Starter Loot Box',
    description: 'Perfect for beginners',
    price: 499, // $4.99
    rewards: [
      { type: 'coins', quantity: 100, probability: 80, rarity: 'common' },
      { type: 'coins', quantity: 250, probability: 50, rarity: 'rare' },
      { type: 'gems', quantity: 10, probability: 30, rarity: 'rare' },
      { type: 'voice', itemId: 'domi', probability: 20, rarity: 'rare' },
      { type: 'profilePicture', itemId: 'picture-1', probability: 15, rarity: 'epic' }
    ],
    guaranteedReward: {
      type: 'coins',
      quantity: 50
    }
  },
  {
    name: 'Premium Loot Box',
    description: 'Higher chance for rare items',
    price: 999, // $9.99
    rewards: [
      { type: 'coins', quantity: 500, probability: 70, rarity: 'common' },
      { type: 'gems', quantity: 50, probability: 60, rarity: 'rare' },
      { type: 'voice', itemId: 'bella', probability: 40, rarity: 'epic' },
      { type: 'voice', itemId: 'antoni', probability: 30, rarity: 'epic' },
      { type: 'profilePicture', itemId: 'picture-2', probability: 25, rarity: 'epic' },
      { type: 'voice', itemId: 'premium-1', probability: 10, rarity: 'legendary' }
    ],
    guaranteedReward: {
      type: 'gems',
      quantity: 25
    }
  },
  {
    name: 'Legendary Loot Box',
    description: 'Best rewards available',
    price: 1999, // $19.99
    rewards: [
      { type: 'coins', quantity: 1000, probability: 80, rarity: 'common' },
      { type: 'gems', quantity: 100, probability: 70, rarity: 'rare' },
      { type: 'voice', itemId: 'premium-1', probability: 50, rarity: 'epic' },
      { type: 'voice', itemId: 'premium-2', probability: 30, rarity: 'legendary' },
      { type: 'profilePicture', itemId: 'picture-3', probability: 40, rarity: 'epic' }
    ],
    guaranteedReward: {
      type: 'voice',
      itemId: 'bella'
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-arena');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Voice.deleteMany({});
    await LootBox.deleteMany({});

    // Insert voices
    await Voice.insertMany(voices);
    console.log(`✅ Inserted ${voices.length} voices`);

    // Insert loot boxes
    await LootBox.insertMany(lootBoxes);
    console.log(`✅ Inserted ${lootBoxes.length} loot boxes`);

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();


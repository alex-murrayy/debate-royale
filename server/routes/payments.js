const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const LootBox = require('../models/LootBox');
const Voice = require('../models/Voice');
const { auth0Middleware, auth0ErrorHandler } = require('../middleware/auth0');

// Create payment intent for loot box - protected
router.post('/create-payment-intent', auth0Middleware, auth0ErrorHandler, async (req, res) => {
  try {
    const { lootBoxId, amount } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'fake_secret_key') {
      // Mock payment for development
      return res.json({ 
        clientSecret: 'mock_client_secret',
        mock: true,
        message: 'Using mock payment. Add STRIPE_SECRET_KEY for real payments.'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      metadata: {
        userId: user._id.toString(),
        auth0Id: auth0Sub,
        lootBoxId: lootBoxId
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create payment intent for voice - protected
router.post('/purchase-voice', auth0Middleware, auth0ErrorHandler, async (req, res) => {
  try {
    const { voiceId } = req.body;
    const auth0Sub = req.auth.sub;
    const user = await User.findOne({ auth0Id: auth0Sub });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const voice = await Voice.findOne({ voiceId });
    
    if (!voice || !voice.price.realMoney) {
      return res.status(400).json({ error: 'Voice not available for purchase' });
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'fake_secret_key') {
      // Mock payment
      user.unlockedVoices.push(voiceId);
      await user.save();
      
      return res.json({ 
        success: true,
        mock: true,
        message: 'Mock purchase completed. Add STRIPE_SECRET_KEY for real payments.'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: voice.price.realMoney,
      currency: 'usd',
      metadata: {
        userId: user._id.toString(),
        auth0Id: auth0Sub,
        voiceId: voiceId
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook for Stripe (to handle successful payments)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { userId, auth0Id, lootBoxId, voiceId } = paymentIntent.metadata;

    const user = await User.findOne({ 
      $or: [{ _id: userId }, { auth0Id: auth0Id }] 
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (lootBoxId) {
      // Handle loot box purchase
      // (Loot box opening logic would go here)
    } else if (voiceId) {
      // Handle voice purchase
      if (!user.unlockedVoices.includes(voiceId)) {
        user.unlockedVoices.push(voiceId);
        await user.save();
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;


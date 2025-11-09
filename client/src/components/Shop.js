import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingBag, Gift, CreditCard, Coins, Mic } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key');

const Shop = () => {
  const { user, fetchUser } = useAuth();
  const [voices, setVoices] = useState([]);
  const [lootBoxes, setLootBoxes] = useState([]);
  const [activeTab, setActiveTab] = useState('voices');

  useEffect(() => {
    fetchVoices();
    fetchLootBoxes();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/voices`);
      setVoices(response.data);
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const fetchLootBoxes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/lootboxes`);
      setLootBoxes(response.data);
    } catch (error) {
      console.error('Error fetching loot boxes:', error);
    }
  };

  const handleUnlockVoice = async (voiceId, price) => {
    try {
      const response = await axios.post(`${API_URL}/api/voices/unlock`, { voiceId });
      if (response.data.success) {
        await fetchUser();
        alert('Voice unlocked!');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unlock voice');
    }
  };

  const handlePurchaseVoice = async (voiceId) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/purchase-voice`, { voiceId });
      
      if (response.data.mock) {
        // Mock purchase for development
        await fetchUser();
        alert('Mock purchase completed!');
        return;
      }

      // Real Stripe payment
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId
      });

      if (error) {
        alert(error.message);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to purchase voice');
    }
  };

  const handleOpenLootBox = async (lootBoxId) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/create-payment-intent`, {
        lootBoxId,
        amount: 999 // $9.99 in cents
      });

      if (response.data.mock) {
        // Mock purchase
        const openResponse = await axios.post(`${API_URL}/api/lootboxes/open`, { lootBoxId });
        await fetchUser();
        alert(`Loot box opened! Rewards: ${JSON.stringify(openResponse.data.rewards)}`);
        return;
      }

      // Real Stripe payment
      const stripe = await stripePromise;
      const { error } = await stripe.confirmCardPayment(response.data.clientSecret, {
        payment_method: {
          card: {} // In production, use Stripe Elements
        }
      });

      if (error) {
        alert(error.message);
      } else {
        const openResponse = await axios.post(`${API_URL}/api/lootboxes/open`, { lootBoxId });
        await fetchUser();
        alert(`Loot box opened! Rewards: ${JSON.stringify(openResponse.data.rewards)}`);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to open loot box');
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <h1 className="text-4xl font-bold text-ub-white mb-8">Shop</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('voices')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'voices'
                ? 'bg-ub-blue-600 text-ub-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Mic className="h-5 w-5 inline mr-2" />
            Voices
          </button>
          <button
            onClick={() => setActiveTab('lootboxes')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'lootboxes'
                ? 'bg-ub-blue-600 text-ub-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gift className="h-5 w-5 inline mr-2" />
            Loot Boxes
          </button>
        </div>

        {/* Voices Tab */}
        {activeTab === 'voices' && (
          <div className="grid md:grid-cols-3 gap-6">
            {voices.map((voice) => {
              const isUnlocked = user.unlockedVoices.includes(voice.voiceId);
              const canUnlock = user.level >= voice.levelRequired;

              return (
                <div key={voice.voiceId} className="glass-strong rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-bold text-ub-white mb-2">{voice.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{voice.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-slate-300">
                      Rarity: <span className="text-ub-blue-400">{voice.rarity}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      Level Required: {voice.levelRequired}
                    </div>
                  </div>

                  {isUnlocked ? (
                    <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-center font-semibold">
                      Unlocked
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {voice.price.coins && (
                        <button
                          onClick={() => handleUnlockVoice(voice.voiceId, voice.price)}
                          disabled={!canUnlock || user.coins < voice.price.coins}
                          className="w-full px-4 py-2 bg-ub-blue-600 hover:bg-ub-blue-500 text-ub-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <Coins className="h-4 w-4" />
                          <span>{voice.price.coins} Coins</span>
                        </button>
                      )}
                      {voice.price.realMoney && (
                        <button
                          onClick={() => handlePurchaseVoice(voice.voiceId)}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-ub-white rounded-xl font-semibold flex items-center justify-center space-x-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>${(voice.price.realMoney / 100).toFixed(2)}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loot Boxes Tab */}
        {activeTab === 'lootboxes' && (
          <div className="grid md:grid-cols-3 gap-6">
            {lootBoxes.map((lootBox) => (
              <div key={lootBox._id} className="glass-strong rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-bold text-ub-white mb-2">{lootBox.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{lootBox.description}</p>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-ub-white mb-2">
                    ${(lootBox.price / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">
                    Contains random rewards including voices, profile pictures, coins, and gems
                  </div>
                </div>

                <button
                  onClick={() => handleOpenLootBox(lootBox._id)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-ub-white rounded-xl font-semibold flex items-center justify-center space-x-2"
                >
                  <Gift className="h-5 w-5" />
                  <span>Open Loot Box</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;


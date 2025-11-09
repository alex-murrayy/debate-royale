import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mic, Image as ImageIcon, Edit2, Save, X, Mail, Award, TrendingUp, TrendingDown } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { dbUser, auth0User, isAuthenticated, isLoading, fetchUser, updateUser, getAccessTokenSilently } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [availablePictures, setAvailablePictures] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
      return;
    }
    if (dbUser) {
      setEditUsername(dbUser.username || '');
      fetchAvailableContent();
    }
  }, [dbUser, isAuthenticated, isLoading, navigate]);

  const fetchAvailableContent = async () => {
    if (!dbUser) return;
    
    // In production, fetch from API
    setAvailablePictures([
      'default-1', 'default-2', 'default-3',
      ...(dbUser.unlockedPictures || [])
    ]);
    
    try {
      const token = await getAccessTokenSilently();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get(`${API_URL}/api/voices`);
      setAvailableVoices(response.data);
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const handleUpdatePicture = async (pictureId) => {
    try {
      const token = await getAccessTokenSilently();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.put(`${API_URL}/api/users/profile-picture`, { pictureId });
      if (response.data.user) {
        updateUser(response.data.user);
      } else {
        await fetchUser();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update picture');
    }
  };

  const handleUpdateVoice = async (voiceId) => {
    try {
      const token = await getAccessTokenSilently();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.put(`${API_URL}/api/users/voice`, { voiceId });
      if (response.data.user) {
        updateUser(response.data.user);
      } else {
        await fetchUser();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update voice');
    }
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
    setEditUsername(dbUser?.username || '');
    setError('');
  };

  const handleSaveUsername = async () => {
    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (editUsername.trim().length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.put(`${API_URL}/api/users/username`, { username: editUsername.trim() });
      if (response.data.user) {
        updateUser(response.data.user);
      } else {
        await fetchUser();
      }
      setIsEditingUsername(false);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update username');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setEditUsername(dbUser?.username || '');
    setError('');
  };

  if (isLoading || !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-ub-white">Loading...</div>
      </div>
    );
  }

  const winRate = dbUser.wins + dbUser.losses > 0 
    ? ((dbUser.wins / (dbUser.wins + dbUser.losses)) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <h1 className="text-4xl font-bold text-ub-white mb-8">Profile</h1>

        {/* User Info */}
        <div className="glass-strong rounded-2xl p-8 mb-8 border border-slate-700/50">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="w-32 h-32 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-2xl flex items-center justify-center text-5xl font-bold text-ub-white shadow-glow-ub">
              {(dbUser.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                {isEditingUsername ? (
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => {
                          setEditUsername(e.target.value);
                          setError('');
                        }}
                        className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent text-2xl font-bold"
                        placeholder="Username"
                        maxLength={20}
                      />
                      <button
                        onClick={handleSaveUsername}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {error && (
                      <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-ub-white">{dbUser.username}</h2>
                    <button
                      onClick={handleEditUsername}
                      className="p-2 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <Edit2 className="h-5 w-5 text-slate-400 hover:text-ub-blue-400" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Mail className="h-4 w-4" />
                  <span>{auth0User?.email || dbUser.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Award className="h-4 w-4" />
                  <span>{dbUser.rank || 'Bronze'} • Level {dbUser.level || 1}</span>
                </div>
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>{dbUser.wins || 0} Wins</span>
                  </div>
                  <div className="flex items-center space-x-2 text-red-400">
                    <TrendingDown className="h-4 w-4" />
                    <span>{dbUser.losses || 0} Losses</span>
                  </div>
                  <div className="text-slate-300">
                    <span>{winRate}% Win Rate</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="text-slate-300">
                    <span className="text-ub-blue-400 font-semibold">{dbUser.coins || 0}</span> Coins
                  </div>
                  <div className="text-slate-300">
                    <span className="text-purple-400 font-semibold">{dbUser.gems || 0}</span> Gems
                  </div>
                  <div className="text-slate-300">
                    <span className="text-green-400 font-semibold">{dbUser.experience || 0}</span> XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-ub-blue-600 text-ub-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="h-5 w-5 inline mr-2" />
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('picture')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'picture'
                ? 'bg-ub-blue-600 text-ub-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="h-5 w-5 inline mr-2" />
            Profile Pictures
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'voice'
                ? 'bg-ub-blue-600 text-ub-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Mic className="h-5 w-5 inline mr-2" />
            Voices
          </button>
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="glass-strong rounded-2xl p-8 border border-slate-700/50">
            <h3 className="text-2xl font-bold text-ub-white mb-6">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                <div className="flex items-center space-x-2">
                  {isEditingUsername ? (
                    <>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => {
                          setEditUsername(e.target.value);
                          setError('');
                        }}
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent"
                        placeholder="Username"
                        maxLength={20}
                      />
                      <button
                        onClick={handleSaveUsername}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white">
                        {dbUser.username}
                      </div>
                      <button
                        onClick={handleEditUsername}
                        className="px-4 py-2 bg-ub-blue-600 hover:bg-ub-blue-700 text-white rounded-xl transition-colors flex items-center space-x-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </>
                  )}
                </div>
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
                <p className="text-slate-400 text-sm mt-2">Username must be 3-20 characters long</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                <div className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-400">
                  {auth0User?.email || dbUser.email}
                </div>
                <p className="text-slate-400 text-sm mt-2">Email is managed by Auth0 and cannot be changed here</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Pictures */}
        {activeTab === 'picture' && (
          <div className="grid md:grid-cols-6 gap-4">
            {availablePictures.map((pictureId) => {
              const isSelected = dbUser.profilePicture === pictureId;
              const isUnlocked = (dbUser.unlockedPictures || []).includes(pictureId) || pictureId.startsWith('default');

              return (
                <button
                  key={pictureId}
                  onClick={() => isUnlocked && handleUpdatePicture(pictureId)}
                  disabled={!isUnlocked}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    isSelected
                      ? 'border-ub-blue-500 bg-ub-blue-500/20'
                      : isUnlocked
                      ? 'border-slate-700 hover:border-slate-600'
                      : 'border-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-full aspect-square bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold text-ub-white">
                    {pictureId[0].toUpperCase()}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-ub-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-ub-white rounded-full" />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center">
                      <span className="text-xs text-slate-400">Locked</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Voices */}
        {activeTab === 'voice' && (
          <div className="grid md:grid-cols-3 gap-6">
            {availableVoices
              .filter(voice => (dbUser.unlockedVoices || []).includes(voice.voiceId) || voice.voiceId === 'default' || voice.unlockedByDefault)
              .map((voice) => {
                const isSelected = dbUser.selectedVoice === voice.voiceId;

                return (
                  <button
                    key={voice.voiceId}
                    onClick={() => handleUpdateVoice(voice.voiceId)}
                    className={`glass-strong rounded-2xl p-6 border-2 transition-all text-left ${
                      isSelected
                        ? 'border-ub-blue-500 bg-ub-blue-500/20'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-ub-white">{voice.name}</h3>
                      {isSelected && (
                        <div className="w-6 h-6 bg-ub-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-ub-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{voice.description}</p>
                    <div className="mt-4 text-sm text-ub-blue-400">
                      {voice.rarity} • {voice.category}
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


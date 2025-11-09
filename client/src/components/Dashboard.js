import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, TrendingUp, Award, BarChart3 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading, login, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
      return;
    }

    if (isAuthenticated && user) {
      fetchDebates();
    }
  }, [user, isAuthenticated, isLoading, login]);

  const fetchDebates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/debates/my-debates`);
      setDebates(response.data);
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-ub-white">Loading...</div>
      </div>
    );
  }

  const winRate = user.wins + user.losses > 0 
    ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto py-12">
        <h1 className="text-4xl font-bold text-ub-white mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-8 w-8 text-ub-blue-400" />
              <span className="text-2xl font-bold text-ub-white">{user.wins}</span>
            </div>
            <div className="text-sm text-slate-400">Wins</div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-red-400" />
              <span className="text-2xl font-bold text-ub-white">{user.losses}</span>
            </div>
            <div className="text-sm text-slate-400">Losses</div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-ub-white">{winRate}%</span>
            </div>
            <div className="text-sm text-slate-400">Win Rate</div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-ub-blue-400" />
              <span className="text-2xl font-bold text-ub-white">{user.rank}</span>
            </div>
            <div className="text-sm text-slate-400">Rank</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="glass-strong rounded-2xl p-6 mb-8 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-ub-white">Level {user.level}</h2>
            <span className="text-ub-blue-400 font-semibold">{user.experience} XP</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-ub-blue-500 to-ub-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${(user.experience / (user.level * 100)) * 100}%` }}
            />
          </div>
          <div className="text-sm text-slate-400 mt-2">
            {user.level * 100 - user.experience} XP until next level
          </div>
        </div>

        {/* Recent Debates */}
        <div className="glass-strong rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-ub-white mb-4">Recent Debates</h2>
          {debates.length === 0 ? (
            <p className="text-slate-400">No debates yet. Start your first debate!</p>
          ) : (
            <div className="space-y-4">
              {debates.map((debate) => (
                <div key={debate._id} className="bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-ub-white font-semibold">{debate.topic}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(debate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {debate.winner && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          debate.winner && debate.winner.toString() === user._id.toString()
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {debate.winner && debate.winner.toString() === user._id.toString() ? 'Won' : 'Lost'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

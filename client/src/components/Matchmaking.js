import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { Loader, Search } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Matchmaking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState('idle'); // idle, searching, found
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Connect to socket
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Listen for match found
    newSocket.on('match-found', (data) => {
      setStatus('found');
      navigate(`/debate/${data.debateId}`);
    });

    newSocket.on('matchmaking-status', (data) => {
      if (data.status === 'waiting') {
        setStatus('searching');
      }
    });

    return () => {
      newSocket.close();
    };
  }, [user, navigate]);

  const handleStartSearch = () => {
    if (!topic.trim()) {
      alert('Please enter a debate topic');
      return;
    }

    if (socket) {
      setStatus('searching');
      socket.emit('join-matchmaking', {
        userId: user.id,
        topic: topic.trim()
      });
    }
  };

  const handleCancel = () => {
    if (socket) {
      socket.emit('leave-matchmaking', { userId: user.id });
    }
    setStatus('idle');
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="glass-strong rounded-3xl p-8 md:p-12 border border-slate-700/50">
          <h1 className="text-4xl font-bold text-ub-white mb-8 text-center">Find a Debate</h1>

          {status === 'idle' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Debate Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Should AI be regulated by governments?"
                  className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <button
                onClick={handleStartSearch}
                className="w-full px-8 py-4 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl font-bold text-lg transition-all shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <Search className="h-5 w-5" />
                <span>Find Opponent</span>
              </button>
            </div>
          )}

          {status === 'searching' && (
            <div className="text-center py-12">
              <Loader className="h-16 w-16 animate-spin text-ub-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-ub-white mb-2">Searching for opponent...</h2>
              <p className="text-slate-400 mb-6">Topic: {topic}</p>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-ub-white rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;


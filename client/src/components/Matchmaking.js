import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAnonymous } from '../context/AnonymousContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Loader, Search, Users, Eye, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Predefined debate topics
const DEBATE_TOPICS = [
  "Should AI be regulated by governments?",
  "Is social media harmful to society?",
  "Should college be free for everyone?",
  "Is remote work better than office work?",
  "Should voting be mandatory?",
  "Is cryptocurrency the future of money?",
  "Should we colonize Mars?",
  "Is animal testing necessary?",
  "Should the death penalty be abolished?",
  "Is climate change the biggest threat to humanity?",
  "Should plastic be banned?",
  "Is universal basic income a good idea?",
  "Should nuclear energy be expanded?",
  "Is genetic modification of humans ethical?",
  "Should social media platforms be held accountable for content?",
  "Is capitalism better than socialism?",
  "Should healthcare be free?",
  "Is technology making us more isolated?",
  "Should professional athletes be paid less?",
  "Is space exploration worth the cost?"
];

const Matchmaking = () => {
  const { sessionId, username } = useAnonymous();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [status, setStatus] = useState('idle'); // idle, searching, found
  const [socket, setSocket] = useState(null);
  const [activeDebates, setActiveDebates] = useState([]);
  const [loadingDebates, setLoadingDebates] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showCustomTopic, setShowCustomTopic] = useState(false);

  // Fetch active debates
  const fetchActiveDebates = async () => {
    try {
      console.log('Fetching active debates from:', `${API_URL}/api/debates/active`);
      const response = await axios.get(`${API_URL}/api/debates/active`);
      console.log('Active debates response:', response.data);
      setActiveDebates(response.data || []);
    } catch (error) {
      console.error('Error fetching active debates:', error);
      console.error('Error details:', error.response?.data || error.message);
      setActiveDebates([]);
    } finally {
      setLoadingDebates(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Matchmaking component mounted', {
      sessionId: sessionId ? 'present' : 'missing',
      username
    });

    // Fetch active debates on mount
    fetchActiveDebates();

    // Connect to socket only once
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    setSocket(newSocket);

    // Socket connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setSocketConnected(true);
      // Refresh active debates when connected
      fetchActiveDebates();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    });

    // Listen for match found
    newSocket.on('match-found', (data) => {
      console.log('🎯 Match found!', data);
      setStatus('found');
      navigate(`/debate/${data.debateId}`);
    });

    newSocket.on('matchmaking-status', (data) => {
      console.log('📊 Matchmaking status:', data);
      if (data.status === 'waiting') {
        setStatus('searching');
      }
    });

    newSocket.on('matchmaking-error', (data) => {
      console.error('❌ Matchmaking error:', data);
      alert(`Matchmaking error: ${data.error || 'Unknown error'}`);
      setStatus('idle');
    });

    // Cleanup
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.removeAllListeners();
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleStartSearch = (debateTopic = null) => {
    const topicToUse = debateTopic || topic.trim();
    
    if (!topicToUse) {
      alert('Please select or enter a debate topic');
      setStatus('idle');
      return;
    }

    if (!sessionId) {
      console.error('❌ No sessionId available');
      setStatus('idle');
      return;
    }

    if (!socket) {
      console.error('❌ Socket not initialized');
      setStatus('idle');
      return;
    }

    if (!socketConnected) {
      console.error('❌ Socket not connected');
      setStatus('idle');
      return;
    }

    console.log('🔍 Starting search with:', {
      sessionId,
      username,
      topic: topicToUse,
      socketId: socket.id,
      socketConnected
    });

    setSelectedTopic(topicToUse);
    
    // Emit the join-matchmaking event
    try {
      socket.emit('join-matchmaking', {
        sessionId: sessionId,
        username: username || 'Anonymous',
        topic: topicToUse
      });
      console.log('✅ join-matchmaking event emitted');
    } catch (error) {
      console.error('❌ Error emitting join-matchmaking:', error);
      alert('Error starting search. Please try again.');
      setStatus('idle');
    }
  };

  const handleTopicClick = (topicText) => {
    console.log('🎯 Topic clicked:', topicText);
    console.log('📊 Current state:', {
      socketConnected,
      sessionId: sessionId ? 'present' : 'missing',
      username,
      socket: socket ? 'present' : 'missing',
      socketId: socket?.id
    });

    // Set the selected topic immediately for visual feedback
    setSelectedTopic(topicText);
    
    // Show immediate feedback
    setStatus('searching');

    if (!socketConnected) {
      alert('Not connected to server. Please wait for connection and try again.');
      setStatus('idle');
      return;
    }

    if (!sessionId) {
      alert('Session not ready. Please refresh the page.');
      setStatus('idle');
      return;
    }

    if (!socket) {
      alert('Socket not initialized. Please refresh the page.');
      setStatus('idle');
      return;
    }

    // Start the search
    console.log('🚀 Starting search for topic:', topicText);
    handleStartSearch(topicText);
  };

  const handleCancel = () => {
    if (socket && sessionId) {
      socket.emit('leave-matchmaking', { 
        sessionId: sessionId
      });
    }
    setStatus('idle');
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-6xl mx-auto py-12">
        {/* Create New Debate */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 border border-slate-700/50 mb-8">
          <h1 className="text-4xl font-bold text-ub-white mb-2 text-center">Start a Debate</h1>
          <p className="text-center text-slate-400 mb-8">Choose a topic and find an opponent</p>

          {status === 'idle' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-slate-400">
                    {socketConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
                {sessionId && (
                  <span className="text-xs text-slate-500">Session: {sessionId.substring(0, 8)}...</span>
                )}
              </div>

              {/* Predefined Topics */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Popular Debate Topics
                  {(!socketConnected || !sessionId) && (
                    <span className="ml-2 text-xs text-red-400">
                      (Waiting for connection...)
                    </span>
                  )}
                </label>
                <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {DEBATE_TOPICS.map((topicOption, index) => {
                    // Allow clicking even if not fully connected - the handler will check
                    const isReady = socketConnected && sessionId;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🎯 Button clicked!', {
                            topic: topicOption,
                            socketConnected,
                            sessionId: sessionId ? 'present' : 'missing',
                            socket: socket ? 'present' : 'missing',
                            username
                          });
                          handleTopicClick(topicOption);
                        }}
                        className={`p-4 text-left bg-slate-900/50 border rounded-xl text-white transition-all ${
                          isReady
                            ? 'border-ub-blue-500 hover:border-ub-blue-400 hover:bg-slate-800/50 cursor-pointer active:scale-95'
                            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30 cursor-pointer'
                        }`}
                        title={isReady ? `Click to debate: ${topicOption}` : `Click to try (${!socketConnected ? 'Connecting...' : 'Initializing...'})`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{topicOption}</span>
                          <div className="flex items-center space-x-2">
                            {!isReady && (
                              <span className="text-xs text-yellow-400">⏳</span>
                            )}
                            <Search className={`h-4 w-4 ml-2 flex-shrink-0 ${isReady ? 'text-ub-blue-400' : 'text-slate-500'}`} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {(!socketConnected || !sessionId) && (
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    {!socketConnected && '⏳ Connecting to server...'}
                    {socketConnected && !sessionId && '⏳ Initializing session...'}
                  </p>
                )}
              </div>

              {/* Custom Topic Option */}
              <div>
                <button
                  onClick={() => setShowCustomTopic(!showCustomTopic)}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all text-sm"
                >
                  {showCustomTopic ? 'Hide' : 'Create Custom Topic'}
                </button>
                
                {showCustomTopic && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-3">Your Topic</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter your debate topic..."
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent text-lg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleStartSearch();
                          }
                        }}
                        disabled={!socketConnected || !sessionId}
                      />
                    </div>
                    <button
                      onClick={() => handleStartSearch()}
                      disabled={!socketConnected || !sessionId || !topic.trim()}
                      className="w-full px-8 py-4 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-ub-white rounded-xl font-bold text-lg transition-all shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105 flex items-center justify-center space-x-3"
                    >
                      <Search className="h-5 w-5" />
                      <span>Start Debate</span>
                    </button>
                  </div>
                )}
              </div>
              
              {(!socketConnected || !sessionId) && (
                <p className="text-sm text-slate-400 text-center">
                  {!socketConnected && 'Waiting for server connection...'}
                  {!sessionId && 'Initializing session...'}
                </p>
              )}
            </div>
          )}

          {status === 'searching' && (
            <div className="text-center py-12">
              <Loader className="h-16 w-16 animate-spin text-ub-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-ub-white mb-2">Searching for opponent...</h2>
              <p className="text-slate-400 mb-2 font-semibold">Topic:</p>
              <p className="text-ub-blue-400 mb-6 text-lg">{selectedTopic || topic}</p>
              <p className="text-sm text-slate-500 mb-6">
                Waiting for someone to debate this topic with you...
              </p>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-ub-white rounded-xl font-semibold transition-all"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>

        {/* Active Debates - Watch as Spectator */}
        <div className="glass-strong rounded-3xl p-8 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-ub-white flex items-center space-x-2">
              <Eye className="h-6 w-6" />
              <span>Watch Active Debates</span>
            </h2>
            <button
              onClick={fetchActiveDebates}
              disabled={loadingDebates}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-ub-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loadingDebates ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loadingDebates ? (
            <div className="text-center py-12">
              <Loader className="h-8 w-8 animate-spin text-ub-blue-400 mx-auto" />
            </div>
          ) : activeDebates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="mb-2">No active debates.</p>
              <p className="text-sm">Start a debate above to see it here, or wait for others to start one.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeDebates.map((debate) => (
                <Link
                  key={debate._id}
                  to={`/debate/${debate._id}`}
                  className="glass rounded-xl p-6 border border-slate-700/50 hover:border-ub-blue-500/50 transition-all hover:bg-slate-800/50"
                >
                  <h3 className="text-lg font-bold text-ub-white mb-3">{debate.topic}</h3>
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-green-400">{debate.player1?.username || 'Player 1'} (FOR)</span>
                      <span>vs</span>
                      <span className="text-red-400">{debate.player2?.username || 'Player 2'} (AGAINST)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{debate.spectatorCount || 0} watching</span>
                    </div>
                    <div className="flex items-center space-x-2 text-ub-blue-400">
                      <span>Watch</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matchmaking;

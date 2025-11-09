import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Mic, Send, Volume2, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DebateRoom = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [debate, setDebate] = useState(null);
  const [argument, setArgument] = useState('');
  const [side, setSide] = useState('');
  const [socket, setSocket] = useState(null);
  const [generating, setGenerating] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Connect to socket
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Fetch debate data
    fetchDebate();

    // Listen for new arguments
    newSocket.on('new-argument', (data) => {
      fetchDebate(); // Refresh debate data
    });

    newSocket.on('debate-ended', (data) => {
      alert(`Debate ended! Winner: ${data.winnerId === user.id ? 'You!' : 'Opponent'}`);
    });

    return () => {
      newSocket.close();
    };
  }, [id]);

  const fetchDebate = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/debates/${id}`);
      const debateData = response.data;
      setDebate(debateData);

      // Determine which side the user is on
      if (debateData.player1.userId === user.id) {
        setSide(debateData.player1.side);
      } else if (debateData.player2.userId === user.id) {
        setSide(debateData.player2.side);
      }
    } catch (error) {
      console.error('Error fetching debate:', error);
    }
  };

  const handleGenerateVoiceover = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/api/voices/generate`, {
        text,
        voiceId: user.selectedVoice || 'default'
      });

      return response.data.voiceoverUrl;
    } catch (error) {
      console.error('Error generating voiceover:', error);
      return null;
    }
  };

  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!argument.trim() || !socket) return;

    setGenerating(true);

    // Generate voiceover
    const voiceoverUrl = await handleGenerateVoiceover(argument);

    // Submit argument via socket
    socket.emit('submit-argument', {
      debateId: id,
      argument: argument.trim(),
      voiceoverUrl
    });

    setArgument('');
    setGenerating(false);
  };

  const playVoiceover = (url) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-ub-white text-xl">Loading debate...</div>
        </div>
      </div>
    );
  }

  const isPlayer1 = debate.player1.userId === user.id;
  const myArguments = isPlayer1 ? debate.player1.arguments : debate.player2.arguments;
  const opponentArguments = isPlayer1 ? debate.player2.arguments : debate.player1.arguments;

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Debate Header */}
        <div className="glass-strong rounded-3xl p-6 mb-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-ub-white mb-2">{debate.topic}</h1>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-xl font-semibold ${
              side === 'for' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              Arguing: {side === 'for' ? 'FOR' : 'AGAINST'}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* My Arguments */}
          <div className="glass-strong rounded-3xl p-6 border border-ub-blue-500/30">
            <h2 className="text-xl font-bold text-ub-white mb-4">Your Arguments</h2>
            <div className="space-y-4">
              {myArguments.map((arg, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-slate-200 mb-2">{arg.text}</p>
                  {arg.voiceoverUrl && (
                    <button
                      onClick={() => playVoiceover(arg.voiceoverUrl)}
                      className="flex items-center space-x-2 text-ub-blue-400 hover:text-ub-blue-300 text-sm"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Play Voiceover</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Opponent Arguments */}
          <div className="glass-strong rounded-3xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-ub-white mb-4">Opponent Arguments</h2>
            <div className="space-y-4">
              {opponentArguments.length === 0 ? (
                <p className="text-slate-400">Waiting for opponent's argument...</p>
              ) : (
                opponentArguments.map((arg, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-slate-200 mb-2">{arg.text}</p>
                    {arg.voiceoverUrl && (
                      <button
                        onClick={() => playVoiceover(arg.voiceoverUrl)}
                        className="flex items-center space-x-2 text-ub-blue-400 hover:text-ub-blue-300 text-sm"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>Play Voiceover</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Argument Input */}
        <div className="glass-strong rounded-3xl p-6 mt-6 border border-slate-700/50">
          <form onSubmit={handleSubmitArgument} className="flex space-x-4">
            <input
              type="text"
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              placeholder="Type your argument..."
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent"
              disabled={generating}
            />
            <button
              type="submit"
              disabled={generating || !argument.trim()}
              className="px-6 py-3 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl font-semibold transition-all shadow-glow-ub disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </form>
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default DebateRoom;


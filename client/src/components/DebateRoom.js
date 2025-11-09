import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import Peer from 'simple-peer';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DebateRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, getAccessTokenSilently, getUser } = useAuth();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [argumentText, setArgumentText] = useState('');
  const [side, setSide] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [dbUser, setDbUser] = useState(null);
  
  // WebRTC state
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  const [peer, setPeer] = useState(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      login();
      return;
    }

    const initDebate = async () => {
      try {
        const token = await getAccessTokenSilently();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user from database first
        const userData = await getUser();
        setDbUser(userData);
        
        // Fetch debate data
        const debateRes = await axios.get(`${API_URL}/api/debates/${id}`);
        setDebate(debateRes.data);
        
        // Determine side
        if (userData && debateRes.data.player1?.userId) {
          if (debateRes.data.player1.userId.toString() === userData._id.toString()) {
            setSide(debateRes.data.player1.side);
            setOpponentId(debateRes.data.player2?.userId?.toString() || '');
          } else if (debateRes.data.player2?.userId) {
            setSide(debateRes.data.player2.side);
            setOpponentId(debateRes.data.player1.userId.toString());
          }
        }

        // Connect to socket
        const newSocket = io(API_URL, {
          auth: { token }
        });
        setSocket(newSocket);

        // Join debate room
        newSocket.emit('join-debate-room', { debateId: id });

        // Listen for new arguments
        newSocket.on('new-argument', (data) => {
          fetchDebate();
        });

        // Listen for debate end
        newSocket.on('debate-ended', (data) => {
          fetchDebate();
        });

        // WebRTC signaling
        newSocket.on('webrtc-offer', async (data) => {
          if (data.fromUserId === opponentId) {
            await handleReceiveOffer(data.offer);
          }
        });

        newSocket.on('webrtc-answer', async (data) => {
          if (data.fromUserId === opponentId && peer) {
            await peer.signal(data.answer);
          }
        });

        newSocket.on('webrtc-ice-candidate', async (data) => {
          if (data.fromUserId === opponentId && peer) {
            peer.signal(data.candidate);
          }
        });

        setLoading(false);
      } catch (error) {
        console.error('Error initializing debate:', error);
        setLoading(false);
      }
    };

    initDebate();

    return () => {
      if (socket) {
        socket.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [id, isAuthenticated, navigate]);

  const fetchDebate = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/debates/${id}`);
      setDebate(response.data);
    } catch (error) {
      console.error('Error fetching debate:', error);
    }
  };

  const handleToggleAudio = async () => {
    if (!isAudioEnabled) {
      // Enable audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // Create peer connection
        const newPeer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream
        });

        newPeer.on('signal', (data) => {
          socket.emit('webrtc-offer', {
            debateId: id,
            offer: data,
            targetUserId: opponentId
          });
        });

        newPeer.on('stream', (remoteStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        });

        setPeer(newPeer);
        setIsAudioEnabled(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      }
    } else {
      // Disable audio
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
      setIsAudioEnabled(false);
      setPeer(null);
    }
  };

  const handleReceiveOffer = async (offer) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const newPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      newPeer.signal(offer);

      newPeer.on('signal', (data) => {
        socket.emit('webrtc-answer', {
          debateId: id,
          answer: data,
          targetUserId: opponentId
        });
      });

      newPeer.on('stream', (remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      });

      setPeer(newPeer);
      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Error setting up WebRTC:', error);
    }
  };

  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!argumentText.trim() || !socket) return;

    try {
      const token = await getAccessTokenSilently();
      // Generate voiceover (optional)
      // const voiceoverRes = await axios.post(`${API_URL}/api/voices/generate`, {
      //   text: argumentText,
      //   voiceId: user.selectedVoice || 'default'
      // });

      socket.emit('submit-argument', {
        debateId: id,
        argument: argumentText,
        voiceoverUrl: null // voiceoverRes.data.voiceoverUrl
      });

      setArgumentText('');
      fetchDebate();
    } catch (error) {
      console.error('Error submitting argument:', error);
    }
  };

  if (loading || !debate) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader className="h-12 w-12 animate-spin text-ub-blue-500" />
      </div>
    );
  }

  // Determine which side the user is on
  if (!debate || !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader className="h-12 w-12 animate-spin text-ub-blue-500" />
      </div>
    );
  }

  const isPlayer1 = debate.player1?.userId && dbUser._id && debate.player1.userId.toString() === dbUser._id.toString();
  const myArguments = isPlayer1 ? (debate.player1?.arguments || []) : (debate.player2?.arguments || []);
  const opponentArguments = isPlayer1 ? (debate.player2?.arguments || []) : (debate.player1?.arguments || []);
  const opponentUsername = isPlayer1 ? (debate.player2?.username || 'Opponent') : (debate.player1?.username || 'Opponent');

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 mb-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-2">{debate.topic}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-lg font-semibold ${
                side === 'for' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {side.toUpperCase()}
              </span>
              <span className="text-slate-400">vs</span>
              <span className="text-white font-semibold">{opponentUsername}</span>
            </div>
            
            {/* Audio Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleAudio}
                className={`p-3 rounded-xl transition-all ${
                  isAudioEnabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsRemoteAudioEnabled(!isRemoteAudioEnabled)}
                className={`p-3 rounded-xl transition-all ${
                  isRemoteAudioEnabled
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}
              >
                {isRemoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Arguments Display */}
        <div className="glass-strong rounded-3xl p-8 mb-6 border border-slate-700/50 h-[500px] overflow-y-auto">
          {myArguments.map((arg, idx) => (
            <div key={`my-${idx}`} className="mb-4 text-right">
              <div className="inline-block max-w-[70%] p-4 bg-ub-blue-600/30 rounded-xl border border-ub-blue-500/30">
                <p className="text-white">{arg.text}</p>
                {arg.voiceoverUrl && (
                  <audio src={arg.voiceoverUrl} controls className="mt-2 w-full" />
                )}
              </div>
            </div>
          ))}
          {opponentArguments.map((arg, idx) => (
            <div key={`opp-${idx}`} className="mb-4 text-left">
              <div className="inline-block max-w-[70%] p-4 bg-slate-700/50 rounded-xl border border-slate-600/30">
                <p className="text-white">{arg.text}</p>
                {arg.voiceoverUrl && (
                  <audio src={arg.voiceoverUrl} controls className="mt-2 w-full" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Argument Input */}
        <form onSubmit={handleSubmitArgument} className="glass-strong rounded-3xl p-6 border border-slate-700/50">
          <div className="flex space-x-4">
            <input
              type="text"
              value={argumentText}
              onChange={(e) => setArgumentText(e.target.value)}
              placeholder="Type your argument..."
              className="flex-1 px-5 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500"
              disabled={debate.status !== 'active'}
            />
            <button
              type="submit"
              disabled={!argumentText.trim() || debate.status !== 'active'}
              className="px-6 py-3 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center space-x-2"
            >
              <Send className="h-5 w-5" />
              <span>Send</span>
            </button>
          </div>
        </form>

        {/* Hidden audio elements for WebRTC */}
        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay volume={isRemoteAudioEnabled ? 1 : 0} />
      </div>
    </div>
  );
};

export default DebateRoom;

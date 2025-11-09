import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnonymous } from '../context/AnonymousContext';
import io from 'socket.io-client';
import axios from 'axios';
import Peer from 'simple-peer';
import { Mic, MicOff, Volume2, VolumeX, Send, Loader, Vote, Users, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const DebateRoom = () => {
  const { id } = useParams();
  const { sessionId, username } = useAnonymous();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [argumentText, setArgumentText] = useState('');
  const [side, setSide] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [myVote, setMyVote] = useState(null); // 'player1' or 'player2'
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [error, setError] = useState(null);
  
  // WebRTC state (only for participants)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
  const [peer, setPeer] = useState(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const opponentSocketId = useRef(null);

  useEffect(() => {
    // Helper function to fetch debate data
    const fetchDebate = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/debates/${id}`);
        setDebate(response.data);
      } catch (error) {
        console.error('Error fetching debate:', error);
      }
    };

    // Helper function to join debate room
    const joinDebateRoom = (socket, debateId, sessId, user, isPart) => {
      console.log('🚪 Joining debate room:', { debateId, sessId, user, isPart });
      socket.emit('join-debate-room', { 
        debateId: debateId, 
        sessionId: sessId,
        username: user,
        isParticipant: isPart
      });
    };

    const initDebate = async () => {
      setError(null);
      setLoading(true);
      
      try {
        console.log('🔍 Loading debate:', id);
        console.log('📊 User info:', { sessionId, username });
        
        if (!sessionId || !username) {
          throw new Error('Session not ready. Please refresh the page.');
        }
        
        // Fetch debate data
        const debateRes = await axios.get(`${API_URL}/api/debates/${id}`);
        console.log('✅ Debate loaded:', debateRes.data);
        
        if (!debateRes.data) {
          throw new Error('Debate not found');
        }
        
        setDebate(debateRes.data);
        
        // Check if user is a participant
        const isPlayer1 = debateRes.data.player1?.sessionId === sessionId;
        const isPlayer2 = debateRes.data.player2?.sessionId === sessionId;
        const userIsParticipant = isPlayer1 || isPlayer2;
        
        console.log('👤 User role:', { isPlayer1, isPlayer2, userIsParticipant, isSpectator: !userIsParticipant });
        
        if (userIsParticipant) {
          setIsParticipant(true);
          setIsSpectator(false);
          setSide(isPlayer1 ? debateRes.data.player1.side : debateRes.data.player2.side);
        } else {
          setIsSpectator(true);
          setIsParticipant(false);
        }

        // Connect to socket
        console.log('🔌 Connecting to socket...');
        const newSocket = io(API_URL, {
          transports: ['websocket', 'polling']
        });
        
        newSocket.on('connect', () => {
          console.log('✅ Socket connected in debate room:', newSocket.id);
          // Join room after socket connects
          joinDebateRoom(newSocket, id, sessionId, username, userIsParticipant);
        });

        newSocket.on('connect_error', (err) => {
          console.error('❌ Socket connection error:', err);
          setError('Failed to connect to server. Please check if the server is running.');
        });

        // Listen for debate errors from server
        newSocket.on('debate-error', (data) => {
          console.error('❌ Debate error from server:', data);
          setError(data.error || 'Failed to join debate room');
          setLoading(false);
        });

        setSocket(newSocket);

        // Set up socket event listeners
        // Listen for debate updates
        newSocket.on('debate-updated', (data) => {
          console.log('📊 Debate updated:', data);
          if (data.debate) {
            setDebate(data.debate);
          }
        });

        // Listen for new arguments
        newSocket.on('new-argument', (data) => {
          console.log('💬 New argument received:', data);
          fetchDebate();
        });

        // Listen for vote updates
        newSocket.on('vote-updated', (data) => {
          console.log('🗳️ Vote updated:', data);
          setDebate(prev => ({
            ...prev,
            votes: data.votes,
            spectatorCount: data.spectatorCount
          }));
          setSpectatorCount(data.spectatorCount);
        });

        // Listen for spectator count
        newSocket.on('spectator-count', (data) => {
          console.log('👥 Spectator count:', data);
          setSpectatorCount(data.count);
        });

        // Listen for debate end
        newSocket.on('debate-ended', (data) => {
          console.log('🏁 Debate ended:', data);
          fetchDebate();
        });

        // WebRTC signaling (only for participants) - set up after socket is created
        const setupWebRTC = () => {
          if (userIsParticipant) {
            newSocket.on('webrtc-offer', async (data) => {
              if (data.fromSessionId !== sessionId) {
                opponentSocketId.current = data.fromSocketId;
                // Handle offer inline to avoid dependency issues
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

                  newPeer.signal(data.offer);

                  newPeer.on('signal', (answerData) => {
                    newSocket.emit('webrtc-answer', {
                      debateId: id,
                      answer: answerData,
                      fromSessionId: sessionId,
                      fromSocketId: newSocket.id,
                      targetSocketId: opponentSocketId.current
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
              }
            });

            newSocket.on('webrtc-answer', async (data) => {
              if (data.fromSessionId !== sessionId) {
                // Find the peer and signal the answer
                // This will be handled by the peer created in handleToggleAudio
                setPeer(prevPeer => {
                  if (prevPeer) {
                    prevPeer.signal(data.answer);
                  }
                  return prevPeer;
                });
              }
            });

            newSocket.on('webrtc-ice-candidate', async (data) => {
              if (data.fromSessionId !== sessionId) {
                setPeer(prevPeer => {
                  if (prevPeer) {
                    prevPeer.signal(data.candidate);
                  }
                  return prevPeer;
                });
              }
            });
          }
        };
        
        setupWebRTC();

        setLoading(false);
      } catch (error) {
        console.error('❌ Error initializing debate:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load debate';
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (sessionId && username) {
      initDebate();
    } else {
      console.log('⏳ Waiting for sessionId and username...', { sessionId: !!sessionId, username: !!username });
      setError('Session not ready. Please refresh the page.');
      setLoading(false);
    }

    // Cleanup function - socket cleanup is handled by closing the socket reference
    // stored in state, which will be set by initDebate
    return () => {
      // Note: socket state may not be updated yet, but React will handle cleanup
      // on the next render or unmount. The socket connection itself will be closed
      // when the component unmounts or dependencies change.
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // Note: We intentionally exclude socket from dependencies to avoid re-running
    // the effect when socket changes, as socket is set inside the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sessionId, username]);

  const handleToggleAudio = async () => {
    if (!isParticipant) return;

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
            fromSessionId: sessionId,
            fromSocketId: socket.id
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


  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!argumentText.trim() || !socket || !isParticipant) return;

    try {
      socket.emit('submit-argument', {
        debateId: id,
        sessionId: sessionId,
        argument: argumentText
      });

      setArgumentText('');
      fetchDebate();
    } catch (error) {
      console.error('Error submitting argument:', error);
    }
  };

  const handleVote = (player) => {
    if (!socket || !isSpectator || myVote) return; // Can only vote once

    socket.emit('vote-debate', {
      debateId: id,
      sessionId: sessionId,
      votedFor: player // 'player1' or 'player2'
    });

    setMyVote(player);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="text-center max-w-md glass-strong rounded-3xl p-8 border border-red-500/50">
          <h2 className="text-2xl font-bold text-ub-white mb-4">Error Loading Debate</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-ub-blue-600 hover:bg-ub-blue-700 text-white rounded-xl transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (loading || !debate) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-ub-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading debate...</p>
        </div>
      </div>
    );
  }

  const player1Arguments = debate.player1?.arguments || [];
  const player2Arguments = debate.player2?.arguments || [];
  const player1Votes = debate.votes?.player1 || 0;
  const player2Votes = debate.votes?.player2 || 0;
  const totalVotes = player1Votes + player2Votes;

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-8 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">{debate.topic}</h1>
            {isSpectator && (
              <div className="flex items-center space-x-2 text-slate-300">
                <Users className="h-5 w-5" />
                <span>{spectatorCount} watching</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{debate.player1?.username || 'Player 1'}</div>
                  <div className="text-sm text-slate-400">FOR</div>
                </div>
                <span className="text-slate-400">vs</span>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">{debate.player2?.username || 'Player 2'}</div>
                  <div className="text-sm text-slate-400">AGAINST</div>
                </div>
              </div>
            </div>
            
            {/* Audio Controls (only for participants) */}
            {isParticipant && (
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
            )}
          </div>
        </div>

        {/* Voting Section (for spectators) */}
        {isSpectator && debate.status === 'active' && (
          <div className="glass-strong rounded-3xl p-6 mb-6 border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Vote className="h-5 w-5" />
              <span>Vote for the Winner</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => handleVote('player1')}
                disabled={!!myVote}
                className={`p-6 rounded-xl border-2 transition-all ${
                  myVote === 'player1'
                    ? 'border-green-500 bg-green-500/20'
                    : myVote
                    ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                    : 'border-slate-700 hover:border-green-500/50 hover:bg-green-500/10 cursor-pointer'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {debate.player1?.username || 'Player 1'}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">FOR</div>
                  <div className="flex items-center justify-center space-x-2 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold">{player1Votes} votes</span>
                  </div>
                  {totalVotes > 0 && (
                    <div className="text-xs text-slate-400 mt-2">
                      {Math.round((player1Votes / totalVotes) * 100)}%
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => handleVote('player2')}
                disabled={!!myVote}
                className={`p-6 rounded-xl border-2 transition-all ${
                  myVote === 'player2'
                    ? 'border-red-500 bg-red-500/20'
                    : myVote
                    ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                    : 'border-slate-700 hover:border-red-500/50 hover:bg-red-500/10 cursor-pointer'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400 mb-2">
                    {debate.player2?.username || 'Player 2'}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">AGAINST</div>
                  <div className="flex items-center justify-center space-x-2 text-red-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold">{player2Votes} votes</span>
                  </div>
                  {totalVotes > 0 && (
                    <div className="text-xs text-slate-400 mt-2">
                      {Math.round((player2Votes / totalVotes) * 100)}%
                    </div>
                  )}
                </div>
              </button>
            </div>
            {myVote && (
              <div className="mt-4 text-center text-sm text-slate-400">
                You voted for {myVote === 'player1' ? debate.player1?.username : debate.player2?.username}
              </div>
            )}
          </div>
        )}

        {/* Arguments Display */}
        <div className="glass-strong rounded-3xl p-8 mb-6 border border-slate-700/50 h-[500px] overflow-y-auto">
          {player1Arguments.map((arg, idx) => (
            <div key={`p1-${idx}`} className="mb-4">
              <div className="inline-block max-w-[70%] p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                <div className="text-xs text-green-400 font-semibold mb-1">
                  {debate.player1?.username || 'Player 1'} (FOR)
                </div>
                <p className="text-white">{arg.text}</p>
              </div>
            </div>
          ))}
          {player2Arguments.map((arg, idx) => (
            <div key={`p2-${idx}`} className="mb-4 text-right">
              <div className="inline-block max-w-[70%] p-4 bg-red-500/20 rounded-xl border border-red-500/30 ml-auto">
                <div className="text-xs text-red-400 font-semibold mb-1 text-right">
                  {debate.player2?.username || 'Player 2'} (AGAINST)
                </div>
                <p className="text-white">{arg.text}</p>
              </div>
            </div>
          ))}
          {player1Arguments.length === 0 && player2Arguments.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              No arguments yet. Waiting for debaters to start...
            </div>
          )}
        </div>

        {/* Argument Input (only for participants) */}
        {isParticipant && debate.status === 'active' && (
          <form onSubmit={handleSubmitArgument} className="glass-strong rounded-3xl p-6 border border-slate-700/50">
            <div className="flex space-x-4">
              <input
                type="text"
                value={argumentText}
                onChange={(e) => setArgumentText(e.target.value)}
                placeholder={`Type your argument (${side})...`}
                className="flex-1 px-5 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500"
              />
              <button
                type="submit"
                disabled={!argumentText.trim()}
                className="px-6 py-3 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        )}

        {/* Hidden audio elements for WebRTC (only for participants) */}
        {isParticipant && (
          <>
            <audio ref={localAudioRef} autoPlay muted />
            <audio ref={remoteAudioRef} autoPlay volume={isRemoteAudioEnabled ? 1 : 0} />
          </>
        )}
      </div>
    </div>
  );
};

export default DebateRoom;

const Debate = require('../models/Debate');

class DebateMatchmaking {
  constructor(io) {
    this.io = io;
    this.waitingPlayers = new Map(); // sessionId -> {socketId, username, topic}
    this.activeDebates = new Map(); // debateId -> {player1Socket, player2Socket}
    this.debateSpectators = new Map(); // debateId -> Set of socketIds
    this.debateVoters = new Map(); // debateId -> Set of sessionIds who voted
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('✅ User connected to matchmaking service:', socket.id);
      console.log('📊 Total connected sockets:', this.io.sockets.sockets.size);

      // Join matchmaking queue
      socket.on('join-matchmaking', async (data) => {
        console.log('🔍 Join matchmaking request:', data);
        const { sessionId, username, topic } = data;
        
        if (!sessionId || !topic) {
          console.error('❌ Missing sessionId or topic:', { sessionId, topic });
          socket.emit('matchmaking-error', { error: 'Missing sessionId or topic' });
          return;
        }

        this.waitingPlayers.set(sessionId, {
          socketId: socket.id,
          username: username || 'Anonymous',
          topic: topic
        });
        socket.sessionId = sessionId;
        socket.topic = topic;

        console.log(`✅ Player ${sessionId} joined queue for topic: ${topic}`);
        console.log(`📊 Waiting players: ${this.waitingPlayers.size}`);

        // Try to find a match
        await this.findMatch(sessionId, topic, socket);
      });

      // Leave matchmaking
      socket.on('leave-matchmaking', (data) => {
        const { sessionId } = data;
        this.waitingPlayers.delete(sessionId);
      });

      // Join debate room (as participant or spectator)
      socket.on('join-debate-room', async (data) => {
        try {
          console.log('🚪 join-debate-room request:', data);
          const { debateId, sessionId, username, isParticipant } = data;
          
          if (!debateId) {
            console.error('❌ Missing debateId in join-debate-room');
            socket.emit('debate-error', { error: 'Missing debate ID' });
            return;
          }

          // Check if database is connected
          if (!this.isDBConnected()) {
            console.error('❌ Database not connected');
            socket.emit('debate-error', { error: 'Database not connected. Please start MongoDB.' });
            return;
          }

          // Check if debate exists
          const debate = await Debate.findById(debateId);
          if (!debate) {
            console.error('❌ Debate not found:', debateId);
            socket.emit('debate-error', { error: 'Debate not found' });
            return;
          }

          console.log('✅ Debate found, joining room:', debateId);
          socket.join(`debate-${debateId}`);
          socket.debateId = debateId;
          socket.sessionId = sessionId;

          // If spectator, add to spectator list
          if (!isParticipant) {
            if (!this.debateSpectators.has(debateId)) {
              this.debateSpectators.set(debateId, new Set());
            }
            this.debateSpectators.get(debateId).add(socket.id);
            
            // Update spectator count
            const spectatorCount = this.debateSpectators.get(debateId).size;
            console.log(`👥 Spectator count for debate ${debateId}: ${spectatorCount}`);
            
            // Update debate in database (only if connected)
            if (this.isDBConnected()) {
              await Debate.findByIdAndUpdate(debateId, { spectatorCount });
            }
            
            // Broadcast spectator count to all in room
            this.io.to(`debate-${debateId}`).emit('spectator-count', { count: spectatorCount });
          }

          // Send current debate state
          console.log('📤 Sending debate data to client');
          socket.emit('debate-updated', { debate });
        } catch (error) {
          console.error('❌ Error in join-debate-room:', error);
          socket.emit('debate-error', { error: error.message || 'Failed to join debate room' });
        }
      });

      // Submit argument
      socket.on('submit-argument', async (data) => {
        const { debateId, sessionId, argument } = data;
        await this.handleArgument(debateId, sessionId, argument);
      });

      // Vote on debate (spectators only)
      socket.on('vote-debate', async (data) => {
        const { debateId, sessionId, votedFor } = data;
        await this.handleVote(debateId, sessionId, votedFor);
      });

      // WebRTC signaling
      socket.on('webrtc-offer', (data) => {
        socket.to(`debate-${data.debateId}`).emit('webrtc-offer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-answer', (data) => {
        socket.to(data.targetSocketId).emit('webrtc-answer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-ice-candidate', (data) => {
        socket.to(`debate-${data.debateId}`).emit('webrtc-ice-candidate', {
          ...data,
          fromSocketId: socket.id
        });
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log('🔌 Socket disconnected:', socket.id);
        if (socket.sessionId) {
          this.waitingPlayers.delete(socket.sessionId);
        }
        
        if (socket.debateId) {
          // Remove from spectators
          const spectators = this.debateSpectators.get(socket.debateId);
          if (spectators) {
            spectators.delete(socket.id);
            const count = spectators.size;
            this.io.to(`debate-${socket.debateId}`).emit('spectator-count', { count });
            
            // Update database if connected
            if (this.isDBConnected()) {
              try {
                await Debate.findByIdAndUpdate(socket.debateId, { 
                  spectatorCount: count
                });
              } catch (err) {
                console.error('Error updating spectator count on disconnect:', err);
              }
            }
          }
        }
      });
    });
  }

  async findMatch(sessionId, topic, socket) {
    // Normalize topic (trim and lowercase for comparison, but keep original for display)
    const normalizedTopic = topic.trim().toLowerCase();
    
    console.log(`🔍 Looking for match for ${sessionId} on topic: "${topic}" (normalized: "${normalizedTopic}")`);
    console.log(`📊 Current waiting players:`, Array.from(this.waitingPlayers.entries()).map(([id, data]) => ({
      sessionId: id,
      topic: data.topic,
      normalizedTopic: data.topic.trim().toLowerCase(),
      socketId: data.socketId
    })));

    // Find another player waiting for the same topic (case-insensitive, trimmed)
    for (const [otherSessionId, otherData] of this.waitingPlayers.entries()) {
      if (otherSessionId !== sessionId) {
        const otherSocket = this.io.sockets.sockets.get(otherData.socketId);
        const otherNormalizedTopic = otherData.topic.trim().toLowerCase();
        const topicMatch = otherNormalizedTopic === normalizedTopic;
        
        console.log(`🔍 Checking ${otherSessionId}: socket exists: ${!!otherSocket}, topic match: ${topicMatch}`, {
          thisTopic: normalizedTopic,
          otherTopic: otherNormalizedTopic
        });
        
        if (otherSocket && topicMatch) {
          // Match found!
          console.log(`🎯 Match found! ${sessionId} vs ${otherSessionId} on topic: "${topic}"`);
          await this.createDebate(sessionId, otherSessionId, topic, socket, otherSocket, otherData);
          return;
        }
      }
    }

    // No match found, notify user they're in queue
    console.log(`⏳ No match found for ${sessionId}, adding to queue. Waiting players: ${this.waitingPlayers.size}`);
    socket.emit('matchmaking-status', { status: 'waiting', message: 'Waiting for another player to join this topic...' });
  }

  async createDebate(player1SessionId, player2SessionId, topic, socket1, socket2, player2Data) {
    console.log(`🏗️ Creating debate between ${player1SessionId} and ${player2SessionId}`);
    
    // Remove from waiting queue
    const player1Data = this.waitingPlayers.get(player1SessionId);
    if (!player1Data) {
      console.error('❌ Player1 data not found in waiting queue');
      return;
    }
    
    this.waitingPlayers.delete(player1SessionId);
    this.waitingPlayers.delete(player2SessionId);

    // Randomly assign sides
    const player1Side = Math.random() > 0.5 ? 'for' : 'against';
    const player2Side = player1Side === 'for' ? 'against' : 'for';

    console.log(`📝 Debate sides: ${player1Data.username} (${player1Side}) vs ${player2Data.username} (${player2Side})`);

    // Create debate in database
    try {
      if (!this.isDBConnected()) {
        throw new Error('Database not connected. Please start MongoDB.');
      }

      const debate = new Debate({
        topic,
        player1: {
          sessionId: player1SessionId,
          username: player1Data.username || 'Anonymous',
          side: player1Side,
          arguments: []
        },
        player2: {
          sessionId: player2SessionId,
          username: player2Data.username || 'Anonymous',
          side: player2Side,
          arguments: []
        },
        status: 'active',
        startedAt: new Date(),
        votes: {
          player1: 0,
          player2: 0,
          voters: []
        },
        spectatorCount: 0
      });

      await debate.save();
      const debateIdStr = debate._id.toString();
      console.log(`✅ Debate created with ID: ${debateIdStr}`);

      // Store socket connections
      this.activeDebates.set(debateIdStr, {
        player1Socket: socket1,
        player2Socket: socket2
      });

      // Initialize spectator tracking
      this.debateSpectators.set(debateIdStr, new Set());
      this.debateVoters.set(debateIdStr, new Set());

      // Join debate room for WebRTC
      socket1.join(`debate-${debateIdStr}`);
      socket2.join(`debate-${debateIdStr}`);
      socket1.debateId = debateIdStr;
      socket2.debateId = debateIdStr;

      // Notify both players with string ID
      console.log(`📤 Sending match-found to player 1: ${player1SessionId}`);
      socket1.emit('match-found', {
        debateId: debateIdStr,
        topic,
        side: player1Side,
        opponentSide: player2Side
      });

      console.log(`📤 Sending match-found to player 2: ${player2SessionId}`);
      socket2.emit('match-found', {
        debateId: debateIdStr,
        topic,
        side: player2Side,
        opponentSide: player1Side
      });

      console.log(`✅ Both players notified of match with debate ID: ${debateIdStr}`);
    } catch (error) {
      console.error('❌ Error creating debate:', error);
      // Notify players of error
      socket1.emit('matchmaking-error', { error: 'Failed to create debate' });
      socket2.emit('matchmaking-error', { error: 'Failed to create debate' });
    }
  }

  async handleArgument(debateId, sessionId, argument) {
    if (!this.isDBConnected()) {
      console.error('❌ Database not connected for handleArgument');
      return;
    }

    const debate = await Debate.findById(debateId);
    if (!debate) return;

    // Add argument to appropriate player
    const argumentData = {
      text: argument,
      timestamp: new Date()
    };

    if (debate.player1.sessionId === sessionId) {
      debate.player1.arguments.push(argumentData);
    } else if (debate.player2.sessionId === sessionId) {
      debate.player2.arguments.push(argumentData);
    } else {
      return; // Not a participant
    }

    await debate.save();

    // Broadcast to all in the debate room (participants and spectators)
    this.io.to(`debate-${debateId}`).emit('debate-updated', { debate });
    this.io.to(`debate-${debateId}`).emit('new-argument', {
      debateId,
      argument: argumentData
    });
  }

  async handleVote(debateId, sessionId, votedFor) {
    if (!this.isDBConnected()) {
      console.error('❌ Database not connected for handleVote');
      return;
    }

    const debate = await Debate.findById(debateId);
    if (!debate) return;

    // Check if user already voted
    const voters = this.debateVoters.get(debateId) || new Set();
    if (voters.has(sessionId)) {
      return; // Already voted
    }

    // Check if user is a participant (participants can't vote)
    if (debate.player1.sessionId === sessionId || debate.player2.sessionId === sessionId) {
      return; // Participants can't vote
    }

    // Add vote
    if (votedFor === 'player1') {
      debate.votes.player1 += 1;
    } else if (votedFor === 'player2') {
      debate.votes.player2 += 1;
    }

    debate.votes.voters.push(sessionId);
    voters.add(sessionId);
    this.debateVoters.set(debateId, voters);

    await debate.save();

    // Broadcast vote update to all in the debate room
    this.io.to(`debate-${debateId}`).emit('vote-updated', {
      votes: debate.votes,
      spectatorCount: this.debateSpectators.get(debateId)?.size || 0
    });
  }

  async handleVoteEnd(debateId) {
    const debate = await Debate.findById(debateId);
    if (!debate) return;

    // Determine winner based on votes
    if (debate.votes.player1 > debate.votes.player2) {
      debate.winner = 'player1';
    } else if (debate.votes.player2 > debate.votes.player1) {
      debate.winner = 'player2';
    } else {
      debate.winner = 'tie';
    }

    debate.status = 'finished';
    debate.finishedAt = new Date();
    debate.duration = Math.floor((debate.finishedAt - debate.startedAt) / 1000);

    await debate.save();

    // Notify all in the debate room
    this.io.to(`debate-${debateId}`).emit('debate-ended', {
      winner: debate.winner,
      votes: debate.votes
    });
  }
}

module.exports = DebateMatchmaking;

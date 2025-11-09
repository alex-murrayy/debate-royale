const Debate = require('../models/Debate');
const User = require('../models/User');

class DebateMatchmaking {
  constructor(io) {
    this.io = io;
    this.waitingPlayers = new Map(); // userId -> socketId
    this.activeDebates = new Map(); // debateId -> {player1Socket, player2Socket}
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join matchmaking queue
      socket.on('join-matchmaking', async (data) => {
        const { userId, topic, auth0Id } = data;
        // Use auth0Id if provided, otherwise use userId
        const userIdentifier = auth0Id || userId;
        this.waitingPlayers.set(userIdentifier, socket.id);
        socket.userId = userIdentifier;
        socket.topic = topic;

        // Try to find a match
        await this.findMatch(userIdentifier, topic, socket);
      });

      // Leave matchmaking
      socket.on('leave-matchmaking', (data) => {
        const { userId, auth0Id } = data;
        const userIdentifier = auth0Id || userId;
        this.waitingPlayers.delete(userIdentifier);
      });

      // Submit argument
      socket.on('submit-argument', async (data) => {
        const { debateId, argument, voiceoverUrl } = data;
        await this.handleArgument(debateId, socket.userId, argument, voiceoverUrl);
      });

      // Vote on debate
      socket.on('vote-debate', async (data) => {
        const { debateId, winnerId } = data;
        await this.handleVote(debateId, winnerId);
      });

      // Join debate room for WebRTC
      socket.on('join-debate-room', (data) => {
        const { debateId } = data;
        socket.join(`debate-${debateId}`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.waitingPlayers.delete(socket.userId);
        }
        console.log('User disconnected:', socket.id);
      });
    });
  }

  async findMatch(userId, topic, socket) {
    // Find another player waiting for the same topic
    for (const [otherUserId, otherSocketId] of this.waitingPlayers.entries()) {
      if (otherUserId !== userId) {
        const otherSocket = this.io.sockets.sockets.get(otherSocketId);
        if (otherSocket && otherSocket.topic === topic) {
          // Match found!
          await this.createDebate(userId, otherUserId, topic, socket, otherSocket);
          return;
        }
      }
    }

    // No match found, notify user they're in queue
    socket.emit('matchmaking-status', { status: 'waiting' });
  }

  async createDebate(player1Id, player2Id, topic, socket1, socket2) {
    // Remove from waiting queue
    this.waitingPlayers.delete(player1Id);
    this.waitingPlayers.delete(player2Id);

    // Get users from database (by auth0Id or userId)
    const player1 = await User.findOne({ 
      $or: [{ auth0Id: player1Id }, { _id: player1Id }] 
    });
    const player2 = await User.findOne({ 
      $or: [{ auth0Id: player2Id }, { _id: player2Id }] 
    });

    if (!player1 || !player2) {
      console.error('Could not find users for debate');
      return;
    }

    // Randomly assign sides
    const player1Side = Math.random() > 0.5 ? 'for' : 'against';
    const player2Side = player1Side === 'for' ? 'against' : 'for';

    // Create debate in database
    const debate = new Debate({
      topic,
      player1: {
        userId: player1._id,
        username: player1.username,
        side: player1Side
      },
      player2: {
        userId: player2._id,
        username: player2.username,
        side: player2Side
      },
      status: 'active',
      startedAt: new Date()
    });

    await debate.save();

    // Store socket connections
    this.activeDebates.set(debate._id.toString(), {
      player1Socket: socket1,
      player2Socket: socket2
    });

    // Join debate room for WebRTC
    socket1.join(`debate-${debate._id}`);
    socket2.join(`debate-${debate._id}`);

    // Notify both players
    socket1.emit('match-found', {
      debateId: debate._id,
      topic,
      side: player1Side,
      opponentSide: player2Side,
      opponentId: player2._id.toString()
    });

    socket2.emit('match-found', {
      debateId: debate._id,
      topic,
      side: player2Side,
      opponentSide: player1Side,
      opponentId: player1._id.toString()
    });
  }

  async handleArgument(debateId, userId, argument, voiceoverUrl) {
    const debate = await Debate.findById(debateId);
    if (!debate) return;

    const debateConnections = this.activeDebates.get(debateId.toString());
    if (!debateConnections) return;

    // Get user to check which side they're on
    const user = await User.findOne({ 
      $or: [{ auth0Id: userId }, { _id: userId }] 
    });
    if (!user) return;

    // Add argument to appropriate player
    const argumentData = {
      text: argument,
      timestamp: new Date(),
      voiceoverUrl
    };

    if (debate.player1.userId.toString() === user._id.toString()) {
      debate.player1.arguments.push(argumentData);
    } else if (debate.player2.userId && debate.player2.userId.toString() === user._id.toString()) {
      debate.player2.arguments.push(argumentData);
    }

    await debate.save();

    // Broadcast to both players
    if (debateConnections.player1Socket) {
      debateConnections.player1Socket.emit('new-argument', {
        debateId,
        argument: argumentData,
        player: debate.player1.userId.toString() === user._id.toString() ? 1 : 2
      });
    }

    if (debateConnections.player2Socket) {
      debateConnections.player2Socket.emit('new-argument', {
        debateId,
        argument: argumentData,
        player: debate.player1.userId.toString() === user._id.toString() ? 1 : 2
      });
    }
  }

  async handleVote(debateId, winnerId) {
    const debate = await Debate.findById(debateId);
    if (!debate) return;

    debate.winner = winnerId;
    debate.status = 'finished';
    debate.finishedAt = new Date();
    debate.duration = Math.floor((debate.finishedAt - debate.startedAt) / 1000);

    await debate.save();

    // Update user stats
    const winner = await User.findById(winnerId);
    const loser = await User.findById(
      debate.player1.userId.toString() === winnerId.toString() 
        ? debate.player2.userId 
        : debate.player1.userId
    );

    if (winner) {
      winner.wins += 1;
      winner.addExperience(50);
      await winner.save();
    }

    if (loser) {
      loser.losses += 1;
      loser.addExperience(10);
      await loser.save();
    }

    // Notify players
    const debateConnections = this.activeDebates.get(debateId.toString());
    if (debateConnections) {
      if (debateConnections.player1Socket) {
        debateConnections.player1Socket.emit('debate-ended', { winnerId });
      }
      if (debateConnections.player2Socket) {
        debateConnections.player2Socket.emit('debate-ended', { winnerId });
      }
      this.activeDebates.delete(debateId.toString());
    }
  }
}

module.exports = DebateMatchmaking;

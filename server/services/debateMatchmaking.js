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
        const { userId, topic } = data;
        this.waitingPlayers.set(userId, socket.id);
        socket.userId = userId;
        socket.topic = topic;

        // Try to find a match
        await this.findMatch(userId, topic, socket);
      });

      // Leave matchmaking
      socket.on('leave-matchmaking', (data) => {
        const { userId } = data;
        this.waitingPlayers.delete(userId);
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

    // Randomly assign sides
    const player1Side = Math.random() > 0.5 ? 'for' : 'against';
    const player2Side = player1Side === 'for' ? 'against' : 'for';

    // Create debate in database
    const debate = new Debate({
      topic,
      player1: {
        userId: player1Id,
        side: player1Side
      },
      player2: {
        userId: player2Id,
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

    // Notify both players
    socket1.emit('match-found', {
      debateId: debate._id,
      topic,
      side: player1Side,
      opponentSide: player2Side
    });

    socket2.emit('match-found', {
      debateId: debate._id,
      topic,
      side: player2Side,
      opponentSide: player1Side
    });
  }

  async handleArgument(debateId, userId, argument, voiceoverUrl) {
    const debate = await Debate.findById(debateId);
    if (!debate) return;

    const debateConnections = this.activeDebates.get(debateId.toString());
    if (!debateConnections) return;

    // Add argument to appropriate player
    const argumentData = {
      text: argument,
      timestamp: new Date(),
      voiceoverUrl
    };

    if (debate.player1.userId.toString() === userId.toString()) {
      debate.player1.arguments.push(argumentData);
    } else if (debate.player2.userId.toString() === userId.toString()) {
      debate.player2.arguments.push(argumentData);
    }

    await debate.save();

    // Broadcast to both players
    debateConnections.player1Socket.emit('new-argument', {
      debateId,
      argument: argumentData,
      player: debate.player1.userId.toString() === userId.toString() ? 1 : 2
    });

    debateConnections.player2Socket.emit('new-argument', {
      debateId,
      argument: argumentData,
      player: debate.player1.userId.toString() === userId.toString() ? 1 : 2
    });
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
    const User = require('../models/User');
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
      debateConnections.player1Socket.emit('debate-ended', { winnerId });
      debateConnections.player2Socket.emit('debate-ended', { winnerId });
      this.activeDebates.delete(debateId.toString());
    }
  }
}

module.exports = DebateMatchmaking;


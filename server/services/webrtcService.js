// WebRTC service for live audio streaming between devices
class WebRTCService {
  constructor(io) {
    this.io = io;
    this.peerConnections = new Map(); // userId -> peerConnection
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Handle WebRTC signaling
      socket.on('webrtc-offer', async (data) => {
        const { debateId, offer, targetUserId } = data;
        // Forward offer to target user
        socket.to(`debate-${debateId}`).emit('webrtc-offer', {
          offer,
          fromUserId: socket.userId
        });
      });

      socket.on('webrtc-answer', async (data) => {
        const { debateId, answer, targetUserId } = data;
        // Forward answer to target user
        socket.to(`debate-${debateId}`).emit('webrtc-answer', {
          answer,
          fromUserId: socket.userId
        });
      });

      socket.on('webrtc-ice-candidate', async (data) => {
        const { debateId, candidate, targetUserId } = data;
        // Forward ICE candidate to target user
        socket.to(`debate-${debateId}`).emit('webrtc-ice-candidate', {
          candidate,
          fromUserId: socket.userId
        });
      });

      socket.on('join-debate-room', (data) => {
        const { debateId } = data;
        socket.join(`debate-${debateId}`);
      });

      socket.on('leave-debate-room', (data) => {
        const { debateId } = data;
        socket.leave(`debate-${debateId}`);
      });
    });
  }
}

module.exports = WebRTCService;


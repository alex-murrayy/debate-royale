const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Log Socket.io connection attempts
io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', socket.id, error);
  });
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection - make it optional for development
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-royale';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️  Continuing without database - some features may not work');
    console.warn('💡 To fix:');
    console.warn('   - Run: npm run mongo:up (to start Docker MongoDB)');
    console.warn('   - Or: Start local MongoDB with "mongod"');
    console.warn('   - Or: Set MONGODB_URI in .env to a cloud MongoDB instance');
  }
};

connectDB();

// Import routes
const debateRoutes = require('./routes/debates');

// Import services
const DebateMatchmaking = require('./services/debateMatchmaking');

// Routes
app.use('/api/debates', debateRoutes);

// Socket.io for real-time debate matching and WebRTC signaling
const matchmaking = new DebateMatchmaking(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Debate Royale API is running' });
});

server.listen(PORT, () => {
  console.log(`🚀 Debate Royale server running on port ${PORT}`);
  console.log(`📝 Using ${process.env.ELEVENLABS_API_KEY ? 'REAL' : 'MOCK'} ElevenLabs API`);
  console.log(`💳 Using ${process.env.STRIPE_SECRET_KEY ? 'REAL' : 'MOCK'} Stripe`);
  console.log(`🔌 Socket.io server ready on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle Socket.io errors
io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.io connection error:', err.req);
  console.error('❌ Error details:', err.message);
  console.error('❌ Error context:', err.context);
});

module.exports = { app, io };

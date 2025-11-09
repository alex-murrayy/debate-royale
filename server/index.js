const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-royale', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const debateRoutes = require('./routes/debates');
const voiceRoutes = require('./routes/voices');
const lootBoxRoutes = require('./routes/lootboxes');
const paymentRoutes = require('./routes/payments');

// Import services
const DebateMatchmaking = require('./services/debateMatchmaking');
const WebRTCService = require('./services/webrtcService');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/voices', voiceRoutes);
app.use('/api/lootboxes', lootBoxRoutes);
app.use('/api/payments', paymentRoutes);

// Socket.io for real-time debate matching and WebRTC signaling
const matchmaking = new DebateMatchmaking(io);
const webrtcService = new WebRTCService(io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Debate Royale API is running' });
});

server.listen(PORT, () => {
      console.log(`🚀 Debate Royale server running on port ${PORT}`);
  console.log(`📝 Using ${process.env.ELEVENLABS_API_KEY ? 'REAL' : 'MOCK'} ElevenLabs API`);
  console.log(`💳 Using ${process.env.STRIPE_SECRET_KEY ? 'REAL' : 'MOCK'} Stripe`);
});

module.exports = { app, io };

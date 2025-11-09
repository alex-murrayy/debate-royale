# 🎤 Debate Royale

**Anonymous online debate game with live audio, AI-powered voiceovers, leveling system, and loot boxes**

Debate Royale is a competitive debate platform where users can engage in anonymous debates with live audio streaming, level up, unlock voices and profile pictures, and purchase premium content through loot boxes.

## 🚀 Features

- **Anonymous Debates**: Match with opponents and debate topics in real-time
- **AI Voiceovers**: ElevenLabs-powered voiceovers for your arguments
- **Leveling System**: Level up and rank up by winning debates
- **Unlockable Content**: Unlock profile pictures and voices as you progress
- **Loot Boxes**: Purchase loot boxes with real money to get random rewards
- **Premium Voices**: Buy premium voices with credit cards via Stripe
- **Real-time Matchmaking**: Socket.io-powered real-time debate matching
- **User Profiles**: Track wins, losses, level, and rank

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB with Mongoose
- **APIs**:
  - ElevenLabs (Text-to-Speech)
  - Stripe (Payments)
- **Real-time**: Socket.io for matchmaking and debates

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose (for MongoDB) - **Recommended**
  - OR MongoDB installed locally (v5.0 or higher)
- Stripe account (for payments) - Optional
- ElevenLabs API key - Optional

### Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd Backup
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Start MongoDB with Docker** (Recommended)

   ```bash
   npm run mongo:up
   ```

   This will start MongoDB in a Docker container. The database will be available at `mongodb://localhost:27017/debate-royale`.

   **Other MongoDB commands:**

   - `npm run mongo:down` - Stop and remove MongoDB container
   - `npm run mongo:logs` - View MongoDB logs
   - `npm run mongo:stop` - Stop MongoDB container
   - `npm run mongo:start` - Start MongoDB container

   **Alternative: Use local MongoDB**

   If you prefer to run MongoDB locally instead of Docker:

   ```bash
   mongod
   ```

   📖 **For detailed Docker setup instructions, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)**

4. **Set up environment variables**

   Copy the example environment file:

   ```bash
   cp env.example .env
   ```

   The default configuration works with Docker MongoDB. If you're using a cloud MongoDB instance, update `MONGODB_URI` in `.env`.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   This will start:

   - Backend server on http://localhost:5001
   - Frontend on http://localhost:3000

## 🎮 How to Play

1. **Register/Login**: Create an account or login
2. **Find Debate**: Enter a topic and search for an opponent
3. **Debate**: Submit arguments with AI-generated voiceovers
4. **Win**: Win debates to gain experience and level up
5. **Unlock**: Unlock new voices and profile pictures
6. **Purchase**: Buy loot boxes or premium voices with real money

## 🏆 Ranking System

- **Bronze**: Level 1-4
- **Silver**: Level 5-9
- **Gold**: Level 10-19
- **Platinum**: Level 20-29
- **Diamond**: Level 30-39
- **Master**: Level 40-49
- **Grandmaster**: Level 50+

## 💰 Economy

- **Coins**: Earned by winning debates, used to unlock voices
- **Gems**: Premium currency, can be purchased or found in loot boxes
- **Loot Boxes**: Purchase with real money, contain random rewards
- **Premium Voices**: Buy directly with credit card

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile-picture` - Update profile picture
- `PUT /api/users/voice` - Update selected voice

### Debates

- `GET /api/debates/my-debates` - Get user's debates
- `GET /api/debates/:id` - Get debate by ID

### Voices

- `GET /api/voices` - Get all available voices
- `POST /api/voices/generate` - Generate voiceover
- `POST /api/voices/unlock` - Unlock voice with coins/gems

### Loot Boxes

- `GET /api/lootboxes` - Get all loot boxes
- `POST /api/lootboxes/open` - Open a loot box

### Payments

- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/purchase-voice` - Purchase voice with real money
- `POST /api/payments/webhook` - Stripe webhook handler

## 🎨 Customization

- Modify voices in database (Voice model)
- Adjust leveling curve in User model
- Customize loot box rewards in LootBox model
- Update ranks and requirements

## 📝 Database Models

- **User**: User accounts with level, rank, unlocked content
- **Debate**: Debate sessions with arguments and results
- **Voice**: Available voices with pricing and requirements
- **LootBox**: Loot box definitions with rewards

## 🚢 Deployment

1. Set up MongoDB Atlas or other cloud database
2. Deploy backend to Vultr/Heroku/Railway
3. Deploy frontend to Vercel/Netlify
4. Configure environment variables
5. Set up Stripe webhooks
6. Configure CORS and Socket.io settings

## 🔐 Security

- Auth0 authentication (no passwords stored)
- JWT tokens for API authentication
- Stripe webhook signature verification
- Input validation and sanitization

## 🔑 Auth0 Setup

### Social Connections

If you see warnings about "Auth0 development keys":

1. **Quick Fix**: Disable social connections in Auth0 Dashboard
2. **Proper Fix**: Set up production keys (see `SETUP_SOCIAL_CONNECTIONS.md`)

For production, configure your own Client ID/Secret for social providers to:

- Remove dev keys warnings
- Show your app branding on consent screens
- Enable full SSO functionality

## 📄 License

MIT License - feel free to use this for your project!

---

**Built with ❤️ for competitive debaters**

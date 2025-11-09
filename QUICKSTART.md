# 🚀 Quick Start Guide

Get HackHub Narrator up and running in 5 minutes!

## Prerequisites

- Node.js v16 or higher
- npm or yarn

## Setup Steps

### 1. Install Dependencies

```bash
# Run the setup script
./setup.sh

# OR manually:
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```env
# Required for real voice generation
ELEVENLABS_API_KEY=your_key_here

# Required for AI script generation
GEMINI_API_KEY=your_key_here

# Required for user accounts
AUTH0_DOMAIN=your_domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
REACT_APP_AUTH0_DOMAIN=your_domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your_client_id
```

**Note:** The app will work in demo/mock mode without API keys, but you won't get real voiceovers.

### 3. Get API Keys

#### ElevenLabs API Key
1. Go to [https://elevenlabs.io](https://elevenlabs.io)
2. Sign up for a free account
3. Navigate to your profile → API Keys
4. Copy your API key

#### Google Gemini API Key
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

#### Auth0 Setup
1. Go to [https://auth0.com](https://auth0.com)
2. Sign up for a free account
3. Create a new application (Single Page Application)
4. Add `http://localhost:3000` to allowed callback URLs
5. Copy Domain and Client ID

### 4. Start the Development Server

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

## Usage

1. **Open your browser** to http://localhost:3000
2. **Generate a script** (optional):
   - Click "Generate Script with AI"
   - Enter project name and description
   - Let AI write your script
3. **Enter your script** (or use the AI-generated one)
4. **Select a voice** from the available options
5. **Click "Generate Voiceover"**
6. **Download your MP3** file
7. **Add to your video editor** and you're done!

## Demo Mode

If you don't have API keys yet, the app runs in **demo mode**:
- UI works perfectly
- Mock responses for script generation
- Mock audio files (won't play, but downloads work)
- Perfect for testing the interface

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env file
PORT=5001
```

### API errors
- Check that your API keys are correct in `.env`
- Verify API keys are active and have credits
- Check server console for error messages

### Auth0 not working
- Verify callback URLs are set correctly
- Check that domain and client ID match in both server and client env vars
- Make sure you're using `http://localhost:3000` (not https)

## Next Steps

- Customize voices in `server/index.js`
- Modify UI colors in `client/tailwind.config.js`
- Deploy to Vultr or Cloudflare
- Get your `.tech` domain from GoDaddy

## Hackathon Tips

1. **Test early** - Get your API keys before the hackathon starts
2. **Demo mode works** - You can demo the UI even without keys
3. **Save your work** - Login to save all generated audio files
4. **Multiple voices** - Try different voices for different parts of your demo
5. **Script generator** - Use it to quickly create professional scripts

Good luck! 🎉


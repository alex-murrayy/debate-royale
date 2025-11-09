# 🎙️ HackHub Narrator

**AI-powered voiceover generator for hackathon demo videos**

Tired after 24 hours of hacking? Let AI generate a professional voiceover for your demo video. No recording. No editing. Just results.

## 🚀 Features

- **AI-Powered Voice Generation**: Uses ElevenLabs API for high-quality text-to-speech
- **Multiple Voice Options**: Choose from various voices with different accents, tones, and styles
- **AI Script Generator**: Powered by Google Gemini to help you write your demo script
- **User Accounts**: Save all your generated audio files with Auth0 authentication
- **Modern UI**: Sleek, modern interface built with React and Tailwind CSS
- **Instant Download**: Get your MP3 file ready to drop into your video editor

## 🏆 Hackathon Prizes Targeted

This project is designed to win multiple sponsor prizes:

1. **ElevenLabs** - Best Use of ElevenLabs (Main prize: Beats Solo Buds)
2. **GoDaddy Registry** - Best Domain Name
3. **Auth0** - Best Use of Auth0
4. **Google Gemini** - AI Integration
5. **Vultr/Cloudflare** - Deployment

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **APIs**:
  - ElevenLabs (Text-to-Speech)
  - Google Gemini (Script Generation)
  - Auth0 (Authentication)
- **Deployment**: Ready for Vultr/Cloudflare

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

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

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   - `ELEVENLABS_API_KEY` - Get from [ElevenLabs](https://elevenlabs.io)
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `AUTH0_DOMAIN` - Get from [Auth0](https://auth0.com)
   - `AUTH0_CLIENT_ID` - Get from Auth0
   - `REACT_APP_AUTH0_DOMAIN` - Same as AUTH0_DOMAIN
   - `REACT_APP_AUTH0_CLIENT_ID` - Same as AUTH0_CLIENT_ID

4. **Run the development server**

   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend (port 3000).

## 🎯 Usage

1. **Generate a Script** (Optional)

   - Click "Generate Script with AI"
   - Enter your project name and description
   - Let Gemini generate a 30-second demo script

2. **Enter Your Script**

   - Type or paste your demo script
   - Or use the AI-generated script

3. **Select a Voice**

   - Choose from available voices
   - Adjust stability and similarity boost settings

4. **Generate Voiceover**

   - Click "Generate Voiceover"
   - Wait for the AI to create your audio
   - Preview and download your MP3 file

5. **Save to Account** (Optional)
   - Login with Auth0 to save your audio files
   - Access them later from your dashboard

## 🔧 API Configuration

### ElevenLabs API

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get your API key from the dashboard
3. Add it to `.env` as `ELEVENLABS_API_KEY`

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to `.env` as `GEMINI_API_KEY`

### Auth0 Setup

1. Create an account at [Auth0](https://auth0.com)
2. Create a new application (Single Page Application)
3. Add `http://localhost:3000` to allowed callback URLs
4. Copy Domain and Client ID to `.env`

## 🚢 Deployment

### Deploy to Vultr

1. Build the React app:

   ```bash
   npm run build
   ```

2. Deploy the server to Vultr
3. Set environment variables on Vultr
4. Update `REACT_APP_API_URL` to your production API URL

### Deploy to Cloudflare Pages

1. Build the React app
2. Deploy to Cloudflare Pages
3. Configure environment variables
4. Set up Workers for the API (if needed)

## 📝 Demo Mode

If you don't have API keys yet, the app will run in demo mode with mock responses. This allows you to test the UI and flow without real API calls.

## 🎨 Customization

- Modify voices in `server/index.js` (AVAILABLE_VOICES)
- Customize UI colors in `client/tailwind.config.js`
- Add more features in `client/src/components/`

## 📄 License

MIT License - feel free to use this for your hackathon!

## 🙏 Credits

- Built for hackathon with focus on sponsor integration
- Powered by ElevenLabs, Google Gemini, and Auth0
- UI designed for tired hackers who need quick results

---

**Good luck with your hackathon! 🚀**
# master-debtor

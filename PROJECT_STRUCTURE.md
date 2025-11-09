# 📁 Project Structure

```
Backup/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Home.js    # Landing page
│   │   │   ├── Generator.js  # Main voiceover generator
│   │   │   ├── Dashboard.js  # User dashboard
│   │   │   └── Navbar.js     # Navigation bar
│   │   ├── App.js         # Main app component
│   │   ├── App.css        # App styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Frontend dependencies
│   ├── tailwind.config.js # Tailwind CSS config
│   └── postcss.config.js  # PostCSS config
│
├── server/                # Express backend
│   ├── index.js          # Main server file
│   └── package.json      # Backend dependencies
│
├── package.json          # Root package.json
├── env.example           # Environment variables template
├── .gitignore           # Git ignore file
├── setup.sh             # Setup script
├── README.md            # Main documentation
├── QUICKSTART.md        # Quick start guide
├── HACKATHON.md         # Hackathon submission guide
└── PROJECT_STRUCTURE.md # This file
```

## Key Files

### Frontend (`client/`)

- **`src/App.js`**: Main app component with routing and Auth0 provider
- **`src/components/Home.js`**: Landing page with features and CTA
- **`src/components/Generator.js`**: Main voiceover generation interface
- **`src/components/Dashboard.js`**: User dashboard for saved audio files
- **`src/components/Navbar.js`**: Navigation with authentication

### Backend (`server/`)

- **`index.js`**: Express server with API routes
  - `/api/voices` - Get available voices
  - `/api/generate-script` - Generate script with Gemini
  - `/api/generate-voiceover` - Generate voiceover with ElevenLabs
  - `/api/user/audio` - Get user's saved audio files
  - `/api/user/audio/:id` - Download specific audio file

## Environment Variables

See `env.example` for all required environment variables:

- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `GEMINI_API_KEY` - Google Gemini API key
- `AUTH0_DOMAIN` - Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 client ID
- `REACT_APP_AUTH0_DOMAIN` - Auth0 domain for React
- `REACT_APP_AUTH0_CLIENT_ID` - Auth0 client ID for React
- `REACT_APP_API_URL` - Backend API URL

## API Endpoints

### GET `/api/voices`
Returns list of available voices

### POST `/api/generate-script`
Generates a script using Gemini AI
- Body: `{ projectName, description }`
- Returns: `{ script }`

### POST `/api/generate-voiceover`
Generates voiceover using ElevenLabs
- Body: `{ text, voiceId, stability, similarityBoost, userId }`
- Returns: MP3 audio file

### GET `/api/user/audio`
Gets user's saved audio files
- Header: `user-id`
- Returns: `{ audioFiles: [] }`

### GET `/api/user/audio/:audioId`
Downloads a specific audio file
- Header: `user-id`
- Returns: MP3 audio file

## Component Hierarchy

```
App
├── Auth0Provider
│   └── Router
│       ├── Navbar
│       └── Routes
│           ├── Home
│           ├── Generator
│           └── Dashboard
```

## Data Flow

1. User enters script or generates with AI
2. User selects voice and settings
3. Frontend sends request to `/api/generate-voiceover`
4. Backend calls ElevenLabs API
5. Audio file returned to frontend
6. User can play, download, or save to account
7. If logged in, audio saved to user's account

## State Management

- React hooks (useState, useEffect) for local state
- Auth0 for authentication state
- In-memory storage for demo (replace with database in production)

## Styling

- Tailwind CSS for utility-first styling
- Custom color scheme with primary blue
- Responsive design for mobile and desktop
- Dark theme with gradient backgrounds

## Deployment

- Frontend: Build with `npm run build` and deploy to Cloudflare Pages/Vultr
- Backend: Deploy to Vultr/Cloudflare Workers
- Environment variables: Set in deployment platform
- Database: Replace in-memory storage with database (MongoDB, PostgreSQL, etc.)


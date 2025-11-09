#!/bin/bash

echo "🎤 Debate Arena Setup"
echo "===================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please edit .env and add your:"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - ELEVENLABS_API_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - REACT_APP_STRIPE_PUBLISHABLE_KEY"
else
    echo ""
    echo "✅ .env file already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Make sure MongoDB is running"
echo "3. Run 'npm run seed' to seed the database"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "This will start:"
echo "  - Backend server on http://localhost:5000"
echo "  - Frontend on http://localhost:3000"
echo ""

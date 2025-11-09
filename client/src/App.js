import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Callback from './components/Callback';
import Dashboard from './components/Dashboard';
import DebateRoom from './components/DebateRoom';
import Matchmaking from './components/Matchmaking';
import Shop from './components/Shop';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key');

// Debug: Log environment variables
console.log('🔍 Auth0 Config:', {
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  audience: process.env.REACT_APP_AUTH0_AUDIENCE
});

const domain = process.env.REACT_APP_AUTH0_DOMAIN || 'dev-fake.auth0.com';
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || 'fake-client-id';
const audience = process.env.REACT_APP_AUTH0_AUDIENCE || 'https://debate-royale-api';

if (domain === 'dev-fake.auth0.com') {
  console.error('❌ REACT_APP_AUTH0_DOMAIN is not set! Check your .env file in the client/ directory.');
}

function App() {
  // For now, skip audience to avoid "Service not found" error
  // TODO: After creating API in Auth0 with identifier "https://debate-royale-api", uncomment the audience line below
  const authParams = {
    redirect_uri: `${window.location.origin}/callback`,
    scope: 'openid profile email'
    // audience: audience,  // Uncomment this after creating API in Auth0
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={authParams}
      cacheLocation="localstorage"
      useRefreshTokens={false}
      useCookiesForTransactions={false}
      skipRedirectCallback={false}
    >
      <Elements stripe={stripePromise}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen relative overflow-hidden">
              {/* University at Buffalo themed background gradient */}
              <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-ub-blue-900 to-slate-950 -z-10" />
              <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,91,187,0.15),transparent_50%)] -z-10" />
              <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(47,159,208,0.1),transparent_50%)] -z-10" />
              
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/matchmaking" element={<Matchmaking />} />
                <Route path="/debate/:id" element={<DebateRoom />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </Elements>
    </Auth0Provider>
  );
}

export default App;

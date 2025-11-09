import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DebateRoom from './components/DebateRoom';
import Matchmaking from './components/Matchmaking';
import Shop from './components/Shop';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key');

function App() {
  return (
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
  );
}

export default App;

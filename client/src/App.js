import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import DebateRoom from './components/DebateRoom';
import Matchmaking from './components/Matchmaking';
import Navbar from './components/Navbar';
import { AnonymousProvider } from './context/AnonymousContext';
import './App.css';

function App() {
  return (
    <AnonymousProvider>
      <Router>
        <div className="min-h-screen relative overflow-hidden">
          {/* University at Buffalo themed background gradient */}
          <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-ub-blue-900 to-slate-950 -z-10" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,91,187,0.15),transparent_50%)] -z-10" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(47,159,208,0.1),transparent_50%)] -z-10" />
          
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/debate/:id" element={<DebateRoom />} />
          </Routes>
        </div>
      </Router>
    </AnonymousProvider>
  );
}

export default App;

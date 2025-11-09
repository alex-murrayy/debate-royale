import React from 'react';
import { Link } from 'react-router-dom';
import { useAnonymous } from '../context/AnonymousContext';
import { Mic, Users } from 'lucide-react';

const Navbar = () => {
  const { username } = useAnonymous();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-slate-800/50 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-ub-blue-500/30 rounded-xl blur-md group-hover:blur-lg transition-all" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center shadow-glow-ub">
                <Mic className="h-5 w-5 text-ub-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold text-ub-white tracking-tight">Debate</span>
              <span className="text-xl font-extrabold text-gradient-primary"> Royale</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link
              to="/matchmaking"
              className="text-slate-300 hover:text-ub-blue-400 transition-colors font-semibold text-sm uppercase tracking-wide"
            >
              Find Debate
            </Link>
            <div className="flex items-center space-x-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
              <Users className="h-4 w-4 text-ub-blue-400" />
              <span className="text-sm text-slate-200 font-medium">{username || 'Anonymous'}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

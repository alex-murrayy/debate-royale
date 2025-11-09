import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, Trophy, Zap, Users, ArrowRight } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="min-h-screen relative pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center animate-fade-in">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-ub-white mb-8 leading-tight tracking-tight">
            <span className="block mb-2">Debate</span>
            <span className="block text-gradient animate-gradient bg-gradient-to-r from-ub-blue-300 via-victor-e-blue to-ub-blue-500 bg-clip-text text-transparent bg-[length:200%_auto]">
              Royale
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Anonymous debates with live audio and AI-powered voiceovers. Level up, unlock voices, and prove your argumentative skills.
          </p>
          
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-20">
                {isAuthenticated ? (
                  <Link
                    to="/matchmaking"
                    className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 text-ub-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 hover:shadow-glow-lg shadow-glow-ub overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center space-x-3">
                      <span>Start Debating</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={login}
                    className="group relative inline-flex items-center justify-center space-x-3 px-10 py-5 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 text-ub-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 hover:shadow-glow-lg shadow-glow-ub overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center space-x-3">
                      <span>Get Started</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                )}
              </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32">
            <div className="glass-strong rounded-3xl p-8 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-glow-ub">
                <Users className="h-8 w-8 text-ub-white" />
              </div>
              <h3 className="text-2xl font-bold text-ub-white mb-4">Anonymous Debates</h3>
              <p className="text-slate-400 leading-relaxed">
                Debate topics anonymously with players from around the world. Your identity stays hidden.
              </p>
            </div>

            <div className="glass-strong rounded-3xl p-8 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-br from-victor-e-blue to-ub-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-ub">
                <Mic className="h-8 w-8 text-ub-white" />
              </div>
              <h3 className="text-2xl font-bold text-ub-white mb-4">AI Voiceovers</h3>
              <p className="text-slate-400 leading-relaxed">
                Unlock powerful voices powered by ElevenLabs. Level up to access new voices and customize your experience.
              </p>
            </div>

            <div className="glass-strong rounded-3xl p-8 border border-slate-700/50">
              <div className="w-16 h-16 bg-gradient-to-br from-lake-lasalle to-ub-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow-ub">
                <Trophy className="h-8 w-8 text-ub-white" />
              </div>
              <h3 className="text-2xl font-bold text-ub-white mb-4">Level & Rank</h3>
              <p className="text-slate-400 leading-relaxed">
                Level up by winning debates. Unlock new ranks, profile pictures, and exclusive content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

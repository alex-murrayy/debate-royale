import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Download, Trash2, Play, Loader, FileAudio, Folder, Clock, User } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const { isAuthenticated, user, loginWithRedirect } = useAuth0();
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAudioFiles();
    }
  }, [isAuthenticated]);

  const fetchAudioFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user/audio`, {
        headers: {
          'user-id': user?.sub,
        },
      });
      setAudioFiles(response.data.audioFiles || []);
    } catch (error) {
      console.error('Error fetching audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (audioId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/audio/${audioId}`,
        {
          headers: {
            'user-id': user?.sub,
          },
          responseType: 'blob',
        }
      );

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover-${audioId}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      alert('Failed to download audio file');
    }
  };

  const handlePlay = async (audioId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/audio/${audioId}`,
        {
          headers: {
            'user-id': user?.sub,
          },
          responseType: 'blob',
        }
      );

      const url = URL.createObjectURL(response.data);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio file');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-strong rounded-3xl p-16 text-center border border-slate-700/50">
          <div className="w-20 h-20 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-ub">
            <User className="h-10 w-10 text-ub-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Please login to access your saved audio files and manage your voiceovers.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl font-bold text-lg transition-all shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105"
          >
            <span>Login to Continue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4">
              My Audio
              <span className="block text-gradient mt-2">Library</span>
            </h1>
            <p className="text-xl text-slate-400">
              All your generated voiceovers in one place
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4 px-6 py-3 glass rounded-xl border border-slate-700/50">
            <Folder className="h-5 w-5 text-ub-blue-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{audioFiles.length}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Files</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader className="h-12 w-12 animate-spin text-ub-blue-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Loading your audio files...</p>
          </div>
        </div>
      ) : audioFiles.length === 0 ? (
        <div className="glass-strong rounded-3xl p-16 text-center border border-slate-700/50">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileAudio className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            No Audio Files Yet
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-md mx-auto">
            Start generating voiceovers to see them appear here. All your generated files will be saved automatically.
          </p>
          <a
            href="/generate"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl font-bold text-lg transition-all shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105"
          >
            <span>Generate Your First Voiceover</span>
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audioFiles.map((audioFile) => (
            <div
              key={audioFile.id}
              className="group glass-strong rounded-2xl p-6 hover:border-ub-blue-500/50 transition-all border border-slate-700/50 hover:shadow-glow-ub"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center shadow-glow-ub group-hover:scale-110 transition-transform">
                  <FileAudio className="h-6 w-6 text-ub-white" />
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {new Date(audioFile.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-slate-400 mb-3 font-semibold uppercase tracking-wide">Preview</div>
                <div className="text-white text-sm leading-relaxed line-clamp-3 font-medium">
                  {audioFile.text}...
                </div>
                <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Voice ID: {audioFile.voiceId.substring(0, 12)}...</span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handlePlay(audioFile.id)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all flex items-center justify-center space-x-2 font-semibold border border-slate-700/50 hover:border-slate-600"
                >
                  <Play className="h-4 w-4" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => handleDownload(audioFile.id)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl transition-all flex items-center justify-center space-x-2 font-semibold shadow-glow-ub hover:shadow-glow-lg"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Section */}
      {audioFiles.length > 0 && (
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50 text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">{audioFiles.length}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide">Total Files</div>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50 text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">
              {audioFiles.length > 0 ? new Date(Math.max(...audioFiles.map(f => new Date(f.createdAt)))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-wide">Latest File</div>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-slate-700/50 text-center">
            <div className="text-3xl font-extrabold text-gradient mb-2">100%</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide">Saved</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

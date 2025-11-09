import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { Mic, Sparkles, Download, Loader, Play, Volume2, Settings, Zap, FileText, Wand2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const Generator = () => {
  const { isAuthenticated, user } = useAuth0();
  const [script, setScript] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [showScriptGenerator, setShowScriptGenerator] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/voices`);
      setVoices(response.data.voices);
      if (response.data.voices.length > 0) {
        setSelectedVoice(response.data.voices[0].id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  const handleGenerateScript = async () => {
    if (!projectName || !projectDescription) {
      alert('Please enter both project name and description');
      return;
    }

    setGeneratingScript(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-script`, {
        projectName,
        description: projectDescription,
      });
      setGeneratedScript(response.data.script);
      setScript(response.data.script);
      setShowScriptGenerator(false);
    } catch (error) {
      console.error('Error generating script:', error);
      alert('Failed to generate script. Please try again.');
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerateVoiceover = async () => {
    if (!script.trim()) {
      alert('Please enter a script');
      return;
    }

    if (!selectedVoice) {
      alert('Please select a voice');
      return;
    }

    setGenerating(true);
    setAudioUrl(null);

    try {
      const userId = isAuthenticated ? user?.sub : null;
      const response = await axios.post(
        `${API_BASE_URL}/api/generate-voiceover`,
        {
          text: script,
          voiceId: selectedVoice,
          stability,
          similarityBoost,
          userId,
        },
        {
          responseType: 'blob',
        }
      );

      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
      
      // Create audio player
      const audio = new Audio(url);
      setAudioPlayer(audio);
    } catch (error) {
      console.error('Error generating voiceover:', error);
      alert('Failed to generate voiceover. Please check your API keys or try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePlay = () => {
    if (audioPlayer) {
      audioPlayer.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Failed to play audio. Please try downloading instead.');
      });
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'voiceover.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const selectedVoiceData = voices.find(v => v.id === selectedVoice);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Header */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full mb-6 border-ub-blue-500/30">
          <Zap className="h-4 w-4 text-ub-blue-400" />
          <span className="text-ub-blue-300 text-sm font-semibold uppercase tracking-wide">AI Voice Generator</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Create Professional
          <span className="block text-gradient mt-2">Voiceovers</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Transform your hackathon demo script into a polished, professional voiceover in seconds
        </p>
      </div>

      {/* AI Script Generator Section */}
      <div className="glass-strong rounded-3xl p-8 mb-8 border border-slate-700/50 hover:border-ub-blue-500/30 transition-all">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center shadow-glow-ub">
              <Wand2 className="h-6 w-6 text-ub-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Script Generator</h2>
              <p className="text-sm text-slate-400">Powered by Google Gemini</p>
            </div>
          </div>
          <button
            onClick={() => setShowScriptGenerator(!showScriptGenerator)}
            className="px-6 py-3 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl transition-all font-semibold shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105"
          >
            {showScriptGenerator ? 'Hide Generator' : 'Generate Script with AI'}
          </button>
        </div>

        {showScriptGenerator && (
          <div className="space-y-5 p-6 glass rounded-2xl border border-slate-700/50 animate-slide-up">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., CampusConnect AI"
                className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent transition-all text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                Project Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="A one-sentence description of your project..."
                rows="3"
                className="w-full px-5 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent transition-all resize-none text-lg"
              />
            </div>
            <button
              onClick={handleGenerateScript}
              disabled={generatingScript}
              className="w-full px-6 py-4 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 disabled:from-slate-700 disabled:to-slate-700 text-ub-white rounded-xl transition-all flex items-center justify-center space-x-3 font-bold text-lg shadow-glow-ub disabled:shadow-none"
            >
              {generatingScript ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating Script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Professional Script</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Script Input */}
      <div className="glass-strong rounded-3xl p-8 mb-8 border border-slate-700/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-ub-white" />
          </div>
          <div>
            <label className="block text-lg font-bold text-white">Your Demo Script</label>
            <p className="text-sm text-slate-400">Enter your script or use the AI generator above</p>
          </div>
        </div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Enter your demo script here... Or use the AI script generator above to create a professional script automatically!"
          rows="10"
          className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ub-blue-500 focus:border-transparent resize-none text-lg leading-relaxed transition-all"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            <span className="font-semibold">{script.length}</span> characters • Approximately <span className="font-semibold">{Math.ceil(script.length / 150)}</span> seconds
          </div>
          {script.length > 0 && (
            <div className="text-sm text-ub-blue-400 font-semibold">
              ✓ Ready to generate
            </div>
          )}
        </div>
      </div>

      {/* Voice Selection */}
      <div className="glass-strong rounded-3xl p-8 mb-8 border border-slate-700/50">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center">
            <Mic className="h-5 w-5 text-ub-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Select Voice</h2>
            <p className="text-sm text-slate-400">Choose from professional AI voices</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelectedVoice(voice.id)}
              className={`group p-5 rounded-2xl border-2 transition-all text-left ${
                selectedVoice === voice.id
                  ? 'border-ub-blue-500 bg-ub-blue-500/20 shadow-glow-ub'
                  : 'border-slate-700 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-white text-lg">{voice.name}</div>
                {selectedVoice === voice.id && (
                  <div className="w-6 h-6 bg-ub-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-ub-white rounded-full" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{voice.accent} • {voice.gender}</div>
                <div className="text-sm text-ub-blue-400 font-semibold">{voice.tone}</div>
              </div>
            </button>
          ))}
        </div>

        {selectedVoiceData && (
          <div className="p-6 glass rounded-2xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-bold text-white text-xl mb-1">{selectedVoiceData.name}</div>
                <div className="text-sm text-slate-400">
                  {selectedVoiceData.accent} • {selectedVoiceData.gender} • <span className="text-ub-blue-400 font-semibold">{selectedVoiceData.tone}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-ub-white" />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Stability
                  </label>
                  <span className="text-ub-blue-400 font-bold text-lg">{stability.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={stability}
                  onChange={(e) => setStability(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ub-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Similarity Boost
                  </label>
                  <span className="text-primary-400 font-bold text-lg">{similarityBoost.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={similarityBoost}
                  onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-ub-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mb-8">
        <button
          onClick={handleGenerateVoiceover}
          disabled={generating || !script.trim() || !selectedVoice}
          className="w-full px-8 py-6 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-ub-white rounded-2xl font-bold text-xl transition-all flex items-center justify-center space-x-3 shadow-glow-lg hover:shadow-glow-ub disabled:shadow-none transform hover:scale-105 disabled:transform-none"
        >
          {generating ? (
            <>
              <Loader className="h-6 w-6 animate-spin" />
              <span>Generating Voiceover...</span>
            </>
          ) : (
            <>
              <Zap className="h-6 w-6" />
              <span>Generate Professional Voiceover</span>
            </>
          )}
        </button>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="glass-strong rounded-3xl p-8 border border-lake-lasalle/30 shadow-glow-ub animate-slide-up">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-lake-lasalle to-ub-blue-500 rounded-xl flex items-center justify-center shadow-glow-ub">
              <Volume2 className="h-6 w-6 text-ub-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Voiceover</h2>
              <p className="text-sm text-slate-400">Ready to download and use</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={handlePlay}
              className="w-16 h-16 bg-gradient-to-br from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-2xl transition-all flex items-center justify-center shadow-glow-ub hover:shadow-glow-lg transform hover:scale-110"
            >
              <Play className="h-8 w-8 ml-1" />
            </button>
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1 font-medium uppercase tracking-wide">Audio File</div>
              <div className="text-white font-bold text-lg">voiceover.mp3</div>
              <div className="text-xs text-slate-500 mt-1">High-quality MP3 format</div>
            </div>
            <button
              onClick={handleDownload}
              className="px-8 py-4 bg-gradient-to-r from-lake-lasalle to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl transition-all flex items-center space-x-3 font-bold text-lg shadow-glow-ub hover:shadow-glow-lg transform hover:scale-105"
            >
              <Download className="h-5 w-5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {!isAuthenticated && (
          <div className="glass-strong rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Save Your Work</h3>
                <p className="text-sm text-slate-400">
                  Login to save all your generated audio files to your account and access them anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-strong rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">API Integration</h3>
              <p className="text-sm text-slate-400">
                Add your API keys to <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs">.env</code> to enable real voice generation with ElevenLabs and Gemini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;

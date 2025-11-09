import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';

const Callback = () => {
  const { isLoading, isAuthenticated, error, user } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    // Log all URL parameters for debugging
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    console.log('🔍 Callback URL params:', {
      error: errorParam,
      errorDescription,
      code: code ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      fullUrl: location.search
    });

    // Check for URL error parameters first
    if (errorParam) {
      console.error('❌ Auth0 callback error from URL:', {
        error: errorParam,
        description: errorDescription,
        fullUrl: window.location.href
      });
      setStatus(`Error: ${errorDescription || errorParam}`);
      setTimeout(() => {
        navigate('/');
      }, 5000);
      return;
    }

    // Wait for Auth0 to finish processing
    if (isLoading) {
      setStatus('Loading...');
      console.log('⏳ Auth0 is processing...');
      return;
    }

    // Check for Auth0 error object
    if (error) {
      console.error('❌ Auth0 error object:', {
        error: error.error,
        errorDescription: error.error_description,
        message: error.message,
        fullError: error
      });
      setStatus(`Error: ${error.error_description || error.message || error.error || 'Authentication failed'}`);
      setTimeout(() => {
        navigate('/');
      }, 5000);
      return;
    }

    // Success case
    if (isAuthenticated && user) {
      setStatus('Authentication successful! Redirecting...');
      console.log('✅ Authentication successful!', {
        user: user.email || user.nickname || user.sub,
        isAuthenticated,
        hasUser: !!user
      });
      
      // Give Auth0 time to save to localStorage
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } else if (!isLoading) {
      // Not authenticated after callback
      console.warn('⚠️ Not authenticated after callback', {
        isLoading,
        isAuthenticated,
        hasUser: !!user,
        hasError: !!error,
        urlParams: Object.fromEntries(urlParams.entries())
      });
      
      // If we have a code but no user, Auth0 might still be processing
      if (code && !user) {
        setStatus('Processing authentication... Please wait.');
        // Wait a bit longer
        return;
      }
      
      setStatus('Authentication failed. No user data received. Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isLoading, isAuthenticated, error, user, navigate, location]);

  // Show error state - check URL params first, then Auth0 error
  const urlParams = new URLSearchParams(location.search);
  const errorParam = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  // Show error if we have an error in URL or from Auth0
  if (errorParam || (error && !isLoading)) {
    const displayError = errorDescription || error?.error_description || error?.message || error?.error || errorParam || 'Authentication failed';
    const fullError = errorDescription || error?.error_description || error?.message;
    
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="text-center max-w-md glass-strong rounded-3xl p-8 border border-red-500/50">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ub-white mb-2">Login Error</h2>
          <p className="text-slate-400 mb-2 font-semibold">{displayError}</p>
          {fullError && fullError !== displayError && (
            <p className="text-slate-500 text-sm mb-4">{fullError}</p>
          )}
          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left text-xs text-slate-400">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>Error: {errorParam || error?.error || 'Unknown'}</p>
            {errorDescription && <p>Description: {errorDescription}</p>}
            {error?.error_description && <p>Auth0: {error.error_description}</p>}
            <p className="mt-2 text-slate-500">Check Auth0 Dashboard → Applications → Settings</p>
            <p className="text-slate-500">Verify Callback URL: http://localhost:3000/callback</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-ub-blue-600 hover:bg-ub-blue-700 text-white rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show success state
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="text-center max-w-md glass-strong rounded-3xl p-8 border border-green-500/50">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ub-white mb-2">Login Successful!</h2>
          <p className="text-slate-400 mb-2">Welcome, {user.email || user.nickname || 'User'}!</p>
          <p className="text-slate-500 text-sm mb-4">Redirecting to home page...</p>
          <Loader className="h-8 w-8 animate-spin text-ub-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center pt-24 px-4">
      <div className="text-center max-w-md glass-strong rounded-3xl p-8 border border-slate-700/50">
        <Loader className="h-12 w-12 animate-spin text-ub-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-ub-white mb-2">Completing login...</h2>
        <p className="text-slate-400 mb-4">{status}</p>
        {user && (
          <p className="text-slate-500 text-sm">User: {user.email || user.nickname}</p>
        )}
      </div>
    </div>
  );
};

export default Callback;


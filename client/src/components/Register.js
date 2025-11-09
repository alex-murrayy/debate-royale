import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const { login, isLoading } = useAuth();

  // Auth0 handles registration through the login flow
  // Redirect to Auth0 login (which includes signup option)
  React.useEffect(() => {
    if (!isLoading) {
      login();
    }
  }, [login, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 px-4">
      <div className="glass-strong rounded-3xl p-8 md:p-12 w-full max-w-md border border-slate-700/50 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-ub">
          <UserPlus className="h-8 w-8 text-ub-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-ub-white mb-2">Creating Account...</h2>
        <p className="text-slate-400">Redirecting to Auth0 signup</p>
      </div>
    </div>
  );
};

export default Register;


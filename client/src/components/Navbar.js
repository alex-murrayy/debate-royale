import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, User, LogOut, LogIn, Trophy, ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const { user, dbUser, auth0User, isAuthenticated, isLoading, logout, login } = useAuth();

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Navbar Auth State:', {
      isAuthenticated,
      isLoading,
      hasAuth0User: !!auth0User,
      hasDbUser: !!dbUser,
      auth0User: auth0User?.email,
      dbUser: dbUser?.username
    });
  }, [isAuthenticated, isLoading, auth0User, dbUser]);

  // Show login button only when not authenticated and not loading
  const showLoginButton = !isAuthenticated && !isLoading;
  
  // Get display name - prefer database user, fallback to Auth0 user
  const displayName = dbUser?.username || auth0User?.nickname || auth0User?.email || 'User';
  const userRank = dbUser?.rank;
  const userLevel = dbUser?.level;

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
            {isAuthenticated && !isLoading && (
              <>
                <Link
                  to="/matchmaking"
                  className="text-slate-300 hover:text-ub-blue-400 transition-colors font-semibold text-sm uppercase tracking-wide"
                >
                  Find Debate
                </Link>
                <Link
                  to="/shop"
                  className="flex items-center space-x-1 text-slate-300 hover:text-ub-blue-400 transition-colors font-semibold text-sm uppercase tracking-wide"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Shop</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-slate-300 hover:text-ub-blue-400 transition-colors font-semibold text-sm uppercase tracking-wide"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-slate-300 hover:text-ub-blue-400 transition-colors font-semibold text-sm uppercase tracking-wide"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </>
            )}
            
            {isAuthenticated && !isLoading ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-2 glass rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-ub-blue-500 to-ub-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-ub-white" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-200 font-medium">{displayName}</div>
                    {userRank && userLevel && (
                      <div className="text-xs text-ub-blue-400">{userRank} • Lv.{userLevel}</div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-ub-white rounded-xl transition-all border border-slate-700/50 hover:border-slate-600 font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : showLoginButton ? (
              <button
                onClick={login}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-ub-blue-600 to-ub-blue-500 hover:from-ub-blue-500 hover:to-ub-blue-400 text-ub-white rounded-xl transition-all shadow-glow-ub hover:shadow-glow-lg font-bold transform hover:scale-105"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

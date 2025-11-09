import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const {
    user: auth0User,
    isLoading: auth0Loading,
    isAuthenticated,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const [dbUser, setDbUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Get or create user in our database
  const fetchUser = async () => {
    if (!isAuthenticated || !auth0User) {
      setDbUser(null);
      return null;
    }

    setIsLoadingUser(true);
    try {
      // Try to get access token for API calls, but don't fail if it doesn't work
      // Without an API/audience configured, we can't get access tokens, but that's OK
      let token = null;
      try {
        // Only try to get token if we have an audience configured
        if (process.env.REACT_APP_AUTH0_AUDIENCE && 
            process.env.REACT_APP_AUTH0_AUDIENCE !== 'https://debate-royale-api') {
          token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE
            }
          }).catch(() => null); // Silently fail if token can't be obtained
        }
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenError) {
        // Token not available - that's OK, we'll work without it for now
        console.log('No access token available (API not configured yet)');
      }

      // For now, skip database user creation if we don't have a token
      // The user will still be authenticated via Auth0 and can use the app
      // Database features will be available once API is configured
      if (!token) {
        console.log('Skipping database user creation - no API configured');
        setDbUser(null);
        return null;
      }

      // Try to fetch or create database user if we have a token
      let response;
      try {
        response = await axios.get(`${API_URL}/api/users/profile`);
        setDbUser(response.data);
        return response.data;
      } catch (error) {
        // User doesn't exist, create them
        if (error.response?.status === 404 || error.response?.status === 401) {
          try {
            response = await axios.post(`${API_URL}/api/users/create`, {
              auth0Id: auth0User.sub,
              email: auth0User.email,
              username: auth0User.nickname || auth0User.email?.split('@')[0] || 'user',
              picture: auth0User.picture
            });
            setDbUser(response.data);
            return response.data;
          } catch (createError) {
            console.error('Error creating user:', createError);
            setDbUser(null);
            return null;
          }
        }
        console.error('Error fetching user:', error);
        setDbUser(null);
        return null;
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
      setDbUser(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Fetch user when authentication state changes
  // NOTE: We skip fetching database user if no API is configured
  // The user will still be authenticated via Auth0, just won't have DB features
  useEffect(() => {
    if (isAuthenticated && auth0User && !auth0Loading) {
      // Only try to fetch DB user if we have an API configured
      // For now, skip it to avoid token exchange errors
      // fetchUser(); // Commented out until API is configured
      console.log('✅ User authenticated via Auth0:', auth0User.email || auth0User.nickname);
    } else if (!isAuthenticated && !auth0Loading) {
      setDbUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, auth0User?.sub, auth0Loading]);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    auth0Logout({
      returnTo: window.location.origin
    });
    delete axios.defaults.headers.common['Authorization'];
    setDbUser(null);
  };

  const updateUser = (updatedUser) => {
    setDbUser(updatedUser);
  };

  // Combine Auth0 user and database user for convenience
  const user = dbUser || auth0User;
  const isLoading = auth0Loading || isLoadingUser;

  return (
    <AuthContext.Provider value={{
      user: user, // Database user if available, otherwise Auth0 user
      dbUser: dbUser, // Database user specifically
      auth0User: auth0User, // Auth0 user specifically
      isLoading,
      isAuthenticated,
      login,
      logout,
      fetchUser,
      updateUser,
      getAccessTokenSilently,
      getUser: fetchUser // Alias for compatibility
    }}>
      {children}
    </AuthContext.Provider>
  );
};

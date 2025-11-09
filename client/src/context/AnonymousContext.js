import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AnonymousContext = createContext();

export const useAnonymous = () => {
  const context = useContext(AnonymousContext);
  if (!context) {
    throw new Error('useAnonymous must be used within an AnonymousProvider');
  }
  return context;
};

export const AnonymousProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState(null);

  // Generate or retrieve anonymous session ID
  useEffect(() => {
    // Try to get session ID from localStorage
    let storedSessionId = localStorage.getItem('anonymous_session_id');
    let storedUsername = localStorage.getItem('anonymous_username');

    // If no session ID exists, create a new one
    if (!storedSessionId) {
      storedSessionId = `anon_${uuidv4()}`;
      localStorage.setItem('anonymous_session_id', storedSessionId);
    }

    // If no username exists, generate a random one
    if (!storedUsername) {
      const adjectives = ['Swift', 'Bold', 'Clever', 'Wise', 'Sharp', 'Quick', 'Brave', 'Calm'];
      const nouns = ['Debater', 'Thinker', 'Orator', 'Scholar', 'Sage', 'Analyst', 'Critic', 'Philosopher'];
      const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      storedUsername = `${randomAdj} ${randomNoun} ${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('anonymous_username', storedUsername);
    }

    setSessionId(storedSessionId);
    setUsername(storedUsername);
  }, []);

  const updateUsername = (newUsername) => {
    setUsername(newUsername);
    localStorage.setItem('anonymous_username', newUsername);
  };

  return (
    <AnonymousContext.Provider value={{
      sessionId,
      username,
      updateUsername,
      isAnonymous: true
    }}>
      {children}
    </AnonymousContext.Provider>
  );
};


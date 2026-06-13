// ============================================================================
// FILE: AWSContext.tsx
// LOCATION: client/src/context/
// PURPOSE: React context for managing authentication and AWS credentials
// ============================================================================

import React, { createContext, useContext, useState, type ReactNode } from 'react';

// ========== User type definition ==========
export interface User {
  userId: string;
  username: string;
  email: string;
  awsCredentialsSet?: boolean;
}

// ========== AWS Credentials type definition ==========
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack: boolean;
  endpoint?: string;
}

// ========== Context state type definition ==========
interface AWSContextType {
  // Authentication
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // User management
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  
  // AWS Credentials (encrypted on server, not stored in context)
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
}

const AWSContext = createContext<AWSContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const AWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial auth state from localStorage
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(() => {
    // Пытаемся восстановить из localStorage или sessionStorage при загрузке
    try {
      let stored = localStorage.getItem('aws_credentials');
      if (!stored) {
        stored = sessionStorage.getItem('aws_credentials');
      }
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem('auth_token', newToken);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    localStorage.setItem('user_profile', JSON.stringify(newUser));
  };

  const logout = () => {
    setTokenState(null);
    setUserState(null);
    setCredentialsState(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('aws_credentials');
    sessionStorage.removeItem('aws_credentials');
  };

  const setCredentials = (creds: AWSCredentials) => {
    setCredentialsState(creds);
    // Сохраняем в оба место - sessionStorage и localStorage
    sessionStorage.setItem('aws_credentials', JSON.stringify(creds));
    localStorage.setItem('aws_credentials', JSON.stringify(creds));
  };

  const clearCredentials = () => {
    setCredentialsState(null);
    sessionStorage.removeItem('aws_credentials');
  };

  return (
    <AWSContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        setToken,
        setUser,
        logout,
        credentials,
        setCredentials,
        clearCredentials,
      }}
    >
      {children}
    </AWSContext.Provider>
  );
};

export const useAWS = () => {
  const context = useContext(AWSContext);
  if (!context) {
    throw new Error('useAWS must be used within AWSProvider');
  }
  return context;
};

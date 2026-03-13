import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack: boolean;
}

interface AWSContextType {
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
  isAuthenticated: boolean;
}

const AWSContext = createContext<AWSContextType | undefined>(undefined);

export const AWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(() => {
    // Пытаемся восстановить из sessionStorage при загрузке
    try {
      const stored = sessionStorage.getItem('aws_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setCredentials = (creds: AWSCredentials) => {
    setCredentialsState(creds);
    // Сохраняем в sessionStorage (исчезнет при закрытии браузера)
    sessionStorage.setItem('aws_credentials', JSON.stringify(creds));
  };

  const clearCredentials = () => {
    setCredentialsState(null);
    sessionStorage.removeItem('aws_credentials');
  };

  return (
    <AWSContext.Provider
      value={{
        credentials,
        setCredentials,
        clearCredentials,
        isAuthenticated: credentials !== null,
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

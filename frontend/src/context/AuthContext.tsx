import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export interface IUserProfile {
  _id: string;
  nrp: string;
  name: string;
  role: 'ADMIN' | 'PLANNER' | 'GL' | 'MEKANIK';
  site: string;
  section: 'WHEEL' | 'TRACK' | 'SUPPORT';
}

interface AuthContextType {
  user: IUserProfile | null;
  loading: boolean;
  login: (nrp: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('bms_token');
      if (token) {
        const data = await authService.getMe();
        setUser(data.user || data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
      localStorage.removeItem('bms_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (nrp: string, password: string) => {
    try {
      const data = await authService.login(nrp, password);
      setUser(data.user);
    } catch (e) {
      setUser(null);
      throw e;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

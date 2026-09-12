import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  togglePlan: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // If no token and not explicitly logged out, seamlessly load demo user for instant preview
    const explicitlyLoggedOut = sessionStorage.getItem('freelanceflow_logged_out');
    if (!explicitlyLoggedOut) {
      try {
        const data = await authService.login('demo@freelanceflow.dev', 'Demo123456!');
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    sessionStorage.removeItem('freelanceflow_logged_out');
    const data = await authService.login(email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string) => {
    sessionStorage.removeItem('freelanceflow_logged_out');
    const data = await authService.register(name, email, password);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = async () => {
    sessionStorage.setItem('freelanceflow_logged_out', '1');
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const togglePlan = async () => {
    if (!user) return;
    const newPlan = user.plan === 'FREE' ? 'PRO' : 'FREE';
    const updated = await authService.updatePlan(newPlan);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        login,
        register,
        logout,
        togglePlan,
        refreshUser,
        refreshProfile: refreshUser,
        updateUser,
      }}
    >
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

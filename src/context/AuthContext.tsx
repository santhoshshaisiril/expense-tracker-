import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser, clearStoredToken } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (payload: { full_name: string; email: string; password: string; confirm_password: string; username?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function verifySession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getProfile();
        setUser(res.user);
        setStoredUser(res.user);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = async (credentials: { email?: string; username?: string; password: string }) => {
    try {
      const res = await api.login(credentials);
      setStoredToken(res.token);
      setStoredUser(res.user);
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.full_name}!`, 'success', 'Login Successful');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please verify credentials.', 'error', 'Login Error');
      throw err;
    }
  };

  const demoLogin = async () => {
    try {
      const res = await api.login({ email: 'demo@tracker.com', password: 'password123' });
      setStoredToken(res.token);
      setStoredUser(res.user);
      setToken(res.token);
      setUser(res.user);
      showToast('Logged in as Rahul Sharma (Demo User)', 'success', 'Demo Login Active');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed.', 'error', 'Error');
      throw err;
    }
  };

  const register = async (payload: { full_name: string; email: string; password: string; confirm_password: string; username?: string }) => {
    try {
      const res = await api.register(payload);
      setStoredToken(res.token);
      setStoredUser(res.user);
      setToken(res.token);
      setUser(res.user);
      showToast(`Account created! Welcome to Smart Expense Tracker.`, 'success', 'Registration Complete');
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error', 'Registration Error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout network errors
    } finally {
      clearStoredToken();
      setUser(null);
      setToken(null);
      showToast('You have been logged out securely.', 'info', 'Logged Out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        demoLogin,
        register,
        logout
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

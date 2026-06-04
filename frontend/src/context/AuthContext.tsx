import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';
import type { Role } from '../auth/permissions';

interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = useCallback(async (username: string, password: string) => {
    try {
      const { data } = await api.post('/login/', { 
        username, 
        password 
      });

      const { token: tok, user: usr } = data;

      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
      
      setToken(tok);
      setUser(usr);
      
      console.log("Login successful:", usr); // For debugging
    } catch (err: any) {
      console.error("Login failed:", err.response?.data || err);
      
      // Throw the real error so Login page can show it
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors?.[0]) {
        throw new Error(err.response.data.non_field_errors[0]);
      } else {
        throw new Error('Invalid username or password');
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

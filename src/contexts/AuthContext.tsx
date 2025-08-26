'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (userData: User, tokens?: { access_token: string; refresh_token: string; expires_in: number }) => void;
  logout: () => void;
  checkAuth: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  const [accessToken, setAccessToken] = useLocalStorage<string | null>('access_token', null);
  const [storedRefreshToken, setStoredRefreshToken] = useLocalStorage<string | null>('refresh_token', null);
  const [tokenExpires, setTokenExpires] = useLocalStorage<string | null>('token_expires', null);

  const login = (userData: User, tokens?: { access_token: string; refresh_token: string; expires_in: number }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Salva os tokens se fornecidos
    if (tokens) {
      setAccessToken(tokens.access_token);
      setStoredRefreshToken(tokens.refresh_token);
      setTokenExpires((Date.now() + (tokens.expires_in * 1000)).toString());
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAccessToken(null);
    setStoredRefreshToken(null);
    setTokenExpires(null);
    router.push('/login');
  };

  const refreshToken = useCallback(async () => {
    if (!storedRefreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.tokens.access_token);
        setStoredRefreshToken(data.tokens.refresh_token);
        setTokenExpires((Date.now() + (data.tokens.expires_in * 1000)).toString());
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  }, [storedRefreshToken, setAccessToken, setStoredRefreshToken, setTokenExpires, logout]);

  const checkAuth = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser && accessToken && tokenExpires) {
      const expiresAt = parseInt(tokenExpires);
      if (Date.now() < expiresAt) {
        setUser(JSON.parse(storedUser));
      } else {
        refreshToken();
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [accessToken, tokenExpires, refreshToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    login,
    logout,
    checkAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

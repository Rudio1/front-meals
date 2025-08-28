'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from './ThemeContext';

interface User {
  id: number;
  name: string;
  email: string;
  themeSelected?: 'light' | 'dark' | 'rosa';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (userData: User, tokens?: { access_token: string; refresh_token: string; expires_in: number }) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setTheme } = useTheme();
  
  const [accessToken, setAccessToken, , isAccessTokenLoaded] = useLocalStorage<string | null>('access_token', null);
  const [storedRefreshToken, setStoredRefreshToken, , isRefreshTokenLoaded] = useLocalStorage<string | null>('refresh_token', null);
  const [tokenExpires, setTokenExpires, , isTokenExpiresLoaded] = useLocalStorage<string | null>('token_expires', null);
  
  // Usar refs para evitar dependências circulares
  const setUserRef = useRef(setUser);
  const setThemeRef = useRef(setTheme);
  const setAccessTokenRef = useRef(setAccessToken);
  const setStoredRefreshTokenRef = useRef(setStoredRefreshToken);
  const setTokenExpiresRef = useRef(setTokenExpires);
  const routerRef = useRef(router);

  const login = useCallback((userData: User, tokens?: { access_token: string; refresh_token: string; expires_in: number }) => {
    setUserRef.current(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (userData.themeSelected) {
      setThemeRef.current(userData.themeSelected as 'light' | 'dark' | 'rosa');
    }
    
    if (tokens) {
      setAccessTokenRef.current(tokens.access_token);
      setStoredRefreshTokenRef.current(tokens.refresh_token);
      setTokenExpiresRef.current((Date.now() + (tokens.expires_in * 1000)).toString());
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUserRef.current(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (userData.themeSelected) {
        setThemeRef.current(userData.themeSelected as 'light' | 'dark' | 'rosa');
      }
    }
  }, [user]);

  const logout = useCallback(() => {
    setUserRef.current(null);
    localStorage.removeItem('user');
    setAccessTokenRef.current(null);
    setStoredRefreshTokenRef.current(null);
    setTokenExpiresRef.current(null);
    routerRef.current.push('/login');
  }, []);

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
        setAccessTokenRef.current(data.tokens.access_token);
        setStoredRefreshTokenRef.current(data.tokens.refresh_token);
        setTokenExpiresRef.current((Date.now() + (data.tokens.expires_in * 1000)).toString());
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUserRef.current(JSON.parse(storedUser));
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  }, [storedRefreshToken, logout]);



  useEffect(() => {
    // Só executa quando todos os valores do localStorage foram carregados
    if (isAccessTokenLoaded && isRefreshTokenLoaded && isTokenExpiresLoaded) {
      // Verificar autenticação diretamente aqui para evitar dependências circulares
      const storedUser = localStorage.getItem('user');
      
      if (storedUser && accessToken && tokenExpires) {
        const expiresAt = parseInt(tokenExpires);
        if (Date.now() < expiresAt) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          if (userData.themeSelected) {
            setThemeRef.current(userData.themeSelected as 'light' | 'dark' | 'rosa');
          }
        } else {
          refreshToken();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [isAccessTokenLoaded, isRefreshTokenLoaded, isTokenExpiresLoaded, accessToken, tokenExpires, refreshToken]);

  useEffect(() => {
    if (user) {
      setThemeRef.current(user.themeSelected || 'light');
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || !isAccessTokenLoaded || !isRefreshTokenLoaded || !isTokenExpiresLoaded,
    accessToken,
    login,
    updateUser,
    logout,
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

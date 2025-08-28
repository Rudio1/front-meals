'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from './ThemeContext';

interface User {
  id: number;
  name: string;
  email: string;
  themeSelected?: string;
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
  checkAuth: () => void;
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

  const login = (userData: User, tokens?: { access_token: string; refresh_token: string; expires_in: number }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Aplicar tema do usuário
    if (userData.themeSelected) {
      setTheme(userData.themeSelected as 'light' | 'dark');
    }
    
    // Salva os tokens se fornecidos
    if (tokens) {
      setAccessToken(tokens.access_token);
      setStoredRefreshToken(tokens.refresh_token);
      setTokenExpires((Date.now() + (tokens.expires_in * 1000)).toString());
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Sincronizar tema se foi alterado
      if (userData.themeSelected) {
        setTheme(userData.themeSelected as 'light' | 'dark');
      }
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

  const refreshToken = async () => {
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
  };

  const checkAuth = () => {

    const storedUser = localStorage.getItem('user');
    
    if (storedUser && accessToken && tokenExpires) {
      const expiresAt = parseInt(tokenExpires);
      if (Date.now() < expiresAt) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Aplicar tema salvo
        if (userData.themeSelected) {
          setTheme(userData.themeSelected as 'light' | 'dark');
        }
      } else {
        refreshToken();
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Só executa checkAuth quando todos os valores do localStorage foram carregados
    if (isAccessTokenLoaded && isRefreshTokenLoaded && isTokenExpiresLoaded) {
      checkAuth();
    }
  }, [isAccessTokenLoaded, isRefreshTokenLoaded, isTokenExpiresLoaded, accessToken, tokenExpires, checkAuth]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || !isAccessTokenLoaded || !isRefreshTokenLoaded || !isTokenExpiresLoaded,
    accessToken,
    login,
    updateUser,
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

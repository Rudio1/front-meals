import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface UseAuthenticatedFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export function useAuthenticatedFetch() {
  const { accessToken, refreshToken, logout } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string,
    options: UseAuthenticatedFetchOptions = {}
  ) => {
    const { method = 'GET', headers = {}, body } = options;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401) {
        try {
          await refreshToken();
          
          const newToken = localStorage.getItem('access_token');
          if (newToken) {
            const retryResponse = await fetch(url, {
              method,
              headers: {
                ...requestHeaders,
                'Authorization': `Bearer ${newToken}`,
              },
              body: body ? JSON.stringify(body) : undefined,
            });
            
            return retryResponse;
          }
        } catch {
          logout();
          throw new Error('Token expirado e não foi possível renovar');
        }
      }

      return response;
    } catch (error) {
      console.error('Erro na requisição autenticada:', error);
      throw error;
    }
  }, [accessToken, refreshToken, logout]);

  return authenticatedFetch;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { authApi } from '../services/api';
import { disconnectSocket } from '../services/socket';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => Promise<boolean>;
  updateUser: (user: User) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate._id === 'string' &&
    candidate._id.trim().length > 0 &&
    typeof candidate.fullName === 'string' &&
    candidate.fullName.trim().length > 0 &&
    (candidate.role === 'user' || candidate.role === 'admin') &&
    typeof candidate.location === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem('taskant_user');
  if (storedUser === null) return null;

  const value = storedUser.trim();
  if (!value || value === 'undefined' || value === 'null') {
    localStorage.removeItem('taskant_user');
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (isUser(parsed)) return parsed;
  } catch {
    // Invalid cached data is discarded below.
  }

  localStorage.removeItem('taskant_user');
  return null;
}

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: unknown };
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const clearSession = () => {
      try {
        localStorage.removeItem('taskant_token');
        localStorage.removeItem('taskant_user');
      } catch {
        // Ignore storage errors.
      }
      disconnectSocket();
      if (active) {
        setToken(null);
        setUser(null);
      }
    };

    const handleUnauthorized = () => {
      clearSession();
      if (active) setLoading(false);
    };
    window.addEventListener('taskant:unauthorized', handleUnauthorized);

    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('taskant_token');
        const cachedUser = readStoredUser();
        const validToken =
          storedToken?.trim() && storedToken !== 'undefined' && storedToken !== 'null'
            ? storedToken.trim()
            : null;

        if (!validToken || isJwtExpired(validToken)) {
          clearSession();
          return;
        }

        try {
          const res = await authApi.me();
          if (!isUser(res.data.user)) {
            throw new Error('The authentication response did not contain a valid user');
          }
          if (active) {
            setToken(validToken);
            setUser(res.data.user);
          }
          localStorage.setItem('taskant_user', JSON.stringify(res.data.user));
        } catch (error: unknown) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if ((status === undefined || status >= 500) && cachedUser) {
            console.error('Unable to verify the saved TaskAnt session', {
              status,
              code: axios.isAxiosError(error) ? error.code : undefined,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            if (active) {
              setToken(validToken);
              setUser(cachedUser);
            }
            return;
          }
          clearSession();
        }
      } catch {
        console.error('Unable to restore the saved TaskAnt session');
        clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
      window.removeEventListener('taskant:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email: email.trim(), password });
    if (
      typeof res.data.token !== 'string' ||
      !res.data.token.trim() ||
      !isUser(res.data.user)
    ) {
      throw new Error('The authentication response did not contain a valid session');
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('taskant_token', res.data.token);
    localStorage.setItem('taskant_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const register = async (data: Record<string, string>) => {
    const res = await authApi.register(data);
    if (
      typeof res.data.token !== 'string' ||
      !res.data.token.trim() ||
      !isUser(res.data.user)
    ) {
      throw new Error('The authentication response did not contain a valid session');
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('taskant_token', res.data.token);
    localStorage.setItem('taskant_user', JSON.stringify(res.data.user));
  };

  const logout = async (): Promise<boolean> => {
    let serverRevoked = false;
    try {
      await authApi.logout();
      serverRevoked = true;
    } catch {
      // The caller can report that server-side revocation was not confirmed.
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('taskant_token');
      localStorage.removeItem('taskant_user');
      disconnectSocket();
    }
    return serverRevoked;
  };

  const updateUser = (updated: User) => {
    if (!isUser(updated)) {
      throw new Error('Cannot save an invalid TaskAnt user');
    }
    setUser(updated);
    localStorage.setItem('taskant_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('taskant:unauthorized', handleUnauthorized);

    const restoreSession = async () => {
      await Promise.resolve();
      try {
        const storedToken = localStorage.getItem('taskant_token');
        const cachedUser = readStoredUser();
        const validToken =
          storedToken?.trim() && storedToken !== 'undefined' && storedToken !== 'null'
            ? storedToken
            : null;
        setToken(validToken);
        setUser(cachedUser);

        if (validToken) {
          try {
            const res = await authApi.me();
            if (!isUser(res.data.user)) {
              throw new Error('The authentication response did not contain a valid user');
            }
            setUser(res.data.user);
            localStorage.setItem('taskant_user', JSON.stringify(res.data.user));
          } catch {
            localStorage.removeItem('taskant_token');
            localStorage.removeItem('taskant_user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Unable to restore the saved TaskAnt session', error);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
    return () => window.removeEventListener('taskant:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('taskant_token');
    localStorage.removeItem('taskant_user');
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

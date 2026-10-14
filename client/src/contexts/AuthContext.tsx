import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
        const storedUser = localStorage.getItem('taskant_user');
        setToken(storedToken);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as User);
          } catch (error) {
            console.error('Unable to read saved TaskAnt user', error);
            localStorage.removeItem('taskant_user');
          }
        }

        if (storedToken) {
          try {
            const res = await authApi.me();
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

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('taskant_token', res.data.token);
    localStorage.setItem('taskant_user', JSON.stringify(res.data.user));
  };

  const register = async (data: Record<string, string>) => {
    const res = await authApi.register(data);
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

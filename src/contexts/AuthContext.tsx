import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (stored && token) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);

        api.getMe().then((me) => {
          setUser({ ...me, role: me.role as User['role'] });
        }).catch(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        });
      } catch {
        localStorage.removeItem('user');
        setUser(null);
      }
    }

    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password);
    setUser({ ...data.user, role: data.user.role as User['role'] });
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

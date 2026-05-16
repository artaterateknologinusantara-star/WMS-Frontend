'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, logoutUser, getStoredUser, type AuthUser, type LoginRequest } from '@/lib/services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const authUser = await loginUser(request);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

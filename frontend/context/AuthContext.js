'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, getStoredToken, saveAuth, clearAuth } from '@/lib/auth';
import { login as apiLogin, signup as apiSignup } from '@/lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser  = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser && storedToken) setUser(storedUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password });
    saveAuth(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const signup = useCallback(async (name, email, password, role) => {
    const res = await apiSignup({ name, email, password, role });
    saveAuth(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

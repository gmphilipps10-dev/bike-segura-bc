import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiPost, apiGet, apiPut } from '../config/api';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  nascimento: string;
  endereco: string;
  contatoEmergencia: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Omit<UserData, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  error: string;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'bike_segura_token';
const USER_KEY = 'bike_segura_user';

function loadToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function loadUser(): UserData | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(loadUser);
  const [token, setToken] = useState<string | null>(loadToken);
  const [error, setError] = useState('');

  const isLoggedIn = !!token && !!user;

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = loadToken();
      if (!storedToken) return;
      try {
        const userData = await apiGet('/auth/me', storedToken);
        setUser(userData);
        setToken(storedToken);
      } catch {
        // Token invalid, clear it
        logout();
      }
    };
    validateToken();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError('');
      const data = await apiPost('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Email ou senha incorretos';
      // Try to parse error message from API
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
      return false;
    }
  };

  const register = async (data: Omit<UserData, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setError('');
      const result = await apiPost('/auth/register', data);
      setToken(result.token);
      setUser(result.user);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Erro ao criar conta';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const updateUser = async (data: Partial<UserData>): Promise<void> => {
    if (!token || !user) return;
    try {
      const updated = await apiPut('/auth/profile', data, token);
      setUser(updated);
    } catch (err: any) {
      console.error('Update error:', err);
    }
  };

  const clearError = () => setError('');

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, token, login, register, logout, updateUser, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

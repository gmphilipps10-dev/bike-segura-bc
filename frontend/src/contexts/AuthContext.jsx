import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe(token).then((u) => { setUser(u); }).catch(() => { localStorage.removeItem('token'); }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, senha) => {
    const data = await api.login(email, senha);
    localStorage.setItem('token', data.access_token);
    const u = await api.getMe(data.access_token);
    setUser(u);
    return u;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (u) => setUser(u);

  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

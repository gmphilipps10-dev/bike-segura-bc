import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authAPI } from '../utils/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (data: {
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    telefone: string;
    email: string;
    senha: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const userData = await authAPI.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, senha: string) {
    try {
      const response = await authAPI.login(email, senha);
      await AsyncStorage.setItem('token', response.access_token);
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  }

  async function signUp(data: {
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    telefone: string;
    email: string;
    senha: string;
    foto_perfil?: string;
  }) {
    try {
      const response = await authAPI.register(data);
      await AsyncStorage.setItem('token', response.access_token);
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao cadastrar');
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
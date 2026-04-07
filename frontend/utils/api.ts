import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Bike, BikePhotos } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const authAPI = {
  register: async (data: {
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    telefone: string;
    email: string;
    senha: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao cadastrar');
    }
    return response.json();
  },

  login: async (email: string, senha: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao fazer login');
    }
    return response.json();
  },

  getMe: async (): Promise<User> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do usuário');
    }
    return response.json();
  },
};

export const bikeAPI = {
  create: async (data: {
    marca: string;
    modelo: string;
    cor: string;
    numero_serie: string;
    fotos: BikePhotos;
    tipo: string;
    caracteristicas?: string;
    link_rastreamento?: string;
    nota_fiscal?: string;
  }): Promise<Bike> => {
    try {
      const headers = await getAuthHeaders();
      console.log('Enviando requisição para criar bike...');
      
      const response = await fetch(`${API_URL}/bikes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      
      console.log('Resposta recebida:', response.status);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Erro na resposta:', error);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        throw new Error(error.detail || `Erro ao cadastrar bicicleta (${response.status})`);
      }
      
      return response.json();
    } catch (error: any) {
      console.error('Erro ao criar bike:', error);
      throw error;
    }
  },

  getAll: async (): Promise<Bike[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/bikes`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error('Erro ao buscar bicicletas');
    }
    return response.json();
  },

  getOne: async (id: string): Promise<Bike> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/bikes/${id}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error('Erro ao buscar bicicleta');
    }
    return response.json();
  },

  update: async (id: string, data: Partial<Bike>): Promise<Bike> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/bikes/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao atualizar bicicleta');
    }
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/bikes/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error('Erro ao deletar bicicleta');
    }
  },

  alertFurto: async (id: string): Promise<Bike> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/bikes/${id}/alert-furto`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao acionar alerta de furto');
    }
    return response.json();
  },
};
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../config/api';
import { useAuth } from './AuthContext';

export interface BikeData {
  id: string;
  name: string;
  type: string;
  brand: string;
  serie: string;
  color: string;
  value: string;
  photo: string | null;
  protected: boolean;
  location: string;
  lastSeen: string;
  rastreamento?: string;
  plataformaTag?: string;
  caracteristicas?: string;
  hash?: string;
  status?: 'normal' | 'furto' | 'recuperada';
  boNumber?: string;
  alertDate?: string | null;
  scanCount?: number;
}

type BikeApiData = Partial<BikeData> & {
  id?: string;
  _id?: string;
};

function normalizeBike(rawBike: BikeApiData): BikeData {
  const id = rawBike.id || rawBike._id;

  if (!id) {
    throw new Error('Equipamento recebido sem identificador.');
  }

  return {
    ...rawBike,
    id: String(id),
  } as BikeData;
}

interface BikeContextType {
  bikes: BikeData[];
  loading: boolean;
  addBike: (bike: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => Promise<any>;
  updateBike: (id: string, data: Partial<BikeData>) => Promise<BikeData>;
  removeBike: (id: string) => Promise<void>;
  toggleProtection: (id: string) => Promise<void>;
  refreshBikes: () => Promise<void>;
}

const BikeContext = createContext<BikeContextType | null>(null);

export function BikeProvider({ children }: { children: ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [bikes, setBikes] = useState<BikeData[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBikes = async () => {
    if (!token || !isLoggedIn) {
      setBikes([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet('/bikes', token);
      setBikes(Array.isArray(data) ? data.map(normalizeBike) : []);
    } catch (err) {
      console.error('Error fetching bikes:', err);
      setBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBikes();
  }, [token, isLoggedIn]);

  const addBike = async (bikeData: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => {
    if (!token) return null;
    try {
      const newBike = normalizeBike(await apiPost('/bikes', bikeData, token));
      setBikes(prev => [...prev, newBike]);
      return newBike;
    } catch (err) {
      console.error('Error adding bike:', err);
      return null;
    }
  };

  const removeBike = async (id: string) => {
    if (!token) throw new Error('Sua sessao expirou. Entre novamente para excluir o equipamento.');
    if (!id) throw new Error('Nao foi possivel identificar o equipamento.');

    try {
      await apiDelete(`/bikes/${id}`, token);
      setBikes(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error removing bike:', err);
      throw err;
    }
  };

  const toggleProtection = async (id: string) => {
    if (!token) return;
    const bike = bikes.find(b => b.id === id);
    if (!bike) return;
    try {
      const updated = normalizeBike(await apiPut(`/bikes/${id}`, {
        protected: !bike.protected,
        lastSeen: bike.protected ? 'Desativado' : 'Agora'
      }, token));
      setBikes(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      console.error('Error toggling protection:', err);
    }
  };

  const updateBike = async (id: string, data: Partial<BikeData>) => {
    if (!token) throw new Error('Sua sessao expirou. Entre novamente para editar o equipamento.');
    if (!id) throw new Error('Nao foi possivel identificar o equipamento.');

    try {
      const updated = normalizeBike(await apiPut(`/bikes/${id}`, data, token));
      setBikes(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
      return updated;
    } catch (err) {
      console.error('Error updating bike:', err);
      throw err;
    }
  };

  return (
    <BikeContext.Provider value={{ bikes, loading, addBike, updateBike, removeBike, toggleProtection, refreshBikes }}>
      {children}
    </BikeContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikeContext);
  if (!ctx) throw new Error('useBikes must be used within BikeProvider');
  return ctx;
}

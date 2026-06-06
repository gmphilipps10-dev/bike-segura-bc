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

interface BikeContextType {
  bikes: BikeData[];
  loading: boolean;
  addBike: (bike: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => Promise<any>;
  updateBike: (id: string, data: Partial<BikeData>) => Promise<any>;
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
      setBikes(data);
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
      const newBike = await apiPost('/bikes', bikeData, token);
      setBikes(prev => [...prev, newBike]);
      return newBike;
    } catch (err) {
      console.error('Error adding bike:', err);
      return null;
    }
  };

  const removeBike = async (id: string) => {
    if (!token) return;
    try {
      await apiDelete(`/bikes/${id}`, token);
      setBikes(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error removing bike:', err);
    }
  };

  const toggleProtection = async (id: string) => {
    if (!token) return;
    const bike = bikes.find(b => b.id === id);
    if (!bike) return;
    try {
      const updated = await apiPut(`/bikes/${id}`, {
        protected: !bike.protected,
        lastSeen: bike.protected ? 'Desativado' : 'Agora'
      }, token);
      setBikes(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      console.error('Error toggling protection:', err);
    }
  };

  const updateBike = async (id: string, data: Partial<BikeData>) => {
    if (!token) return null;
    try {
      const updated = await apiPut(`/bikes/${id}`, data, token);
      setBikes(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
      return updated;
    } catch (err) {
      console.error('Error updating bike:', err);
      return null;
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
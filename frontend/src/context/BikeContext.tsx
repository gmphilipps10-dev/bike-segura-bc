import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
}

interface BikeContextType {
  bikes: BikeData[];
  addBike: (bike: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => void;
  removeBike: (id: string) => void;
  toggleProtection: (id: string) => void;
}

const BikeContext = createContext<BikeContextType | null>(null);

function getStorageKey(userId: string | null): string {
  if (userId) {
    return `bike_segura_bikes_${userId}`;
  }
  return 'bike_segura_bikes_temp';
}

function loadBikes(userId: string | null): BikeData[] {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

export function BikeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [bikes, setBikes] = useState<BikeData[]>(() => loadBikes(userId));

  // Reload bikes when user changes
  useEffect(() => {
    setBikes(loadBikes(userId));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(bikes));
  }, [bikes, userId]);

  const addBike = (bikeData: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => {
    const newBike: BikeData = {
      ...bikeData,
      id: Date.now().toString(),
      protected: true,
      location: 'Balneário Camboriú, SC',
      lastSeen: 'Agora'
    };
    setBikes(prev => [...prev, newBike]);
  };

  const removeBike = (id: string) => {
    setBikes(prev => prev.filter(b => b.id !== id));
  };

  const toggleProtection = (id: string) => {
    setBikes(prev => prev.map(b =>
      b.id === id ? { ...b, protected: !b.protected, lastSeen: b.protected ? 'Desativado' : 'Agora' } : b
    ));
  };

  return (
    <BikeContext.Provider value={{ bikes, addBike, removeBike, toggleProtection }}>
      {children}
    </BikeContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikeContext);
  if (!ctx) throw new Error('useBikes must be used within BikeProvider');
  return ctx;
}

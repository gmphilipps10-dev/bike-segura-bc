import { createContext, useContext, useState, type ReactNode } from 'react';

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
}

const BikeContext = createContext<BikeContextType | null>(null);

const initialBikes: BikeData[] = [
  {
    id: '1',
    name: 'Sense Impulse E-Trail',
    type: 'Mountain Bike',
    brand: 'Sense',
    serie: 'SNS-2024-88742',
    color: 'Preto com vermelho',
    value: '12500',
    photo: '/bike-1.jpg',
    protected: true,
    location: 'Blumenau, SC',
    lastSeen: 'Há 2 min'
  },
  {
    id: '2',
    name: 'Caloi Carbon Racing',
    type: 'Speed',
    brand: 'Caloi',
    serie: 'CLO-2025-11293',
    color: 'Branco com azul',
    value: '8900',
    photo: '/bike-2.jpg',
    protected: true,
    location: 'Blumenau, SC',
    lastSeen: 'Online'
  }
];

export function BikeProvider({ children }: { children: ReactNode }) {
  const [bikes, setBikes] = useState<BikeData[]>(initialBikes);

  const addBike = (bikeData: Omit<BikeData, 'id' | 'protected' | 'location' | 'lastSeen'>) => {
    const newBike: BikeData = {
      ...bikeData,
      id: Date.now().toString(),
      protected: true,
      location: 'Blumenau, SC',
      lastSeen: 'Agora'
    };
    setBikes(prev => [...prev, newBike]);
  };

  return (
    <BikeContext.Provider value={{ bikes, addBike }}>
      {children}
    </BikeContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikeContext);
  if (!ctx) throw new Error('useBikes must be used within BikeProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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
  login: (email: string, password: string) => boolean;
  register: (data: Omit<UserData, 'id'> & { password: string }) => boolean;
  logout: () => void;
  updateUser: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'bike_segura_auth';
const USERS_KEY = 'bike_segura_users';

function loadUser(): UserData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function loadUsers(): (UserData & { password: string })[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  // Default demo user
  return [{
    id: 'demo-1',
    name: 'Gian Silva',
    email: 'gian@email.com',
    phone: '(47) 99999-9999',
    cpf: '123.456.789-00',
    rg: '1.234.567-8',
    nascimento: '10/05/1995',
    endereco: 'Balneário Camboriú, SC',
    contatoEmergencia: '(47) 98888-8888',
    password: '123456'
  }];
}

function saveUsers(users: (UserData & { password: string })[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(loadUser);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const users = loadUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    // Also allow login with phone
    const foundByPhone = users.find(u => u.phone === email && u.password === password);
    if (foundByPhone) {
      const { password: _, ...userData } = foundByPhone;
      setUser(userData);
      return true;
    }
    return false;
  };

  const register = (data: Omit<UserData, 'id'> & { password: string }): boolean => {
    const users = loadUsers();
    if (users.some(u => u.email === data.email)) {
      return false; // Email already exists
    }
    const newUser = { ...data, id: Date.now().toString() };
    users.push(newUser);
    saveUsers(users);
    const { password: _, ...userData } = newUser;
    setUser(userData);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = (data: Partial<UserData>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    // Also update in users list
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

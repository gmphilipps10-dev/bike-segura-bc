import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

interface AuthContextType {
  isLoggedIn: boolean
  isAdmin: boolean
  login: (password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const admin = localStorage.getItem('admin_user')
    if (token && admin) {
      setIsLoggedIn(true)
      setIsAdmin(JSON.parse(admin).isAdmin === true)
    }
  }, [])

  const login = async (password: string) => {
    try {
      const painelRes = await fetch(`${API_BASE}/auth/painel-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: password }),
      })
      const painelData = await painelRes.json()

      if (painelRes.ok && painelData.token) {
        const painelUser = { id: 'painel-admin', isAdmin: true, name: 'Painel Admin' }
        localStorage.setItem('admin_token', painelData.token)
        localStorage.setItem('admin_user', JSON.stringify(painelUser))
        setIsLoggedIn(true)
        setIsAdmin(true)
        return { success: true }
      }

      return {
        success: false,
        message: painelData.message || 'Senha do painel incorreta.',
      }
    } catch {
      return {
        success: false,
        message: 'Nao foi possivel conectar ao servidor. Tente novamente.',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setIsLoggedIn(false)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

interface AuthContextType {
  isLoggedIn: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  login: async () => false,
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

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.token && data.user) {
        // Verifica se e admin
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        })
        const meData = await meRes.json()
        
        if (meData.isAdmin) {
          localStorage.setItem('admin_token', data.token)
          localStorage.setItem('admin_user', JSON.stringify(meData))
          setIsLoggedIn(true)
          setIsAdmin(true)
          return true
        }
        // Nao e admin
        alert('Acesso negado. Esta area e exclusiva para administradores.')
      }

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
        return true
      }

      return false
    } catch {
      return false
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

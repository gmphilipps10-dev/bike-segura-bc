import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

interface AuthContextType {
  isLoggedIn: boolean
  isAdmin: boolean
  isOwner: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  isOwner: false,
  login: async () => ({ success: false }),
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const admin = localStorage.getItem('admin_user')
    if (token && admin) {
      const adminUser = JSON.parse(admin)
      setIsLoggedIn(true)
      setIsAdmin(adminUser.isAdmin === true)
      setIsOwner(adminUser.isOwner === true || adminUser.role === 'owner')
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const emailLimpo = email.trim()
      const painelRes = await fetch(`${API_BASE}/auth/painel-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailLimpo ? { email: emailLimpo, senha: password } : { senha: password }),
      })
      const painelData = await painelRes.json()

      if (painelRes.ok && painelData.token) {
        const painelUser = painelData.user || { id: 'painel-admin', isAdmin: true, isOwner: false, name: 'Painel Admin', role: 'admin' }
        localStorage.setItem('admin_token', painelData.token)
        localStorage.setItem('admin_user', JSON.stringify(painelUser))
        setIsLoggedIn(true)
        setIsAdmin(painelUser.isAdmin === true)
        setIsOwner(painelUser.isOwner === true || painelUser.role === 'owner')
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
    setIsOwner(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

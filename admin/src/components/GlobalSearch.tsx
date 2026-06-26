import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bike, ClipboardList, CreditCard, QrCode, Search, User, X } from './Icons'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

type SearchResult = {
  id: string
  type: string
  title: string
  subtitle: string
  badge: string
  route: string
  icon: string
}

const iconMap: Record<string, any> = {
  user: User,
  bike: Bike,
  qr: QrCode,
  plan: ClipboardList,
  payment: CreditCard,
  alert: AlertTriangle,
}

const typeLabel: Record<string, string> = {
  cliente: 'Cliente',
  equipamento: 'Equipamento',
  adesivo: 'Adesivo QR',
  plano: 'Plano',
  pagamento: 'Pagamento',
  sinistro: 'Sinistro',
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('admin_token') || ''
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/admin/search?q=${encodeURIComponent(trimmed)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await res.json()
        setResults(Array.isArray(data.results) ? data.results : [])
        setOpen(true)
      } catch (error: any) {
        if (error.name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, token])

  const goToResult = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    navigate(result.route)
  }

  return (
    <div ref={containerRef} className="fixed top-4 right-4 z-[60] w-[min(580px,calc(100vw-2rem))]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={event => setQuery(event.target.value)}
            placeholder="Pesquisar clientes, equipamentos, QR, pagamentos, sinistros..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]) }}
              className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white"
              aria-label="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && query.trim().length >= 2 && (
          <div className="max-h-[70vh] overflow-y-auto border-t border-white/10 p-2">
            {loading ? (
              <p className="px-3 py-4 text-sm text-slate-500">Pesquisando...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">Nenhum resultado encontrado.</p>
            ) : (
              <div className="space-y-1">
                {results.map(result => {
                  const Icon = iconMap[result.icon] || Search
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => goToResult(result)}
                      className="w-full rounded-xl px-3 py-3 text-left hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                          <Icon className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">{result.title}</p>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                              {typeLabel[result.type] || result.type}
                            </span>
                          </div>
                          {result.subtitle && <p className="mt-1 truncate text-xs text-slate-400">{result.subtitle}</p>}
                        </div>
                        {result.badge && (
                          <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300">
                            {result.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

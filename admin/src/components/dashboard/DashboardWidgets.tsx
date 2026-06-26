import { Link } from 'react-router-dom'
import type { ComponentType } from 'react'

type IconComponent = ComponentType<{ className?: string }>

export function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('pt-BR')
}

export function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDateTime(value: string) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(Number(date))) return '--'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'text-amber-400',
  bg = 'bg-amber-400/10',
  link,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: IconComponent
  color?: string
  bg?: string
  link?: string
}) {
  const content = (
    <>
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-xs mt-1">{title}</p>
      {subtitle && <p className="text-slate-500 text-[11px] mt-2">{subtitle}</p>}
    </>
  )

  if (link) return <Link to={link} className="glass-card-hover p-5">{content}</Link>
  return <div className="glass-card p-5">{content}</div>
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="glass-card p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">{title}</h2>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ text = 'Ainda nao ha dados para exibir.' }: { text?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  )
}

export function LoadingDashboard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="glass-card p-5 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-white/10 mb-4" />
          <div className="h-8 rounded bg-white/10 mb-3" />
          <div className="h-3 rounded bg-white/5 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function FunnelChart({
  items,
}: {
  items: { label: string; value: number }[]
}) {
  const max = Math.max(...items.map(item => item.value), 1)

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-slate-300 text-sm">{item.label}</p>
            <p className="text-white text-sm font-bold">{formatNumber(item.value)}</p>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-amber-400"
              style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RankingList({
  items,
  labelKey,
  empty,
}: {
  items: any[]
  labelKey: string
  empty: string
}) {
  if (!items.length) return <EmptyState text={empty} />
  const max = Math.max(...items.map(item => Number(item.total || 0)), 1)

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item, index) => {
        const label = item[labelKey] || item.button_name || item.button || item.page || item.usuario || 'Sem nome'
        const value = Number(item.total || item.convertidas || 0)
        return (
          <div key={`${label}-${index}`} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-slate-200 text-sm truncate">{label}</p>
              <p className="text-amber-400 text-sm font-bold">{formatNumber(value)}</p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const online = ['online', 'conectado', 'operacional'].includes(String(status).toLowerCase())
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${
      online
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
        : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {status}
    </span>
  )
}

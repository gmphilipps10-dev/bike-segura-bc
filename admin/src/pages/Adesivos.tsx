import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { CheckCircle, AlertTriangle, Printer, Plus } from '../components/Icons'
import Sidebar from '../components/Sidebar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/bike-segura-bc-backend/api'

interface Adesivo {
  _id: string
  stickerNumber: string
  hash: string
  status: 'disponivel' | 'vinculado' | 'inativo'
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const dividirEmPaginas = <T,>(items: T[], tamanho: number) =>
  Array.from({ length: Math.ceil(items.length / tamanho) }, (_, indice) =>
    items.slice(indice * tamanho, (indice + 1) * tamanho)
  )

export default function Adesivos() {
  const [items, setItems] = useState<Adesivo[]>([])
  const [stats, setStats] = useState({ total: 0, disponiveis: 0, vinculados: 0 })
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const [msg, setMsg] = useState('')
  const [filtro, setFiltro] = useState<'disponivel' | 'vinculado' | 'todos'>('disponivel')
  const token = localStorage.getItem('admin_token') || ''

  const fetchData = () => {
    const status = filtro !== 'todos' ? `&status=${filtro}` : ''
    fetch(`${API_BASE}/preprinted?limit=100${status}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) {
          console.error('[Adesivos] Erro API:', r.status, r.statusText)
          return { items: [], total: 0, disponiveis: 0, vinculados: 0 }
        }
        return r.json()
      })
      .then(d => {
        setItems(d.items || [])
        setStats({ total: d.total || 0, disponiveis: d.disponiveis || 0, vinculados: d.vinculados || 0 })
        setLoading(false)
      })
      .catch(err => { console.error('[Adesivos] Erro:', err); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [filtro, token])

  const gerarLote = () => {
    const confirmou = window.confirm(
      'Gerar 100 novos adesivos QR Code? Esta operacao nao deve ser repetida por engano.'
    )
    if (!confirmou) return

    setGerando(true)
    setMsg('')
    fetch(`${API_BASE}/preprinted/gerar-lote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantidade: 100 })
    })
      .then(r => {
        if (!r.ok) {
          console.error('[GerarLote] Erro:', r.status)
          setMsg('Erro ao gerar lote. Tente novamente.')
          return null
        }
        return r.json()
      })
      .then(d => {
        if (!d) return

        const quantidade = d.quantidade ?? d.count ?? d.total
        const primeiro = d.de ?? d.inicio ?? d.start
        const ultimo = d.ate ?? d.fim ?? d.end
        const intervalo = primeiro && ultimo ? `: ${primeiro} ate ${ultimo}` : ''

        setMsg(quantidade
          ? `${quantidade} adesivos gerados${intervalo}`
          : d.message || 'Lote gerado com sucesso!')
        fetchData()
      })
      .catch(err => { console.error('[GerarLote] Erro:', err); setMsg('Erro ao gerar lote.') })
      .finally(() => setGerando(false))
  }

  const adesivosParaImpressao = items.filter(item => item.status === 'disponivel')

  const imprimirAdesivos = async () => {
    if (adesivosParaImpressao.length === 0 || imprimindo) return

    const janela = window.open('', 'bike-segura-etiquetas', 'width=1100,height=850')
    if (!janela) {
      window.alert('O navegador bloqueou a janela de impressao. Autorize pop-ups para este site e tente novamente.')
      return
    }

    janela.document.write('<!doctype html><title>Preparando etiquetas...</title><p style="font-family:Arial;padding:24px">Preparando QR Codes...</p>')
    janela.document.close()
    setImprimindo(true)

    try {
      const etiquetas = await Promise.all(adesivosParaImpressao.map(async item => {
        const destino = `${window.location.origin}/s/${item.stickerNumber}`
        const qrDataUrl = await QRCode.toDataURL(destino, {
          width: 320,
          margin: 0,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        })

        return {
          ...item,
          qrDataUrl,
          identificadorCurto: item.hash.slice(0, 8).toUpperCase(),
        }
      }))

      const paginas = dividirEmPaginas(etiquetas, 36)
      const conteudo = paginas.map((pagina, indicePagina) => `
        <section class="pagina${indicePagina === paginas.length - 1 ? ' ultima' : ''}">
          ${pagina.map(item => `
            <article class="etiqueta">
              <img src="${item.qrDataUrl}" alt="QR Code ${escapeHtml(item.stickerNumber)}">
              <div class="dados">
                <div class="marca">BIKE SEGURA BC</div>
                <div class="serie">${escapeHtml(item.stickerNumber)}</div>
                <div class="id">${escapeHtml(item.identificadorCurto)}</div>
              </div>
            </article>
          `).join('')}
        </section>
      `).join('')

      janela.document.open()
      janela.document.write(`<!doctype html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <title>Etiquetas Bike Segura BC</title>
            <style>
              @page { size: A4 portrait; margin: 8mm; }
              * { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; background: #fff; color: #000; }
              body {
                font-family: Arial, Helvetica, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .pagina {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                grid-auto-rows: 27mm;
                gap: 3mm;
                width: 100%;
                break-after: page;
                page-break-after: always;
              }
              .pagina.ultima {
                break-after: auto;
                page-break-after: auto;
              }
              .etiqueta {
                display: grid;
                grid-template-columns: 19mm minmax(0, 1fr);
                align-items: center;
                gap: 2mm;
                min-width: 0;
                padding: 2mm;
                overflow: hidden;
                border: 0.35mm solid #222;
                border-radius: 2mm;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .etiqueta img {
                display: block;
                width: 19mm;
                height: 19mm;
              }
              .dados {
                min-width: 0;
                font-family: Consolas, "Courier New", monospace;
                line-height: 1.05;
              }
              .marca {
                margin-bottom: 1.2mm;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 4.6pt;
                font-weight: 800;
                letter-spacing: 0.08mm;
                white-space: nowrap;
              }
              .serie {
                font-size: 7.5pt;
                font-weight: 900;
                white-space: nowrap;
              }
              .id {
                margin-top: 1.2mm;
                font-size: 6.5pt;
                font-weight: 700;
                letter-spacing: 0.15mm;
                white-space: nowrap;
              }
              @media screen {
                body { padding: 8mm; background: #e5e7eb; }
                .pagina { max-width: 194mm; margin: 0 auto 8mm; padding: 0; background: #fff; }
              }
            </style>
          </head>
          <body>
            ${conteudo}
            <script>
              window.addEventListener('load', async () => {
                await Promise.all(Array.from(document.images).map(img =>
                  img.decode ? img.decode().catch(() => {}) : Promise.resolve()
                ));
                setTimeout(() => { window.focus(); window.print(); }, 250);
              });
              window.addEventListener('afterprint', () => window.close());
            </script>
          </body>
        </html>`)
      janela.document.close()
    } catch (error) {
      console.error('[Adesivos] Erro ao preparar impressao:', error)
      janela.close()
      window.alert('Nao foi possivel preparar as etiquetas. Tente novamente.')
    } finally {
      setImprimindo(false)
    }
  }

  return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar />
        <div className="flex-1 p-6 lg:p-8">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-white">Adesivos QR Code</h1>
            <p className="text-slate-400 text-sm">{stats.disponiveis} disponiveis / {stats.vinculados} em uso</p>
          </header>

          {stats.disponiveis < 10 && (
            <div className="glass-card border border-red-500/30 p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">Estoque baixo! Apenas {stats.disponiveis} adesivos.</p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button onClick={gerarLote} disabled={gerando} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" />{gerando ? 'Gerando...' : 'Gerar Lote (+100)'}
            </button>
            <button
              onClick={imprimirAdesivos}
              disabled={loading || imprimindo || adesivosParaImpressao.length === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />{imprimindo ? 'Preparando...' : 'Imprimir'}
            </button>
          </div>

          {msg && <div className="glass-card bg-emerald-500/10 border border-emerald-500/20 p-3 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /><p className="text-emerald-400 text-xs">{msg}</p></div>}

          <div className="flex gap-2 mb-3">
            {(['disponivel', 'vinculado', 'todos'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${filtro === f ? 'bg-white/10 text-white' : 'text-slate-600'}`}>{f === 'todos' ? 'TODOS' : f === 'disponivel' ? 'DISPONIVEIS' : 'USADOS'}</button>
            ))}
          </div>

          {loading ? <p className="text-slate-500">Carregando...</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {items.map(item => (
                <div key={item._id} className={`glass-card p-3 ${item.status === 'disponivel' ? 'border border-emerald-500/10' : 'opacity-60'}`}>
                  <p className="text-white font-mono text-xs font-bold">{item.stickerNumber}</p>
                  <p className="text-slate-600 text-[9px] font-mono">{item.hash?.slice(0, 8).toUpperCase()}</p>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${item.status === 'disponivel' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.status === 'disponivel' ? 'LIVRE' : 'USADO'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}

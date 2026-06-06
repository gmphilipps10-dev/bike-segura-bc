import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ===== CSV (já existente, melhorado com BOM para Excel) =====
export function exportarCSV(nome: string, headers: string[], rows: (string | number)[][]) {
  const csv = ['\uFEFF' + headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nome}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== PDF com jsPDF + autoTable =====
export function exportarPDF(
  titulo: string,
  subtitulo: string,
  headers: string[],
  rows: (string | number)[][],
  totais?: { label: string; value: string }[]
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const hoje = new Date().toLocaleDateString('pt-BR')

  // Cabecalho
  doc.setFontSize(16)
  doc.setTextColor(31, 41, 55)
  doc.text(titulo, 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(subtitulo, 14, 28)
  doc.text(`Gerado em: ${hoje}`, 14, 33)

  // Tabela
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 38,
    theme: 'striped',
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [60, 60, 60] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2, font: 'helvetica' },
  })

  // Totais
  if (totais && totais.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 250
    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.setFont('helvetica', 'bold')
    doc.text('RESUMO', 14, finalY + 10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    totais.forEach((t, i) => {
      doc.text(`${t.label}: ${t.value}`, 14, finalY + 17 + i * 6)
    })
  }

  // Rodape
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Bike Segura BC - Pagina ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10)
    doc.text('www.bikesegurabc.com.br', doc.internal.pageSize.width - 60, doc.internal.pageSize.height - 10)
  }

  doc.save(`${titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ===== Excel (XLSX) =====
export function exportarExcel(
  nome: string,
  aba: string,
  headers: string[],
  rows: (string | number)[][],
  totais?: { label: string; value: string }[]
) {
  // Prepara dados
  const data = [headers, ...rows]
  if (totais && totais.length > 0) {
    data.push([], ['RESUMO'], ...totais.map(t => [t.label, t.value]))
  }

  const ws = XLSX.utils.aoa_to_sheet(data)

  // Largura das colunas
  const colWidths = headers.map((_, i) => {
    const maxLen = Math.max(...data.map(r => String(r[i] || '').length))
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }
  })
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, aba)
  XLSX.writeFile(wb, `${nome}-${new Date().toISOString().split('T')[0]}.xlsx`)
}

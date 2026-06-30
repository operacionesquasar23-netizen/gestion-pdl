import { useState, useEffect } from 'react'
import Head from 'next/head'

const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbwLbjC8aOQ9sZ7x0_CLAySNOx5ib7xu65R2KsQlkK-0hIKZIZ4Y1_g_Ggt3rASxd6-U/exec"

const ESTADOS_ORDER = [
  'Pendiente revisión',
  'Visita programada',
  'Visita realizada',
  'Cotización enviada',
  'Cotización aprobada',
  'Cotización rechazada',
  'En renegociación',
  'Habilitación programada',
  'Habilitación realizada',
  'Evidencias recibidas',
  'Cerrado',
]

const ESTADO_COLORS = {
  'Pendiente revisión':      '#F59E0B',
  'Visita programada':       '#3B82F6',
  'Visita realizada':        '#6366F1',
  'Cotización enviada':      '#F97316',
  'Cotización aprobada':     '#14B8A6',
  'Cotización rechazada':    '#EF4444',
  'En renegociación':        '#A855F7',
  'Habilitación programada': '#06B6D4',
  'Habilitación realizada':  '#84CC16',
  'Evidencias recibidas':    '#10B981',
  'Cerrado':                 '#22C55E',
}

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-800',
    amber:  'bg-amber-50 text-amber-800',
    green:  'bg-green-50 text-green-800',
    purple: 'bg-purple-50 text-purple-800',
    teal:   'bg-teal-50 text-teal-800',
    orange: 'bg-orange-50 text-orange-800',
  }
  return (
    <div className={`${colors[color]} rounded-2xl px-6 py-5`}>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarChart({ data, maxValue }) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-40 truncate text-right">{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 relative">
            <div
              className="h-6 rounded-full flex items-center justify-end pr-2 transition-all"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                minWidth: item.value > 0 ? '2rem' : '0',
                backgroundColor: item.color || '#3B82F6'
              }}>
              {item.value > 0 && (
                <span className="text-xs font-bold text-white">{item.value}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${SHEETS_API_URL}?sheet=Solicitudes`)
      const data = await res.json()
      const rows = data.values || []
      if (rows.length < 2) { setTickets([]); setLoading(false); return }
      const headers = rows[0]
      const parsed = rows.slice(1).map(row => {
        const obj = {}
        headers.forEach((h, i) => { obj[h] = row[i] || '' })
        return obj
      })
      setTickets(parsed)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const ticketsMes = tickets.filter(t => {
    if (!t.FechaRequerimiento) return false
    const parts = t.FechaRequerimiento.split('/')
    if (parts.length < 3) return false
    const tMes = parseInt(parts[1]) - 1
    const tAnio = parseInt(parts[2].split(',')[0].trim())
    return tMes === mes && tAnio === anio
  })

  // Métricas principales
  const totalMes = ticketsMes.length
  const cerradosMes = ticketsMes.filter(t => t.Estado === 'Cerrado').length

  // Por estado
  const porEstado = ESTADOS_ORDER.map(e => ({
    label: e,
    value: ticketsMes.filter(t => t.Estado === e).length,
    color: ESTADO_COLORS[e]
  })).filter(e => e.value > 0)

  // Por ejecutivo
  const ejecutivos = [...new Set(tickets.map(t => t.Ejecutivo).filter(Boolean))]
  const porEjecutivo = ejecutivos.map(e => ({
    label: e,
    value: ticketsMes.filter(t => t.Ejecutivo === e).length,
    color: '#3B82F6'
  })).sort((a, b) => b.value - a.value).filter(e => e.value > 0)

  // Por tienda
  const tiendas = [...new Set(ticketsMes.map(t => t.Tienda).filter(Boolean))]
  const porTienda = tiendas.map(t => ({
    label: t,
    value: ticketsMes.filter(x => x.Tienda === t).length,
    color: '#6366F1'
  })).sort((a, b) => b.value - a.value).slice(0, 8)

  // Por cliente
  const clientes = [...new Set(ticketsMes.map(t => t.Cliente).filter(Boolean))]
  const porCliente = clientes.map(c => ({
    label: c,
    value: ticketsMes.filter(x => x.Cliente === c).length,
    color: '#F59E0B'
  })).sort((a, b) => b.value - a.value).slice(0, 8)

  const maxCliente = Math.max(...porCliente.map(e => e.value), 1)

  // Por proveedor
  const porProveedor = ['CARZE', 'MPESSAC'].map(p => ({
    label: p,
    value: ticketsMes.filter(t => t.Proveedor === p).length,
    color: p === 'CARZE' ? '#F97316' : '#14B8A6'
  }))

  // Monto total cotizaciones
  const montoTotal = ticketsMes.reduce((sum, t) => {
    const m = parseFloat(t.MontoCotizacion) || 0
    return sum + m
  }, 0)

  // Tiempo promedio de atención
  const parseFecha = (str) => {
    if (!str) return null
    const parts = str.split('/').map(p => p.trim())
    if (parts.length < 3) return null
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parseInt(parts[2].split(',')[0].split(' ')[0])
    return new Date(year, month, day)
  }

  const cerrados = ticketsMes.filter(t => t.Estado === 'Cerrado' && t.FechaCierre && t.FechaRequerimiento)
  const tiempoPromedio = cerrados.length > 0
    ? Math.round(cerrados.reduce((sum, t) => {
        const inicio = parseFecha(t.FechaRequerimiento)
        const fin = parseFecha(t.FechaCierre)
        if (!inicio || !fin) return sum
        return sum + Math.max(0, (fin - inicio) / (1000 * 60 * 60 * 24))
      }, 0) / cerrados.length)
    : null

  const maxEstado = Math.max(...porEstado.map(e => e.value), 1)
  const maxEjec = Math.max(...porEjecutivo.map(e => e.value), 1)
  const maxTienda = Math.max(...porTienda.map(e => e.value), 1)

  return (
    <>
      <Head><title>Dashboard · PDL</title></Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="font-semibold">PDL — Dashboard</h1>
              <p className="text-blue-200 text-xs">Métricas y estadísticas</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <a href="/" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
            <button onClick={fetchData}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

          {/* Selector de mes */}
          <div className="flex items-center gap-3">
            <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={anio} onChange={e => setAnio(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="text-sm text-gray-400">{totalMes} solicitudes en {meses[mes]} {anio}</span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Cargando datos...</div>
          ) : (
            <>
              {/* Stats principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total del mes" value={totalMes} color="blue" />
                <StatCard label="Cerrados" value={cerradosMes} sub={totalMes > 0 ? `${Math.round(cerradosMes/totalMes*100)}% del total` : ''} color="green" />
                <StatCard label="Monto cotizaciones" value={`S/ ${montoTotal.toLocaleString('es-PE')}`} color="teal" />
                <StatCard label="Tiempo promedio" value={tiempoPromedio !== null ? `${tiempoPromedio} días` : '—'} sub="de atención" color="purple" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Por estado */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">📊 Por estado</h2>
                  {porEstado.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
                    : <BarChart data={porEstado} maxValue={maxEstado} />
                  }
                </div>

                {/* Por ejecutivo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">👤 Por ejecutivo</h2>
                  {porEjecutivo.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
                    : <BarChart data={porEjecutivo} maxValue={maxEjec} />
                  }
                </div>

                {/* Por tienda */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">🏪 Por tienda</h2>
                  {porTienda.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
                    : <BarChart data={porTienda} maxValue={maxTienda} />
                  }
                </div>

                {/* Por cliente */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">🏢 Por cliente</h2>
                  {porCliente.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
                    : <BarChart data={porCliente} maxValue={maxCliente} />
                  }
                </div>

                {/* Por proveedor */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">🔧 Por proveedor</h2>
                  {porProveedor.every(p => p.value === 0)
                    ? <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
                    : (
                      <div className="flex gap-4 justify-center mt-4">
                        {porProveedor.map((p, i) => (
                          <div key={i} className="text-center">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2"
                              style={{ backgroundColor: p.color + '20', border: `3px solid ${p.color}` }}>
                              <span className="text-2xl font-bold" style={{ color: p.color }}>{p.value}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">{p.label}</p>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

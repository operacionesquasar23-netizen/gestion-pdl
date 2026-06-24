import { useState, useEffect } from 'react'
import Head from 'next/head'

const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

const ESTADOS = [
  { id: 'Pendiente revisión',      short: 'Pendiente revisión' },
  { id: 'Visita programada',       short: 'Visita programada' },
  { id: 'Visita realizada',        short: 'Visita realizada' },
  { id: 'Cotización enviada',      short: 'Cotización enviada' },
  { id: 'Cotización aprobada',     short: 'Cotización aprobada' },
  { id: 'Habilitación programada', short: 'Habilitación programada' },
  { id: 'Habilitación reprogramada', short: 'Habilitación reprogramada' },
  { id: 'Habilitación realizada',  short: 'Habilitación realizada' },
  { id: 'Evidencias recibidas',    short: 'Evidencias recibidas' },
  { id: 'OC solicitada',           short: 'OC solicitada' },
  { id: 'AC y OC entregadas',      short: 'AC y OC entregadas' },
  { id: 'Cerrado',                 short: 'Cerrado' },
]

// Estados que no forman parte del camino lineal principal pero existen
const ESTADOS_ALTERNOS = ['Cotización rechazada', 'En renegociación']

function getStepIndex(estado) {
  const idx = ESTADOS.findIndex(e => e.id === estado)
  return idx === -1 ? 0 : idx
}

function ProgressBar({ estado }) {
  const currentIndex = getStepIndex(estado)
  const isAlterno = ESTADOS_ALTERNOS.includes(estado)

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
      {ESTADOS.map((e, i) => {
        const done = i < currentIndex
        const current = i === currentIndex && !isAlterno
        return (
          <div key={e.id} className="flex items-center flex-shrink-0" title={e.id}>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-colors ${
                current ? 'bg-blue-700 text-white ring-2 ring-blue-200' :
                done ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
              {done ? '✓' : i + 1}
            </div>
            {i < ESTADOS.length - 1 && (
              <div className={`h-0.5 w-3 flex-shrink-0 ${i < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Resumen() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroEjecutivo, setFiltroEjecutivo] = useState('Todos')
  const [buscar, setBuscar] = useState('')

  useEffect(() => { fetchData() }, [])

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
      }).reverse()
      setTickets(parsed)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const ejecutivos = [...new Set(tickets.map(t => t.Ejecutivo).filter(Boolean))]

  const filtered = tickets.filter(t => {
    const matchE = filtroEstado === 'Todos' || t.Estado === filtroEstado
    const matchEj = filtroEjecutivo === 'Todos' || t.Ejecutivo === filtroEjecutivo
    const q = buscar.toLowerCase()
    const matchQ = !q ||
      t.Cliente?.toLowerCase().includes(q) ||
      t.Tienda?.toLowerCase().includes(q) ||
      t.TicketID?.toLowerCase().includes(q) ||
      t.Asunto?.toLowerCase().includes(q)
    return matchE && matchEj && matchQ
  })

  return (
    <>
      <Head><title>Resumen de Solicitudes · PDL</title></Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="font-semibold">PDL — Resumen de Solicitudes</h1>
              <p className="text-blue-200 text-xs">Vista general del estado de cada requerimiento</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
            <button onClick={fetchData}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              🔄 Actualizar
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
            <input value={buscar} onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por cliente, tienda, asunto o código..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[220px]" />

            <select value={filtroEjecutivo} onChange={e => setFiltroEjecutivo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Todos">Todos los ejecutivos</option>
              {ejecutivos.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
              {ESTADOS_ALTERNOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} resultado(s)</span>
          </div>

          {/* Leyenda */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Guía de estados</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {ESTADOS.map((e, i) => (
                <div key={e.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center gap-1 w-20">
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{e.id}</span>
                  </div>
                  {i < ESTADOS.length - 1 && <div className="h-0.5 w-3 bg-gray-200 flex-shrink-0 mb-5" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-700 ring-2 ring-blue-200"></div>
                <span>Estado actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                <span>Completado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                <span>Pendiente</span>
              </div>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Cargando solicitudes...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>Sin solicitudes que mostrar</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((t, i) => {
                const isAlterno = ESTADOS_ALTERNOS.includes(t.Estado)
                return (
                  <a key={i} href={`/seguimiento/${t.TicketID}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow block">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-xs font-mono text-gray-400">{t.TicketID}</p>
                        <h3 className="text-sm font-semibold text-gray-900">{t.Asunto || t.TipoSolicitud}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t.Cliente} · {t.Tienda} · {t.Ejecutivo}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                        isAlterno ? 'bg-red-100 text-red-700' :
                        t.Estado === 'Cerrado' ? 'bg-green-100 text-green-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {t.Estado}
                      </span>
                    </div>
                    {!isAlterno ? (
                      <ProgressBar estado={t.Estado} />
                    ) : (
                      <p className="text-xs text-red-500 italic">Requiere atención — {t.Estado}</p>
                    )}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import Head from 'next/head'

const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

function parseFecha(str) {
  if (!str) return null
  str = str.trim()
  
  // Formato ISO: 2026-05-21T05:00:00.000Z
  if (str.includes('T')) {
    const d = new Date(str)
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  
  // Formato DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split('/').map(p => p.trim())
    if (parts.length >= 3) {
      const day = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1
      const year = parseInt(parts[2].split(',')[0].split(' ')[0])
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) return new Date(year, month, day)
    }
  }

  // Formato D-MMM-YY
  if (str.includes('-')) {
    const meses = { 'ene':0,'feb':1,'mar':2,'abr':3,'may':4,'jun':5,'jul':6,'ago':7,'sep':8,'oct':9,'nov':10,'dic':11 }
    const parts = str.split('-')
    if (parts.length === 3) {
      const day = parseInt(parts[0])
      const month = meses[parts[1].toLowerCase()]
      let year = parseInt(parts[2])
      if (year < 100) year += 2000
      if (!isNaN(day) && month !== undefined && !isNaN(year)) return new Date(year, month, day)
    }
  }

  return null
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
}

export default function Calendario() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

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
      })
      setTickets(parsed)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)
  const diasEnMes = ultimoDia.getDate()
  let diaSemanaInicio = primerDia.getDay() - 1
  if (diaSemanaInicio < 0) diaSemanaInicio = 6

  const celdas = []
  for (let i = 0; i < diaSemanaInicio; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(new Date(anio, mes, d))

  const getEventosDia = (fecha) => {
    if (!fecha) return { visitas: [], habilitaciones: [] }
    const visitas = tickets.filter(t => {
      const fv = parseFecha(t.FechaVisita)
      const fh = parseFecha(t.FechaHabilitacion)
      // Solo mostrar visita si NO tiene fecha de habilitación programada
      return fv && isSameDay(fv, fecha) && !fh
    })
    const habilitaciones = tickets.filter(t => {
      const fh = parseFecha(t.FechaHabilitacion)
      return fh && isSameDay(fh, fecha)
    })
    return { visitas, habilitaciones }
  }

  const eventosDiaSeleccionado = diaSeleccionado ? getEventosDia(diaSeleccionado) : null
  const hoy = new Date()

  return (
    <>
      <Head><title>Calendario · PDL</title></Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="font-semibold">PDL — Calendario</h1>
              <p className="text-blue-200 text-xs">Visitas y habilitaciones programadas</p>
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

        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Leyenda */}
          <div className="flex items-center gap-6 bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Visita programada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Habilitación programada</span>
            </div>
          </div>

          {/* Navegación mes */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-3">
            <button onClick={() => {
              if (mes === 0) { setMes(11); setAnio(a => a - 1) }
              else setMes(m => m - 1)
              setDiaSeleccionado(null)
            }} className="text-gray-400 hover:text-gray-700 text-xl px-2">‹</button>
            <h2 className="text-base font-semibold text-gray-900">{MESES[mes]} {anio}</h2>
            <button onClick={() => {
              if (mes === 11) { setMes(0); setAnio(a => a + 1) }
              else setMes(m => m + 1)
              setDiaSeleccionado(null)
            }} className="text-gray-400 hover:text-gray-700 text-xl px-2">›</button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">Cargando calendario...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Calendario */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                {/* Días de la semana */}
                <div className="grid grid-cols-7 mb-2">
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Días */}
                <div className="grid grid-cols-7 gap-1">
                  {celdas.map((fecha, i) => {
                    if (!fecha) return <div key={i} />
                    const { visitas, habilitaciones } = getEventosDia(fecha)
                    const esHoy = isSameDay(fecha, hoy)
                    const esSeleccionado = diaSeleccionado && isSameDay(fecha, diaSeleccionado)
                    const tieneEventos = visitas.length > 0 || habilitaciones.length > 0
                    return (
                      <button key={i}
                        onClick={() => setDiaSeleccionado(esSeleccionado ? null : fecha)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                          esSeleccionado ? 'bg-blue-700 text-white' :
                          esHoy ? 'bg-blue-50 text-blue-700 font-bold' :
                          tieneEventos ? 'hover:bg-gray-50 font-medium' :
                          'hover:bg-gray-50 text-gray-600'
                        }`}>
                        <span>{fecha.getDate()}</span>
                        {tieneEventos && (
                          <div className="flex gap-0.5 mt-0.5">
                            {visitas.length > 0 && (
                              <div className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? 'bg-white' : 'bg-blue-500'}`} />
                            )}
                            {habilitaciones.length > 0 && (
                              <div className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? 'bg-white' : 'bg-green-500'}`} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Panel lateral */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                {!diaSeleccionado ? (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-3xl mb-2">📅</p>
                    <p className="text-sm">Selecciona un día para ver los eventos</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      {diaSeleccionado.getDate()} de {MESES[diaSeleccionado.getMonth()]} {diaSeleccionado.getFullYear()}
                    </h3>

                    {eventosDiaSeleccionado.visitas.length === 0 && eventosDiaSeleccionado.habilitaciones.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Sin eventos este día</p>
                    )}

                    {eventosDiaSeleccionado.visitas.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">🔵 Visitas</p>
                        <div className="flex flex-col gap-2">
                          {eventosDiaSeleccionado.visitas.map((t, i) => (
                            <a key={i} href={`/seguimiento/${t.TicketID}`}
                              className="bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors">
                              <p className="text-xs font-mono text-blue-400">{t.TicketID}</p>
                              <p className="text-sm font-medium text-gray-900">{t.Tienda}</p>
                              <p className="text-xs text-gray-500">{t.Cliente}</p>
                              <p className="text-xs text-gray-400">{t.Ejecutivo} · {t.Proveedor || 'Sin proveedor'}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {eventosDiaSeleccionado.habilitaciones.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">🟢 Habilitaciones</p>
                        <div className="flex flex-col gap-2">
                          {eventosDiaSeleccionado.habilitaciones.map((t, i) => (
                            <a key={i} href={`/seguimiento/${t.TicketID}`}
                              className="bg-green-50 rounded-lg px-3 py-2 hover:bg-green-100 transition-colors">
                              <p className="text-xs font-mono text-green-400">{t.TicketID}</p>
                              <p className="text-sm font-medium text-gray-900">{t.Tienda}</p>
                              <p className="text-xs text-gray-500">{t.Cliente}</p>
                              <p className="text-xs text-gray-400">{t.Ejecutivo} · {t.Proveedor || 'Sin proveedor'}{t.Turno ? ` · ${t.Turno}` : ''}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  )
}

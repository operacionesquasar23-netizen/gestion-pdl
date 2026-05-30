import { useState } from 'react'
import Head from 'next/head'

const ESTADOS = [
  { id: 'Pendiente revisión',      icon: '⏳', done: false },
  { id: 'Visita programada',       icon: '📅', done: false },
  { id: 'Visita realizada',        icon: '✅', done: false },
  { id: 'Cotización enviada',      icon: '📋', done: false },
  { id: 'Cotización aprobada',     icon: '👍', done: false },
  { id: 'Cotización rechazada',    icon: '❌', done: false },
  { id: 'En renegociación',        icon: '🔄', done: false },
  { id: 'Habilitación programada', icon: '🗓️', done: false },
  { id: 'Habilitación realizada',  icon: '🔧', done: false },
  { id: 'Evidencias recibidas',    icon: '📸', done: false },
  { id: 'Cerrado',                 icon: '🎉', done: false },
]

const ESTADOS_LINEALES = [
  'Pendiente revisión',
  'Visita programada',
  'Visita realizada',
  'Cotización enviada',
  'Cotización aprobada',
  'Habilitación programada',
  'Habilitación realizada',
  'Evidencias recibidas',
  'Cerrado',
]

export async function getServerSideProps({ params }) {
  const code = params.code?.toUpperCase()
  if (!code) return { notFound: true }

  try {
    const API_URL = "https://script.google.com/macros/s/AKfycbzL2UB7FbtEDH3i-K8qRtxh5i-whpzrISgOU4TdZ_8JAP6GvOC-epPdNzGFBlQNoYqxkQ/exec"
    const res = await fetch(`${API_URL}?sheet=Solicitudes`)
    const data = await res.json()
    const rows = data.values || []

    if (rows.length === 0) return { props: { ticket: null, historial: [], code } }

    const headers = rows[0]
    const row = rows.find((r, i) => i > 0 && r[1] === code)

    if (!row) return { props: { ticket: null, historial: [], code } }

    const ticket = {}
    headers.forEach((h, i) => { ticket[h] = row[i] || '' })

    const formatFecha = (val) => {
      if (!val) return ''
      if (val.includes('T')) {
        return new Date(val).toLocaleDateString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      }
      return val
    }

    ticket.FechaVisita = formatFecha(ticket.FechaVisita)
    ticket.FechaHabilitacion = formatFecha(ticket.FechaHabilitacion)

    // Obtener historial
    const resH = await fetch(`${API_URL}?sheet=Historial`)
    const dataH = await resH.json()
    const rowsH = dataH.values || []
    const headersH = rowsH[0] || []
    const historial = rowsH.slice(1)
      .filter(r => r[1] === code)
      .map(r => {
        const obj = {}
        headersH.forEach((h, i) => { obj[h] = r[i] || '' })
        return obj
      })

    return { props: { ticket, historial, code } }
  } catch (e) {
    console.error(e)
    return { props: { ticket: null, historial: [], code } }
  }
}

export default function Seguimiento({ ticket, historial, code }) {
  const [buscar, setBuscar] = useState(code || '')
  const [buscando, setBuscando] = useState(false)

  const handleBuscar = () => {
    if (!buscar.trim()) return
    setBuscando(true)
    window.location.href = `/seguimiento/${buscar.trim().toUpperCase()}`
  }

  const currentIdx = ticket ? ESTADOS_LINEALES.indexOf(ticket.Estado) : -1

  const files = ticket?.DatosAdjuntos
    ? ticket.DatosAdjuntos.split(',').map(f => f.trim()).filter(Boolean)
    : []

  return (
    <>
      <Head>
        <title>Seguimiento {code} · PDL</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-brand text-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-lg font-semibold">PDL — Seguimiento de Solicitud</h1>
              <p className="text-blue-200 text-xs font-mono">{code}</p>
            </div>
            <a href="/" className="ml-auto text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Buscador */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
            <p className="text-xs text-gray-400 mb-2">Buscar otra solicitud</p>
            <div className="flex gap-2">
              <input value={buscar} onChange={e => setBuscar(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                placeholder="Ej: PDL-MPQFSEL3"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleBuscar} disabled={buscando}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Buscar
              </button>
            </div>
          </div>

          {!ticket ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Solicitud no encontrada</h2>
              <p className="text-gray-500 text-sm">No encontramos ninguna solicitud con el código <strong className="font-mono">{code}</strong></p>
            </div>
          ) : (
            <>
              {/* Info del ticket */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Datos de la solicitud</span>
                  <span className="font-mono text-xs text-gray-400">{ticket.FechaRequerimiento}</span>
                </div>
                <div className="px-6 py-4 grid grid-cols-2 gap-3">
                  {[
                    ['Ejecutivo', ticket.Ejecutivo],
                    ['Cliente', ticket.Cliente],
                    ['Tienda', ticket.Tienda],
                    ['Tipo Solicitud', ticket.TipoSolicitud],
                    ['Marca', ticket.Marca],
                    ['Campaña', ticket.Campaña],
                    ['Elemento', ticket.Elemento],
                    ['COD', ticket.COD],
                  ].map(([lbl, val]) => val ? (
                    <div key={lbl}>
                      <p className="text-xs text-gray-400 mb-0.5">{lbl}</p>
                      <p className="text-sm font-medium text-gray-900">{val}</p>
                    </div>
                  ) : null)}
                  {ticket.Descripcion && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Descripción</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{ticket.Descripcion}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado actual */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estado actual</span>
                </div>
                <div className="px-6 py-5">
                  {/* Barra de progreso */}
                  <div className="flex items-start gap-0 mb-6 overflow-x-auto pb-2">
                    {ESTADOS_LINEALES.map((s, i) => {
                      const done = i < currentIdx
                      const current = i === currentIdx
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center relative min-w-0">
                          {i < ESTADOS_LINEALES.length - 1 && (
                            <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${done ? 'bg-blue-500' : 'bg-gray-100'}`} />
                          )}
                          <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${
                            done    ? 'bg-blue-500 border-blue-500 text-white' :
                            current ? 'bg-white border-blue-500 text-blue-700' :
                                      'bg-white border-gray-200 text-gray-300'
                          }`}>
                            {done ? '✓' : i + 1}
                          </div>
                          <p className={`text-center mt-1.5 text-xs leading-tight px-0.5 ${
                            current ? 'text-blue-700 font-semibold' :
                            done    ? 'text-gray-500' : 'text-gray-300'
                          }`} style={{fontSize:'10px'}}>{s}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Estado destacado */}
                  <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-blue-600 mb-1">Estado actual</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {ESTADOS.find(e => e.id === ticket.Estado)?.icon} {ticket.Estado}
                    </p>
                  </div>

                  {/* Info operaciones */}
                  {(ticket.Proveedor || ticket.FechaVisita || ticket.FechaHabilitacion || ticket.Turno) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {ticket.Proveedor && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Proveedor asignado</p>
                          <p className="text-sm font-medium">{ticket.Proveedor}</p>
                        </div>
                      )}
                      {ticket.FechaVisita && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Fecha de visita</p>
                          <p className="text-sm font-medium">{ticket.FechaVisita}</p>
                        </div>
                      )}
                      {ticket.FechaHabilitacion && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Fecha de habilitación</p>
                          <p className="text-sm font-medium">{ticket.FechaHabilitacion}</p>
                        </div>
                      )}
                      {ticket.Turno && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Turno</p>
                          <p className="text-sm font-medium">{ticket.Turno}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Historial */}
              {historial.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Historial de actualizaciones</span>
                  </div>
                  <div className="px-6 py-4 flex flex-col gap-0">
                    {historial.map((h, i) => {
                      const estado = ESTADOS.find(e => e.id === h.Estado)
                      return (
                        <div key={i} className="flex gap-3 pb-4 relative">
                          {i < historial.length - 1 && <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-100" />}
                          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            {estado?.icon || '•'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{h.Estado}</p>
                            <p className="text-xs text-gray-400">{h.Fecha}</p>
                            {h.Observaciones && <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">{h.Observaciones}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Archivos */}
              {files.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50">
                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Archivos adjuntos</span>
                  </div>
                  <div className="px-6 py-4 flex flex-col gap-2">
                    {files.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                        📎 <span className="flex-1 truncate">Archivo {i + 1}</span>
                        <span className="text-gray-400 text-xs">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 pb-4">
                ¿Consultas? Contacta a tu coordinador con el código <strong className="font-mono">{code}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

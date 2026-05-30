import { useState, useEffect } from 'react'
import Head from 'next/head'

const ESTADOS = [
  { id: 'Pendiente revisión',      color: 'bg-amber-100 text-amber-800' },
  { id: 'Visita programada',       color: 'bg-blue-100 text-blue-800' },
  { id: 'Visita realizada',        color: 'bg-indigo-100 text-indigo-800' },
  { id: 'Cotización enviada',      color: 'bg-orange-100 text-orange-800' },
  { id: 'Cotización aprobada',     color: 'bg-teal-100 text-teal-800' },
  { id: 'Cotización rechazada',    color: 'bg-red-100 text-red-800' },
  { id: 'En renegociación',        color: 'bg-purple-100 text-purple-800' },
  { id: 'Habilitación programada', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'Habilitación realizada',  color: 'bg-lime-100 text-lime-800' },
  { id: 'Evidencias recibidas',    color: 'bg-emerald-100 text-emerald-800' },
  { id: 'Cerrado',                 color: 'bg-green-100 text-green-800' },
]

const ADMIN_PIN = '1234'

function Badge({ estado }) {
  const e = ESTADOS.find(x => x.id === estado) || { color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${e.color}`}>
      {estado}
    </span>
  )
}

function Modal({ ticket, onClose, onUpdate }) {
  const [nuevoEstado, setNuevoEstado] = useState(ticket.Estado || '')
  const [observaciones, setObservaciones] = useState(ticket.Observaciones || '')
  const [prioridad, setPrioridad] = useState(ticket.Prioridad || '')
  const [responsable, setResponsable] = useState(ticket.Responsable || '')
  const [proveedor, setProveedor] = useState(ticket.Proveedor || '')
  const [fechaVisita, setFechaVisita] = useState(
    ticket.FechaVisita ? ticket.FechaVisita.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [fechaHabilitacion, setFechaHabilitacion] = useState(
    ticket.FechaHabilitacion ? ticket.FechaHabilitacion.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [turno, setTurno] = useState(ticket.Turno || '')
  const [saving, setSaving] = useState(false)
  const [evidencias, setEvidencias] = useState([])

  const handleSave = async () => {
    setSaving(true)
    
    // Subir evidencias si hay
    let evidenciaLinks = ticket.Evidencias || ''
    if (evidencias.length > 0) {
      const nuevosLinks = await Promise.all(evidencias.map(file =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async () => {
            const res = await fetch('/api/admin/subirevidencia', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ticketId: ticket.TicketID,
                fileName: file.name,
                mimeType: file.type,
                data: reader.result.split(',')[1]
              })
            })
            const data = await res.json()
            resolve(data.url || '')
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      ))
      const links = nuevosLinks.filter(Boolean).join(', ')
      evidenciaLinks = evidenciaLinks ? `${evidenciaLinks}, ${links}` : links
    }

    await onUpdate(ticket, {
      Estado: nuevoEstado,
      Observaciones: observaciones,
      Prioridad: prioridad,
      Responsable: responsable,
      FechaVisita: fechaVisita,
      FechaHabilitacion: fechaHabilitacion,
      Turno: turno,
      Proveedor: proveedor,
      Evidencias: evidenciaLinks
    })
    setSaving(false)
    onClose()
  }

  const files = ticket.DatosAdjuntos
    ? ticket.DatosAdjuntos.split(',').map(f => f.trim()).filter(Boolean)
    : []

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className="font-mono text-xs text-gray-400">{ticket.TicketID}</span>
            <h2 className="text-base font-semibold text-gray-900">{ticket.Tienda} — {ticket.Cliente}</h2>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Asunto', ticket.Asunto],
              ['Ejecutivo', ticket.Ejecutivo],
              ['Cliente', ticket.Cliente],
              ['Tienda', ticket.Tienda],
              ['Tipo Solicitud', ticket.TipoSolicitud],
              ['Marca', ticket.Marca],
              ['Campaña', ticket.Campaña],
              ['Elemento', ticket.Elemento],
              ['COD', ticket.COD],
              ['Fecha Requerimiento', ticket.FechaRequerimiento],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <p className="text-xs text-gray-400 mb-0.5">{lbl}</p>
                <p className="text-sm text-gray-900">{val || '—'}</p>
              </div>
            ))}
            {ticket.Descripcion && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Descripción</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{ticket.Descripcion}</p>
              </div>
            )}
          </div>

          {/* Gestión operaciones */}
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Gestión de Operaciones</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado</label>
                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ESTADOS.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Prioridad</label>
                <select value={prioridad} onChange={e => setPrioridad(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin asignar</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Responsable</label>
                <input value={responsable} onChange={e => setResponsable(e.target.value)}
                  placeholder="Nombre del responsable"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Proveedor</label>
                <select value={proveedor} onChange={e => setProveedor(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin asignar</option>
                  <option value="CARZE">CARZE</option>
                  <option value="MPESSAC">MPESSAC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha Visita</label>
                <input type="date" value={fechaVisita} onChange={e => setFechaVisita(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha Habilitación</label>
                <input type="date" value={fechaHabilitacion} onChange={e => setFechaHabilitacion(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Turno</label>
                <select value={turno} onChange={e => setTurno(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sin asignar</option>
                  <option value="En apertura">En apertura</option>
                  <option value="Durante el día">Durante el día</option>
                  <option value="Al cierre de tienda">Al cierre de tienda</option>
                  <option value="En amanecida">En amanecida</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Observaciones internas</label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  rows={3} placeholder="Notas internas del equipo de operaciones..."
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {saving ? 'Guardando...' : '✓ Actualizar solicitud'}
            </button>
          </div>

          {/* Archivos */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencias del proveedor</p>
            <input type="file" multiple accept="image/*,.pdf"
              onChange={e => setEvidencias(Array.from(e.target.files))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {evidencias.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{evidencias.length} archivo(s) seleccionado(s)</p>
            )}
          </div>
            {files.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Archivos adjuntos</p>
                <div className="flex flex-col gap-2">
                  {files.map((url, i) => {
                    const isImage = url.includes('drive.google.com') || url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                    return isImage ? (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={`/api/imagen?url=${encodeURIComponent(url)}`} alt={`Archivo ${i + 1}`}
                          className="w-full rounded-lg border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer" />
                      </a>
                    ) : (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                        📎 <span className="flex-1 truncate">Archivo {i + 1}</span>
                        <span className="text-gray-400 text-xs">↗</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {(ticket.Evidencias || evidenciaLinks) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencias del proveedor</p>
                <div className="flex flex-col gap-2">
                  {(ticket.Evidencias || evidenciaLinks).split(',').map((url, i) => {
                    url = url.trim()
                    if (!url) return null
                    const isImage = url.includes('drive.google.com') || url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                    return isImage ? (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={`/api/imagen?url=${encodeURIComponent(url)}`} alt={`Evidencia ${i + 1}`}
                          className="w-full rounded-lg border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer" />
                      </a>
                    ) : (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                        📎 <span className="flex-1 truncate">Evidencia {i + 1}</span>
                        <span className="text-gray-400 text-xs">↗</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
              <div className="flex flex-col gap-2">
                {files.map((url, i) => {
                  const isImage = url.includes('uc?export=view') || url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                  return isImage ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={`/api/imagen?url=${encodeURIComponent(url)}`} alt={`Imagen ${i + 1}`}
                        className="w-full rounded-lg border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer" />
                    </a>
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                      📎 <span className="flex-1 truncate">Archivo {i + 1}</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Link seguimiento */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-xs text-gray-400 flex-1 truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/seguimiento/${ticket.TicketID}` : ''}
            </span>
            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/seguimiento/${ticket.TicketID}`)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
              Copiar link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(false)
  const [pinErr, setPinErr] = useState('')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [buscar, setBuscar] = useState('')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const checkPin = () => {
    if (pin === ADMIN_PIN) { setAuth(true); setPinErr('') }
    else setPinErr('PIN incorrecto')
  }

  useEffect(() => {
    if (!auth) return
    fetchTickets()
  }, [auth])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tickets')
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleUpdate = async (ticket, updates) => {
    setSaving(true)
    try {
      await fetch('/api/admin/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.TicketID, updates })
      })
      await fetchTickets()
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  if (!auth) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
        <span className="text-4xl mb-4 block">🔐</span>
        <h1 className="text-xl font-semibold mb-1">Panel de Administración</h1>
        <p className="text-gray-400 text-sm mb-6">Ingresa el PIN para acceder</p>
        <input type="password" value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPin()}
          placeholder="PIN"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
        {pinErr && <p className="text-red-500 text-sm mb-3">{pinErr}</p>}
        <button onClick={checkPin}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          Entrar
        </button>
      </div>
    </div>
  )

  const filtered = tickets.filter(t => {
    const matchE = filtroEstado === 'Todos' || t.Estado === filtroEstado
    const q = buscar.toLowerCase()
    const matchQ = !q || t.Cliente?.toLowerCase().includes(q) || t.Tienda?.toLowerCase().includes(q) || t.TicketID?.toLowerCase().includes(q) || t.Ejecutivo?.toLowerCase().includes(q)
    return matchE && matchQ
  })

  const stats = {
    total: tickets.length,
    pendiente: tickets.filter(t => t.Estado === 'Pendiente revisión').length,
    proceso: tickets.filter(t => !['Pendiente revisión','Servicio realizado','Cancelado'].includes(t.Estado)).length,
    completado: tickets.filter(t => t.Estado === 'Servicio realizado').length,
  }

  return (
    <>
      <Head><title>Admin · PDL</title></Head>
      <div className="min-h-screen bg-slate-50">
        {/* Topbar */}
        <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="font-semibold">PDL — Panel de Administración</h1>
              <p className="text-blue-200 text-xs">Gestión de habilitaciones de puntos de luz</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchTickets}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              🔄 Actualizar
            </button>
            <a href="/" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
            <a href="/nueva-solicitud" target="_blank"
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              + Nueva solicitud
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', val: stats.total, color: 'bg-blue-50 text-blue-800' },
              { label: 'Pendientes', val: stats.pendiente, color: 'bg-amber-50 text-amber-800' },
              { label: 'En proceso', val: stats.proceso, color: 'bg-indigo-50 text-indigo-800' },
              { label: 'Completados', val: stats.completado, color: 'bg-green-50 text-green-800' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl px-4 py-3 text-center`}>
                <p className="text-2xl font-semibold">{s.val}</p>
                <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-3 flex-wrap">
            <input value={buscar} onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar por cliente, tienda, ejecutivo, código..."
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-80" />
            <div className="flex gap-2 flex-wrap">
              {['Todos', ...ESTADOS.map(s => s.id)].map(s => (
                <button key={s} onClick={() => setFiltroEstado(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filtroEstado === s
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-gray-400">Cargando solicitudes...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p>Sin solicitudes que mostrar</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Ticket', 'Asunto', 'Cliente','Tienda','Ejecutivo','Tipo','Estado','Fecha','Archivos',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.TicketID}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{t.Asunto}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{t.Cliente}</td>
                      <td className="px-4 py-3 text-gray-700">{t.Tienda}</td>
                      <td className="px-4 py-3 text-gray-700">{t.Ejecutivo}</td>
                      <td className="px-4 py-3 text-gray-700">{t.TipoSolicitud}</td>
                      <td className="px-4 py-3"><Badge estado={t.Estado} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{t.FechaRequerimiento}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {t.DatosAdjuntos ? `📎 ${t.DatosAdjuntos.split(',').filter(Boolean).length}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(t)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <Modal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}

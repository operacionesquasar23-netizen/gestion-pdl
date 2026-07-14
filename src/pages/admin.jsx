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
  { id: 'Rechazado por tienda',    color: 'bg-red-100 text-red-800' },
  { id: 'Habilitación reprogramada',color: 'bg-pink-100 text-pink-800' },
  { id: 'Habilitación realizada',  color: 'bg-lime-100 text-lime-800' },
  { id: 'Evidencias recibidas',    color: 'bg-emerald-100 text-emerald-800' },
  { id: 'OC solicitada',              color: 'bg-yellow-100 text-yellow-800' },
  { id: 'AC y OC entregadas',    color: 'bg-violet-100 text-violet-800' },
  { id: 'Cerrado',                 color: 'bg-green-100 text-green-800' },
]

const ADMIN_PIN = 'op01'

function diasEnEstado(fechaUltimoEstado) {
  if (!fechaUltimoEstado) return null
  const parts = fechaUltimoEstado.split('/').map(p => p.trim())
  if (parts.length < 3) return null
  const day = parseInt(parts[0])
  const month = parseInt(parts[1]) - 1
  const year = parseInt(parts[2].split(',')[0].split(' ')[0])
  const fecha = new Date(year, month, day)
  const hoy = new Date()
  const diff = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24))
  return diff
}

function Badge({ estado }) {
  const e = ESTADOS.find(x => x.id === estado) || { color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${e.color}`}>
      {estado}
    </span>
  )
}

function FileItem({ url, label }) {
  const isImage = url.includes('drive.google.com') || url.match(/\.(jpg|jpeg|png|gif|webp)/i)
  return isImage ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={`/api/imagen?url=${encodeURIComponent(url)}`}
        alt={label}
        className="w-full rounded-lg border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer"
      />
    </a>
  ) : (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
      📎 <span className="flex-1 truncate">{label}</span>
      <span className="text-gray-400 text-xs">↗</span>
    </a>
  )
}

// Compresión conservadora: solo reduce imágenes pesadas, mantiene buena calidad
// para que sirvan como evidencia. No toca PDFs ni archivos ya livianos.
async function comprimirImagen(file, maxWidth = 2400, calidad = 0.88) {
  if (!file.type.startsWith('image/')) return file // no tocar PDFs

  if (file.size < 1.5 * 1024 * 1024) return file // ya es liviano, no tocar

  return new Promise((resolve) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (!blob || blob.size >= file.size) return resolve(file) // si no mejora, usar original
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        }, 'image/jpeg', calidad)
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

// Sube un archivo individual y notifica progreso al terminar (éxito o error)
function subirArchivo(file, ticketId, prefijo, onProgreso) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/subirevidencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            fileName: `${prefijo}${file.name}`,
            mimeType: file.type,
            data: reader.result.split(',')[1]
          })
        })
        const data = await res.json()
        onProgreso()
        resolve(data.url || '')
      } catch (err) {
        console.error('Error subiendo', file.name, err)
        onProgreso()
        resolve('')
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function Modal({ ticket, onClose, onUpdate }) {
  const [nuevoEstado, setNuevoEstado] = useState(ticket.Estado || '')
  const [observaciones, setObservaciones] = useState(ticket.Observaciones || '')
  const [prioridad, setPrioridad] = useState(ticket.Prioridad || '')
  const [responsable, setResponsable] = useState(ticket.Responsable || '')
  const [proveedor, setProveedor] = useState(ticket.Proveedor || '')
  const [nroCotizacionVisita, setNroCotizacionVisita] = useState(ticket.NroCotizacionVisita || '')
  const [montoCotizacionVisita, setMontoCotizacionVisita] = useState(ticket.MontoCotizacionVisita || '')
  const [nroCotizacionHabilitacion, setNroCotizacionHabilitacion] = useState(ticket.NroCotizacionHabilitacion || '')
  const [montoCotizacionHabilitacion, setMontoCotizacionHabilitacion] = useState(ticket.MontoCotizacionHabilitacion || '')
  const [fechaVisita, setFechaVisita] = useState(
    ticket.FechaVisita ? ticket.FechaVisita.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [fechaHabilitacion, setFechaHabilitacion] = useState(
    ticket.FechaHabilitacion ? ticket.FechaHabilitacion.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [turno, setTurno] = useState(ticket.Turno || '')
  const [saving, setSaving] = useState(false)
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })
  const [evidencias, setEvidencias] = useState([])
  const [evidenciaLinks, setEvidenciaLinks] = useState(ticket.Evidencias || '')
  const [fechaFinalizacionVisita, setFechaFinalizacionVisita] = useState(
  ticket.FechaFinalizacionVisita ? ticket.FechaFinalizacionVisita.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [nroOrdenCompraVisita, setNroOrdenCompraVisita] = useState(ticket.NroOrdenCompraVisita || '')
  const [fechaFinalizacionHabilitacion, setFechaFinalizacionHabilitacion] = useState(
  ticket.FechaFinalizacionHabilitacion ? ticket.FechaFinalizacionHabilitacion.split('T')[0].split('/').reverse().join('-') : ''
  )
  const [nroOrdenCompraHabilitacion, setNroOrdenCompraHabilitacion] = useState(ticket.NroOrdenCompraHabilitacion || '')
  const [docsProveedor, setDocsProveedor] = useState(ticket.DocsProveedor || '')
  const [nuevosDocsProveedor, setNuevosDocsProveedor] = useState([])
  const [nuevosArchivosEjecutivo, setNuevosArchivosEjecutivo] = useState([])
  const [datosAdjuntos, setDatosAdjuntos] = useState(ticket.DatosAdjuntos || '')

  const files = datosAdjuntos
    ? datosAdjuntos.split(',').map(f => f.trim()).filter(Boolean)
    : []

  const evidenciaFiles = evidenciaLinks
    ? evidenciaLinks.split(',').map(f => f.trim()).filter(Boolean)
    : []

  const handleSave = async () => {
    setSaving(true)

    try {
      const totalArchivos = evidencias.length + nuevosDocsProveedor.length + nuevosArchivosEjecutivo.length
      let subidos = 0
      setProgreso({ actual: 0, total: totalArchivos })

      const marcarProgreso = () => {
        subidos += 1
        setProgreso({ actual: subidos, total: totalArchivos })
      }

      // Comprimir en paralelo (rápido, solo afecta fotos pesadas)
      const [evidenciasComprimidas, docsComprimidos, ejecutivoComprimidos] = await Promise.all([
        Promise.all(evidencias.map(f => comprimirImagen(f))),
        Promise.all(nuevosDocsProveedor.map(f => comprimirImagen(f))),
        Promise.all(nuevosArchivosEjecutivo.map(f => comprimirImagen(f))),
      ])

      // Subir las 3 categorías EN PARALELO entre sí (no en secuencia)
      const [linksEvidencias, linksDocs, linksEjecutivo] = await Promise.all([
        Promise.all(evidenciasComprimidas.map(f => subirArchivo(f, ticket.TicketID, '', marcarProgreso))),
        Promise.all(docsComprimidos.map(f => subirArchivo(f, ticket.TicketID, 'doc_', marcarProgreso))),
        Promise.all(ejecutivoComprimidos.map(f => subirArchivo(f, ticket.TicketID, '', marcarProgreso))),
      ])

      const newEvidenciaLinks = [evidenciaLinks, linksEvidencias.filter(Boolean).join(', ')]
        .filter(Boolean).join(', ')
      const newDocsProveedor = [docsProveedor, linksDocs.filter(Boolean).join(', ')]
        .filter(Boolean).join(', ')
      const newDatosAdjuntos = [datosAdjuntos, linksEjecutivo.filter(Boolean).join(', ')]
        .filter(Boolean).join(', ')

      setEvidenciaLinks(newEvidenciaLinks)
      setDocsProveedor(newDocsProveedor)
      setDatosAdjuntos(newDatosAdjuntos)

      await onUpdate(ticket, {
        Estado: nuevoEstado,
        Observaciones: observaciones,
        Prioridad: prioridad,
        Responsable: responsable,
        FechaVisita: fechaVisita,
        FechaHabilitacion: fechaHabilitacion,
        Turno: turno,
        Proveedor: proveedor,
        NroCotizacionVisita: nroCotizacionVisita,
        MontoCotizacionVisita: montoCotizacionVisita,
        NroCotizacionHabilitacion: nroCotizacionHabilitacion,
        MontoCotizacionHabilitacion: montoCotizacionHabilitacion,
        Evidencias: newEvidenciaLinks,
        FechaFinalizacionVisita: fechaFinalizacionVisita,
        NroOrdenCompraVisita: nroOrdenCompraVisita,
        FechaFinalizacionHabilitacion: fechaFinalizacionHabilitacion,
        NroOrdenCompraHabilitacion: nroOrdenCompraHabilitacion,
        DocsProveedor: newDocsProveedor,
        DatosAdjuntos: newDatosAdjuntos,
      })
    } catch (err) {
      console.error('Error al guardar:', err)
      alert('Hubo un error guardando los cambios. Revisa la consola.')
    } finally {
      setSaving(false)
      setProgreso({ actual: 0, total: 0 })
      onClose()
    }
  }

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
              ['Fecha Finalización Visita', ticket.FechaFinalizacionVisita ? ticket.FechaFinalizacionVisita.split('T')[0].split('/').slice(0,3).join('/') : '—'],
              ['N° OC Visita', ticket.NroOrdenCompraVisita],
              ['Fecha Finalización Habilitación', ticket.FechaFinalizacionHabilitacion ? ticket.FechaFinalizacionHabilitacion.split('T')[0].split('/').slice(0,3).join('/') : '—'],
              ['N° OC Habilitación', ticket.NroOrdenCompraHabilitacion],
              ['N° Cotización Visita', ticket.NroCotizacionVisita],
              ['Monto Cotización Visita', ticket.MontoCotizacionVisita ? `S/ ${ticket.MontoCotizacionVisita}` : '—'],
              ['N° Cotización Habilitación', ticket.NroCotizacionHabilitacion],
              ['Monto Cotización Habilitación', ticket.MontoCotizacionHabilitacion ? `S/ ${ticket.MontoCotizacionHabilitacion}` : '—'],
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
                <label className="block text-xs text-gray-600 mb-1">N° Cotización Visita</label>
                <input value={nroCotizacionVisita} onChange={e => setNroCotizacionVisita(e.target.value)}
                  placeholder="Ej: COT-V-001"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monto Cotización Visita (S/)</label>
                <input value={montoCotizacionVisita} onChange={e => setMontoCotizacionVisita(e.target.value)}
                  type="number" placeholder="Ej: 500"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">N° Cotización Habilitación</label>
                <input value={nroCotizacionHabilitacion} onChange={e => setNroCotizacionHabilitacion(e.target.value)}
                  placeholder="Ej: COT-H-001"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Monto Cotización Habilitación (S/)</label>
                <input value={montoCotizacionHabilitacion} onChange={e => setMontoCotizacionHabilitacion(e.target.value)}
                  type="number" placeholder="Ej: 2500"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                <label className="block text-xs text-gray-600 mb-1">Fecha Finalización Visita</label>
                <input type="date" value={fechaFinalizacionVisita} onChange={e => setFechaFinalizacionVisita(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha Finalización Habilitación</label>
                <input type="date" value={fechaFinalizacionHabilitacion} onChange={e => setFechaFinalizacionHabilitacion(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">N° OC Visita</label>
                <input value={nroOrdenCompraVisita} onChange={e => setNroOrdenCompraVisita(e.target.value)}
                  placeholder="Ej: OC-V-2026-001"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">N° OC Habilitación</label>
                <input value={nroOrdenCompraHabilitacion} onChange={e => setNroOrdenCompraHabilitacion(e.target.value)}
                  placeholder="Ej: OC-H-2026-001"
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

            {/* Barra de progreso de subida de archivos */}
            {saving && progreso.total > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>Subiendo archivos...</span>
                  <span className="font-mono">{progreso.actual}/{progreso.total}</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {saving
                ? (progreso.total > 0
                    ? `Subiendo archivos... ${progreso.actual}/${progreso.total}`
                    : 'Guardando...')
                : '✓ Actualizar solicitud'}
            </button>
          </div>

          {/* Archivos del ejecutivo (olvidados) */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Agregar archivo del ejecutivo</p>
            <p className="text-xs text-gray-400 mb-2">Usa esto si el ejecutivo olvidó adjuntar algo al crear la solicitud.</p>
            <input type="file" multiple accept="image/*,.pdf"
              onChange={e => setNuevosArchivosEjecutivo(Array.from(e.target.files))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {nuevosArchivosEjecutivo.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{nuevosArchivosEjecutivo.length} archivo(s) seleccionado(s)</p>
            )}
          </div>

          {/* Subir evidencias */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Subir evidencias del proveedor</p>
            <input type="file" multiple accept="image/*,.pdf"
              onChange={e => setEvidencias(Array.from(e.target.files))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {evidencias.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{evidencias.length} archivo(s) seleccionado(s)</p>
            )}
          </div>

          {/* Archivos adjuntos del ejecutivo */}
          {files.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Archivos adjuntos</p>
              <div className="flex flex-col gap-2">
                {files.map((url, i) => (
                  <FileItem key={i} url={url} label={`Archivo ${i + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* Documentos del proveedor */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Documentos del proveedor</p>
            <input type="file" multiple accept="image/*,.pdf"
              onChange={e => setNuevosDocsProveedor(Array.from(e.target.files))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {nuevosDocsProveedor.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{nuevosDocsProveedor.length} archivo(s) seleccionado(s)</p>
            )}
            {docsProveedor && (
              <div className="flex flex-col gap-2 mt-2">
                {docsProveedor.split(',').map((url, i) => {
                  url = url.trim()
                  if (!url) return null
                  const isImage = url.includes('drive.google.com') || url.match(/\.(jpg|jpeg|png|gif|webp)/i)
                  return isImage ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={`/api/imagen?url=${encodeURIComponent(url)}`} alt={`Doc ${i + 1}`}
                        className="w-full rounded-lg border border-gray-100 hover:opacity-90 transition-opacity cursor-pointer" />
                    </a>
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 hover:text-blue-700 transition-colors">
                      📎 <span className="flex-1 truncate">Documento {i + 1}</span>
                      <span className="text-gray-400 text-xs">↗</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Evidencias del proveedor */}
          {evidenciaFiles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Evidencias del proveedor</p>
              <div className="flex flex-col gap-2">
                {evidenciaFiles.map((url, i) => (
                  <FileItem key={i} url={url} label={`Evidencia ${i + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* Generar Acta de Conformidad */}
          {ticket.NroOrdenCompraVisita && (
            <button
              onClick={() => window.open(`/acta?ticketId=${ticket.TicketID}&tipo=visita`, '_blank')}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
              📄 Generar Acta de Conformidad — Visita
            </button>
          )}
          {ticket.NroOrdenCompraHabilitacion && (
            <button
              onClick={() => window.open(`/acta?ticketId=${ticket.TicketID}&tipo=habilitacion`, '_blank')}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2">
              📄 Generar Acta de Conformidad — Habilitación
            </button>
          )}

          {/* Correo de status */}
          <a href={`mailto:?subject=${encodeURIComponent(ticket.Asunto)}&body=${encodeURIComponent('Buen día estimado,\n\nSu requerimiento se encuentra actualmente en: "' + nuevoEstado + '"\n\nPuede ver el detalle completo en:\nhttps://gestion-pdl.vercel.app/seguimiento/' + ticket.TicketID)}`} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">📧 Enviar correo de status</a>

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
          className="w-full bg-brand text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          Entrar
        </button>
      </div>
    </div>
  )

  const filtered = tickets.filter(t => {
    const matchE = filtroEstado === 'Todos' || t.Estado === filtroEstado
    const q = buscar.toLowerCase()
    const matchQ = !q || t.Cliente?.toLowerCase().includes(q) || t.Tienda?.toLowerCase().includes(q) || t.TicketID?.toLowerCase().includes(q) || t.Ejecutivo?.toLowerCase().includes(q) || t.Asunto?.toLowerCase().includes(q)
    return matchE && matchQ
  })

  const stats = {
    total: tickets.length,
    pendiente: tickets.filter(t => t.Estado === 'Pendiente revisión').length,
    proceso: tickets.filter(t => !['Pendiente revisión','Cerrado','Cotización rechazada'].includes(t.Estado)).length,
    completado: tickets.filter(t => t.Estado === 'Cerrado').length,
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
            <a href="/" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
            <a href="/configuracion" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ⚙️ Configuración
            </a>
            <button onClick={fetchTickets}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              🔄 Actualizar
            </button>
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
              placeholder="Buscar por cliente, tienda, ejecutivo, código, asunto..."
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
                    {['Ticket','Asunto','Cliente','Tienda','Ejecutivo','Tipo','Estado','Días','Fecha','Archivos',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.TicketID}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{t.Asunto}</td>
                      <td className="px-4 py-3 text-gray-700">{t.Cliente}</td>
                      <td className="px-4 py-3 text-gray-700">{t.Tienda}</td>
                      <td className="px-4 py-3 text-gray-700">{t.Ejecutivo}</td>
                      <td className="px-4 py-3 text-gray-700">{t.TipoSolicitud}</td>
                      <td className="px-4 py-3"><Badge estado={t.Estado} /></td>
                      <td className="px-4 py-3">
                        {(() => {
                          const dias = diasEnEstado(t.FechaUltimoEstado)
                          if (dias === null) return <span className="text-gray-300">—</span>
                          const color = dias > 7 ? 'text-red-600 font-bold' : dias > 3 ? 'text-amber-500 font-medium' : 'text-green-600'
                          return <span className={`text-xs ${color}`}>{dias}d</span>
                        })()}
                      </td>
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

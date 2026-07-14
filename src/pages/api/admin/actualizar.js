import { getSheet } from '../../../lib/supabase'

const API_URL = "https://script.google.com/macros/s/AKfycbwLbjC8aOQ9sZ7x0_CLAySNOx5ib7xu65R2KsQlkK-0hIKZIZ4Y1_g_Ggt3rASxd6-U/exec"

function formatearFecha(str) {
  if (!str) return ''
  if (str.includes('T')) {
    const d = new Date(str)
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
  }
  if (str.includes('-') && str.length === 10) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }
  return str
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { ticketId, updates } = req.body
    if (!ticketId) return res.status(400).json({ error: 'Falta ticketId' })

    const now = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    if (updates.Estado === 'Cerrado') {
      updates.FechaCierre = now
    }
    if (updates.Estado) {
      updates.FechaUltimoEstado = now
    }

    // Formatear fechas
    const camposFecha = ['FechaVisita', 'FechaHabilitacion', 'FechaFinalizacionVisita', 'FechaFinalizacionHabilitacion']
    camposFecha.forEach(campo => {
      if (updates[campo]) updates[campo] = formatearFecha(updates[campo])
    })

    const rows = await getSheet('Solicitudes')
    if (rows.length === 0) return res.status(404).json({ error: 'No hay datos' })

    const headers = rows[0]
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === ticketId)

    if (rowIndex === -1) return res.status(404).json({ error: 'Ticket no encontrado' })

    const estadoColIndex = headers.indexOf('Estado')
    const estadoAnterior = rows[rowIndex][estadoColIndex]
    const row = [...rows[rowIndex]]
    Object.entries(updates).forEach(([key, value]) => {
      const colIndex = headers.indexOf(key)
      if (colIndex !== -1) row[colIndex] = value
    })

    // ⬇️ ESTO ES LO QUE FALTA: guardar la fila actualizada en Solicitudes
    const updateResp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        sheet: 'Solicitudes',
        row: rowIndex + 1,
        values: row
      })
    })

    const updateResult = await updateResp.json()
    if (!updateResult.ok) {
      console.error('Update sheet failed:', updateResult)
      return res.status(502).json({ error: 'No se pudo actualizar la hoja' })
    }

    // Historial: solo si el estado realmente cambió
    if (updates.Estado && updates.Estado !== estadoAnterior) {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append',
          sheet: 'Historial',
          values: [Date.now(), ticketId, updates.Estado, updates.Observaciones || '', now]
        })
      })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al actualizar' })
  }
}
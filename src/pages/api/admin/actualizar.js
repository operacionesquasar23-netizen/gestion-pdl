import { getSheet } from '../../../lib/supabase'

const API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { ticketId, updates } = req.body
    if (!ticketId) return res.status(400).json({ error: 'Falta ticketId' })

    // Obtener todas las filas para encontrar la fila del ticket
    const rows = await getSheet('Solicitudes')
    if (rows.length === 0) return res.status(404).json({ error: 'No hay datos' })

    const headers = rows[0]
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === ticketId)

    // Si el estado es Cerrado, agregar FechaCierre automáticamente
    if (updates.Estado === 'Cerrado') {
      const now2 = new Date().toLocaleDateString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
      updates.FechaCierre = now2
    }

    if (rowIndex === -1) return res.status(404).json({ error: 'Ticket no encontrado' })

    // Actualizar los campos correspondientes
    const row = [...rows[rowIndex]]
    Object.entries(updates).forEach(([key, value]) => {
      const colIndex = headers.indexOf(key)
      if (colIndex !== -1) row[colIndex] = value
    })

    // Enviar actualización al Apps Script
    const updateRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        sheet: 'Solicitudes',
        row: rowIndex + 1, // +1 porque Sheets es 1-indexed
        values: row
      })
    })

    const data = await updateRes.json()

    // Registrar en historial
    const now = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        sheet: 'Historial',
        values: [Date.now(), ticketId, updates.Estado || '', updates.Observaciones || '', now]
      })
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al actualizar' })
  }
}

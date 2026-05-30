import { getSheet } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const rows = await getSheet('Solicitudes')
    if (rows.length === 0) return res.status(200).json({ tickets: [] })

    const headers = rows[0]
    const tickets = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] || '' })
      return obj
    }).reverse() // más recientes primero

    return res.status(200).json({ tickets })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al obtener tickets' })
  }
}

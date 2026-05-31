const API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { cod } = req.query
    if (!cod) return res.status(400).json({ error: 'Falta COD' })

    const response = await fetch(`${API_URL}?sheet=Solicitudes`)
    const data = await response.json()
    const rows = data.values || []

    if (rows.length === 0) return res.status(200).json({ tickets: [] })

    const headers = rows[0]
    const codIndex = headers.indexOf('COD')

    const tickets = rows.slice(1)
      .filter(row => row[codIndex]?.toString().toLowerCase() === cod.toLowerCase())
      .map(row => {
        const obj = {}
        headers.forEach((h, i) => { obj[h] = row[i] || '' })
        return obj
      })

    return res.status(200).json({ tickets })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al buscar' })
  }
}
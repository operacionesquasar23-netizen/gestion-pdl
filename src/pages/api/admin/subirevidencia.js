const API_URL = "https://script.google.com/macros/s/AKfycbzL2UB7FbtEDH3i-K8qRtxh5i-whpzrISgOU4TdZ_8JAP6GvOC-epPdNzGFBlQNoYqxkQ/exec"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { ticketId, fileName, mimeType, data } = req.body

    const uploadRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'uploadFile',
        ticketId,
        fileName: `evidencia_${fileName}`,
        mimeType,
        fileData: data
      })
    })

    const result = await uploadRes.json()
    return res.status(200).json({ url: result.url || '' })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error al subir evidencia' })
  }
}

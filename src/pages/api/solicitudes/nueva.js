import { appendRow, uploadFile } from '../../../lib/supabase'
import { generateCode } from '../../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { cliente, tienda, ejecutivo, tipoSolicitud, marca, campana, elemento, cod, descripcion, files, asunto } = req.body
    console.log('files recibidos en API:', req.body.files ? req.body.files.length : 'ninguno')

    if (!cliente || !tienda || !ejecutivo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    const code = generateCode()
    const now = new Date().toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

    // Subir archivos a Google Drive
    let fileLinks = ''
    let imageLinks = ''
    if (files && files.length > 0) {
      const urls = []
      const images = []
      for (const file of files) {
        const result = await uploadFile(code, file.name, file.mimeType, file.data)
        if (result?.url) {
          urls.push(result.url)
          if (result.isImage) images.push(result.url)
        }
      }
      fileLinks = urls.join(', ')
      imageLinks = images.join(', ')
    }

    await appendRow('Solicitudes', [
      Date.now(),           // ID
      code,                 // TicketID
      now,                  // FechaRequerimiento
      asunto,               // Asunto
      cliente,              // Cliente
      cod || '',            // COD
      marca || '',          // Marca
      campana || '',        // Campaña
      elemento || '',       // Elemento
      tienda,               // Tienda
      tipoSolicitud || '',  // TipoSolicitud
      descripcion || '',    // Descripcion
      ejecutivo,            // Ejecutivo
      'Pendiente revisión', // Estado
      '',                   // Proveedor
      '',                   // FechaVisita
      '',                   // FechaHabilitacion
      '',                   // Turno
      '',                   // Prioridad
      '',                   // Observaciones
      '',                   // FechaCierre
      '',                   // Responsable
      fileLinks,            // DatosAdjuntos
      imageLinks            // ImageLinks
    ])

    await appendRow('Historial', [
      Date.now(),
      code,
      'Pendiente revisión',
      'Solicitud recibida',
      now
    ])

    return res.status(200).json({ code })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
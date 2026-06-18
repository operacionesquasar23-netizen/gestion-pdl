//import { supabaseAdmin } from '../../../lib/supabase'
import { sendStatusUpdate } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { reqId, newStatus, note } = req.body
  if (!reqId || !newStatus) return res.status(400).json({ error: 'Faltan parámetros' })

  const supabase = supabaseAdmin()

  // 1. Obtener solicitud
  const { data: request, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', reqId)
    .single()

  if (error || !request) return res.status(404).json({ error: 'Solicitud no encontrada' })

  // 2. Actualizar estado
  await supabase
    .from('requests')
    .update({ status: newStatus })
    .eq('id', reqId)

  // 3. Insertar en historial
  await supabase.from('request_history').insert({
    request_id: reqId,
    status:     newStatus,
    note:       note || '',
  })

  // 4. Enviar correo al ejecutivo
  try {
    await sendStatusUpdate(request, newStatus, note)
  } catch (emailErr) {
    console.error('Email error (non-fatal):', emailErr)
  }

  return res.status(200).json({ ok: true })
}

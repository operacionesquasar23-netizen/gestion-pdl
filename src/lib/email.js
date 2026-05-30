import { Resend } from 'resend'
import { STATUS_MAP } from './constants'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.FROM_EMAIL  || 'norecios@tuempresa.com'
const ADMIN  = process.env.ADMIN_EMAIL || 'admin@tuempresa.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function baseHtml(body) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }
      .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #1D4ED8; padding: 24px 32px; }
      .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 600; }
      .header p  { color: #BFDBFE; margin: 4px 0 0; font-size: 13px; }
      .body { padding: 28px 32px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #EEF2FF; color: #3730A3; }
      .field { margin-bottom: 12px; }
      .field .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 2px; }
      .field .val { font-size: 14px; color: #1e293b; font-weight: 500; }
      .divider { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
      .btn { display: inline-block; background: #1D4ED8; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 16px; }
      .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body><div class="wrap">${body}</div></body>
  </html>`
}

// Notifica al admin cuando llega una nueva solicitud
export async function sendNewRequestAdmin(req) {
  const html = baseHtml(`
    <div class="header">
      <h1>⚡ Nueva solicitud PDL recibida</h1>
      <p>${req.code} · ${new Date().toLocaleDateString('es-PE')}</p>
    </div>
    <div class="body">
      <div class="field"><div class="lbl">Ejecutivo</div><div class="val">${req.exec_name}</div></div>
      <div class="field"><div class="lbl">Tienda</div><div class="val">${req.store_name}</div></div>
      <div class="field"><div class="lbl">Dirección</div><div class="val">${req.address || '—'}</div></div>
      <div class="field"><div class="lbl">Puntos de luz</div><div class="val">${req.pdl_count}</div></div>
      <div class="field"><div class="lbl">Prioridad</div><div class="val">${req.priority}</div></div>
      <div class="field"><div class="lbl">Descripción</div><div class="val">${req.description || '—'}</div></div>
      <hr class="divider">
      <a class="btn" href="${APP_URL}/admin">Ver en panel admin →</a>
    </div>
    <div class="footer">Sistema PDL · Gestión de Puntos de Luz</div>
  `)
  await resend.emails.send({
    from: FROM, to: ADMIN,
    subject: `[PDL] Nueva solicitud ${req.code} — ${req.store_name}`,
    html
  })
}

// Notifica al ejecutivo que su solicitud fue recibida
export async function sendConfirmationExecutive(req) {
  if (!req.exec_email) return
  const html = baseHtml(`
    <div class="header">
      <h1>✅ Solicitud recibida</h1>
      <p>Tu solicitud ha sido registrada correctamente</p>
    </div>
    <div class="body">
      <p style="margin:0 0 16px">Hola <strong>${req.exec_name}</strong>, tu solicitud de habilitación de puntos de luz fue recibida exitosamente.</p>
      <div class="field"><div class="lbl">Código de seguimiento</div><div class="val" style="font-size:18px">${req.code}</div></div>
      <div class="field"><div class="lbl">Tienda</div><div class="val">${req.store_name}</div></div>
      <div class="field"><div class="lbl">Puntos de luz solicitados</div><div class="val">${req.pdl_count}</div></div>
      <hr class="divider">
      <p style="font-size:13px;color:#64748b">Recibirás actualizaciones por correo conforme avance el proceso. Guarda el código <strong>${req.code}</strong> para hacer seguimiento.</p>
      <a class="btn" href="${APP_URL}/seguimiento/${req.code}">Ver estado de mi solicitud →</a>
    </div>
    <div class="footer">Sistema PDL · Gestión de Puntos de Luz</div>
  `)
  await resend.emails.send({
    from: FROM, to: req.exec_email,
    subject: `[PDL] Solicitud ${req.code} recibida — ${req.store_name}`,
    html
  })
}

// Notifica al ejecutivo cuando cambia el estado
export async function sendStatusUpdate(req, newStatus, note) {
  if (!req.exec_email) return
  const s = STATUS_MAP[newStatus]
  const html = baseHtml(`
    <div class="header">
      <h1>${s?.icon || '🔄'} Actualización de tu solicitud</h1>
      <p>${req.code} · ${req.store_name}</p>
    </div>
    <div class="body">
      <p style="margin:0 0 16px">Hola <strong>${req.exec_name}</strong>, tu solicitud ha avanzado al siguiente estado:</p>
      <div class="badge">${s?.label || newStatus}</div>
      ${note ? `<div class="field" style="margin-top:16px"><div class="lbl">Nota del equipo</div><div class="val">${note}</div></div>` : ''}
      <hr class="divider">
      <a class="btn" href="${APP_URL}/seguimiento/${req.code}">Ver estado completo →</a>
    </div>
    <div class="footer">Sistema PDL · Gestión de Puntos de Luz</div>
  `)
  await resend.emails.send({
    from: FROM, to: req.exec_email,
    subject: `[PDL] ${req.code} — ${s?.label || newStatus}`,
    html
  })
}

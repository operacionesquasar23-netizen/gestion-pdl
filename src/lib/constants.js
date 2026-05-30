export const STATUSES = [
  { id: 'pending',    label: 'Pendiente revisión',   color: 'amber',  icon: '⏳' },
  { id: 'visit-prog', label: 'Visita programada',     color: 'blue',   icon: '📅' },
  { id: 'visit-done', label: 'Visita realizada',      color: 'indigo', icon: '✅' },
  { id: 'quote',      label: 'Cotización enviada',    color: 'orange', icon: '📋' },
  { id: 'svc-prog',   label: 'Servicio programado',   color: 'teal',   icon: '🔧' },
  { id: 'svc-done',   label: 'Servicio realizado',    color: 'green',  icon: '🎉' },
]

export const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.id, s]))

export const PRIORITY_MAP = {
  alta:  { label: 'Alta',  dot: '#EF4444' },
  media: { label: 'Media', dot: '#F59E0B' },
  baja:  { label: 'Baja',  dot: '#22C55E' },
}

export const STATUS_BADGE_CLASSES = {
  'pending':    'bg-amber-50  text-amber-800  border-amber-200',
  'visit-prog': 'bg-blue-50   text-blue-800   border-blue-200',
  'visit-done': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'quote':      'bg-orange-50 text-orange-800 border-orange-200',
  'svc-prog':   'bg-teal-50   text-teal-800   border-teal-200',
  'svc-done':   'bg-green-50  text-green-800  border-green-200',
}

export function nextStatuses(currentId) {
  const idx = STATUSES.findIndex(s => s.id === currentId)
  return idx === -1 ? [] : STATUSES.slice(idx + 1)
}

export function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function generateCode() {
  const ts = Date.now().toString(36).toUpperCase()
  return `PDL-${ts}`
}

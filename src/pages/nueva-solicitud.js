import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Head from 'next/head'

const MAX_FILES = 10
const MAX_MB = 20

const EJECUTIVOS = ['Daniela','Franco','Maribed','Frecsia','Rafael','Ysmarly','Yessenia','Victor']
const TIPOS = ['Visita Técnica','Habilitación de PDL']

function FileIcon({ name }) {
  if (!name) return null
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return <span className="text-red-500 text-xs font-bold">PDF</span>
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return <span className="text-blue-500 text-xs font-bold">IMG</span>
  return <span className="text-gray-400 text-xs font-bold">DOC</span>
}

export default function NuevaSolicitud() {
  const [form, setForm] = useState({
    asunto: '',
    cliente: '',
    cod: '',
    marca: '',
    campana: '',
    elemento: '',
    tienda: '',
    tipoSolicitud: '',
    descripcion: '',
    ejecutivo: '',
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [successData, setSuccessData] = useState({})
  const [error, setError] = useState('')

  const onDrop = useCallback(accepted => {
    setFiles(prev => [...prev, ...accepted].slice(0, MAX_FILES))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      maxSize: MAX_MB * 1024 * 1024,
      multiple: true,
      accept: { 'image/*': [], 'application/pdf': [] }
    })

  const removeFile = i => setFiles(f => f.filter((_, idx) => idx !== i))
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!form.cliente || !form.tienda || !form.ejecutivo) {
      setError('Por favor completa los campos obligatorios (*).')
      return
    }
    setLoading(true)
    try {
      // Convertir archivos a base64
      const filesData = await Promise.all(files.map(file => 
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve({
            name: file.name,
            mimeType: file.type,
            data: reader.result.split(',')[1]
          })
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      ))

      console.log('archivos a enviar:', filesData.length)
      console.log('primer archivo:', filesData[0]?.name, filesData[0]?.data?.length)

      const res = await fetch('/api/solicitudes/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, files: filesData })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')
      setSuccess(data.code)
      setSuccessData(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 text-sm mb-6">Tu solicitud fue registrada exitosamente.</p>
        <div className="bg-blue-50 rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-blue-600 mb-1 font-medium">Código de seguimiento</p>
          <p className="text-2xl font-mono font-semibold text-blue-800">{success}</p>
        </div>
        <a href={`/seguimiento/${success}`}
          className="block w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors mb-3">
          Ver estado de mi solicitud →
        </a>
        <a href={`mailto:paul.najarro@quasar-btl.pe?subject=REQUERIMIENTO DE ${successData.tipoSolicitud} - ${successData.asunto}&body=Buen día Estimado,%0D%0A%0D%0ATipo de requerimiento: ${successData.tipoSolicitud}%0D%0AElemento: ${successData.elemento}%0D%0AMarca: ${successData.marca}%0D%0ACOD: ${successData.cod}%0D%0ATienda: ${successData.tienda}%0D%0ADescripción: ${successData.descripcion}%0D%0A%0D%0AArchivos adjuntos en el sistema:%0D%0Ahttps://gestion-pdl.vercel.app/seguimiento/${success}`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors mb-3">
          📧 Enviar correo a Operaciones
        </a>
        <button onClick={() => { setSuccess(null); setForm({ asunto:'', cliente:'', cod:'', marca:'', campana:'', elemento:'', tienda:'', tipoSolicitud:'', descripcion:'', ejecutivo:'' }); setFiles([]) }}
          className="text-sm text-gray-400 hover:text-gray-600">
          Enviar otra solicitud
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Head>
        <title>Nueva Solicitud PDL</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-brand text-white px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-lg font-semibold">PDL — Sistema de Gestión</h1>
              <p className="text-blue-200 text-xs">Nueva Solicitud de Habilitación</p>
            </div>
            <a href="/" className="ml-auto text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
              ← Inicio
            </a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Sección Información General */}
            <div className="px-8 py-5 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📋</span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Información General</h2>
                  <p className="text-xs text-gray-400">Completa los datos básicos del ticket</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Asunto *</label>
                  <input name="asunto" value={form.asunto} onChange={handleChange}
                    placeholder="Ej: Cabeceras Proyecto Catman"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
                  <input name="cliente" value={form.cliente} onChange={handleChange}
                    placeholder="Nombre del cliente"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código (COD)</label>
                  <input name="cod" value={form.cod} onChange={handleChange}
                    placeholder="Código de Campaña"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
                  <input name="marca" value={form.marca} onChange={handleChange}
                    placeholder="Marca"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Campaña</label>
                  <input name="campana" value={form.campana} onChange={handleChange}
                    placeholder="Campaña"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Elemento</label>
                  <input name="elemento" value={form.elemento} onChange={handleChange}
                    placeholder="Elemento"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tienda *</label>
                  <input name="tienda" value={form.tienda} onChange={handleChange}
                    placeholder="Nombre de la tienda"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Solicitud *</label>
                  <select name="tipoSolicitud" value={form.tipoSolicitud} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Selecciona un tipo</option>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección Descripción */}
            <div className="px-8 py-5 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📝</span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Descripción de la Solicitud</h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                    rows={4} placeholder="Describe el requerimiento, accesos, condiciones especiales..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ejecutivo Responsable *</label>
                  <select name="ejecutivo" value={form.ejecutivo} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Selecciona el ejecutivo</option>
                    {EJECUTIVOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección Adjuntos */}
            <div className="px-8 py-5 border-b border-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📎</span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Adjuntos <span className="text-gray-400 font-normal">(Opcional)</span></h2>
                  <p className="text-xs text-gray-400">Puedes agregar evidencias, fotos o documentos relacionados</p>
                </div>
              </div>
              <div {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}>
                <input {...getInputProps()} />
                <div className="text-3xl mb-2">☁️</div>
                <p className="text-sm text-gray-600 font-medium">
                  {isDragActive ? 'Suelta los archivos aquí...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Formatos permitidos: JPG, PNG, PDF, DOC, DOCX (Máx. {MAX_MB}MB c/u)</p>
              </div>
              {files.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                      <FileIcon name={f.name} />
                      <span className="text-sm text-gray-700 flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400">{(f.size/1024/1024).toFixed(1)} MB</span>
                      <button type="button" onClick={() => removeFile(i)}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer botones */}
            <div className="px-8 py-5 flex items-center justify-between">
              <button type="button" onClick={() => setForm({ asunto:'', cliente:'', cod:'', marca:'', campana:'', elemento:'', tienda:'', tipoSolicitud:'', descripcion:'', ejecutivo:'' })}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                ✕ Cancelar
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="px-8 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {loading ? 'Guardando...' : '🖫 Guardar Ticket'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import Head from 'next/head'

const API_URL = "https://script.google.com/macros/s/AKfycbwLbjC8aOQ9sZ7x0_CLAySNOx5ib7xu65R2KsQlkK-0hIKZIZ4Y1_g_Ggt3rASxd6-U/exec"

export default function Configuracion() {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [firmaFile, setFirmaFile] = useState(null)
  const [firmaPreview, setFirmaPreview] = useState('')
  const [firmaURL, setFirmaURL] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}?sheet=Configuracion`)
      const data = await res.json()
      const rows = data.values || []
      if (rows.length >= 2) {
        setNombre(rows[1][0] || '')
        setDni(rows[1][1] || '')
        setFirmaURL(rows[1][2] || '')
        if (rows[1][2]) setFirmaPreview(rows[1][2])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleFirma = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFirmaFile(file)
    const reader = new FileReader()
    reader.onload = () => setFirmaPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!nombre || !dni) { alert('Completa nombre y DNI'); return }
    setSaving(true)
    try {
      let urlFirma = firmaURL

        // Subir firma si hay una nueva
        if (firmaFile) {
          const reader = new FileReader()
          const base64 = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(firmaFile)
          })

          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // <-- cambio aquí
            body: JSON.stringify({
              action: 'uploadFile',
              ticketId: 'CONFIG',
              fileName: `firma_responsable.${firmaFile.name.split('.').pop()}`,
              mimeType: firmaFile.type,
              fileData: base64
            })
          })
          const data = await res.json()
          if (data.url) urlFirma = data.url
        }

        // Guardar en Sheets
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // <-- cambio aquí también
          body: JSON.stringify({
            action: 'update',
            sheet: 'Configuracion',
            row: 2,
            values: [nombre, dni, urlFirma]
          })
        })

      setFirmaURL(urlFirma)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
      alert('Error al guardar')
    }
    setSaving(false)
  }

  return (
    <>
      <Head><title>Configuración · PDL</title></Head>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Quasar" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="font-semibold">PDL — Configuración</h1>
              <p className="text-blue-200 text-xs">Datos del responsable para actas de conformidad</p>
            </div>
          </div>
          <a href="/admin" className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
            ← Panel Admin
          </a>
        </div>

        <div className="max-w-xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Cargando configuración...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Responsable del Acta de Conformidad</h2>
                <p className="text-xs text-gray-400">Estos datos aparecerán en todas las actas generadas</p>
              </div>

              <div className="px-8 py-6 flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Ej: BRENDA LEZAMETA REYNA"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">DNI *</label>
                  <input value={dni} onChange={e => setDni(e.target.value)}
                    placeholder="Ej: 77393657"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Firma digital</label>
                  <input type="file" accept="image/*"
                    onChange={handleFirma}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  {firmaPreview && (
                    <div className="mt-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <p className="text-xs text-gray-400 mb-2">Vista previa de la firma:</p>
                      <img src={firmaPreview} alt="Firma" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {saving ? 'Guardando...' : saved ? '✅ Guardado correctamente' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

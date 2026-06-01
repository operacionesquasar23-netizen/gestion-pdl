import { useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'

export default function Home() {
  const [codigo, setCodigo] = useState('')
  const [cod, setCod] = useState('')
  const [buscandoCod, setBuscandoCod] = useState(false)
  const [resultadosCod, setResultadosCod] = useState([])

  const handleSeguimiento = () => {
    if (!codigo.trim()) return
    window.location.href = `/seguimiento/${codigo.trim().toUpperCase()}`
  }

  const handleBuscarCod = async () => {
    if (!cod.trim()) return
    setBuscandoCod(true)
    const res = await fetch(`/api/buscar?cod=${encodeURIComponent(cod.trim())}`)
    const data = await res.json()
    setResultadosCod(data.tickets || [])
    setBuscandoCod(false)
  }

  return (
    <>
      <Head>
        <title>Quasar · Sistema de Gestión PDL</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col">

        {/* Header */}
        <div className="bg-brand text-white px-6 py-5">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Image src="/logo.png" alt="Quasar" width={56} height={56} className="rounded-full" />
            <div>
              <h1 className="text-xl font-bold">Quasar</h1>
              <p className="text-blue-200 text-sm">Sistema de Gestión de Puntos de Luz</p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-brand text-white px-6 pb-16 pt-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-2">MAO</h1>
            <h2 className="text-3xl font-bold mb-3">Gestión integral de<br />puntos de luz en tiendas</h2>
          </div>
        </div>

        {/* Cards */}
        <div className="max-w-7xl mx-auto px-4 -mt-8 pb-12 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Nueva Solicitud */}
            <a href="/nueva-solicitud"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition-colors">
                📋
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Nueva Solicitud</h3>
              <p className="text-sm text-gray-500 mb-4">Registra un nuevo requerimiento de habilitación de puntos de luz.</p>
              <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-800">
                Ir al formulario →
              </span>
            </a>

            {/* Seguimiento */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl mb-4">
                🔍
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Seguimiento</h3>
              <p className="text-sm text-gray-500 mb-4">Consulta el estado de tu solicitud.</p>
              
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Por código de ticket</p>
                  <div className="flex gap-2">
                    <input
                      value={codigo}
                      onChange={e => setCodigo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSeguimiento()}
                      placeholder="Ej: PDL-MPQFSEL3"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleSeguimiento}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                      Buscar
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Por COD de campaña</p>
                  <div className="flex gap-2">
                    <input
                      value={cod}
                      onChange={e => setCod(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBuscarCod()}
                      placeholder="Ej: 12345"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleBuscarCod}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                      Buscar
                    </button>
                  </div>
                  {buscandoCod && <p className="text-xs text-gray-400 mt-2">Buscando...</p>}
                  {resultadosCod.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {resultadosCod.map((t, i) => (
                        <a key={i} href={`/seguimiento/${t.TicketID}`}
                          className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{t.Asunto}</p>
                            <p className="text-xs text-gray-400">{t.Tienda} · {t.TicketID}</p>
                          </div>
                          <span className="text-xs text-blue-600">Ver →</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {resultadosCod.length === 0 && cod && !buscandoCod && (
                    <p className="text-xs text-red-400 mt-2">No se encontraron solicitudes con ese COD</p>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Admin */}
            <a href="/admin"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-100 transition-colors">
                ⚙️
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Panel de Operaciones</h3>
              <p className="text-sm text-gray-500 mb-4">Gestiona todas las solicitudes, asigna proveedores y actualiza estados.</p>
              <span className="text-xs font-semibold text-purple-700 group-hover:text-purple-800">
                Acceder al panel →
              </span>
            </a>

          </div>

          {/* Dashboard */}
          <a href="/dashboard"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-amber-100 transition-colors">
              📊
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Dashboard</h3>
            <p className="text-sm text-gray-500 mb-4">Métricas y estadísticas del proceso.</p>
            <span className="text-xs font-semibold text-amber-700 group-hover:text-amber-800">
              Ver métricas →
            </span>
          </a>        

          {/* Stats o info adicional */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl mb-1">📋</p>
                <p className="text-sm font-medium text-gray-700">Solicitud</p>
                <p className="text-xs text-gray-400 mt-0.5">El ejecutivo registra el requerimiento</p>
              </div>
              <div>
                <p className="text-2xl mb-1">🔧</p>
                <p className="text-sm font-medium text-gray-700">Proceso</p>
                <p className="text-xs text-gray-400 mt-0.5">Operaciones coordina visita y cotización</p>
              </div>
              <div>
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-medium text-gray-700">Habilitación</p>
                <p className="text-xs text-gray-400 mt-0.5">El proveedor ejecuta y envía evidencias</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-auto bg-white border-t border-gray-100 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-400">© 2026 Quasar · Sistema de Gestión PDL</p>
            <div className="flex items-center gap-4">
              <a href="/nueva-solicitud" className="text-xs text-gray-400 hover:text-blue-700">Nueva Solicitud</a>
              <a href="/admin" className="text-xs text-gray-400 hover:text-blue-700">Operaciones</a>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

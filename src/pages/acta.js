import { useEffect, useState } from 'react'
import Head from 'next/head'

const API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

export async function getServerSideProps({ query }) {
  const { ticketId } = query
  if (!ticketId) return { notFound: true }

  try {
    const [resTickets, resConfig] = await Promise.all([
      fetch(`${API_URL}?sheet=Solicitudes`),
      fetch(`${API_URL}?sheet=Configuracion`)
    ])

    const dataTickets = await resTickets.json()
    const dataConfig = await resConfig.json()

    const rowsT = dataTickets.values || []
    const headersT = rowsT[0] || []
    const rowTicket = rowsT.find((r, i) => i > 0 && r[1] === ticketId)
    if (!rowTicket) return { notFound: true }

    const ticket = {}
    headersT.forEach((h, i) => { ticket[h] = rowTicket[i] || '' })

    const rowsC = dataConfig.values || []
    const config = rowsC.length >= 2 ? {
      nombre: rowsC[1][0] || '',
      dni: rowsC[1][1] || '',
      firmaURL: rowsC[1][2] || ''
    } : { nombre: '', dni: '', firmaURL: '' }

    return { props: { ticket, config } }
  } catch (e) {
    return { notFound: true }
  }
}

export default function Acta({ ticket, config }) {
  const formatFecha = (str) => {
    if (!str) return '_______________'
    if (str.includes('T')) {
      const d = new Date(str)
      return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
    }
    return str.split(',')[0].trim()
  }

  return (
    <>
      <Head>
        <title>Acta de Conformidad · {ticket.TicketID}</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
          }
          body { font-family: Arial, sans-serif; background: white; }
        `}</style>
      </Head>

      {/* Botón imprimir */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-blue-800">
          🖨️ Imprimir / Guardar PDF
        </button>
        <button onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300">
          Cerrar
        </button>
      </div>

      {/* Acta */}
      <div style={{
        maxWidth: '750px',
        margin: '40px auto',
        padding: '40px',
        border: '2px solid #1D3461',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#000'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px' }}>GMRC S.A.</h2>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            ACTA DE CONFORMIDAD
          </h1>
        </div>

        {/* Datos principales */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', width: '33%', backgroundColor: '#f0f0f0' }}>
                N° DE ORDEN DE COMPRA
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', width: '33%' }}>
                {ticket.NroOrdenCompra || '_______________'}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', width: '16%', backgroundColor: '#f0f0f0' }}>
                FECHA DEL SERVICIO
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', width: '18%' }}>
                {formatFecha(ticket.FechaHabilitacion)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                ÁREA
              </td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '8px 12px' }}>
                RETAIL
              </td>
            </tr>
          </tbody>
        </table>

        {/* Tipo de servicio */}
        <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '16px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 8px' }}>SERVICIO:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <p style={{ margin: '2px 0' }}>1. INSTALACIÓN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (  {ticket.TipoSolicitud?.toLowerCase().includes('instalac') ? 'x' : ' '}  )</p>
            <p style={{ margin: '2px 0' }}>3. TRASLADOS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (  {ticket.TipoSolicitud?.toLowerCase().includes('traslado') ? 'x' : ' '}  )</p>
            <p style={{ margin: '2px 0' }}>2. MANTENIMIENTO (  {ticket.TipoSolicitud?.toLowerCase().includes('mantenim') ? 'x' : ' '}  )</p>
            <p style={{ margin: '2px 0' }}>4. OTROS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (  {!ticket.TipoSolicitud?.toLowerCase().includes('instalac') && !ticket.TipoSolicitud?.toLowerCase().includes('traslado') && !ticket.TipoSolicitud?.toLowerCase().includes('mantenim') ? 'x' : ' '}  )</p>
          </div>
        </div>

        {/* Descripción */}
        <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '16px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase' }}>
            DESCRIPCIÓN DEL SERVICIO (Solicitante)
          </p>
          <p style={{ margin: '0', minHeight: '40px', textTransform: 'uppercase' }}>
            {ticket.Asunto || ticket.Descripcion || ''}
          </p>
        </div>

        {/* Informe proveedor */}
        <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '16px' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase' }}>
            INFORME Y OBSERVACIONES DEL SERVICIO POR PARTE DEL PROVEEDOR (Opcional)
          </p>
          <p style={{ margin: '0', minHeight: '30px' }}>
            {ticket.Proveedor || ''}
          </p>
        </div>

        {/* COD y Fecha finalización */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', width: '25%', backgroundColor: '#f0f0f0' }}>
                CÓDIGO DE CAMPAÑA
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', width: '25%' }}>
                {ticket.COD || ''}
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', fontWeight: 'bold', width: '25%', backgroundColor: '#f0f0f0' }}>
                FECHA DE FINALIZACIÓN DEL SERVICIO
              </td>
              <td style={{ border: '1px solid #000', padding: '8px 12px', width: '25%' }}>
                {formatFecha(ticket.FechaFinalizacion || ticket.FechaHabilitacion)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Firmas */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '16px 12px', width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase', fontSize: '11px' }}>
                  NOMBRE Y FIRMA DEL USUARIO RESPONSABLE
                </p>
                {config.firmaURL && (
                  <div style={{ marginBottom: '8px' }}>
                    <img
                      src={`/api/imagen?url=${encodeURIComponent(config.firmaURL)}`}
                      alt="Firma"
                      style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
                <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 'bold' }}>
                  {config.nombre}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px' }}>
                  DNI {config.dni}
                </p>
              </td>
              <td style={{ border: '1px solid #000', padding: '16px 12px', width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 40px', textTransform: 'uppercase', fontSize: '11px' }}>
                  FIRMA DEL TÉCNICO (PROVEEDOR)
                </p>
                <div style={{ borderTop: '1px solid #000', paddingTop: '4px' }}>
                  <p style={{ margin: '0', fontSize: '11px' }}>{ticket.Proveedor || ''}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 30px', textTransform: 'uppercase', fontSize: '11px' }}>
                  REVISADO POR EL JEFE DE ÁREA
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Notas */}
        <div style={{ fontSize: '11px', color: '#444', borderTop: '1px solid #ddd', paddingTop: '12px' }}>
          <p style={{ margin: '2px 0' }}>* Este formato debe ser entregado: debidamente llenado, junto con la factura y la Orden de Compra.</p>
          <p style={{ margin: '2px 0' }}>* Todas las firmas deben ser en original o electrónica.</p>
          <p style={{ margin: '2px 0' }}>* La fecha de finalización del servicio debe ser menor o igual a la fecha de la emisión de la factura.</p>
          <p style={{ margin: '2px 0' }}>* La letra debe ser legible y clara, sin borrones.</p>
          <p style={{ margin: '2px 0' }}>* No se aceptará este documento ni la factura, si el formato no está completo (incluyendo todas las firmas).</p>
        </div>
      </div>
    </>
  )
}

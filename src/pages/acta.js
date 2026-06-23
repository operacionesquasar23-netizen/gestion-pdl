import Head from 'next/head'

const API_URL = "https://script.google.com/macros/s/AKfycbw5lXuqBcUMOm3hSmhsF6fpFGTbuC0Lwld0-9Bhn90_QNJ0m58NQHvAFwzGs2IjZlc-MA/exec"

const BORDER = '1.3px solid #000'

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

  const tipo = (ticket.TipoSolicitud || '').toLowerCase()
  const esInstalacion = tipo.includes('instalac') ||
  (!esMantenimiento && !esTraslado)
  const esMantenimiento = tipo.includes('mantenim')
  const esTraslado = tipo.includes('traslado')
  const esOtros = false

  const headerCell = { padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }
  const valueCell = { padding: '8px', textAlign: 'center' }

  return (
    <>
      <Head>
        <title>Acta de Conformidad · {ticket.TicketID}</title>
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }

            html,
            body {
              margin: 0;
              padding: 0;
            }

            .acta-container {
              page-break-inside: avoid;
            }

            .no-print {
              display: none !important;
            }
          }

          body {
            font-family: Calibri, Arial, sans-serif;
            background: white;
            margin: 0;
          }
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
      <div
        className="acta-container"
        style={{
          maxWidth: '750px',
          margin: '0 auto',
          padding: '10px 20px',
          fontFamily: 'Calibri, Arial, sans-serif',
          fontSize: '13px',
          color: '#000'
        }}
      >
        {/* Header con logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <img src="/logo1.png" alt="Quasar" style={{ height: '70px', objectFit: 'contain' }} />
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>GMRC S.A.</p>
        </div>
        <h1 style={{ textAlign: 'center', fontSize: '19px', fontWeight: 'bold', margin: '0 0 18px' }}>
          ACTA DE CONFORMIDAD
        </h1>

        {/* Cuerpo con borde exterior */}
        <div style={{ border: BORDER }}>

          {/* N° Orden / Fecha / Area */}
          <div style={{ display: 'flex', borderBottom: BORDER }}>
            <div style={{ flex: 1, borderRight: BORDER, ...headerCell }}>N° DE ORDEN DE COMPRA</div>
            <div style={{ flex: 1, borderRight: BORDER, ...headerCell }}>FECHA DEL SERVICIO</div>
            <div style={{ flex: 1, ...headerCell }}>AREA</div>
          </div>
          <div style={{ display: 'flex', borderBottom: BORDER }}>
            <div style={{ flex: 1, borderRight: BORDER, ...valueCell }}>{ticket.NroOrdenCompra || '_______________'}</div>
            <div style={{ flex: 1, borderRight: BORDER, ...valueCell }}>{formatFecha(ticket.FechaHabilitacion)}</div>
            <div style={{ flex: 1, ...valueCell }}>RETAIL</div>
          </div>

          {/* Servicio */}
          <div style={{ borderBottom: BORDER, padding: '10px 14px', minHeight: '150px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 14px' }}>SERVICIO:</p>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ flex: 2 }}>
                <p style={{ margin: '4px 0' }}>1.&nbsp;&nbsp;&nbsp;&nbsp;INSTALACIÓN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;{esInstalacion ? 'x' : ' '}&nbsp;&nbsp;)</p>
                <p style={{ margin: '4px 0' }}>2.&nbsp;&nbsp;&nbsp;&nbsp;MANTENIMIENTO&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;{esMantenimiento ? 'x' : ' '}&nbsp;&nbsp;)</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '4px 0' }}>3. TRASLADOS&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;{esTraslado ? 'x' : ' '}&nbsp;&nbsp;)</p>
                <p style={{ margin: '4px 0' }}>4. OTROS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;{esOtros ? 'x' : ' '}&nbsp;&nbsp;)</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div style={{ borderBottom: BORDER, ...headerCell }}>
            DESCRIPCIÓN DEL SERVICIO (Solicitante)
          </div>
          <div style={{
            borderBottom: BORDER, padding: '14px', minHeight: '130px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase'
          }}>
            {`${ticket.Asunto || ''} - ${ticket.Tienda || ''}`}
          </div>

          {/* Informe proveedor */}
          <div style={{ borderBottom: BORDER, ...headerCell }}>
            INFORME Y OBSERVACIONES DEL SERVICIO POR PARTE DEL PROVEEDOR (Opcional)
          </div>
          <div style={{
            borderBottom: BORDER, padding: '14px', minHeight: '100px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
          }}>
            {ticket.Proveedor || ''}
          </div>

          {/* Bloque inferior: código / firmas */}
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Izquierda: código de campaña + firmas técnico/jefe */}
            <div style={{ flex: 2, borderRight: BORDER, display: 'flex', flexDirection: 'column' }}>
              <div style={{ borderBottom: BORDER, ...headerCell }}>CODIGO DE CAMPAÑA</div>
              <div style={{
                borderBottom: BORDER, minHeight: '70px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {ticket.COD || ''}
              </div>
              <div style={{ display: 'flex', borderBottom: BORDER, flex: 1 }}>
                <div style={{ flex: 1, borderRight: BORDER, minHeight: '70px' }}></div>
                <div style={{ flex: 1, minHeight: '70px' }}></div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, borderRight: BORDER, padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                  FIRMA DEL TECNICO (PROVEEDOR)
                </div>
                <div style={{ flex: 1, padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                  REVISADO POR EL JEFE DE AREA
                </div>
              </div>
            </div>

            {/* Derecha: fecha finalización + firma usuario responsable */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <div style={{ borderBottom: BORDER, padding: '7.5px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                FECHA DE FINALIZACIÓN DEL SERVICIO
              </div>
              <div style={{ borderBottom: BORDER, padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                {formatFecha(ticket.FechaFinalizacion || ticket.FechaHabilitacion)}
              </div>
              <div style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                NOMBRE Y FIRMA DEL USUARIO RESPONSABLE
              </div>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '8px'
                }}
              >
                {config.firmaURL && (
                  <img
                    src={`/api/imagen?url=${encodeURIComponent(config.firmaURL)}`}
                    alt="Firma"
                    style={{ maxHeight: '55px', maxWidth: '160px', objectFit: 'contain', marginBottom: '4px' }}
                  />
                )}
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>{config.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px' }}>DNI {config.dni}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '14px' }}>
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
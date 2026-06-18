export default function Acta({ ticket, config }) {
  // ... tus funciones existentes ...

  return (
    <>
      <Head>
        <title>Acta de Conformidad · {ticket.TicketID}</title>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { 
              margin: 0 !important; 
              padding: 0 !important;
              background: white;
            }
            
            @page {
              margin: 0.3cm !important;
              size: A4 portrait;
            }
            
            .acta-container {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 0 auto !important;
              padding: 8px 16px !important;
            }
            
            .acta-container .header-logo {
              margin-bottom: 2px !important;
            }
            
            .acta-container h1 {
              margin-top: 0 !important;
              margin-bottom: 8px !important;
              font-size: 17px !important;
            }
            
            .acta-content {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Reducir alturas en impresión */
            .service-description {
              min-height: 80px !important;
              padding: 10px !important;
            }
            
            .provider-observations {
              min-height: 60px !important;
              padding: 10px !important;
            }
          }
        `}</style>
      </Head>

      {/* Botón imprimir - igual */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        {/* ... mismo código ... */}
      </div>

      {/* Acta - con clase para control */}
      <div 
        className="acta-container"
        style={{
          maxWidth: '750px',
          margin: '16px auto',
          padding: '12px 24px 16px',
          fontFamily: 'Calibri, Arial, sans-serif',
          fontSize: '13px',
          color: '#000'
        }}
      >
        {/* Header con logo */}
        <div className="header-logo" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2px'
        }}>
          <img src="/logo1.png" alt="Quasar" style={{ height: '60px', objectFit: 'contain' }} />
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>GMRC S.A.</p>
        </div>
        <h1 style={{ 
          textAlign: 'center', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          margin: '0 0 10px'
        }}>
          ACTA DE CONFORMIDAD
        </h1>

        {/* Cuerpo con borde exterior */}
        <div className="acta-content" style={{ border: BORDER }}>
          {/* ... resto del contenido igual ... */}
        </div>

        {/* Notas */}
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '10px' }}>
          {/* ... mismo código ... */}
        </div>
      </div>
    </>
  )
}
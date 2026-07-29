import '../styles/globals.css'
import { useState, useEffect } from 'react';
import Splash from '../components/Splash';

export default function App({ Component, pageProps }) {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Iniciando...');
  const [videoNearEnd, setVideoNearEnd] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    async function init() {
      setStatusMsg('Verificando sesión...');
      await new Promise(r => setTimeout(r, 1500));

      setStatusMsg('Cargando datos de PDL...');
      await new Promise(r => setTimeout(r, 1500));

      setDataReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (dataReady && videoNearEnd && !fadeOut) {
      setStatusMsg('Listo');
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 800); // recién aquí desmonta el splash, no la página
    }
  }, [dataReady, videoNearEnd, fadeOut]);

  return (
    <>
      <div style={{ opacity: fadeOut ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
        <Component {...pageProps} />
      </div>
      {showSplash && (
        <Splash
          message={statusMsg}
          fadeOut={fadeOut}
          onVideoNearEnd={() => setVideoNearEnd(true)}
        />
      )}
    </>
  );
}
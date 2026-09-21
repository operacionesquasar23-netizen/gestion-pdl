import '../styles/globals.css'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Splash from '../components/Splash';

// Rutas donde NO debe mostrarse la animación de inicio
const RUTAS_SIN_SPLASH = ['/acta'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const sinSplash = RUTAS_SIN_SPLASH.includes(router.pathname);

  const [showSplash, setShowSplash] = useState(!sinSplash);
  const [fadeOut, setFadeOut] = useState(sinSplash);
  const [statusMsg, setStatusMsg] = useState('Iniciando...');
  const [videoNearEnd, setVideoNearEnd] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (sinSplash) return;

    async function init() {
      setStatusMsg('Verificando sesión...');
      await new Promise(r => setTimeout(r, 1500));

      setStatusMsg('Cargando datos de PDL...');
      await new Promise(r => setTimeout(r, 1500));

      setDataReady(true);
    }
    init();
  }, [sinSplash]);

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
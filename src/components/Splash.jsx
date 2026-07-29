export default function Splash({ message, fadeOut, onVideoEnd, onVideoNearEnd }) {
  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (video.duration && video.currentTime >= video.duration - 1) {
      onVideoNearEnd?.();
    }
  };

  return (
    <div style={{
      ...styles.container,
      opacity: fadeOut ? 0 : 1,
      transform: fadeOut ? 'scale(1.15)' : 'scale(1)',
    }}>
      <div style={styles.videoWrapper}>
        <video
          autoPlay
          muted
          playsInline
          onEnded={onVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          style={styles.video}
        >
          <source src="/videos/splash.mp4" type="video/mp4" />
        </video>
        <div style={styles.rightBorderFix}></div>
      </div>
      <p style={styles.text}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    background: '#193465',
    zIndex: 9999,
    transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
  },
  videoWrapper: {
    position: 'relative',
    width: '90vw',
    maxWidth: 700,
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    borderRadius: 8,
    background: '#193465',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  rightBorderFix: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: '100%',
    background: '#193465',
  },
  text: { color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 },
};
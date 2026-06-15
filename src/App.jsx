import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './features/auth/LoginScreen';
import PinLockScreen from './features/auth/PinLockScreen';
import HomeScreen from './features/home/HomeScreen';
import TimelineScreen from './features/timeline/TimelineScreen';
import FlashbackScreen from './features/flashback/FlashbackScreen';
import ProfileScreen from './features/profile/ProfileScreen';
import NavigationBar from './shared/widgets/NavigationBar';
import { Hourglass, Download, X } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Tema dikelola secara global di App.jsx agar tidak ada bug reset tema saat refresh
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('momento-theme') || 'system';
  });

  // Kunci PIN Aplikasi
  const [isUnlocked, setIsUnlocked] = useState(false);
  const savedPin = user?.user_metadata?.pin_code;

  // Sinkronisasi tema secara global ke dokumen HTML saat pertama kali dimuat & saat berubah
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('momento-theme', theme);
  }, [theme]);

  // Efek untuk memvalidasi status Kunci PIN ketika user login/logout/ubah pin
  useEffect(() => {
    if (!user) {
      setIsUnlocked(false);
    } else if (!savedPin) {
      // Jika pengguna belum menyetel PIN, lewati layar kunci
      setIsUnlocked(true);
    } else {
      // Jika ada PIN, kunci aplikasi saat awal dimuat/refresh
      setIsUnlocked(false);
    }
  }, [user, savedPin]);

  // Listener untuk instalasi PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Sinkronisasi kelas layout ke #root (mencegah scroll di halaman login/lock screen/loading)
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      const isAuthMode = loading || !user || (savedPin && !isUnlocked);
      if (isAuthMode) {
        rootEl.classList.add('auth-mode');
      } else {
        rootEl.classList.remove('auth-mode');
      }
    }
  }, [loading, user, savedPin, isUnlocked]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Pilihan user untuk instalasi: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Hourglass size={48} color="#8b5cf6" className="animate-hourglass" />
        <p style={styles.loadingText}>Menyiapkan Mesin Waktu...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Tampilkan layar kunci PIN jika user sudah login tetapi aplikasi masih terkunci
  if (savedPin && !isUnlocked) {
    return <PinLockScreen savedPin={savedPin} onUnlock={() => setIsUnlocked(true)} />;
  }

  // Render layar sesuai tab aktif
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'timeline':
        return <TimelineScreen setActiveTab={setActiveTab} />;
      case 'flashback':
        return <FlashbackScreen />;
      case 'profile':
        return <ProfileScreen theme={theme} setTheme={setTheme} />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      {/* Banner Kustom untuk Install PWA */}
      {showInstallBanner && (
        <div className="glass-panel animate-fade-in" style={styles.installBanner}>
          <div style={styles.installLeft}>
            <Download size={18} color="var(--accent-primary)" />
            <span style={styles.installText}>Pasang Momento di HP Anda!</span>
          </div>
          <div style={styles.installRight}>
            <button onClick={handleInstallClick} className="btn-primary" style={styles.installBtn}>
              Pasang
            </button>
            <button onClick={() => setShowInstallBanner(false)} style={styles.dismissBtn}>
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </div>
      )}

      <div style={styles.contentArea}>
        {renderScreen()}
      </div>
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    gap: '20px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    letterSpacing: '0.03em',
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: '100%',
  },
  installBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    margin: '12px 12px 0 12px',
    borderRadius: '16px',
    borderBottom: 'none',
    zIndex: 99,
  },
  installLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  installText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  installRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  installBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '10px',
    boxShadow: 'none',
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

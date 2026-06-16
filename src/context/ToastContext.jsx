/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
});

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info', id }

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500); // Otomatis hilang setelah 3.5 detik

    return () => clearTimeout(timer);
  }, [toast]);

  // Render Toast UI secara internal agar menyatu dengan provider
  const getToastStyles = (type) => {
    switch (type) {
      case 'error':
        return {
          background: 'rgba(239, 68, 68, 0.9)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.35)',
        };
      case 'info':
        return {
          background: 'rgba(139, 92, 246, 0.9)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 8px 30px rgba(139, 92, 246, 0.35)',
        };
      case 'success':
      default:
        return {
          background: 'rgba(16, 185, 129, 0.9)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
        };
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={18} color="#ffffff" />;
      case 'info':
        return <Info size={18} color="#ffffff" />;
      case 'success':
      default:
        return <CheckCircle size={18} color="#ffffff" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div style={styles.overlayContainer}>
          <div 
            style={{ 
              ...styles.toastCard, 
              ...getToastStyles(toast.type) 
            }} 
            className="animate-slide-down"
          >
            <div style={styles.toastContent}>
              {renderIcon(toast.type)}
              <span style={styles.toastText}>{toast.message}</span>
            </div>
            <button style={styles.closeBtn} onClick={() => setToast(null)}>
              <X size={14} color="#ffffff" opacity={0.8} />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};

const styles = {
  overlayContainer: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 999999,
    width: '90%',
    maxWidth: '400px',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none', // Biar klik di luar toast masih nembus ke form/UI
  },
  toastCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '16px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    width: '100%',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    pointerEvents: 'auto', // Aktifkan interaksi klik khusus untuk kartu toast nya saja
    transition: 'all 0.3s ease-in-out',
  },
  toastContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  toastText: {
    lineHeight: '1.4',
    letterSpacing: '0.01em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
  },
};

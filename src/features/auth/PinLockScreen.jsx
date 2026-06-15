import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hourglass, Delete, KeyRound, LogOut } from 'lucide-react';

export default function PinLockScreen({ savedPin, onUnlock }) {
  const { signOut, user } = useAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  // Batasi panjang PIN 4 digit
  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      setErrorMsg('');
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  // Cek PIN saat panjangnya mencapai 4 digit
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === savedPin) {
        onUnlock();
      } else {
        // PIN salah: getarkan/goyang kontainer dan reset input
        setShake(true);
        setErrorMsg('PIN salah! Silakan coba lagi.');
        const timer = setTimeout(() => {
          setShake(false);
          setPin('');
        }, 500); // Durasi animasi goyang
        return () => clearTimeout(timer);
      }
    }
  }, [pin, savedPin, onUnlock]);

  const handleForgotPin = async () => {
    if (window.confirm('Lupa PIN? Anda harus masuk kembali (login) menggunakan email Anda.')) {
      await signOut();
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.logoSection}>
        <div style={styles.iconWrapper}>
          <Hourglass size={36} color="var(--accent-primary)" className="animate-hourglass" />
        </div>
        <h2 style={styles.title}>Mesin Waktu Terkunci</h2>
        <p style={styles.subtitle}>Masukkan PIN Kunci Aplikasi Anda</p>
      </div>

      {/* Bulatan indikator PIN */}
      <div 
        style={{
          ...styles.dotsContainer,
          transform: shake ? 'translateX(10px)' : 'none',
          transition: 'transform 0.1s ease',
          animation: shake ? 'shake 0.1s ease infinite' : 'none',
        }}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              ...styles.dot,
              backgroundColor: index < pin.length ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: index < pin.length ? '0 0 10px var(--accent-primary)' : 'none',
            }}
          />
        ))}
      </div>

      {errorMsg ? (
        <p style={styles.errorText}>{errorMsg}</p>
      ) : (
        <p style={styles.forgotText}>Gunakan PIN yang Anda buat di profil</p>
      )}

      {/* Grid Keyboard Angka */}
      <div style={styles.keyboard}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            style={styles.keyBtn}
          >
            {num}
          </button>
        ))}
        {/* Tombol Lupa PIN / Reset */}
        <button onClick={handleForgotPin} style={styles.actionKeyBtn} title="Lupa PIN">
          <KeyRound size={20} color="var(--text-secondary)" />
        </button>
        {/* Angka 0 */}
        <button
          onClick={() => handleNumberClick('0')}
          style={styles.keyBtn}
        >
          0
        </button>
        {/* Tombol Backspace */}
        <button onClick={handleDelete} style={styles.actionKeyBtn} title="Hapus">
          <Delete size={20} color="var(--text-secondary)" />
        </button>
      </div>

      <button onClick={() => signOut()} style={styles.logoutLink}>
        <LogOut size={14} /> Keluar Akun
      </button>

      {/* CSS Animasi Shake untuk PIN salah */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '100%',
    padding: '24px 20px',
    backgroundColor: 'var(--bg-primary)',
    width: '100%',
    overflow: 'hidden',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  dotsContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    height: '16px',
  },
  dot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    transition: 'all 0.15s ease',
  },
  errorText: {
    fontSize: '13px',
    color: 'var(--error)',
    height: '20px',
    fontWeight: '600',
    marginBottom: '32px',
  },
  forgotText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    height: '20px',
    marginBottom: '32px',
  },
  keyboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px 24px',
    width: '100%',
    maxWidth: '280px',
    marginBottom: '40px',
  },
  keyBtn: {
    aspectRatio: '1',
    borderRadius: '50%',
    border: '1px solid var(--border-light)',
    background: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--text-primary)',
    fontSize: '24px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  actionKeyBtn: {
    aspectRatio: '1',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s ease',
  },
  logoutLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

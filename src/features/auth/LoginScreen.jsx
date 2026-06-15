import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Hourglass, CheckCircle, ArrowRight, Loader } from 'lucide-react';

export default function LoginScreen() {
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg('');
    
    const { success, error } = await signInWithOtp(email);
    
    setLoading(false);
    if (success) {
      setSent(true);
    } else {
      setErrorMsg(error || 'Gagal mengirimkan Magic Link. Silakan coba lagi.');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.logoSection}>
        <div style={styles.iconWrapper}>
          <Hourglass size={48} color="#8b5cf6" style={styles.hourglass} />
        </div>
        <h1 style={styles.title}>Momento</h1>
        <p style={styles.tagline}>"Simpan hari ini, temui kembali setahun nanti."</p>
      </div>

      <div className="glass-panel" style={styles.loginCard}>
        {sent ? (
          <div style={styles.successWrapper}>
            <div style={styles.successIconWrapper}>
              <CheckCircle size={36} color="#10b981" />
            </div>
            <h3 style={styles.successTitle}>Magic Link Terkirim!</h3>
            <p style={styles.successText}>
              Periksa kotak masuk email <strong>{email}</strong> Anda. Klik tautan di dalam email untuk langsung masuk ke aplikasi.
            </p>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setSent(false)}
            >
              Gunakan Email Lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.cardTitle}>Masuk ke Mesin Waktu</h2>
            <p style={styles.cardSubtitle}>
              Masukkan email Anda. Kami akan mengirimkan tautan login instan tanpa sandi.
            </p>

            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

            <div style={styles.inputGroup}>
              <label htmlFor="email" className="input-label">Email Anda</label>
              <div style={styles.inputWrapper}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="input-field"
                  style={{ paddingLeft: '48px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '16px' }}
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" style={styles.spinner} />
                  Mengirimkan Tautan...
                </>
              ) : (
                <>
                  Kirim Magic Link
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div style={styles.footer}>
        <p>Momento &copy; 2026 • Jurnal Pribadi Estetik</p>
      </div>
    </div>
  );
}

// In-line styles for exact layout control
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: 'var(--bg-primary)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    marginBottom: '16px',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
  },
  hourglass: {
    animation: 'pulseGlow 2.5s infinite ease-in-out',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f8fafc, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  tagline: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  loginCard: {
    width: '100%',
    borderRadius: '24px',
    padding: '32px 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  inputGroup: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--error)',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  successWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  successTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  successText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  footer: {
    marginTop: '48px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

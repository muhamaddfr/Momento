import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Hourglass, CheckCircle, ArrowRight, Loader, KeyRound } from 'lucide-react';

export default function LoginScreen() {
  const { signInWithOtp, signInWithPassword } = useAuth();
  
  // States umum
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State untuk alur login (magic-link vs PIN)
  const [authMethod, setAuthMethod] = useState('magic-link'); // 'magic-link' | 'pin'
  
  // State untuk alur Magic Link
  const [sent, setSent] = useState(false);

  // Submit form Magic Link
  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg('');
    
    const { success, error } = await signInWithOtp(email);
    
    setLoading(false);
    if (success) {
      setSent(true);
    } else {
      if (error && error.includes('rate limit')) {
        setErrorMsg('Batas limit kirim email tercapai. Silakan coba masuk dengan metode "Kunci PIN" di atas.');
      } else {
        setErrorMsg(error || 'Gagal mengirimkan Magic Link. Silakan coba lagi.');
      }
    }
  };

  // Submit form PIN (Masuk menggunakan PIN sebagai password Supabase)
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pin) return;

    // Validasi 4 digit angka
    if (!/^\d{4}$/.test(pin)) {
      setErrorMsg('PIN harus berupa 4 digit angka.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { success, error } = await signInWithPassword(email, pin);
      if (!success) {
        // Jika gagal login, beri pesan ramah (mungkin belum setel PIN)
        if (error && error.includes('Invalid login credentials')) {
          throw new Error('Email atau PIN salah. Jika Anda belum menyetel PIN, silakan masuk menggunakan "Magic Link" terlebih dahulu untuk pertama kali.');
        }
        throw new Error(error);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.iconWrapper}>
          <Hourglass size={48} color="#8b5cf6" className="animate-hourglass" />
        </div>
        <h1 style={styles.title}>Momento</h1>
        <p style={styles.tagline}>"Simpan hari ini, temui kembali setahun nanti."</p>
      </div>

      {/* Main Login Card */}
      <div className="glass-panel" style={styles.loginCard}>
        {sent ? (
          /* JIKA MAGIC LINK SUDAH TERKIRIM */
          <div style={styles.successWrapper}>
            <div style={styles.successIconWrapper}>
              <CheckCircle size={36} color="#10b981" />
            </div>
            <h3 style={styles.successTitle}>Magic Link Terkirim!</h3>
            <p style={styles.successText}>
              Periksa kotak masuk email <strong>{email}</strong> Anda. Klik tautan di dalamnya untuk langsung masuk ke aplikasi.
            </p>
            <div style={styles.rateLimitAlert}>
              💡 <strong>Tips:</strong> Setelah berhasil masuk pertama kali, setel **Kunci PIN** di halaman Profil agar berikutnya Anda bisa masuk instan tanpa menunggu email.
            </div>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => {
                setSent(false);
                setAuthMethod('pin');
              }}
            >
              Masuk Dengan PIN
            </button>
          </div>
        ) : (
          /* FORM UTAMA LOGIN */
          <div>
            {/* Tab Selector Mode Login */}
            <div style={styles.tabsContainer}>
              <button
                style={{
                  ...styles.tabBtn,
                  color: authMethod === 'magic-link' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: authMethod === 'magic-link' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  fontWeight: authMethod === 'magic-link' ? '700' : '500',
                }}
                onClick={() => {
                  setAuthMethod('magic-link');
                  setErrorMsg('');
                }}
              >
                Magic Link
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  color: authMethod === 'pin' ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: authMethod === 'pin' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  fontWeight: authMethod === 'pin' ? '700' : '500',
                }}
                onClick={() => {
                  setAuthMethod('pin');
                  setErrorMsg('');
                }}
              >
                Masuk via PIN
              </button>
            </div>

            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

            {authMethod === 'magic-link' ? (
              /* FORM A: MAGIC LINK (Onboarding pertama kali) */
              <form onSubmit={handleMagicLinkSubmit} style={styles.form}>
                <p style={styles.cardSubtitle}>
                  Masuk pertama kali menggunakan email Anda. Kami akan mengirimkan tautan verifikasi cepat tanpa kata sandi.
                </p>

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
            ) : (
              /* FORM B: MASUK VIA PIN (Login cepat bagi yang sudah setel PIN) */
              <form onSubmit={handlePinSubmit} style={styles.form}>
                <p style={styles.cardSubtitle}>
                  Masukkan email dan 4-digit PIN yang telah Anda setel sebelumnya di halaman Profil.
                </p>

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

                <div style={styles.inputGroup}>
                  <label htmlFor="pin" className="input-label">PIN Kunci Aplikasi</label>
                  <div style={styles.inputWrapper}>
                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                    <input
                      id="pin"
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      className="input-field"
                      style={{ paddingLeft: '48px', letterSpacing: '0.3em', fontWeight: '700' }}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px' }}
                  disabled={loading || !email || pin.length !== 4}
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" style={styles.spinner} />
                      Membuka Jurnal...
                    </>
                  ) : (
                    <>
                      Masuk Jurnal
                      <KeyRound size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>Momento &copy; 2026 • Jurnal Pribadi Estetik</p>
      </div>
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
    width: '100%',
    padding: '16px 20px',
    backgroundColor: 'var(--bg-primary)',
    overflow: 'hidden',
    position: 'relative',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '16px',
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
    marginBottom: '8px',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #f8fafc, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  tagline: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  loginCard: {
    width: '100%',
    borderRadius: '24px',
    padding: '20px 18px',
    marginBottom: '20px', /* Lebih rapat agar pas di layar kecil */
  },
  tabsContainer: {
    display: 'flex',
    width: '100%',
    borderBottom: '1px solid var(--border-light)',
    marginBottom: '16px',
  },
  tabBtn: {
    flex: 1,
    padding: '10px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardSubtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
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
    padding: '10px 14px',
    color: 'var(--error)',
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '4px',
  },
  rateLimitAlert: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    borderRadius: '12px',
    padding: '12px 14px',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    lineHeight: '1.5',
    textAlign: 'left',
    marginTop: '12px',
  },
  successWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  successText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  footer: {
    position: 'absolute',
    bottom: '20px',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

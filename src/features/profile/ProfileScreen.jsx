import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { calculateStreak, stretchPinToPassword } from '../../shared/utils/helpers';
import { 
  User, LogOut, Info, Bell, Loader, Heart, 
  Edit3, Check, X, Sun, Moon, Laptop, Lock
} from 'lucide-react';

export default function ProfileScreen({ theme, setTheme }) {
  const { user, signOut } = useAuth();
  const [totalEntries, setTotalEntries] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // States untuk edit username
  const [displayName, setDisplayName] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // States untuk pengaturan waktu pengingat harian & flashback
  const [reminderTime, setReminderTime] = useState('20:00');
  const [flashbackTime, setFlashbackTime] = useState('07:00');

  // States untuk Kunci PIN Aplikasi
  const [pinCode, setPinCode] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Load awal data statistik, username, PIN, & setelan notifikasi dari user metadata
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('date')
          .eq('user_id', user.id)
          .not('is_sample', 'eq', true);

        if (error) throw error;

        const entriesData = data || [];
        setTotalEntries(entriesData.length);

        const dateStrings = entriesData.map((d) => d.date);
        const calculatedStreak = calculateStreak(dateStrings);
        setStreak(calculatedStreak);
      } catch (error) {
        console.error('Error fetching user stats:', error.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();

    // Set nama & setelan dari metadata user
    const name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Teman';
    setDisplayName(name);
    setUsernameInput(name);
    
    setReminderTime(user?.user_metadata?.reminder_time || '20:00');
    setFlashbackTime(user?.user_metadata?.flashback_time || '07:00');
    setPinCode(user?.user_metadata?.pin_code || '');
  }, [user]);

  // Simpan perubahan username ke Supabase Auth
  const handleSaveUsername = async () => {
    if (!usernameInput.trim() || !user) return;
    
    setSavingUsername(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: usernameInput.trim() }
      });

      if (error) throw error;

      setDisplayName(usernameInput.trim());
      setIsEditingUsername(false);
    } catch (error) {
      console.error('Error updating username:', error.message);
      alert('Gagal memperbarui username: ' + error.message);
    } finally {
      setSavingUsername(false);
    }
  };

  // Simpan/Aktifkan PIN Baru
  const handleSavePin = async (e) => {
    e.preventDefault();
    setPinError('');

    // Validasi input PIN harus 4 digit angka
    const cleanPin = pinInput.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      setPinError('PIN wajib berisi tepat 4 digit angka (0-9).');
      return;
    }

    setSavingPin(true);
    try {
      const stretchedPassword = stretchPinToPassword(user.email, cleanPin);
      const { error } = await supabase.auth.updateUser({
        password: stretchedPassword,
        data: { pin_code: cleanPin }
      });

      if (error) throw error;

      setPinCode(cleanPin);
      setIsSettingPin(false);
      setPinInput('');
    } catch (error) {
      console.error('Error saving PIN:', error.message);
      setPinError('Gagal menyimpan PIN: ' + error.message);
    } finally {
      setSavingPin(false);
    }
  };

  // Matikan/Hapus Kunci PIN
  const handleRemovePin = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan PIN Pengunci Aplikasi? Keamanan jurnal Anda akan berkurang.')) {
      return;
    }

    setSavingPin(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { pin_code: null }
      });

      if (error) throw error;

      setPinCode('');
      setIsSettingPin(false);
      setPinInput('');
    } catch (error) {
      console.error('Error removing PIN:', error.message);
      alert('Gagal menonaktifkan PIN: ' + error.message);
    } finally {
      setSavingPin(false);
    }
  };

  // Simpan perubahan waktu pengingat harian
  const handleUpdateReminderTime = async (newTime) => {
    setReminderTime(newTime);
    if (!user) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: { reminder_time: newTime }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error updating reminder time:', error.message);
    }
  };

  // Simpan perubahan waktu flashback
  const handleUpdateFlashbackTime = async (newTime) => {
    setFlashbackTime(newTime);
    if (!user) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: { flashback_time: newTime }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error updating flashback time:', error.message);
    }
  };

  const handleCancelEdit = () => {
    setUsernameInput(displayName);
    setIsEditingUsername(false);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header Profil */}
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <User size={22} color="var(--accent-primary)" />
          <h2 style={styles.title}>Profil Pengguna</h2>
        </div>
      </header>

      {/* Kartu Informasi User */}
      <div className="glass-panel" style={styles.userCard}>
        <div style={styles.avatar}>
          <span style={styles.avatarInitial}>
            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
        <div style={styles.userInfo}>
          {isEditingUsername ? (
            <div style={styles.editForm}>
              <input
                type="text"
                className="input-field"
                style={styles.editInput}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                maxLength={20}
                disabled={savingUsername}
                autoFocus
              />
              <button 
                onClick={handleSaveUsername} 
                style={styles.saveBtn} 
                disabled={savingUsername || !usernameInput.trim()}
              >
                {savingUsername ? <Loader size={14} className="animate-spin" /> : <Check size={14} color="#10b981" />}
              </button>
              <button 
                onClick={handleCancelEdit} 
                style={styles.cancelBtn} 
                disabled={savingUsername}
              >
                <X size={14} color="var(--error)" />
              </button>
            </div>
          ) : (
            <div style={styles.usernameRow}>
              <h3 style={styles.userEmail}>{displayName}</h3>
              <button 
                onClick={() => setIsEditingUsername(true)} 
                style={styles.editIconBtn}
                title="Ubah Username"
              >
                <Edit3 size={14} color="var(--text-secondary)" />
              </button>
            </div>
          )}
          <span style={styles.userRole}>{user?.email}</span>
        </div>
      </div>

      {/* Statistik Jurnal */}
      <div style={styles.statsRow}>
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Total Jurnal</span>
          {loadingStats ? (
            <Loader size={16} className="animate-spin" color="var(--accent-primary)" />
          ) : (
            <span style={styles.statValue}>{totalEntries}</span>
          )}
          <span style={styles.statSubText}>Momen Kehidupan</span>
        </div>
        
        <div className="glass-panel" style={styles.statCard}>
          <span style={styles.statLabel}>Streak Aktif</span>
          {loadingStats ? (
            <Loader size={16} className="animate-spin" color="var(--accent-primary)" />
          ) : (
            <span style={styles.statValue}>🔥 {streak}</span>
          )}
          <span style={styles.statSubText}>Hari Beruntun</span>
        </div>
      </div>

      {/* Tema Selector */}
      <div className="glass-panel" style={styles.themeSection}>
        <span style={styles.themeLabel}>Tema Aplikasi</span>
        <div style={styles.themeOptions}>
          <button 
            style={{
              ...styles.themeOptionBtn,
              backgroundColor: theme === 'light' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderColor: theme === 'light' ? 'var(--accent-primary)' : 'var(--border-light)',
              color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            <span>Terang</span>
          </button>
          
          <button 
            style={{
              ...styles.themeOptionBtn,
              backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderColor: theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-light)',
              color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            <span>Gelap</span>
          </button>

          <button 
            style={{
              ...styles.themeOptionBtn,
              backgroundColor: theme === 'system' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderColor: theme === 'system' ? 'var(--accent-primary)' : 'var(--border-light)',
              color: theme === 'system' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setTheme('system')}
          >
            <Laptop size={16} />
            <span>Sistem</span>
          </button>
        </div>
      </div>

      {/* KUNCI PIN APLIKASI (MENU BARU) */}
      <div className="glass-panel" style={styles.pinSection}>
        <div style={styles.pinHeader}>
          <div style={styles.pinTitleWrapper}>
            <Lock size={18} color="var(--accent-primary)" />
            <span style={styles.pinTitle}>Kunci PIN Aplikasi</span>
          </div>
          {pinCode && !isSettingPin && (
            <span style={styles.pinActiveBadge}>
              <Check size={12} color="#10b981" /> Aktif
            </span>
          )}
        </div>

        {isSettingPin ? (
          /* Form Input PIN Baru */
          <form onSubmit={handleSavePin} style={styles.pinForm}>
            {pinError && <div style={styles.pinErrorAlert}>{pinError}</div>}
            <div style={styles.pinInputRow}>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit PIN"
                className="input-field"
                style={styles.pinInput}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                disabled={savingPin}
                required
                autoFocus
              />
              <button type="submit" className="btn-primary" style={styles.pinSaveBtn} disabled={savingPin || pinInput.length !== 4}>
                {savingPin ? <Loader size={14} className="animate-spin" /> : 'Simpan'}
              </button>
              <button type="button" className="btn-secondary" style={styles.pinCancelBtn} onClick={() => { setIsSettingPin(false); setPinInput(''); setPinError(''); }} disabled={savingPin}>
                Batal
              </button>
            </div>
            <p style={styles.pinInputSubText}>Gunakan karakter angka (0-9) untuk mengunci layar masuk.</p>
          </form>
        ) : pinCode ? (
          /* Menu Opsi jika PIN sudah Aktif */
          <div style={styles.pinActiveActions}>
            <p style={styles.pinDescText}>
              Aplikasi terkunci secara aman. Layar PIN akan muncul setiap kali Momento dibuka kembali.
            </p>
            <div style={styles.pinActionsRow}>
              <button onClick={() => setIsSettingPin(true)} className="btn-secondary" style={styles.pinActionBtn}>
                Ubah PIN
              </button>
              <button onClick={handleRemovePin} className="btn-secondary" style={{ ...styles.pinActionBtn, color: 'var(--error)' }}>
                Nonaktifkan PIN
              </button>
            </div>
          </div>
        ) : (
          /* Tampilan jika PIN belum Aktif */
          <div style={styles.pinDeactiveActions}>
            <p style={styles.pinDescText}>
              Lindungi privasi tulisan harian Anda dari orang lain dengan mengaktifkan pengunci PIN saat aplikasi dibuka.
            </p>
            <button onClick={() => setIsSettingPin(true)} className="btn-primary" style={styles.pinActivateBtn}>
              Aktifkan PIN Pengunci
            </button>
          </div>
        )}
      </div>

      {/* Daftar Opsi / Settings */}
      <div style={styles.optionsList}>
        {/* Notifikasi Pengingat */}
        <div className="glass-panel" style={styles.optionItem}>
          <div style={styles.optionLeft}>
            <div style={styles.optionIconWrapper}>
              <Bell size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <span style={styles.optionTitle}>Pengingat Harian</span>
              <p style={styles.optionDesc}>Waktu pengingat upload jurnal harian</p>
            </div>
          </div>
          <input 
            type="time" 
            value={reminderTime} 
            onChange={(e) => handleUpdateReminderTime(e.target.value)} 
            style={styles.timeInput}
          />
        </div>

        {/* Notifikasi Flashback */}
        <div className="glass-panel" style={styles.optionItem}>
          <div style={styles.optionLeft}>
            <div style={styles.optionIconWrapper}>
              <ClockIcon size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <span style={styles.optionTitle}>Pengingat Flashback</span>
              <p style={styles.optionDesc}>Waktu notifikasi memori setahun lalu</p>
            </div>
          </div>
          <input 
            type="time" 
            value={flashbackTime} 
            onChange={(e) => handleUpdateFlashbackTime(e.target.value)} 
            style={styles.timeInput}
          />
        </div>

        {/* Tentang Aplikasi */}
        <div className="glass-panel" style={styles.optionItem}>
          <div style={styles.optionLeft}>
            <div style={styles.optionIconWrapper}>
              <Info size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <span style={styles.optionTitle}>Tentang Momento</span>
              <p style={styles.optionDesc}>Versi 1.0 MVP PWA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Logout */}
      <button 
        onClick={signOut}
        className="btn-secondary" 
        style={styles.logoutBtn}
      >
        <LogOut size={18} color="var(--error)" />
        <span style={{ color: 'var(--error)' }}>Keluar dari Aplikasi</span>
      </button>

      {/* Footer Branding */}
      <div style={styles.footerBranding}>
        <p style={styles.brandingText}>Dibuat dengan <Heart size={10} color="var(--error)" fill="var(--error)" /> untuk Jurnal Masa Depan</p>
      </div>
    </div>
  );
}

// Ikon Clock kustom
const ClockIcon = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const styles = {
  container: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  userCard: {
    width: '100%',
    padding: '20px',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    borderBottom: 'none',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
    flexShrink: 0,
  },
  avatarInitial: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#fff',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
    flexGrow: 1,
  },
  usernameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userEmail: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  editIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease',
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  editInput: {
    padding: '6px 10px',
    fontSize: '14px',
    borderRadius: '10px',
    height: '32px',
    flexGrow: 1,
  },
  saveBtn: {
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '10px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cancelBtn: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '10px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  userRole: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    padding: '16px',
    borderRadius: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    borderBottom: 'none',
  },
  statLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statSubText: {
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  themeSection: {
    padding: '16px 20px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: 'none',
  },
  themeLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  themeOptions: {
    display: 'flex',
    gap: '8px',
  },
  themeOptionBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pinSection: {
    padding: '20px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    borderBottom: 'none',
  },
  pinHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pinTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  pinActiveBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--success)',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    padding: '2px 8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  pinForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '4px',
  },
  pinInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  pinInput: {
    height: '38px',
    textAlign: 'center',
    letterSpacing: '0.25em',
    fontWeight: '700',
    fontSize: '16px',
    padding: '0 10px',
    maxWidth: '120px',
  },
  pinSaveBtn: {
    height: '38px',
    padding: '0 16px',
    fontSize: '13px',
  },
  pinCancelBtn: {
    height: '38px',
    padding: '0 16px',
    fontSize: '13px',
  },
  pinInputSubText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  pinErrorAlert: {
    color: 'var(--error)',
    fontSize: '11px',
    fontWeight: '600',
  },
  pinDescText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  pinActionsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '6px',
  },
  pinActionBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '12px',
    borderRadius: '12px',
  },
  pinDeactiveActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pinActivateBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '13px',
    borderRadius: '12px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '24px',
  },
  optionItem: {
    padding: '16px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: 'none',
  },
  optionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  optionIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    display: 'block',
  },
  optionDesc: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
    lineHeight: '1.4',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--success)',
    background: 'rgba(16, 185, 129, 0.08)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  timeInput: {
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    padding: '6px 8px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    fontWeight: '700',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  logoutBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '18px',
    background: 'rgba(239, 68, 68, 0.03)',
    border: '1px solid rgba(239, 68, 68, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  footerBranding: {
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: '24px',
  },
  brandingText: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
};

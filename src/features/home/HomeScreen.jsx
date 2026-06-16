import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import { supabase } from '../../config/supabase';
import { getLocalDateString } from '../../shared/utils/helpers';
import PhotoCard from '../../shared/widgets/PhotoCard';
import UploadSheet from './UploadSheet';
import { Sparkles, CalendarCheck, FileText, ArrowRight, Loader, RefreshCw, Trash2, Bell, Download, CheckCircle, AlertCircle } from 'lucide-react';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isInstalled, isInstallable, permissionStatus, requestNotificationPermission, triggerTestNotification, promptInstall } = usePWA();
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  });
  const [deleting, setDeleting] = useState(false);

  const handleDeleteTodayEntry = async () => {
    if (!todayEntry || !user) return;
    
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan hari ini? Anda dapat mengunggah ulang foto baru setelah catatan dihapus.')) {
      return;
    }

    setDeleting(true);
    try {
      // 1. Hapus entri dari database
      const { error: dbError } = await supabase
        .from('entries')
        .delete()
        .eq('id', todayEntry.id);

      if (dbError) throw dbError;

      // 2. Hapus file foto dari Supabase Storage (jika ada)
      try {
        const filePath = `${user.id}/${todayEntry.date}.jpg`;
        await supabase.storage
          .from('photos')
          .remove([filePath]);
      } catch (err) {
        console.warn('Storage file deletion failed or already deleted:', err);
      }

      // 3. Reset state dan muat ulang halaman
      setTodayEntry(null);
      await fetchTodayEntry();
    } catch (error) {
      console.error('Error deleting entry:', error.message);
      alert('Gagal menghapus catatan: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const fetchTodayEntry = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayStr = getLocalDateString();
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setTodayEntry(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error fetching today entry:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchTodayEntry();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header Greeting */}
      <header style={styles.header}>
        <div>
          <span style={styles.greetingText}>{greeting},</span>
          <h2 style={styles.usernameText}>
            {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Teman'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={fetchTodayEntry} 
            style={styles.refreshBtn}
            disabled={loading}
            title="Refresh Jurnal Harian"
          >
            <RefreshCw 
              size={16} 
              color="var(--text-secondary)" 
              className={loading ? 'animate-spin' : ''} 
            />
          </button>
          <div style={styles.appBadge}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span style={styles.badgeText}>Momento</span>
          </div>
        </div>
      </header>
      {/* Konten Utama */}
      <div style={styles.mainContent}>
        {/* Panduan Instalasi PWA & Notifikasi Dinamis */}
        {(() => {
          if (!isInstalled) {
            return (
              <div className="glass-panel animate-fade-in" style={styles.installGuideCard}>
                <div style={styles.guideHeader}>
                  <Bell size={18} color="var(--accent-primary)" style={{ animation: 'bounce 2s infinite' }} />
                  <span style={styles.guideTitle}>Pasang Aplikasi & Aktifkan Notifikasi</span>
                </div>
                <p style={styles.guideText}>
                  Fitur pengingat harian & flashback membutuhkan Momento untuk diinstal di Layar Utama HP Anda terlebih dahulu:
                </p>
                <div style={styles.guideInstruction}>
                  📱 <strong>iPhone (iOS):</strong> Ketuk tombol <strong>Bagikan [↑]</strong> di Safari, lalu pilih <strong>Tambahkan ke Layar Utama [+]</strong>.<br/>
                  🤖 <strong>Android / Chrome:</strong> Tekan tombol pasang di bawah ini atau cari banner instalasi browser Anda.
                </div>
                {isInstallable && (
                  <button onClick={promptInstall} className="btn-primary" style={{ marginTop: '8px', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Download size={14} /> Pasang Momento Sekarang
                  </button>
                )}
              </div>
            );
          }

          if (permissionStatus === 'default') {
            return (
              <div className="glass-panel animate-fade-in" style={{ ...styles.installGuideCard, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={styles.guideHeader}>
                  <Bell size={18} color="#f59e0b" style={{ animation: 'pulse 1.5s infinite' }} />
                  <span style={{ ...styles.guideTitle, color: '#f59e0b' }}>Izin Notifikasi Diperlukan</span>
                </div>
                <p style={styles.guideText}>
                  Silakan izinkan notifikasi agar Momento dapat mengirimkan pengingat menulis jurnal harian dan flashback ingatan manis Anda.
                </p>
                <button onClick={requestNotificationPermission} className="btn-primary" style={{ marginTop: '8px', padding: '10px', fontSize: '13px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={14} /> Aktifkan Izin Notifikasi
                </button>
              </div>
            );
          }

          if (permissionStatus === 'denied') {
            return (
              <div className="glass-panel animate-fade-in" style={{ ...styles.installGuideCard, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={styles.guideHeader}>
                  <AlertCircle size={18} color="var(--error)" />
                  <span style={{ ...styles.guideTitle, color: 'var(--error)' }}>Izin Notifikasi Ditolak</span>
                </div>
                <p style={styles.guideText}>
                  Pengingat tidak dapat terkirim karena izin diblokir. Silakan buka **Pengaturan Browser / Aplikasi** Anda untuk mengizinkan notifikasi Momento.
                </p>
              </div>
            );
          }

          // Izin sudah diberikan (granted)
          return (
            <div className="glass-panel animate-fade-in" style={{ ...styles.installGuideCard, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <div style={styles.guideHeader}>
                <CheckCircle size={18} color="var(--success)" />
                <span style={{ ...styles.guideTitle, color: 'var(--success)' }}>Notifikasi Pengingat Aktif</span>
              </div>
              <p style={styles.guideText}>
                Sistem pengingat aktif! Notifikasi menulis jurnal harian & flashback akan muncul sesuai jadwal yang Anda atur.
              </p>
              <button onClick={triggerTestNotification} className="btn-secondary" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '12px', width: 'fit-content' }}>
                Test Kirim Notifikasi 🧪
              </button>
            </div>
          );
        })()}
        {loading ? (
          <div style={styles.loadingWrapper}>
            <Loader size={28} className="animate-spin" color="var(--accent-primary)" />
            <p style={styles.loadingText}>Memeriksa catatan hari ini...</p>
          </div>
        ) : todayEntry ? (
          /* JIKA HARI INI SUDAH UPLOAD */
          <div style={styles.entrySection} className="animate-fade-in">
            <div style={styles.infoBanner}>
              <CalendarCheck size={20} color="var(--success)" />
              <div>
                <h4 style={styles.bannerTitle}>Hari Ini Selesai!</h4>
                <p style={styles.bannerText}>Jurnal harian Anda telah tersimpan dengan aman.</p>
              </div>
            </div>
            <PhotoCard entry={todayEntry} />
            <button 
              onClick={handleDeleteTodayEntry}
              className="btn-secondary"
              style={styles.deleteBtn}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Menghapus Jurnal...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} color="var(--error)" />
                  <span style={{ color: 'var(--error)' }}>Hapus Catatan Hari Ini</span>
                </>
              )}
            </button>
            <div style={styles.tomorrowNotice}>
              <p>Sampai jumpa besok pagi untuk merekam momen baru! 👋</p>
            </div>
          </div>
        ) : (
          /* JIKA HARI INI BELUM UPLOAD */
          <div style={styles.uploadPrompt} className="animate-fade-in">
            <div className="glass-panel" style={styles.promptCard}>
              <div style={styles.promptIconWrapper}>
                <FileText size={32} color="var(--accent-primary)" />
              </div>
              <h3 style={styles.promptTitle}>Belum Ada Catatan Hari Ini</h3>
              <p style={styles.promptText}>
                Jangan biarkan hari ini terlewat begitu saja. Abadikan satu foto terbaik dan tulis cerita singkat tentang perjalanan Anda hari ini.
              </p>
              
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="btn-primary" 
                style={styles.promptBtn}
              >
                Tulis Jurnal Hari Ini
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Form Upload */}
      <UploadSheet 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={fetchTodayEntry}
      />
    </div>
  );
}

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
    marginBottom: '28px',
  },
  refreshBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  greetingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginTop: '2px',
  },
  appBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '30px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
  },
  badgeText: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loadingWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px 0',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  entrySection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    borderRadius: '20px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    marginBottom: '20px',
  },
  bannerTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '2px',
  },
  bannerText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  tomorrowNotice: {
    textAlign: 'center',
    padding: '16px 0',
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  deleteBtn: {
    width: '100%',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '16px',
    marginTop: '4px',
    marginBottom: '12px',
  },
  installGuideCard: {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '20px',
    marginBottom: '20px',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.12)',
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  guideTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  guideText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  guideInstruction: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
  },
  uploadPrompt: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
  },
  promptCard: {
    width: '100%',
    padding: '36px 24px',
    borderRadius: '28px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  promptIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  promptTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  promptText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  promptBtn: {
    width: '100%',
    padding: '16px',
    animation: 'pulseGlow 3s infinite ease-in-out',
  },
};

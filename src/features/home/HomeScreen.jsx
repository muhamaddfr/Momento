import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { getLocalDateString } from '../../shared/utils/helpers';
import PhotoCard from '../../shared/widgets/PhotoCard';
import UploadSheet from './UploadSheet';
import { Sparkles, CalendarCheck, FileText, ArrowRight, Loader } from 'lucide-react';

export default function HomeScreen() {
  const { user } = useAuth();
  const [todayEntry, setTodayEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [greeting, setGreeting] = useState('Halo');

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
        .maybeSingle();

      if (error) throw error;
      setTodayEntry(data);
    } catch (error) {
      console.error('Error fetching today entry:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayEntry();

    // Dapatkan salam berdasarkan jam saat ini
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreeting('Selamat Pagi');
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
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
        <div style={styles.appBadge}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span style={styles.badgeText}>Momento</span>
        </div>
      </header>

      {/* Konten Utama */}
      <div style={styles.mainContent}>
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

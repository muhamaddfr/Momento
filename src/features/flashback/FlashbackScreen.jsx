import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { getLocalDateString } from '../../shared/utils/helpers';
import PhotoCard from '../../shared/widgets/PhotoCard';
import { Sparkles, Clock, Loader, PlusCircle } from 'lucide-react';

export default function FlashbackScreen() {
  const { user } = useAuth();
  const [flashbackEntry, setFlashbackEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingSample, setCreatingSample] = useState(false);

  // Dapatkan tanggal tepat 1 tahun yang lalu
  const getOneYearAgoDateString = () => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    return getLocalDateString(oneYearAgo);
  };

  const fetchFlashback = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const oneYearAgoStr = getOneYearAgoDateString();

      // 1. Cari entri tepat 1 tahun lalu
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', oneYearAgoStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setFlashbackEntry(data[0]);
      } else {
        setFlashbackEntry(null);
      }
    } catch (error) {
      console.error('Error fetching flashback:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Membuat entri contoh dari 1 tahun yang lalu untuk keperluan pengujian (Testing)
  const handleCreateSample = async () => {
    if (!user) return;
    setCreatingSample(true);
    try {
      const oneYearAgoStr = getOneYearAgoDateString();
      
      // Menggunakan gambar aesthetic pemandangan/perjuangan dari Unsplash
      const samplePhotos = [
        'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop',
      ];
      const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
      
      const sampleCaptions = [
        'Hari ini setahun lalu, gue sedang berjuang menyelesaikan bab terakhir skripsi sambil ditemani secangkir kopi hangat di kosan. Capek banget tapi harus selesai!',
        'Setahun lalu gue baru pertama kali interview kerja di kantor impian. Tegang banget nunggu giliran di lobby, untungnya semua lancar.',
        'Momen sore ini setahun lalu, nongkrong santai bareng temen-temen kuliah sebelum masing-masing sibuk kerja di kota lain. Kangen masa-masa itu.',
      ];
      const randomCaption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
      
      const sampleMoods = ['😎', '🥱', '😊'];
      const randomMood = sampleMoods[Math.floor(Math.random() * sampleMoods.length)];

      const { error } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: oneYearAgoStr,
          caption: randomCaption,
          photo_url: randomPhoto,
          mood: randomMood,
          is_sample: true,
        });

      if (error) throw error;
      await fetchFlashback();
    } catch (error) {
      console.error('Error creating sample entry:', error.message);
      alert('Gagal membuat data simulasi: ' + error.message);
    } finally {
      setCreatingSample(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchFlashback();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header Flashback */}
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <Sparkles size={22} color="var(--accent-primary)" />
          <h2 style={styles.title}>Mesin Waktu</h2>
        </div>
      </header>

      {/* Konten Utama */}
      <div style={styles.content}>
        {loading ? (
          <div style={styles.loadingWrapper}>
            <Loader size={28} className="animate-spin" color="var(--accent-primary)" />
            <p style={styles.loadingText}>Membuka kenangan setahun lalu...</p>
          </div>
        ) : flashbackEntry ? (
          /* JIKA ADA DATA FLASHBACK SETAHUN LALU */
          <div style={styles.flashbackSection} className="animate-fade-in">
            <div style={styles.flashbackBanner}>
              <Clock size={20} color="var(--accent-primary)" />
              <div>
                <h4 style={styles.bannerTitle}>Setahun Yang Lalu...</h4>
                <p style={styles.bannerText}>Temui kembali diri Anda pada tanggal yang sama tahun lalu.</p>
              </div>
            </div>
            
            <div style={styles.cardGlowWrapper}>
              <PhotoCard entry={flashbackEntry} />
            </div>

            <div style={styles.reflectionQuote}>
              <p style={styles.quoteText}>"Waktu terus berjalan, namun momen berharga tetap abadi."</p>
            </div>
          </div>
        ) : (
          /* JIKA TIDAK ADA DATA FLASHBACK SETAHUN LALU */
          <div style={styles.emptyWrapper} className="animate-fade-in">
            <div className="glass-panel" style={styles.emptyCard}>
              <div style={styles.emptyIconWrapper}>
                <Clock size={32} color="var(--text-muted)" />
              </div>
              <h3 style={styles.emptyTitle}>Belum Ada Kenangan Setahun Lalu</h3>
              <p style={styles.emptyText}>
                Fitur Flashback secara otomatis mencari foto & cerita Anda yang diunggah tepat pada tanggal ini di tahun sebelumnya. 
              </p>
              
              <div style={styles.infoBox}>
                <p style={styles.infoText}>
                  💡 <strong>Informasi Pengujian:</strong> Karena Anda baru memulai hari ini, Anda tidak akan memiliki data dari 1 tahun lalu. Anda bisa menekan tombol di bawah untuk membuat data simulasi 1 tahun lalu demi melihat keindahan fitur ini.
                </p>
              </div>

              <button 
                onClick={handleCreateSample}
                className="btn-primary"
                style={styles.simulateBtn}
                disabled={creatingSample}
              >
                {creatingSample ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Membuat Simulasi...
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    Simulasikan Kenangan 1 Tahun Lalu
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
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
  content: {
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
    padding: '80px 0',
  },
  loadingText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  flashbackSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  flashbackBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
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
  cardGlowWrapper: {
    position: 'relative',
    borderRadius: '24px',
    boxShadow: '0 0 25px rgba(139, 92, 246, 0.25)',
  },
  reflectionQuote: {
    textAlign: 'center',
    padding: '24px 0',
  },
  quoteText: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    fontWeight: '400',
  },
  emptyWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
  },
  emptyCard: {
    width: '100%',
    padding: '36px 20px',
    borderRadius: '28px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  infoBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-light)',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'left',
    marginBottom: '24px',
  },
  infoText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  simulateBtn: {
    width: '100%',
    padding: '16px',
  },
};

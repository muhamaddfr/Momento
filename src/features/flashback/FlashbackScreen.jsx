import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../config/supabase';
import { getLocalDateString } from '../../shared/utils/helpers';
import PhotoCard from '../../shared/widgets/PhotoCard';
import { 
  Sparkles, Clock, Loader, PlusCircle, Cpu, 
  Copy, Check, AlertCircle, BookOpen
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const YEARS = [2024, 2025, 2026];

const LOADING_PHRASES = [
  'Menghubungkan mesin waktu ke masa lalu...',
  'Membaca kenangan dan mood jurnal Anda...',
  'Menyelami momen-momen manis yang terlewat...',
  'Merangkum emosi dan tema kehidupan Anda...',
  'Merajut narasi reflektif yang hangat dengan AI...',
];

const markdownStyles = {
  h1: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '16px',
    marginBottom: '8px',
  },
  h2: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: 'var(--accent-primary)',
    marginTop: '18px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
    paddingBottom: '4px',
  },
  h3: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginTop: '12px',
    marginBottom: '6px',
  },
  p: {
    fontSize: '13px',
    lineHeight: '1.65',
    color: 'var(--text-secondary)',
    marginBottom: '10px',
  },
  blockquote: {
    borderLeft: '3px solid var(--accent-primary)',
    paddingLeft: '12px',
    margin: '8px 0',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    background: 'rgba(139, 92, 246, 0.04)',
    padding: '8px 12px',
    borderRadius: '0 8px 8px 0',
  },
  bulletItem: {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: 'var(--accent-primary)',
    fontWeight: '800',
  },
  bulletNumber: {
    color: 'var(--accent-primary)',
    fontWeight: '800',
    minWidth: '16px',
  },
  bulletText: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    flex: 1,
  },
  hr: {
    border: 'none',
    borderBottom: '1px solid var(--border-light)',
    margin: '16px 0',
  }
};

const parseInlineMarkdown = (text) => {
  const boldItalicRegex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g;
  const splitParts = text.split(boldItalicRegex);
  
  return splitParts.map((part, i) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={i} style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={i} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const parseMarkdownToReact = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    
    // 1. Horizontal Rule
    if (trimmed.match(/^([-*\_])\1\1+$/)) {
      return <hr key={index} style={markdownStyles.hr} />;
    }
    
    // 2. Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const headingStyle = level === 1 ? markdownStyles.h1 : level === 2 ? markdownStyles.h2 : markdownStyles.h3;
      return (
        <div key={index} style={headingStyle}>
          {parseInlineMarkdown(content)}
        </div>
      );
    }
    
    // 3. Blockquotes
    if (trimmed.startsWith('>')) {
      const content = trimmed.substring(1).trim();
      return (
        <blockquote key={index} style={markdownStyles.blockquote}>
          {parseInlineMarkdown(content)}
        </blockquote>
      );
    }
    
    // 4. Bullet Points
    const bulletMatch = trimmed.match(/^([-\*\+\_–—•])\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[2];
      return (
        <div key={index} style={markdownStyles.bulletItem}>
          <span style={markdownStyles.bulletDot}>•</span>
          <span style={markdownStyles.bulletText}>{parseInlineMarkdown(content)}</span>
        </div>
      );
    }
    
    // 5. Numbered Lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2];
      return (
        <div key={index} style={markdownStyles.bulletItem}>
          <span style={markdownStyles.bulletNumber}>{num}.</span>
          <span style={markdownStyles.bulletText}>{parseInlineMarkdown(content)}</span>
        </div>
      );
    }
    
    // 6. Empty line
    if (!trimmed) {
      return <div key={index} style={{ height: '8px' }}></div>;
    }
    
    // 7. Regular Paragraph
    return (
      <p key={index} style={markdownStyles.p}>
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });
};

export default function FlashbackScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'ai'
  
  // States Kilas Balik
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingSample, setCreatingSample] = useState(false);

  // States Kapsul AI
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [aiError, setAiError] = useState('');
  const [copied, setCopied] = useState(false);

  // Cycle loading phrases untuk Kapsul AI
  useEffect(() => {
    let interval;
    if (loadingAI) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingPhraseIndex(0);
    }
    return () => clearInterval(interval);
  }, [loadingAI]);

  // Load awal data AI dari cache localStorage saat bulan/tahun berganti
  useEffect(() => {
    if (!user) return;
    const cacheKey = `momento-ai-summary-${user.id}-${selectedYear}-${selectedMonth}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAiSummary(cachedData);
      setAiError('');
    } else {
      setAiSummary('');
      setAiError('');
    }
  }, [selectedMonth, selectedYear, user]);

  const fetchHistoryFlashbacks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Ambil seluruh entri jurnal user (menyortir dari yang terbaru)
      // Filter dilakukan secara lokal di JS agar kompatibel 100% tanpa membuat RPC custom di Supabase
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const today = new Date();
      const todayMonth = today.getMonth(); // 0-indexed
      const todayDate = today.getDate();
      const todayYear = today.getFullYear();

      // Cari entri yang bulan dan tanggalnya cocok dengan hari ini, tetapi tahunnya sebelum hari ini
      const matching = (data || []).filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getFullYear() < todayYear &&
          entryDate.getMonth() === todayMonth &&
          entryDate.getDate() === todayDate
        );
      });

      setHistoryEntries(matching);
    } catch (error) {
      console.error('Error fetching flashbacks:', error.message);
      showToast('Gagal memuat kilas balik.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Membuat entri contoh dari masa lalu (1, 2, dan 3 tahun lalu) untuk pengujian
  const handleCreateSamples = async () => {
    if (!user) return;
    setCreatingSample(true);
    try {
      const today = new Date();
      
      const samplePhotos = [
        'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=600&auto=format&fit=crop',
      ];
      
      const sampleCaptions = [
        'Hari ini setahun lalu, gue sedang berjuang menyelesaikan bab terakhir skripsi sambil ditemani secangkir kopi hangat di kosan. Capek banget tapi harus selesai!',
        'Momen sore ini dua tahun lalu, nongkrong santai bareng temen-temen kuliah sebelum masing-masing sibuk kerja di kota lain. Kangen masa-masa itu.',
        'Tiga tahun lalu di tanggal ini, gue baru pertama kali wawancara kerja di kantor impian. Tegang banget nunggu giliran di lobby, untungnya semua lancar.',
      ];
      
      const sampleMoods = ['😊', '😎', '🥱'];
      const years = [1, 2, 3];

      const rows = years.map((yr, idx) => {
        const pastDate = new Date(today.getFullYear() - yr, today.getMonth(), today.getDate());
        return {
          user_id: user.id,
          date: getLocalDateString(pastDate),
          caption: sampleCaptions[idx],
          photo_url: samplePhotos[idx],
          mood: sampleMoods[idx],
          is_sample: true,
        };
      });

      const { error } = await supabase.from('entries').insert(rows);
      if (error) throw error;

      showToast('Berhasil mensimulasikan kenangan masa lalu! 🕰️', 'success');
      await fetchHistoryFlashbacks();
    } catch (error) {
      console.error('Error creating sample entries:', error.message);
      showToast('Gagal membuat simulasi kenangan.', 'error');
    } finally {
      setCreatingSample(false);
    }
  };

  // Mengirim request ke DeepSeek API (Sumopod API)
  const generateAICapsule = async () => {
    if (!user) return;
    setLoadingAI(true);
    setAiError('');
    setAiSummary('');

    try {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const startOfMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endOfMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      // 1. Ambil seluruh entri jurnal pada bulan & tahun terpilih
      const { data, error } = await supabase
        .from('entries')
        .select('date, caption, mood')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(`Belum ada entri jurnal yang Anda simpan di bulan ${MONTHS[selectedMonth - 1]} ${selectedYear}. Silakan unggah jurnal terlebih dahulu.`);
      }

      // 2. Format tulisan jurnal untuk dikirim sebagai prompt
      const journalBlock = data
        .map((entry) => `Tanggal ${entry.date} (Mood: ${entry.mood}): "${entry.caption}"`)
        .join('\n\n');

      const apiKey = import.meta.env.VITE_AI_API_KEY;
      const apiUrl = import.meta.env.VITE_AI_API_URL;
      const aiModel = import.meta.env.VITE_AI_MODEL || 'deepseek-v4-flash';

      if (!apiKey || !apiUrl) {
        throw new Error('API Key atau Endpoint URL untuk AI belum disetel di file konfigurasi .env Anda.');
      }

      // 3. Panggil API DeepSeek
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah seorang psikolog kehidupan, penganalisis suasana hati, dan sahabat pena yang hangat dan puitis. Tugas Anda adalah membaca seluruh catatan jurnal harian pengguna selama satu bulan, lalu menuliskan sebuah narasi reflektif yang merangkum suasana hati mereka, mengidentifikasi tema-tema utama atau pencapaian kehidupan mereka, serta memberikan pesan penyemangat dan wawasan bijak yang hangat untuk masa depan mereka. Jawablah dalam bahasa Indonesia dengan format terstruktur menggunakan markdown yang estetik.'
            },
            {
              role: 'user',
              content: `Berikut adalah catatan jurnal harian saya pada bulan ${MONTHS[selectedMonth - 1]} ${selectedYear}:\n\n${journalBlock}\n\nSilakan buat rangkuman refleksi bulanan saya.`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errDetail = await response.text();
        throw new Error(`Server AI mengembalikan error (${response.status}): ${errDetail || response.statusText}`);
      }

      const responseData = await response.json();
      const summaryText = responseData?.choices?.[0]?.message?.content;

      if (!summaryText) {
        throw new Error('Gagal menerima teks rangkuman yang valid dari API.');
      }

      // 4. Cache hasil ke localStorage
      const cacheKey = `momento-ai-summary-${user.id}-${selectedYear}-${selectedMonth}`;
      localStorage.setItem(cacheKey, summaryText);

      setAiSummary(summaryText);
      showToast('Kapsul Waktu AI berhasil dirajut! 🤖✨', 'success');
    } catch (err) {
      console.error('Error generating AI capsule:', err);
      setAiError(err.message || 'Terjadi kesalahan saat memproses data AI.');
      showToast('Gagal memproses Kapsul AI.', 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    showToast('Refleksi AI disalin ke clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchHistoryFlashbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header Halaman */}
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <Clock size={22} color="var(--accent-primary)" />
          <h2 style={styles.title}>Mesin Waktu</h2>
        </div>
      </header>

      {/* Tab Navigasi */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            ...styles.tabBtn,
            color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          Kilas Balik Hari Ini
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          style={{
            ...styles.tabBtn,
            color: activeTab === 'ai' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'ai' ? '2px solid var(--accent-primary)' : '2px solid transparent'
          }}
        >
          Kapsul Waktu AI 🤖
        </button>
      </div>

      {/* Area Konten Utama */}
      <div style={styles.content}>
        {activeTab === 'history' ? (
          /* TAB 1: KILAS BALIK HARI INI (MULTI-YEAR TIMELINE) */
          loading ? (
            <div style={styles.loadingWrapper}>
              <Loader size={28} className="animate-spin" color="var(--accent-primary)" />
              <p style={styles.loadingText}>Membuka kenangan tahun-tahun lalu...</p>
            </div>
          ) : historyEntries.length > 0 ? (
            <div style={styles.timelineSection} className="animate-fade-in">
              <div style={styles.flashbackBanner}>
                <Sparkles size={20} color="var(--accent-primary)" />
                <div>
                  <h4 style={styles.bannerTitle}>Hari Ini di Masa Lalu</h4>
                  <p style={styles.bannerText}>Lihat apa saja yang Anda lakukan pada tanggal ini di tahun-tahun sebelumnya.</p>
                </div>
              </div>

              {/* Garis Linimasa Vertikal */}
              <div style={styles.timelineContainer}>
                {historyEntries.map((entry) => {
                  const entryYear = new Date(entry.date).getFullYear();
                  const currentYear = new Date().getFullYear();
                  const yearsAgo = currentYear - entryYear;

                  return (
                    <div key={entry.id} style={styles.timelineItem} className="animate-slide-down">
                      {/* Penanda Linimasa */}
                      <div style={styles.timelineDotWrapper}>
                        <div style={styles.timelineDot}></div>
                        <div style={styles.timelineLine}></div>
                      </div>

                      {/* Konten Kartu Jurnal */}
                      <div style={styles.timelineContent}>
                        <div style={styles.yearBadge}>
                          {yearsAgo} Tahun Lalu ({entryYear})
                        </div>
                        <div style={styles.cardGlowWrapper}>
                          <PhotoCard entry={entry} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={styles.emptyWrapper} className="animate-fade-in">
              <div className="glass-panel" style={styles.emptyCard}>
                <div style={styles.emptyIconWrapper}>
                  <Clock size={32} color="var(--text-muted)" />
                </div>
                <h3 style={styles.emptyTitle}>Belum Ada Kenangan Hari Ini</h3>
                <p style={styles.emptyText}>
                  Fitur Mesin Waktu mencari foto & jurnal harian yang Anda unggah tepat pada tanggal ini di tahun-tahun sebelumnya.
                </p>
                
                <div style={styles.infoBox}>
                  <p style={styles.infoText}>
                    💡 <strong>Informasi Pengujian:</strong> Jika Anda baru mendaftar, gunakan tombol di bawah untuk membuat jurnal tiruan secara otomatis untuk 1 tahun lalu, 2 tahun lalu, dan 3 tahun lalu demi menguji tampilan linimasa.
                  </p>
                </div>

                <button 
                  onClick={handleCreateSamples}
                  className="btn-primary"
                  style={styles.simulateBtn}
                  disabled={creatingSample}
                >
                  {creatingSample ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Membuat Kenangan Simulasi...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      Simulasikan Kenangan Multi-Tahun
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        ) : (
          /* TAB 2: KAPSUL WAKTU AI */
          <div style={styles.aiSection} className="animate-fade-in">
            <div className="glass-panel" style={styles.aiCard}>
              <div style={styles.aiHeaderRow}>
                <Cpu size={24} color="var(--accent-primary)" />
                <h3 style={styles.aiCardTitle}>Refleksi Jurnal Bulanan AI</h3>
              </div>
              <p style={styles.aiCardDesc}>
                Gabungkan seluruh cerita, foto, dan suasana hati Anda selama satu bulan penuh untuk dirangkum AI menjadi refleksi psikologis yang hangat.
              </p>

              {/* Form Pemilih Bulan & Tahun */}
              <div style={styles.selectorRow}>
                <div style={styles.selectWrapper}>
                  <label style={styles.selectLabel}>Bulan</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={styles.selectField}
                    disabled={loadingAI}
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.selectWrapper}>
                  <label style={styles.selectLabel}>Tahun</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={styles.selectField}
                    disabled={loadingAI}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tombol Aksi */}
              <button 
                onClick={generateAICapsule}
                className="btn-primary"
                style={styles.generateBtn}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Menyusun Refleksi...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Rajut Kapsul Waktu AI
                  </>
                )}
              </button>
            </div>

            {/* Tampilan Loading AI Estetik */}
            {loadingAI && (
              <div className="glass-panel animate-fade-in" style={styles.aiLoadingPanel}>
                <Loader size={36} className="animate-spin" color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
                <p style={styles.loadingPhrase}>{LOADING_PHRASES[loadingPhraseIndex]}</p>
                <div style={styles.loadingProgressTrack}>
                  <div style={{ ...styles.loadingProgressFill, width: `${(loadingPhraseIndex + 1) * 20}%` }}></div>
                </div>
              </div>
            )}

            {/* Panel Tampilan Error API */}
            {aiError && !loadingAI && (
              <div className="glass-panel animate-fade-in" style={styles.errorPanel}>
                <AlertCircle size={22} color="var(--error)" style={{ minWidth: '22px' }} />
                <p style={styles.errorText}>{aiError}</p>
              </div>
            )}

            {/* Panel Hasil Refleksi AI */}
            {aiSummary && !loadingAI && (
              <div className="glass-panel animate-fade-in" style={styles.summaryPanel}>
                <div style={styles.summaryHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color="var(--accent-primary)" />
                    <h4 style={styles.summaryTitle}>Hasil Refleksi {MONTHS[selectedMonth - 1]} {selectedYear}</h4>
                  </div>
                  <button onClick={handleCopySummary} style={styles.copyBtn} title="Salin Refleksi">
                    {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} color="var(--text-secondary)" />}
                  </button>
                </div>
                <div style={styles.summaryTextContent}>
                  {parseMarkdownToReact(aiSummary)}
                </div>
              </div>
            )}
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
    marginBottom: '20px',
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
  tabsContainer: {
    display: 'flex',
    gap: '16px',
    borderBottom: '1px solid var(--border-light)',
    marginBottom: '20px',
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    padding: '12px 6px',
    background: 'none',
    border: 'none',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
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
  timelineSection: {
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
    marginBottom: '24px',
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
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingLeft: '12px',
  },
  timelineItem: {
    display: 'flex',
    position: 'relative',
    marginBottom: '28px',
  },
  timelineDotWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    left: '-12px',
    top: '0',
    bottom: '-28px', // Memanjangkan garis ke item berikutnya
    width: '24px',
    zIndex: 1,
  },
  timelineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    boxShadow: '0 0 8px var(--accent-primary)',
    marginTop: '6px',
  },
  timelineLine: {
    flex: 1,
    width: '2px',
    borderLeft: '2px dashed rgba(139, 92, 246, 0.25)',
    marginTop: '4px',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  yearBadge: {
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
  },
  cardGlowWrapper: {
    borderRadius: '24px',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.12)',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  aiSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '20px',
  },
  aiCard: {
    padding: '20px 18px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  aiHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  aiCardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  aiCardDesc: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  selectorRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
  },
  selectWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  selectLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    paddingLeft: '4px',
  },
  selectField: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-primary)',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  },
  generateBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  aiLoadingPanel: {
    padding: '30px 20px',
    borderRadius: '24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid rgba(139, 92, 246, 0.25)',
  },
  loadingPhrase: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: '600',
    marginBottom: '16px',
  },
  loadingProgressTrack: {
    width: '100%',
    maxWidth: '200px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: 'var(--accent-primary)',
    borderRadius: '10px',
    transition: 'width 0.5s ease-in-out',
  },
  errorPanel: {
    padding: '16px',
    borderRadius: '20px',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  errorText: {
    fontSize: '12px',
    color: 'var(--error)',
    lineHeight: '1.5',
  },
  summaryPanel: {
    padding: '24px 20px',
    borderRadius: '28px',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    boxShadow: '0 4px 30px rgba(168, 85, 247, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '12px',
  },
  summaryTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextContent: {
    fontSize: '13.5px',
    lineHeight: '1.6',
    whiteSpace: 'normal',
  },
};

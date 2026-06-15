import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { formatReadableDate } from '../../shared/utils/helpers';
import { Calendar, RefreshCw, FilePlus, Loader, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 10;

export default function TimelineScreen({ setActiveTab }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedEntries, setExpandedEntries] = useState({});

  const toggleExpand = (id) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchEntries = async (reset = false) => {
    if (!user) return;
    
    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 0 : page + 1;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('entries')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .or('is_sample.eq.false,is_sample.is.null')
        .order('date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (reset) {
        setEntries(data || []);
      } else {
        setEntries((prev) => [...prev, ...(data || [])]);
      }

      setPage(currentPage);
      setHasMore(count ? (from + (data?.length || 0)) < count : false);
    } catch (error) {
      console.error('Error fetching timeline entries:', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchEntries(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header Linimasa */}
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <Calendar size={22} color="var(--accent-primary)" />
          <h2 style={styles.title}>Linimasa Hidup</h2>
        </div>
        <button 
          onClick={() => fetchEntries(true)} 
          style={styles.refreshBtn}
          disabled={loading || loadingMore}
        >
          <RefreshCw 
            size={18} 
            color="var(--text-secondary)" 
            className={loading && !loadingMore ? 'animate-spin' : ''} 
          />
        </button>
      </header>

      {/* Konten Utama */}
      <div style={styles.content}>
        {loading && entries.length === 0 ? (
          <div style={styles.loadingWrapper}>
            <Loader size={28} className="animate-spin" color="var(--accent-primary)" />
            <p style={styles.loadingText}>Memuat linimasa kenangan...</p>
          </div>
        ) : entries.length === 0 ? (
          /* JIKA LINIMASA KOSONG */
          <div style={styles.emptyWrapper} className="animate-fade-in">
            <div className="glass-panel" style={styles.emptyCard}>
              <div style={styles.emptyIconWrapper}>
                <Calendar size={32} color="var(--text-muted)" />
              </div>
              <h3 style={styles.emptyTitle}>Linimasa Masih Kosong</h3>
              <p style={styles.emptyText}>
                Anda belum mendokumentasikan apa pun. Mulai rekam kenangan berharga hari ini!
              </p>
              <button 
                onClick={() => setActiveTab('home')}
                className="btn-primary"
                style={styles.emptyBtn}
              >
                <FilePlus size={18} />
                Tulis Jurnal Pertama
              </button>
            </div>
          </div>
        ) : (
          /* DAFTAR CARD JURNAL KRONOLOGIS */
          <div style={styles.listWrapper}>
            {entries.map((entry) => {
              const isExpanded = !!expandedEntries[entry.id];
              return (
                <div 
                  key={entry.id} 
                  className="glass-panel" 
                  style={styles.timelineItem}
                >
                  {/* Row Header - Selalu Tampil */}
                  <div 
                    onClick={() => toggleExpand(entry.id)} 
                    style={styles.itemHeader}
                  >
                    <div style={styles.headerLeft}>
                      <img 
                        src={entry.photo_url} 
                        alt="thumbnail" 
                        style={styles.miniThumbnail} 
                      />
                      <div style={styles.dateAndCaption}>
                        <div style={styles.dateRow}>
                          <span style={styles.moodEmoji}>{entry.mood || '😊'}</span>
                          <span style={styles.itemDate}>{formatReadableDate(entry.date)}</span>
                        </div>
                        {!isExpanded && (
                          <p style={styles.captionTeaser}>{entry.caption}</p>
                        )}
                      </div>
                    </div>
                    <div style={styles.headerRight}>
                      {isExpanded ? (
                        <ChevronUp size={18} color="var(--text-secondary)" />
                      ) : (
                        <ChevronDown size={18} color="var(--text-secondary)" />
                      )}
                    </div>
                  </div>

                  {/* Konten Detail saat Diekspansi */}
                  {isExpanded && (
                    <div className="animate-fade-in" style={styles.expandedContent}>
                      <div style={styles.imageWrapper}>
                        <img 
                          src={entry.photo_url} 
                          alt={entry.caption} 
                          style={styles.expandedImage} 
                        />
                      </div>
                      <p style={styles.expandedCaption}>{entry.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tombol Load More */}
            {hasMore && (
              <button 
                onClick={() => fetchEntries(false)}
                className="btn-secondary"
                style={styles.loadMoreBtn}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Memuat...
                  </>
                ) : (
                  'Muat Lebih Banyak'
                )}
              </button>
            )}

            {!hasMore && entries.length > 0 && (
              <div style={styles.endNotice}>
                <p>Anda telah mencapai ujung linimasa kenangan. ✨</p>
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
  refreshBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-light)',
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
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
  emptyWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  emptyCard: {
    width: '100%',
    padding: '36px 24px',
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
    marginBottom: '24px',
  },
  emptyBtn: {
    width: '100%',
    padding: '16px',
  },
  listWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  timelineItem: {
    width: '100%',
    borderRadius: '20px',
    marginBottom: '12px',
    overflow: 'hidden',
    borderBottom: 'none',
    transition: 'all 0.25s ease',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    overflow: 'hidden',
  },
  miniThumbnail: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    objectFit: 'cover',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexShrink: 0,
  },
  dateAndCaption: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
    flex: 1,
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  moodEmoji: {
    fontSize: '16px',
    lineHeight: '1',
  },
  itemDate: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  captionTeaser: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '8px',
  },
  expandedContent: {
    padding: '0 14px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  imageWrapper: {
    width: '100%',
    position: 'relative',
    paddingTop: '100%',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  expandedImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  expandedCaption: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    padding: '4px 2px 0 2px',
  },
  loadMoreBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '10px',
    marginBottom: '20px',
  },
  endNotice: {
    textAlign: 'center',
    padding: '20px 0 10px 0',
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
};

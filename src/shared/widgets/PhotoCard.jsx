import React, { useState } from 'react';
import { formatReadableDate } from '../utils/helpers';
import { Calendar, Smile } from 'lucide-react';

export default function PhotoCard({ entry }) {
  const { date, caption, photo_url, mood } = entry;
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="glass-panel" style={styles.card}>
      {/* Container Gambar */}
      <div style={styles.imageContainer}>
        {/* Loading skeleton sebelum gambar termuat */}
        {!imgLoaded && <div className="skeleton" style={styles.imageSkeleton} />}
        
        <img
          src={photo_url}
          alt={caption}
          style={{
            ...styles.image,
            opacity: imgLoaded ? 1 : 0,
          }}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
        />

        {/* Floating Mood Badge */}
        {mood && (
          <div style={styles.moodBadge}>
            <span style={styles.moodEmoji}>{mood}</span>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div style={styles.infoArea}>
        <div style={styles.dateRow}>
          <Calendar size={14} color="var(--accent-primary)" />
          <span style={styles.dateText}>{formatReadableDate(date)}</span>
        </div>
        <p style={styles.captionText}>{caption}</p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    borderRadius: '24px',
    overflow: 'hidden',
    borderBottom: 'none',
    transition: 'transform 0.25s ease',
    marginBottom: '20px',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%', /* 1:1 Aspect Ratio (Square) */
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.35s ease-in-out',
  },
  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  moodBadge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  moodEmoji: {
    fontSize: '22px',
  },
  infoArea: {
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dateText: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.01em',
  },
  captionText: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    fontWeight: '400',
    whiteSpace: 'pre-wrap', /* Menjaga spasi baris baru */
  },
};

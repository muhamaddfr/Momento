import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { getLocalDateString, compressImage } from '../../shared/utils/helpers';
import { X, Camera, Smile, Type, Loader, Check } from 'lucide-react';

const MOODS = [
  { emoji: '😎', label: 'Cool' },
  { emoji: '😊', label: 'Senang' },
  { emoji: '🥱', label: 'Lelah' },
  { emoji: '😢', label: 'Sedih' },
  { emoji: '😡', label: 'Kesal' },
  { emoji: '🤯', label: 'Pusing' },
];

export default function UploadSheet({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (uploading) return;
    // Reset semua state saat sheet ditutup
    setImage(null);
    setImagePreview('');
    setCaption('');
    setSelectedMood('😊');
    setErrorMsg('');
    setProgressText('');
    onClose();
  };

  // Versi handleClose yang dipanggil setelah upload sukses (uploading masih true)
  const handleCloseAfterSuccess = () => {
    setUploading(false);
    setImage(null);
    setImagePreview('');
    setCaption('');
    setSelectedMood('😊');
    setErrorMsg('');
    setProgressText('');
    onClose();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !caption || !user) return;

    setUploading(true);
    setErrorMsg('');
    
    try {
      const todayStr = getLocalDateString();
      const fileExt = 'jpg'; // Kita selalu kompres ke JPEG
      const filePath = `${user.id}/${todayStr}.${fileExt}`;

      // 1. Kompresi gambar harian
      setProgressText('Mengompres foto...');
      const compressedBlob = await compressImage(image, 1080, 0.75);

      // 2. Upload ke Supabase Storage
      setProgressText('Mengunggah foto ke Cloud...');
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Dapatkan Public URL foto + cache-bust agar foto baru langsung tampil
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // 4. Catat entri baru ke Firestore/Supabase Database
      setProgressText('Menyimpan catatan jurnal...');
      const { error: dbError } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: todayStr,
          caption: caption,
          photo_url: cacheBustedUrl,
          mood: selectedMood,
          is_sample: false,
        });

      if (dbError) {
        // Jika duplikat (sudah upload hari ini)
        if (dbError.code === '23505') {
          throw new Error('Anda sudah membuat entri jurnal untuk hari ini.');
        }
        throw dbError;
      }

      // Tutup sheet dulu, baru trigger refresh — hindari race condition
      handleCloseAfterSuccess();
      onSuccess();
    } catch (error) {
      console.error('Error saat menyimpan jurnal harian:', error);
      const detailMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      setErrorMsg(`Gagal menyimpan: ${detailMsg}. Silakan pastikan bucket "photos" telah dibuat di Supabase Storage dan policy RLS-nya sudah diaktifkan sesuai panduan README.`);
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div 
        className="glass-panel animate-slide-up" 
        style={styles.sheet} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Panel */}
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>Catat Hari Ini</h3>
          <button onClick={handleClose} style={styles.closeBtn} disabled={uploading}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Upload Foto Area */}
          <div 
            style={{
              ...styles.uploadArea,
              borderColor: imagePreview ? 'var(--border-light)' : 'var(--accent-primary)',
              backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
              borderStyle: imagePreview ? 'solid' : 'dashed',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!imagePreview && (
              <div style={styles.uploadPlaceholder}>
                <div style={styles.uploadIconWrapper}>
                  <Camera size={28} color="var(--accent-primary)" />
                </div>
                <span style={styles.uploadText}>Ketuk atau Tarik Foto Kesini</span>
                <span style={styles.uploadSubtext}>Maksimal 10MB (akan dikompres otomatis)</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </div>

          {/* Pemilihan Mood */}
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smile size={16} /> Mood Hari Ini
            </label>
            <div style={styles.moodContainer}>
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setSelectedMood(m.emoji)}
                  style={{
                    ...styles.moodButton,
                    backgroundColor: selectedMood === m.emoji ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: selectedMood === m.emoji ? 'var(--accent-primary)' : 'var(--border-light)',
                  }}
                  disabled={uploading}
                >
                  <span style={styles.moodEmoji}>{m.emoji}</span>
                  <span style={styles.moodLabel}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Menulis Cerita (Caption) */}
          <div>
            <label className="input-label" htmlFor="caption" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Type size={16} /> Cerita Hari Ini
            </label>
            <textarea
              id="caption"
              placeholder="Bagaimana hari Anda hari ini? Ceritakan momen berharga atau proses perjuangan yang Anda alami..."
              className="input-field"
              rows={4}
              style={styles.textarea}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
              disabled={uploading}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary" 
            style={styles.submitBtn}
            disabled={uploading || !image || !caption}
          >
            {uploading ? (
              <>
                <Loader size={18} className="animate-spin" style={styles.spinner} />
                <span>{progressText}</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Simpan Hari Ini</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: '32px',
    borderTopRightRadius: '32px',
    padding: '24px 20px calc(24px + var(--safe-area-bottom)) 20px',
    maxHeight: '92vh',
    overflowY: 'auto',
    borderBottom: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  uploadArea: {
    width: '100%',
    height: '200px',
    borderRadius: '20px',
    borderWidth: '2px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '16px',
  },
  uploadIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(139, 92, 246, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  uploadText: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  uploadSubtext: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  moodContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
    marginTop: '6px',
  },
  moodButton: {
    border: '1px solid',
    borderRadius: '12px',
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  moodEmoji: {
    fontSize: '20px',
  },
  moodLabel: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  textarea: {
    resize: 'none',
    lineHeight: '1.6',
    fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '8px',
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--error)',
    fontSize: '13px',
    marginBottom: '16px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

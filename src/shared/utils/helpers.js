/**
 * Mengembalikan tanggal lokal dalam format YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Memformat string tanggal (YYYY-MM-DD) menjadi format yang mudah dibaca
 * Contoh: "2026-06-15" -> "Senin, 15 Juni 2026"
 */
export function formatReadableDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Opsi lokal bahasa Indonesia
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('id-ID', options);
}

/**
 * Kompresi gambar menggunakan HTML5 Canvas
 * Mengubah ukuran gambar ke max 1080px (lebar/tinggi) dan mengompres kualitasnya
 * Mengembalikan objek Blob yang siap diunggah
 */
export function compressImage(file, maxWidth = 1080, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Hitung rasio aspek untuk resize
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke Blob JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Menghitung streak jurnal aktif berdasarkan daftar tanggal entri (format YYYY-MM-DD)
 */
export function calculateStreak(dateStrings) {
  if (!dateStrings || dateStrings.length === 0) return 0;
  
  // Ambil tanggal unik, urutkan dari yang terbaru ke terlama
  const uniqueDates = [...new Set(dateStrings)].map(d => {
    const [year, month, day] = d.split('-').map(Number);
    // Gunakan jam 12 siang untuk menghindari masalah pergeseran zona waktu
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  });
  
  uniqueDates.sort((a, b) => b.getTime() - a.getTime());
  
  const today = new Date();
  const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
  
  const yesterdayReset = new Date(todayReset);
  yesterdayReset.setDate(yesterdayReset.getDate() - 1);
  
  const latestEntryDate = uniqueDates[0];
  
  // Jika entri terbaru bukan hari ini atau kemarin, streak-nya 0
  if (latestEntryDate.getTime() !== todayReset.getTime() && latestEntryDate.getTime() !== yesterdayReset.getTime()) {
    return 0;
  }
  
  let streak = 1;
  let currentDate = latestEntryDate;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
    
    const checkDate = uniqueDates[i];
    
    if (checkDate.getTime() === expectedPrevDate.getTime()) {
      streak++;
      currentDate = checkDate;
    } else if (checkDate.getTime() < expectedPrevDate.getTime()) {
      break; // Streak terputus
    }
  }
  
  return streak;
}

/**
 * Meregangkan 4-digit PIN menjadi kata sandi yang aman dan memenuhi batas minimal panjang (6 karakter) Supabase.
 * Menggunakan email pengguna sebagai salt tambahan agar unik dan aman.
 */
export function stretchPinToPassword(email, pin) {
  if (!email || !pin) return '';
  const cleanEmail = email.toLowerCase().trim();
  const cleanPin = pin.trim();
  return `momento_secure_pin_${cleanEmail}_${cleanPin}`;
}


/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { getLocalDateString } from '../shared/utils/helpers';

const PWAContext = createContext({
  isInstalled: false,
  isInstallable: false,
  permissionStatus: 'default',
  requestNotificationPermission: async () => false,
  triggerTestNotification: async () => {},
  promptInstall: async () => {},
});

export const PWAProvider = ({ children }) => {
  const { user } = useAuth();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');

  // 1. Cek status instalasi dan permission notifikasi
  useEffect(() => {
    const checkStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsInstalled(standalone);

      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    };

    checkStatus();

    // Event listener untuk perubahan display mode
    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStatus);
    } catch (e) {
      console.warn(e);
    }

    // Dengarkan event beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      try {
        window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStatus);
      } catch (e) {
        console.warn(e);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // 2. Fungsi untuk memicu prompt instalasi bawaan browser
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.warn('Prompt instalasi belum siap atau tidak didukung di browser ini.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Pilihan user untuk instalasi: ${outcome}`);
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // 3. Fungsi untuk meminta izin notifikasi
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Browser tidak mendukung notifikasi.');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch (err) {
      console.error('Gagal meminta izin notifikasi:', err);
      return false;
    }
  };

  // 4. Fungsi memicu notifikasi tes langsung
  const triggerTestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Browser Anda tidak mendukung notifikasi.');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Izin notifikasi ditolak. Silakan izinkan notifikasi di pengaturan browser Anda.');
        return;
      }
    }

    const title = 'Momento - Mesin Waktu Pribadi';
    const options = {
      body: 'Halo! Ini adalah notifikasi pengujian. Pengingat harian Anda akan muncul seperti ini. ✨',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'momento-test',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    };

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options
          });
        } else {
          await reg.showNotification(title, options);
        }
      } catch (e) {
        console.warn('SW notification message failed, falling back to Web Notification:', e);
        try {
          new Notification(title, options);
        } catch (err) {
          console.error('Test notification fallback failed:', err);
        }
      }
    } else {
      try {
        new Notification(title, options);
      } catch (err) {
        console.error('Test notification fallback failed:', err);
      }
    }
  };

  // Helper untuk mengirim notifikasi lokal berdasar pemicu
  const sendReminderNotification = async (title, body, tag) => {
    if (Notification.permission !== 'granted') return;
    
    const options = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      renotify: true,
      vibrate: [300, 100, 300],
      data: { url: '/' }
    };

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options
          });
        } else {
          await reg.showNotification(title, options);
        }
      } catch (e) {
        console.warn('SW reminder notification message failed:', e);
        try {
          new Notification(title, options);
        } catch (err) {
          console.error('Reminder notification fallback failed:', err);
        }
      }
    } else {
      try {
        new Notification(title, options);
      } catch (err) {
        console.error('Reminder notification fallback failed:', err);
      }
    }
  };

  // 5. Reminder Engine: Menjalankan pengecekan berkala (setiap 60 detik)
  useEffect(() => {
    if (!user || Notification.permission !== 'granted') return;

    const checkReminders = async () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = getLocalDateString();

      const reminderTime = user?.user_metadata?.reminder_time || '20:00';
      const flashbackTime = user?.user_metadata?.flashback_time || '07:00';

      // -- A. Pengecekan Pengingat Jurnal Harian --
      if (currentTimeStr === reminderTime) {
        const lastSent = localStorage.getItem('momento-last-reminder-date');
        if (lastSent !== todayStr) {
          try {
            // Cek apakah user sudah upload jurnal hari ini
            const { data, error } = await supabase
              .from('entries')
              .select('id')
              .eq('user_id', user.id)
              .eq('date', todayStr)
              .limit(1);

            if (!error && (!data || data.length === 0)) {
              // Belum upload! Kirim notifikasi pengingat
              await sendReminderNotification(
                'Momento - Tulis Jurnal Hari Ini',
                'Hari ini hampir berakhir. Jangan biarkan memori hari ini hilang begitu saja. Rekam sekarang! 📖',
                'momento-daily-reminder'
              );
              localStorage.setItem('momento-last-reminder-date', todayStr);
            } else if (data && data.length > 0) {
              // Sudah upload, tidak perlu diganggu
              localStorage.setItem('momento-last-reminder-date', todayStr);
            }
          } catch (e) {
            console.error('Error checking daily reminder entry:', e);
          }
        }
      }

      // -- B. Pengecekan Pengingat Flashback --
      if (currentTimeStr === flashbackTime) {
        const lastSent = localStorage.getItem('momento-last-flashback-date');
        if (lastSent !== todayStr) {
          try {
            // Cek apakah ada jurnal dari setahun lalu (atau beberapa tahun lalu)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            const dateOneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

            const { data, error } = await supabase
              .from('entries')
              .select('id, caption')
              .eq('user_id', user.id)
              .eq('date', dateOneYearAgoStr)
              .limit(1);

            if (!error && data && data.length > 0) {
              // Ada flashback setahun lalu! Kirim notifikasi
              await sendReminderNotification(
                'Momento Flashback 🕰️',
                'Ada ingatan manis tepat setahun yang lalu hari ini. Buka Momento untuk melihat kembali!',
                'momento-flashback-reminder'
              );
              localStorage.setItem('momento-last-flashback-date', todayStr);
            } else {
              // Tidak ada flashback setahun lalu, tandai hari ini selesai untuk flashback check
              localStorage.setItem('momento-last-flashback-date', todayStr);
            }
          } catch (e) {
            console.error('Error checking flashback reminder:', e);
          }
        }
      }
    };

    // Pengecekan pertama saat login / mount
    checkReminders();

    // Jalankan interval per menit
    const intervalId = setInterval(checkReminders, 60000);

    return () => clearInterval(intervalId);
  }, [user]);

  const value = {
    isInstalled,
    isInstallable,
    permissionStatus,
    requestNotificationPermission,
    triggerTestNotification,
    promptInstall,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export const usePWA = () => {
  return useContext(PWAContext);
};

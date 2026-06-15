import { describe, it, expect } from 'vitest';
import { getLocalDateString, formatReadableDate, calculateStreak } from './helpers';

describe('Utilitas helpers.js', () => {
  
  describe('getLocalDateString', () => {
    it('harus mengembalikan string tanggal dengan format YYYY-MM-DD', () => {
      const date = new Date(2026, 5, 15); // 15 Juni 2026
      const dateString = getLocalDateString(date);
      expect(dateString).toBe('2026-06-15');
    });
  });

  describe('formatReadableDate', () => {
    it('harus memformat YYYY-MM-DD menjadi format teks bahasa Indonesia yang mudah dibaca', () => {
      const formatted = formatReadableDate('2026-06-15');
      // Format lokal Indonesia untuk Senin, 15 Juni 2026
      expect(formatted).toContain('15');
      expect(formatted).toContain('Juni');
      expect(formatted).toContain('2026');
    });

    it('harus mengembalikan string kosong jika input tidak valid', () => {
      expect(formatReadableDate('')).toBe('');
      expect(formatReadableDate(null)).toBe('');
    });
  });

  describe('calculateStreak', () => {
    // Buat format YYYY-MM-DD dari tanggal offset
    const getDateWithOffset = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    it('harus mengembalikan 0 jika tidak ada entri sama sekali', () => {
      expect(calculateStreak([])).toBe(0);
      expect(calculateStreak(null)).toBe(0);
    });

    it('harus mengembalikan 0 jika entri terbaru lebih lama dari kemarin', () => {
      const twoDaysAgo = getDateWithOffset(2);
      const threeDaysAgo = getDateWithOffset(3);
      expect(calculateStreak([twoDaysAgo, threeDaysAgo])).toBe(0);
    });

    it('harus mengembalikan 1 jika hanya ada satu entri hari ini', () => {
      const today = getDateWithOffset(0);
      expect(calculateStreak([today])).toBe(1);
    });

    it('harus mengembalikan 1 jika hanya ada satu entri kemarin', () => {
      const yesterday = getDateWithOffset(1);
      expect(calculateStreak([yesterday])).toBe(1);
    });

    it('harus mengembalikan 3 jika ada entri beruntun hari ini, kemarin, dan 2 hari lalu', () => {
      const today = getDateWithOffset(0);
      const yesterday = getDateWithOffset(1);
      const twoDaysAgo = getDateWithOffset(2);
      
      // Menguji dengan urutan acak untuk memastikan sort bekerja
      expect(calculateStreak([yesterday, today, twoDaysAgo])).toBe(3);
    });

    it('harus mengembalikan 2 jika ada entri beruntun hari ini dan kemarin, namun ada gap setelah itu', () => {
      const today = getDateWithOffset(0);
      const yesterday = getDateWithOffset(1);
      const fourDaysAgo = getDateWithOffset(4);
      const fiveDaysAgo = getDateWithOffset(5);

      expect(calculateStreak([today, yesterday, fourDaysAgo, fiveDaysAgo])).toBe(2);
    });

    it('harus menghapus duplikasi tanggal secara aman', () => {
      const today = getDateWithOffset(0);
      const yesterday = getDateWithOffset(1);
      
      expect(calculateStreak([today, today, yesterday, yesterday])).toBe(2);
    });
  });
});

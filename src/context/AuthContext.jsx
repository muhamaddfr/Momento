/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signInWithOtp: async () => {},
  signInWithPassword: async () => {},
  signUpWithPassword: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil session saat ini ketika aplikasi pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Dengarkan perubahan status autentikasi (login, logout, token refresh, dll)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login dengan Magic Link (Email OTP)
  const signInWithOtp = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saat login Magic Link:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Login dengan Email & Password (bypasses email rate limits)
  const signInWithPassword = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saat login password:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Daftar dengan Email & Password
  const signUpWithPassword = async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error saat daftar password:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error saat logout:', error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithOtp,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

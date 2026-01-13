
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const { user, session } = useAuth();
  const [mounted, setMounted] = useState(false);

  // 1. Load initial theme from LocalStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('divvy-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
        // Default to light as requested
        setTheme('light');
        applyTheme('light');
    }
    setMounted(true);
  }, []);

  // 2. If user logs in, fetch their preference from DB via Secure API
  useEffect(() => {
    const fetchUserTheme = async () => {
      if (!user || !session?.access_token) return;
      
      try {
          const res = await fetch('/api/user/me', {
              headers: {
                  'Authorization': `Bearer ${session.access_token}`
              }
          });
          
          if (res.ok) {
              const data = await res.json();
              if (data?.theme) {
                setTheme(data.theme as Theme);
                applyTheme(data.theme as Theme);
                localStorage.setItem('divvy-theme', data.theme);
              }
          }
      } catch (err) {
          console.error("Theme fetch error", err);
      }
    };

    if (user) {
        fetchUserTheme();
    }
  }, [user, session]);

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('divvy-theme', newTheme);

    // Persist to DB if logged in (Best effort)
    if (user) {
       await supabase.from('userprofiles').update({
           theme: newTheme,
           updatedat: new Date().toISOString()
       }).eq('id', user.id);
    }
  };

  if (!mounted) {
      return <>{children}</>; 
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

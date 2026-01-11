
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
  const { user } = useAuth();
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

  // 2. If user logs in, fetch their preference from DB
  useEffect(() => {
    const fetchUserTheme = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single();

      if (data?.theme) {
        setTheme(data.theme as Theme);
        applyTheme(data.theme as Theme);
        localStorage.setItem('divvy-theme', data.theme);
      }
    };

    if (user) {
        fetchUserTheme();
    }
  }, [user]);

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

    // Persist to DB if logged in
    if (user) {
       await supabase.from('profiles').upsert({
           id: user.id,
           theme: newTheme,
           updated_at: new Date().toISOString()
       });
    }
  };

  // Avoid hydration mismatch by rendering only after mount, 
  // though for theme classes on <html> it's often better to have a blocking script in _document
  // For this SPA approach, this suffices.
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

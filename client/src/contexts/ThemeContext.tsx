import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, default to dark mode
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Add current theme class to both html and body
    root.classList.add(theme);
    body.classList.add(theme);
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
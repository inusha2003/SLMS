import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('lms_theme');
    if (saved) return saved === 'dark';
    // Default to dark mode
    return true;
  });

  useEffect(() => {
    localStorage.setItem('lms_theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
      console.log('[Theme] Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('[Theme] Light mode enabled');
    }
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
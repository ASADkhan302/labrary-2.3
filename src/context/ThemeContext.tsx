import React, { createContext, useContext, useEffect, useState } from 'react';
import { LibraryStorage } from '../services/storage';
import { LightThemeStyle } from '../types/library';

export type Theme = 'dark' | 'light' | 'system';
export type { LightThemeStyle };

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  isDark: boolean;
  lightThemeStyle: LightThemeStyle;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLightThemeStyle: (style: LightThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check localStorage first
    const savedTheme = localStorage.getItem('ulm_lms_theme') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    // 2. Check LibraryStorage settings
    try {
      const settings = LibraryStorage.getSettings();
      if (settings?.theme) return settings.theme;
    } catch {
      // fallback
    }
    return 'dark'; // Default LMS dark mode
  });

  const [lightThemeStyle, setLightThemeStyleState] = useState<LightThemeStyle>(() => {
    const savedStyle = localStorage.getItem('ulm_lms_light_theme_style') as LightThemeStyle | null;
    if (savedStyle && ['blue-gray', 'warm-cream', 'sage-green', 'mist-lavender', 'slate-gray'].includes(savedStyle)) {
      return savedStyle;
    }
    try {
      const settings = LibraryStorage.getSettings();
      if (settings?.light_theme_style) return settings.light_theme_style;
    } catch {
      // fallback
    }
    return 'blue-gray';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Track system OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, []);

  const resolvedTheme: 'dark' | 'light' = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-light-theme', lightThemeStyle);
    body.setAttribute('data-light-theme', lightThemeStyle);

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      body.style.backgroundColor = '#020617';
      body.style.color = '#F1F5F9';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      body.style.backgroundColor = 'var(--background)';
      body.style.color = 'var(--text-primary)';
    }
    localStorage.setItem('ulm_lms_theme', theme);
    localStorage.setItem('ulm_lms_light_theme_style', lightThemeStyle);

    // Also sync with LibraryStorage settings
    try {
      const currentSettings = LibraryStorage.getSettings();
      if (currentSettings.theme !== theme || currentSettings.light_theme_style !== lightThemeStyle) {
        LibraryStorage.saveSettings({
          ...currentSettings,
          theme: theme,
          light_theme_style: lightThemeStyle,
        });
      }
    } catch {
      // ignore
    }
  }, [theme, resolvedTheme, lightThemeStyle]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLightThemeStyle = (style: LightThemeStyle) => {
    setLightThemeStyleState(style);
    document.documentElement.setAttribute('data-light-theme', style);
    document.body.setAttribute('data-light-theme', style);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, lightThemeStyle, toggleTheme, setTheme, setLightThemeStyle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside ThemeProvider
    return {
      theme: 'dark' as Theme,
      resolvedTheme: 'dark' as 'dark' | 'light',
      isDark: true,
      lightThemeStyle: 'blue-gray' as LightThemeStyle,
      toggleTheme: () => {},
      setTheme: (_t: Theme) => {},
      setLightThemeStyle: (_s: LightThemeStyle) => {},
    };
  }
  return context;
}


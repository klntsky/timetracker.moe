import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('harnesstime.theme', 'system');

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Remove data-theme attribute to let CSS @media (prefers-color-scheme) handle it
      root.removeAttribute('data-theme');
    } else {
      // Set explicit theme
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Get the effective theme (resolving 'system' to actual preference)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  return {
    theme,
    setTheme,
    effectiveTheme: getEffectiveTheme(),
    isSystemTheme: theme === 'system'
  };
} 
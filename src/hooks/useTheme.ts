import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark' | undefined;

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('timetracker.moe.theme', undefined);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === undefined) {
      // Remove data-theme attribute to let CSS @media (prefers-color-scheme) handle it
      root.removeAttribute('data-theme');
    } else {
      // Set explicit theme
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Get the effective theme (resolving undefined to actual preference)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === undefined) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme as 'light' | 'dark';
  };

  return {
    theme,
    setTheme,
    effectiveTheme: getEffectiveTheme(),
    isSystemTheme: theme === undefined
  };
} 
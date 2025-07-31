import React from 'react';
import { useTheme, Theme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme, isSystemTheme } = useTheme();

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'system') {
      setTheme(undefined);
    } else {
      setTheme(value as Theme);
    }
  };

  return (
    <div>
      <label className="form-label">
        Theme
        <select 
          className="form-select w-auto d-inline-block ms-2"
          value={theme === undefined ? 'system' : theme}
          onChange={handleThemeChange}
        >
          <option value="system">
            System {isSystemTheme && `(${effectiveTheme})`}
          </option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      
      {isSystemTheme && (
        <small className="form-text text-muted d-block mt-1">
          Following your system preference: {effectiveTheme} mode
        </small>
      )}
    </div>
  );
} 
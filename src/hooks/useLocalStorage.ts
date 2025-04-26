import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const read = () => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {/* ignore */}
  }, [key, value]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initial);
  }, [key]);

  return [value, setValue, clear] as const;
}
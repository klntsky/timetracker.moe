import { useState, useEffect, useCallback } from 'react';
import { storage } from '../storage';

/**
 * Simple storage hook for basic state persistence
 * This replaces the complex useStorage with a simpler implementation
 */
export function useSimpleStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    storage
      .get<T>(key)
      .then((storedValue) => {
        if (storedValue !== null && storedValue !== undefined) {
          setValue(storedValue);
        }
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error(`Error loading ${key} from storage:`, error);
        setIsLoaded(true);
      });
  }, [key]);

  // Save to storage when value changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      storage.set(key, value).catch((error) => {
        console.error(`Error saving ${key} to storage:`, error);
      });
    }
  }, [key, value, isLoaded]);

  const clear = useCallback(() => {
    storage.remove(key).catch((error) => {
      console.error(`Error clearing ${key} from storage:`, error);
    });
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, clear, isLoaded] as const;
}

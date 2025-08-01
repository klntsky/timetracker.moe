import { useSimpleStorage } from './useSimpleStorage';
import { useState } from 'react';

/**
 * Hook for persisted state - wrapper around useSimpleStorage for explicit intent
 * Use this for state that should persist across page reloads
 * 
 * @param key Storage key - use createStorageKey() for consistency  
 * @param initialValue Default value if nothing stored
 * @returns Tuple of [value, setter, clear, isReady] just like useSimpleStorage
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  return useSimpleStorage(key, initialValue);
}

/**
 * Explicitly ephemeral state that will NOT persist across reloads.
 * 
 * Use this when you explicitly want state to reset on page reload.
 * This makes the intention clear and prevents accidental non-persistence.
 * 
 * @param initialValue Initial value
 * @returns Tuple of [value, setter] just like useState
 */
export function useEphemeralState<T>(initialValue: T) {
  return useState<T>(initialValue);
}

/**
 * Type guard to ensure a storage key follows our naming convention
 */
export function createStorageKey(feature: string): string {
  if (!feature || feature.includes('.')) {
    throw new Error('Feature name must be non-empty and cannot contain dots');
  }
  return `timetracker.moe.${feature}`;
} 
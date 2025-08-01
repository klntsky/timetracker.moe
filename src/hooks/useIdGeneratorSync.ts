import { useEffect, useRef } from 'react';
import { Project, TimeEntry } from '../types';
import { resyncCounter } from '../utils/idGenerator';

/**
 * Hook to sync the ID generator with loaded data
 * This ensures IDs don't conflict after data is loaded from storage
 */
export function useIdGeneratorSync(projects: Project[], entries: TimeEntry[]) {
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Only sync once when we have data
    if (!hasSyncedRef.current && (projects.length > 0 || entries.length > 0)) {
      resyncCounter(projects, entries).catch(error => {
        console.error('Failed to sync ID generator:', error);
      });
      hasSyncedRef.current = true;
    }
  }, [projects, entries]);
} 
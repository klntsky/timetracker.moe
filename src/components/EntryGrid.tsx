import React, { useMemo, useCallback } from 'react';
import EntryGridView from './EntryGridView';
import { Project, TimeEntry } from '../types';

// Keep the prop surface identical to the previous EntryGrid except that
// the view layer now receives a computed `entriesForDay` helper.
export interface EntryGridProps {
  days: Date[];
  projects: Project[];
  entries: TimeEntry[];
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
  toggleTimer: () => void;
  shouldShowResume?: boolean;
  addEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
  lastUsedEntry?: TimeEntry | null;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
}

const EntryGrid: React.FC<EntryGridProps> = (props) => {
  const { entries } = props;

  // ─── Memoize a map of project-day → entries ──────────────────────────────
  const entriesByProjectDay = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const entry of entries) {
      const date = new Date(entry.start);
      date.setHours(0, 0, 0, 0); // normalise to start of day
      const key = `${entry.projectId}-${date.toDateString()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(entry);
    }
    return map;
  }, [entries]);

  // Stable callback to retrieve entries for a given project + day
  const getEntriesForDay = useCallback(
    (projectId: number, day: Date) => {
      const key = `${projectId}-${day.toDateString()}`;
      return entriesByProjectDay.get(key) ?? [];
    },
    [entriesByProjectDay],
  );

  return <EntryGridView {...props} entriesForDay={getEntriesForDay} />;
};

export default EntryGrid; 